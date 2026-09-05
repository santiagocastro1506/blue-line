import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  FILTER_TOOL_SCHEMA,
  LAND_USE,
  NUMERIC_FIELDS,
  TEXT_FIELDS,
  describeFilter,
  filterSchema,
} from '@/lib/filters';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Natural language in, a validated filter object out. The model is given one
 * tool and no latitude: it fills in a schema. It never writes SQL, never sees a
 * connection, and its output is validated before anything touches the database.
 *
 * When it misreads a phrase, the sheet shows the filter it produced and the user
 * corrects it. That is the product's actual claim, and it only holds because
 * there is a legible object here rather than an opaque string.
 */

const bodySchema = z.object({ q: z.string().min(2).max(400) });

const SYSTEM = `You translate a land-use analyst's phrase into a structured filter over
New York City tax lots. You do not write SQL and you do not answer questions.

The data is one bounded extract: Midtown Manhattan, roughly Times Square through
Bryant Park. Every lot carries PLUTO attributes.

Numeric fields: ${Object.entries(NUMERIC_FIELDS).map(([k, v]) => `${k} (${v.label}${v.unit ? `, ${v.unit}` : ''})`).join('; ')}.
Text fields: ${Object.entries(TEXT_FIELDS).map(([k, v]) => `${k} (${v.label})`).join('; ')}.

Zoning districts here look like C6-7, C5-3, M1-9A/R12, R8, PARK. For a phrase like
"C6 lots", use zonedist1 with op startsWith and value "C6".

Land use is a two-digit code, not a word. Map the analyst's language to it:
${Object.entries(LAND_USE).map(([k, v]) => `${k} = ${v}`).join('; ')}.

far_headroom is unused development right: the highest permitted FAR minus the built
FAR. "Underbuilt", "development potential", "room to build" mean far_headroom above
some threshold. "Overbuilt" or "non-conforming" means far_headroom below zero.

Choose the smallest set of clauses that honestly captures the phrase. Do not invent
constraints the analyst did not ask for. If the phrase implies an ordering
("largest", "tallest", "oldest"), set sort.`;

export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      {
        error: 'unconfigured',
        message:
          'No model key is set, so the sheet will not guess at what you meant. Set ANTHROPIC_API_KEY to enable the query field.',
      },
      { status: 501 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A query phrase is required.' }, { status: 400 });
  }

  const started = Date.now();

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: key });

    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: SYSTEM,
      tools: [
        {
          name: 'set_filter',
          description:
            'Apply a structured filter to the tax lots on the sheet. This is the only way to answer.',
          input_schema: FILTER_TOOL_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: 'set_filter' },
      messages: [{ role: 'user', content: parsed.data.q }],
    });

    const call = message.content.find((block) => block.type === 'tool_use');
    if (!call || call.type !== 'tool_use') {
      return NextResponse.json(
        {
          error: 'not_understood',
          message: 'That phrase did not resolve to a filter over these fields. Try naming a zoning district, a size, or a year.',
        },
        { status: 422 },
      );
    }

    // The model's output is a proposal, not a result. It is validated against the
    // same schema the compiler trusts before it goes anywhere near the database.
    const validated = filterSchema.safeParse(call.input);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'invalid_filter',
          message: 'The filter came back malformed and was rejected before it reached the database.',
          detail: validated.error.issues,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      filter: validated.data,
      readable: describeFilter(validated.data),
      provenance: {
        model: message.model,
        stopReason: message.stop_reason,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        elapsedMs: Date.now() - started,
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'model_failed', message: 'The model call failed.', detail },
      { status: 502 },
    );
  }
}
