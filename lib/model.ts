import 'server-only';

import { FILTER_TOOL_SCHEMA } from './filters';

/**
 * The natural-language field needs one narrow capability: fill in a strict
 * schema and nothing else. Both Claude and Gemini can be pinned to exactly that
 * — a single named tool, forced — so the provider is a configuration detail
 * rather than an architectural commitment.
 *
 * Whichever answers, its output is still only a proposal. It is validated
 * against the same zod schema before the compiler will look at it, so the
 * safety story does not depend on trusting either vendor.
 */

export type Provider = 'anthropic' | 'gemini';

export type CompileResult = {
  input: unknown;
  provenance: {
    provider: Provider;
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  };
};

const TOOL_NAME = 'set_filter';
const TOOL_DESCRIPTION =
  'Apply a structured filter to the tax lots on the sheet. This is the only way to answer.';

const key = (name: string) => process.env[name]?.trim() || null;

/**
 * An explicit LLM_PROVIDER wins; otherwise whichever key is present decides,
 * Anthropic first when both are.
 */
export function resolveProvider(): Provider | null {
  const forced = key('LLM_PROVIDER')?.toLowerCase();
  if (forced === 'anthropic') return key('ANTHROPIC_API_KEY') ? 'anthropic' : null;
  if (forced === 'gemini') return geminiKey() ? 'gemini' : null;

  if (key('ANTHROPIC_API_KEY')) return 'anthropic';
  if (geminiKey()) return 'gemini';
  return null;
}

const geminiKey = () => key('GEMINI_API_KEY') ?? key('GOOGLE_API_KEY');

export const ANTHROPIC_MODEL = key('ANTHROPIC_MODEL') ?? 'claude-sonnet-5';

/**
 * A pinned model is a dated dependency. This project shipped on
 * gemini-2.5-flash and came back a month later to a 404: "no longer available
 * to new users". A portfolio link has to outlive that.
 *
 * So the fast, stable model is tried first, and a retirement falls back to the
 * alias Google maintains, which cannot 404 the same way. The response names
 * whichever one actually answered.
 */
export const GEMINI_MODEL = key('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite';
const GEMINI_FALLBACK = 'gemini-flash-latest';

export async function compileWithModel(
  provider: Provider,
  system: string,
  phrase: string,
): Promise<CompileResult> {
  return provider === 'anthropic'
    ? viaAnthropic(system, phrase)
    : viaGemini(system, phrase);
}

/* ------------------------------------------------------------------ Claude */

async function viaAnthropic(system: string, phrase: string): Promise<CompileResult> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: key('ANTHROPIC_API_KEY') as string });

  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system,
    tools: [
      { name: TOOL_NAME, description: TOOL_DESCRIPTION, input_schema: FILTER_TOOL_SCHEMA },
    ],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [{ role: 'user', content: phrase }],
  });

  const call = message.content.find((block) => block.type === 'tool_use');

  return {
    input: call && call.type === 'tool_use' ? call.input : null,
    provenance: {
      provider: 'anthropic',
      model: message.model,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  };
}

/* ------------------------------------------------------------------ Gemini */

async function viaGemini(system: string, phrase: string): Promise<CompileResult> {
  try {
    return await callGemini(GEMINI_MODEL, system, phrase);
  } catch (err) {
    // A retired model answers 404 NOT_FOUND. Anything else — a bad key, a rate
    // limit, a malformed schema — is a real error and must not be retried into
    // a second identical failure.
    const retired = /\b404\b|NOT_FOUND|no longer available/i.test(String(err));
    if (!retired || GEMINI_MODEL === GEMINI_FALLBACK) throw err;
    return callGemini(GEMINI_FALLBACK, system, phrase);
  }
}

async function callGemini(
  model: string,
  system: string,
  phrase: string,
): Promise<CompileResult> {
  const { GoogleGenAI, FunctionCallingConfigMode } = await import('@google/genai');
  const client = new GoogleGenAI({ apiKey: geminiKey() as string });

  const response = await client.models.generateContent({
    model,
    contents: phrase,
    config: {
      systemInstruction: system,
      tools: [
        {
          functionDeclarations: [
            {
              name: TOOL_NAME,
              description: TOOL_DESCRIPTION,
              // parametersJsonSchema takes the same JSON Schema Claude gets.
              // Its supported subset covers anyOf, which is why the clause
              // union is written with anyOf rather than oneOf.
              parametersJsonSchema: FILTER_TOOL_SCHEMA,
            },
          ],
        },
      ],
      // The equivalent of Claude's forced tool_choice: the model may answer
      // only by calling this function.
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: [TOOL_NAME],
        },
      },
    },
  });

  const call = response.functionCalls?.[0];
  const usage = response.usageMetadata;

  return {
    input: call?.args ?? null,
    provenance: {
      provider: 'gemini',
      model,
      inputTokens: usage?.promptTokenCount ?? null,
      outputTokens: usage?.candidatesTokenCount ?? null,
    },
  };
}
