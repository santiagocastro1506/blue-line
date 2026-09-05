import { z } from 'zod';

/**
 * The model never writes SQL. It fills in this schema, the schema is validated,
 * and the validated object is compiled here into parameterised SQL against a
 * fixed column whitelist. That is the whole safety story, and it is also why the
 * filter can be shown to the user in readable form: there is a real object to
 * render, not a string to trust.
 */

/* --------------------------------------------------------------- vocabulary */

export const NUMERIC_FIELDS = {
  lotarea: { label: 'lot area', unit: 'sq ft' },
  bldgarea: { label: 'building area', unit: 'sq ft' },
  comarea: { label: 'commercial area', unit: 'sq ft' },
  resarea: { label: 'residential area', unit: 'sq ft' },
  officearea: { label: 'office area', unit: 'sq ft' },
  retailarea: { label: 'retail area', unit: 'sq ft' },
  numfloors: { label: 'floors', unit: '' },
  unitsres: { label: 'residential units', unit: '' },
  unitstotal: { label: 'total units', unit: '' },
  // A year is a label, not a quantity: "before 1,930" reads as a mistake.
  yearbuilt: { label: 'year built', unit: '', plain: true },
  builtfar: { label: 'built FAR', unit: '' },
  residfar: { label: 'permitted residential FAR', unit: '' },
  commfar: { label: 'permitted commercial FAR', unit: '' },
  facilfar: { label: 'permitted facility FAR', unit: '' },
  lotfront: { label: 'lot frontage', unit: 'ft' },
  lotdepth: { label: 'lot depth', unit: 'ft' },
  far_headroom: { label: 'unused FAR', unit: '' },
} as const;

export const TEXT_FIELDS = {
  zonedist1: { label: 'zoning district' },
  overlay1: { label: 'commercial overlay' },
  spdist1: { label: 'special district' },
  bldgclass: { label: 'building class' },
  landuse: { label: 'land use' },
  address: { label: 'address' },
  owner: { label: 'owner' },
} as const;

/**
 * far_headroom is not a column. It is the analyst's actual question — how much
 * development right is left on this lot — so it compiles to the expression
 * rather than forcing the user to phrase it as arithmetic.
 */
const SQL_EXPR: Record<string, string> = {
  far_headroom:
    'GREATEST(COALESCE(residfar,0), COALESCE(commfar,0), COALESCE(facilfar,0)) - COALESCE(builtfar,0)',
  // PLUTO writes an unknown construction date as 0. Compared naively, every
  // undated lot answers "yes" to "built before 1930", which is a fabricated
  // answer dressed as a measured one. Unknown must stay unknown.
  yearbuilt: 'NULLIF(yearbuilt, 0)',
};

const columnFor = (field: string) => SQL_EXPR[field] ?? field;

/** NYC DCP land use codes, as published. Used for the legend and readable filters. */
export const LAND_USE: Record<string, string> = {
  '01': 'One & two family',
  '02': 'Multi-family walk-up',
  '03': 'Multi-family elevator',
  '04': 'Mixed residential & commercial',
  '05': 'Commercial & office',
  '06': 'Industrial & manufacturing',
  '07': 'Transportation & utility',
  '08': 'Public facilities & institutions',
  '09': 'Open space & recreation',
  '10': 'Parking facilities',
  '11': 'Vacant land',
};

/* ------------------------------------------------------------------- schema */

const numericField = z.enum(
  Object.keys(NUMERIC_FIELDS) as [keyof typeof NUMERIC_FIELDS, ...(keyof typeof NUMERIC_FIELDS)[]],
);
const textField = z.enum(
  Object.keys(TEXT_FIELDS) as [keyof typeof TEXT_FIELDS, ...(keyof typeof TEXT_FIELDS)[]],
);

const numericClause = z.object({
  kind: z.literal('numeric'),
  field: numericField,
  op: z.enum(['lt', 'lte', 'gt', 'gte', 'eq', 'between']),
  value: z.number(),
  value2: z.number().optional(),
});

const textClause = z.object({
  kind: z.literal('text'),
  field: textField,
  op: z.enum(['eq', 'startsWith', 'contains', 'in']),
  value: z.union([z.string(), z.array(z.string()).min(1).max(24)]),
});

export const clauseSchema = z.discriminatedUnion('kind', [numericClause, textClause]);

export const filterSchema = z.object({
  mode: z.enum(['all', 'any']).default('all'),
  clauses: z.array(clauseSchema).min(1).max(8),
  sort: z
    .object({ field: numericField, direction: z.enum(['asc', 'desc']) })
    .optional(),
  limit: z.number().int().min(1).max(512).optional(),
});

export type Filter = z.infer<typeof filterSchema>;
export type Clause = z.infer<typeof clauseSchema>;

/* ----------------------------------------------------------------- compiler */

export type Compiled = { where: string; params: unknown[]; orderBy: string; limit: number };

/**
 * Compiles to SQL with a running parameter index. `startIndex` exists because
 * the caller may already have bound parameters ahead of the filter — the drawn
 * geometry, for one.
 */
export function compileFilter(filter: Filter, startIndex = 1): Compiled {
  const params: unknown[] = [];
  let i = startIndex;
  const next = (v: unknown) => {
    params.push(v);
    return `$${i++}`;
  };

  const fragments = filter.clauses.map((clause) => {
    const col = columnFor(clause.field);

    if (clause.kind === 'numeric') {
      switch (clause.op) {
        case 'between': {
          const hi = clause.value2 ?? clause.value;
          const [lo, high] = clause.value <= hi ? [clause.value, hi] : [hi, clause.value];
          return `(${col}) BETWEEN ${next(lo)} AND ${next(high)}`;
        }
        case 'lt':
          return `(${col}) < ${next(clause.value)}`;
        case 'lte':
          return `(${col}) <= ${next(clause.value)}`;
        case 'gt':
          return `(${col}) > ${next(clause.value)}`;
        case 'gte':
          return `(${col}) >= ${next(clause.value)}`;
        case 'eq':
          return `(${col}) = ${next(clause.value)}`;
      }
    }

    const list = Array.isArray(clause.value) ? clause.value : [clause.value];
    switch (clause.op) {
      case 'in':
        return `${col} = ANY(${next(list)})`;
      case 'startsWith':
        return `${col} ILIKE ${next(`${escapeLike(String(list[0]))}%`)}`;
      case 'contains':
        return `${col} ILIKE ${next(`%${escapeLike(String(list[0]))}%`)}`;
      case 'eq':
      default:
        return `${col} = ${next(String(list[0]))}`;
    }
  });

  const joiner = filter.mode === 'any' ? ' OR ' : ' AND ';
  const where = `(${fragments.join(joiner)})`;

  const orderBy = filter.sort
    ? `ORDER BY (${columnFor(filter.sort.field)}) ${filter.sort.direction === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`
    : 'ORDER BY lotarea DESC NULLS LAST';

  return { where, params, orderBy, limit: filter.limit ?? 512 };
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

/* ------------------------------------------------------------- readability */

const fmt = new Intl.NumberFormat('en-US');

/** One clause, in the analyst's words. This is what the sheet prints back. */
export function describeClause(clause: Clause): string {
  if (clause.kind === 'numeric') {
    const meta: { label: string; unit: string; plain?: boolean } = NUMERIC_FIELDS[clause.field];
    const unit = meta.unit ? ` ${meta.unit}` : '';
    const n = (x: number) => (meta.plain ? String(Math.round(x)) : fmt.format(x));
    const v = `${n(clause.value)}${unit}`;
    switch (clause.op) {
      case 'between':
        return `${meta.label} between ${v} and ${n(clause.value2 ?? clause.value)}${unit}`;
      case 'lt':
        return `${meta.label} under ${v}`;
      case 'lte':
        return `${meta.label} at most ${v}`;
      case 'gt':
        return `${meta.label} over ${v}`;
      case 'gte':
        return `${meta.label} at least ${v}`;
      case 'eq':
        return `${meta.label} exactly ${v}`;
    }
  }

  const meta = TEXT_FIELDS[clause.field];
  const list = Array.isArray(clause.value) ? clause.value : [clause.value];
  const pretty = (v: string) => (clause.field === 'landuse' ? (LAND_USE[v] ?? v) : v);
  switch (clause.op) {
    case 'in':
      return `${meta.label} is one of ${list.map(pretty).join(', ')}`;
    case 'startsWith':
      return `${meta.label} starts with ${pretty(String(list[0]))}`;
    case 'contains':
      return `${meta.label} contains ${pretty(String(list[0]))}`;
    default:
      return `${meta.label} is ${pretty(String(list[0]))}`;
  }
}

export const describeFilter = (filter: Filter): string[] => filter.clauses.map(describeClause);

/** The JSON Schema handed to the model. Kept in lockstep with filterSchema above. */
export const FILTER_TOOL_SCHEMA = {
  type: 'object' as const,
  properties: {
    mode: {
      type: 'string',
      enum: ['all', 'any'],
      description: 'Whether every clause must match, or any one of them.',
    },
    clauses: {
      type: 'array',
      minItems: 1,
      maxItems: 8,
      items: {
        // `anyOf` rather than `oneOf`: it is the union keyword both providers
        // support natively, so one schema serves Claude and Gemini alike.
        anyOf: [
          {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['numeric'] },
              field: { type: 'string', enum: Object.keys(NUMERIC_FIELDS) },
              op: { type: 'string', enum: ['lt', 'lte', 'gt', 'gte', 'eq', 'between'] },
              value: { type: 'number' },
              value2: { type: 'number', description: 'Upper bound, only for op "between".' },
            },
            required: ['kind', 'field', 'op', 'value'],
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['text'] },
              field: { type: 'string', enum: Object.keys(TEXT_FIELDS) },
              op: { type: 'string', enum: ['eq', 'startsWith', 'contains', 'in'] },
              value: {
                anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
              },
            },
            required: ['kind', 'field', 'op', 'value'],
            additionalProperties: false,
          },
        ],
      },
    },
    sort: {
      type: 'object',
      properties: {
        field: { type: 'string', enum: Object.keys(NUMERIC_FIELDS) },
        direction: { type: 'string', enum: ['asc', 'desc'] },
      },
      required: ['field', 'direction'],
      additionalProperties: false,
    },
    limit: { type: 'integer', minimum: 1, maximum: 512 },
  },
  required: ['mode', 'clauses'],
  additionalProperties: false,
};
