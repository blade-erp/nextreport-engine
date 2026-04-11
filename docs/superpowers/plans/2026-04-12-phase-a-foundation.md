# Phase A: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the monorepo scaffold, schema package (DSL types), and engine-core (render pipeline) so that a JSON report schema + data can be processed into an Intermediate Representation (IR).

**Architecture:** Schema-first development. `@nextreport/schema` defines all types with Zod. `@nextreport/engine-core` consumes schema types and processes them through a 4-stage pipeline (validate → expression → band-process → layout) into a renderer-agnostic IR. All internal modules are isolated behind a 3-function public API.

**Tech Stack:** TypeScript 5.8.3+, pnpm 10.33.0, Turborepo 2.9.6, Zod, zod-to-json-schema, Vitest

**Spec:** `docs/superpowers/specs/2026-04-12-nextreport-engine-design.md`

---

## File Structure

```
/
├── package.json                          (workspace root)
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── vitest.workspace.ts
├── .gitignore
│
├── packages/
│   ├── schema/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── src/
│   │   │   ├── index.ts                  (public API barrel export)
│   │   │   ├── page.schema.ts            (PageSize, Orientation, Margins, Page)
│   │   │   ├── data-source.schema.ts     (Field, DataSource)
│   │   │   ├── position.schema.ts        (Position)
│   │   │   ├── component.schema.ts       (TextComponent, TableComponent, Component union)
│   │   │   ├── band.schema.ts            (Band, BandType)
│   │   │   ├── report.schema.ts          (ReportSchema — top-level)
│   │   │   └── json-schema-export.ts     (Zod → JSON Schema conversion)
│   │   └── src/__tests__/
│   │       ├── page.schema.test.ts
│   │       ├── component.schema.test.ts
│   │       ├── report.schema.test.ts
│   │       └── json-schema-export.test.ts
│   │
│   ├── engine-core/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── src/
│   │   │   ├── index.ts                  (public API: renderReport, validateReport)
│   │   │   ├── types.ts                  (IR types: RenderResult, Page, ResolvedElement)
│   │   │   ├── pipeline/
│   │   │   │   └── render-pipeline.ts    (orchestrator — calls modules in sequence)
│   │   │   ├── expression/
│   │   │   │   ├── tokenizer.ts          (string → tokens)
│   │   │   │   ├── parser.ts             (tokens → AST)
│   │   │   │   ├── evaluator.ts          (AST + data context → resolved value)
│   │   │   │   ├── coerce.ts             (type coercion: toNumber, toDate, etc.)
│   │   │   │   └── functions/
│   │   │   │       ├── registry.ts       (function registry — built-ins registered here)
│   │   │   │       ├── format.ts         (formatCurrency, formatDate, formatNumber)
│   │   │   │       ├── aggregate.ts      (sum, count)
│   │   │   │       ├── string.ts         (uppercase, lowercase, concat)
│   │   │   │       └── conditional.ts    (if)
│   │   │   ├── band-processor/
│   │   │   │   └── band-processor.ts     (iterate bands, expand detail rows, resolve expressions)
│   │   │   └── layout/
│   │   │       └── layout-calculator.ts  (absolute positions, pagination, page breaks)
│   │   └── src/__tests__/
│   │       ├── expression/
│   │       │   ├── tokenizer.test.ts
│   │       │   ├── parser.test.ts
│   │       │   ├── evaluator.test.ts
│   │       │   └── coerce.test.ts
│   │       ├── band-processor.test.ts
│   │       ├── layout-calculator.test.ts
│   │       └── integration/
│   │           └── pipeline.integration.test.ts
│   │
│   ├── renderer-html/                    (empty scaffold)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/index.ts
│   │
│   ├── renderer-pdf/                     (empty scaffold)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/index.ts
│   │
│   ├── canvas/                           (empty scaffold)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/index.ts
│   │
│   ├── ui-designer/                      (empty scaffold)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/index.ts
│   │
│   └── ui-viewer/                        (empty scaffold)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts
│
└── apps/
    └── web/                              (empty scaffold)
        ├── package.json
        ├── tsconfig.json
        └── src/index.ts
```

---

## Task 1: Monorepo Scaffold & Configuration

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `vitest.workspace.ts`
- Create: `packages/schema/package.json`, `packages/schema/tsconfig.json`, `packages/schema/vitest.config.ts`, `packages/schema/src/index.ts`
- Create: `packages/engine-core/package.json`, `packages/engine-core/tsconfig.json`, `packages/engine-core/vitest.config.ts`, `packages/engine-core/src/index.ts`
- Create: Empty scaffolds for all remaining packages and apps/web

- [ ] **Step 1: Create root workspace config**

`package.json`:
```json
{
  "name": "nextreport-engine",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:watch": "turbo test:watch",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.9.6",
    "typescript": "^5.8.3"
  },
  "packageManager": "pnpm@10.33.0",
  "engines": {
    "node": ">=22"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - "packages/*"
  - "apps/*"
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

`vitest.workspace.ts`:
```typescript
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/*/vitest.config.ts',
])
```

- [ ] **Step 2: Create @nextreport/schema package scaffold**

`packages/schema/package.json`:
```json
{
  "name": "@nextreport/schema",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.25.0",
    "zod-to-json-schema": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vitest": "^3.2.0"
  }
}
```

`packages/schema/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

`packages/schema/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
})
```

`packages/schema/src/index.ts`:
```typescript
// @nextreport/schema — public API
// Will be populated in Tasks 2-4
```

- [ ] **Step 3: Create @nextreport/engine-core package scaffold**

`packages/engine-core/package.json`:
```json
{
  "name": "@nextreport/engine-core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@nextreport/schema": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vitest": "^3.2.0"
  }
}
```

`packages/engine-core/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "references": [
    { "path": "../schema" }
  ]
}
```

`packages/engine-core/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
})
```

`packages/engine-core/src/index.ts`:
```typescript
// @nextreport/engine-core — public API
// Will be populated in Tasks 5-10
```

- [ ] **Step 4: Create empty scaffolds for remaining packages**

For each of `renderer-html`, `renderer-pdf`, `canvas`, `ui-designer`, `ui-viewer`: create minimal `package.json`, `tsconfig.json`, and `src/index.ts`.

`packages/renderer-html/package.json`:
```json
{
  "name": "@nextreport/renderer-html",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": { "types": "./src/index.ts", "import": "./src/index.ts" } },
  "scripts": { "build": "tsc", "dev": "tsc --watch", "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@nextreport/schema": "workspace:*",
    "@nextreport/engine-core": "workspace:*"
  },
  "devDependencies": { "typescript": "^5.8.3" }
}
```

`packages/renderer-pdf/package.json`:
```json
{
  "name": "@nextreport/renderer-pdf",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": { "types": "./src/index.ts", "import": "./src/index.ts" } },
  "scripts": { "build": "tsc", "dev": "tsc --watch", "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@nextreport/schema": "workspace:*",
    "@nextreport/engine-core": "workspace:*",
    "@nextreport/renderer-html": "workspace:*"
  },
  "devDependencies": { "typescript": "^5.8.3" }
}
```

`packages/canvas/package.json`:
```json
{
  "name": "@nextreport/canvas",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": { "types": "./src/index.ts", "import": "./src/index.ts" } },
  "scripts": { "build": "tsc", "dev": "tsc --watch", "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@nextreport/schema": "workspace:*"
  },
  "devDependencies": { "typescript": "^5.8.3" }
}
```

`packages/ui-designer/package.json`:
```json
{
  "name": "@nextreport/ui-designer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": { "types": "./src/index.ts", "import": "./src/index.ts" } },
  "scripts": { "build": "tsc", "dev": "tsc --watch", "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@nextreport/schema": "workspace:*",
    "@nextreport/canvas": "workspace:*"
  },
  "devDependencies": { "typescript": "^5.8.3" }
}
```

`packages/ui-viewer/package.json`:
```json
{
  "name": "@nextreport/ui-viewer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": { "types": "./src/index.ts", "import": "./src/index.ts" } },
  "scripts": { "build": "tsc", "dev": "tsc --watch", "typecheck": "tsc --noEmit" },
  "dependencies": {
    "@nextreport/schema": "workspace:*",
    "@nextreport/renderer-html": "workspace:*"
  },
  "devDependencies": { "typescript": "^5.8.3" }
}
```

Each gets a standard `tsconfig.json` (same pattern as schema without vitest) and empty `src/index.ts`:
```typescript
// Placeholder — implemented in Phase B/C
export {}
```

- [ ] **Step 5: Create apps/web empty scaffold**

`apps/web/package.json`:
```json
{
  "name": "@nextreport/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": { "dev": "echo 'Web app — Phase C'", "build": "echo 'Web app — Phase C'" },
  "dependencies": {
    "@nextreport/schema": "workspace:*",
    "@nextreport/engine-core": "workspace:*",
    "@nextreport/renderer-html": "workspace:*",
    "@nextreport/renderer-pdf": "workspace:*",
    "@nextreport/canvas": "workspace:*",
    "@nextreport/ui-designer": "workspace:*",
    "@nextreport/ui-viewer": "workspace:*"
  }
}
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"]
}
```

`apps/web/src/index.ts`:
```typescript
// Placeholder — implemented in Phase C
export {}
```

- [ ] **Step 6: Install dependencies and verify workspace**

Run:
```bash
pnpm install
```
Expected: Clean install, all workspace packages linked.

Run:
```bash
pnpm ls --depth 0 -r
```
Expected: All 8 packages listed with correct workspace links.

Run:
```bash
pnpm --filter @nextreport/schema typecheck
```
Expected: No errors (empty index.ts compiles fine).

- [ ] **Step 7: Commit scaffold**

```bash
git add .
git commit -m "chore: scaffold turborepo monorepo with 7 packages + web app"
```

---

## Task 2: Schema — Position, Page, DataSource Types

**Files:**
- Create: `packages/schema/src/position.schema.ts`
- Create: `packages/schema/src/page.schema.ts`
- Create: `packages/schema/src/data-source.schema.ts`
- Create: `packages/schema/src/__tests__/page.schema.test.ts`

- [ ] **Step 1: Write failing tests for Position, Page, DataSource schemas**

`packages/schema/src/__tests__/page.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { PositionSchema, PageSchema, DataSourceSchema } from '../index.js'

describe('PositionSchema', () => {
  it('accepts valid position', () => {
    const result = PositionSchema.parse({ x: 0, y: 10, width: 200, height: 30 })
    expect(result).toEqual({ x: 0, y: 10, width: 200, height: 30 })
  })

  it('rejects negative width', () => {
    expect(() => PositionSchema.parse({ x: 0, y: 0, width: -1, height: 30 })).toThrow()
  })

  it('rejects missing fields', () => {
    expect(() => PositionSchema.parse({ x: 0 })).toThrow()
  })
})

describe('PageSchema', () => {
  it('accepts valid page config', () => {
    const result = PageSchema.parse({
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
    })
    expect(result.size).toBe('A4')
    expect(result.orientation).toBe('portrait')
  })

  it('applies defaults for missing fields', () => {
    const result = PageSchema.parse({})
    expect(result.size).toBe('A4')
    expect(result.orientation).toBe('portrait')
    expect(result.margins).toEqual({ top: 20, right: 15, bottom: 20, left: 15 })
  })

  it('rejects invalid page size', () => {
    expect(() => PageSchema.parse({ size: 'B5' })).toThrow()
  })
})

describe('DataSourceSchema', () => {
  it('accepts json data source with fields', () => {
    const result = DataSourceSchema.parse({
      type: 'json',
      fields: [
        { name: 'companyName', type: 'string' },
        { name: 'items', type: 'array', fields: [
          { name: 'name', type: 'string' },
          { name: 'price', type: 'number' },
        ]},
      ],
    })
    expect(result.type).toBe('json')
    expect(result.fields).toHaveLength(2)
    expect(result.fields![1].fields).toHaveLength(2)
  })

  it('accepts data source without fields (optional)', () => {
    const result = DataSourceSchema.parse({ type: 'json' })
    expect(result.fields).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/schema test`
Expected: FAIL — imports not found.

- [ ] **Step 3: Implement Position, Page, DataSource schemas**

`packages/schema/src/position.schema.ts`:
```typescript
import { z } from 'zod'

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
})

export type Position = z.infer<typeof PositionSchema>
```

`packages/schema/src/page.schema.ts`:
```typescript
import { z } from 'zod'

export const PageSizeSchema = z.enum(['A4', 'A3', 'Letter', 'Legal'])
export type PageSize = z.infer<typeof PageSizeSchema>

export const OrientationSchema = z.enum(['portrait', 'landscape'])
export type Orientation = z.infer<typeof OrientationSchema>

export const MarginsSchema = z.object({
  top: z.number().min(0),
  right: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
})
export type Margins = z.infer<typeof MarginsSchema>

export const PageSchema = z.object({
  size: PageSizeSchema.default('A4'),
  orientation: OrientationSchema.default('portrait'),
  margins: MarginsSchema.default({ top: 20, right: 15, bottom: 20, left: 15 }),
})
export type Page = z.infer<typeof PageSchema>
```

`packages/schema/src/data-source.schema.ts`:
```typescript
import { z } from 'zod'

export const FieldTypeSchema = z.enum(['string', 'number', 'date', 'boolean', 'array'])
export type FieldType = z.infer<typeof FieldTypeSchema>

export interface Field {
  name: string
  type: FieldType
  fields?: Field[]
}

export const FieldSchema: z.ZodType<Field> = z.object({
  name: z.string().min(1),
  type: FieldTypeSchema,
  fields: z.lazy(() => z.array(FieldSchema)).optional(),
})

export const DataSourceSchema = z.object({
  type: z.enum(['json']),
  fields: z.array(FieldSchema).optional(),
})
export type DataSource = z.infer<typeof DataSourceSchema>
```

Update `packages/schema/src/index.ts`:
```typescript
export { PositionSchema, type Position } from './position.schema.js'
export {
  PageSizeSchema, type PageSize,
  OrientationSchema, type Orientation,
  MarginsSchema, type Margins,
  PageSchema, type Page,
} from './page.schema.js'
export {
  FieldTypeSchema, type FieldType,
  FieldSchema, type Field,
  DataSourceSchema, type DataSource,
} from './data-source.schema.js'
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @nextreport/schema test`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/schema/
git commit -m "feat(schema): add Position, Page, and DataSource schemas"
```

---

## Task 3: Schema — Component Schemas (Text, Table)

**Files:**
- Create: `packages/schema/src/component.schema.ts`
- Create: `packages/schema/src/__tests__/component.schema.test.ts`

- [ ] **Step 1: Write failing tests for component schemas**

`packages/schema/src/__tests__/component.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { ComponentSchema, TextComponentSchema, TableComponentSchema } from '../index.js'

describe('TextComponentSchema', () => {
  it('accepts valid text component', () => {
    const result = TextComponentSchema.parse({
      type: 'text',
      position: { x: 0, y: 10, width: 200, height: 30 },
      properties: {
        content: '{{companyName}}',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
      },
    })
    expect(result.type).toBe('text')
    expect(result.properties.content).toBe('{{companyName}}')
  })

  it('applies defaults for optional properties', () => {
    const result = TextComponentSchema.parse({
      type: 'text',
      position: { x: 0, y: 0, width: 100, height: 20 },
      properties: { content: 'Hello' },
    })
    expect(result.properties.fontSize).toBe(12)
    expect(result.properties.fontWeight).toBe('normal')
    expect(result.properties.color).toBe('#000000')
    expect(result.properties.textAlign).toBe('left')
  })
})

describe('TableComponentSchema', () => {
  it('accepts valid table component', () => {
    const result = TableComponentSchema.parse({
      type: 'table',
      position: { x: 0, y: 0, width: 500, height: 200 },
      properties: {
        dataBinding: 'items',
        columns: [
          { header: 'Name', field: 'name' },
          { header: 'Price', field: 'price', width: 100 },
        ],
      },
    })
    expect(result.type).toBe('table')
    expect(result.properties.columns).toHaveLength(2)
  })
})

describe('ComponentSchema (discriminated union)', () => {
  it('parses text component', () => {
    const result = ComponentSchema.parse({
      type: 'text',
      position: { x: 0, y: 0, width: 100, height: 20 },
      properties: { content: 'Hello' },
    })
    expect(result.type).toBe('text')
  })

  it('parses table component', () => {
    const result = ComponentSchema.parse({
      type: 'table',
      position: { x: 0, y: 0, width: 500, height: 200 },
      properties: { dataBinding: 'items', columns: [{ header: 'Name', field: 'name' }] },
    })
    expect(result.type).toBe('table')
  })

  it('rejects unknown component type', () => {
    expect(() => ComponentSchema.parse({
      type: 'chart',
      position: { x: 0, y: 0, width: 100, height: 100 },
      properties: {},
    })).toThrow()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/schema test`
Expected: FAIL — ComponentSchema not exported.

- [ ] **Step 3: Implement component schemas**

`packages/schema/src/component.schema.ts`:
```typescript
import { z } from 'zod'
import { PositionSchema } from './position.schema.js'

export const TextComponentSchema = z.object({
  type: z.literal('text'),
  position: PositionSchema,
  properties: z.object({
    content: z.string(),
    fontSize: z.number().positive().default(12),
    fontWeight: z.enum(['normal', 'bold']).default('normal'),
    color: z.string().default('#000000'),
    textAlign: z.enum(['left', 'center', 'right']).default('left'),
  }),
})
export type TextComponent = z.infer<typeof TextComponentSchema>

export const TableColumnSchema = z.object({
  header: z.string(),
  field: z.string(),
  width: z.number().positive().optional(),
})
export type TableColumn = z.infer<typeof TableColumnSchema>

export const TableComponentSchema = z.object({
  type: z.literal('table'),
  position: PositionSchema,
  properties: z.object({
    dataBinding: z.string(),
    columns: z.array(TableColumnSchema).min(1),
  }),
})
export type TableComponent = z.infer<typeof TableComponentSchema>

export const ComponentSchema = z.discriminatedUnion('type', [
  TextComponentSchema,
  TableComponentSchema,
])
export type Component = z.infer<typeof ComponentSchema>
```

Add to `packages/schema/src/index.ts`:
```typescript
export {
  TextComponentSchema, type TextComponent,
  TableColumnSchema, type TableColumn,
  TableComponentSchema, type TableComponent,
  ComponentSchema, type Component,
} from './component.schema.js'
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @nextreport/schema test`
Expected: All tests PASS (previous + new).

- [ ] **Step 5: Commit**

```bash
git add packages/schema/
git commit -m "feat(schema): add Text and Table component schemas with discriminated union"
```

---

## Task 4: Schema — Band, Report Schema & JSON Schema Export

**Files:**
- Create: `packages/schema/src/band.schema.ts`
- Create: `packages/schema/src/report.schema.ts`
- Create: `packages/schema/src/json-schema-export.ts`
- Create: `packages/schema/src/__tests__/report.schema.test.ts`
- Create: `packages/schema/src/__tests__/json-schema-export.test.ts`

- [ ] **Step 1: Write failing tests for band, report, and JSON Schema export**

`packages/schema/src/__tests__/report.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { BandSchema, ReportSchema } from '../index.js'

describe('BandSchema', () => {
  it('accepts header band with components', () => {
    const result = BandSchema.parse({
      type: 'header',
      height: 80,
      components: [{
        type: 'text',
        position: { x: 0, y: 10, width: 200, height: 30 },
        properties: { content: '{{companyName}}' },
      }],
    })
    expect(result.type).toBe('header')
    expect(result.components).toHaveLength(1)
  })

  it('accepts detail band with dataBinding', () => {
    const result = BandSchema.parse({
      type: 'detail', height: 25, dataBinding: 'items', components: [],
    })
    expect(result.dataBinding).toBe('items')
  })

  it('accepts empty components array', () => {
    const result = BandSchema.parse({ type: 'footer', height: 40, components: [] })
    expect(result.components).toHaveLength(0)
  })
})

describe('ReportSchema', () => {
  it('parses a complete invoice report schema', () => {
    const result = ReportSchema.parse({
      version: '1.0',
      type: 'report',
      locale: 'tr-TR',
      page: { size: 'A4', orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 } },
      dataSource: { type: 'json' },
      bands: [
        { type: 'header', height: 80, components: [
          { type: 'text', position: { x: 0, y: 10, width: 200, height: 30 }, properties: { content: '{{companyName}}', fontSize: 24, fontWeight: 'bold' } },
        ]},
        { type: 'detail', height: 25, dataBinding: 'items', components: [
          { type: 'text', position: { x: 0, y: 0, width: 200, height: 25 }, properties: { content: '{{item.name}}' } },
        ]},
        { type: 'footer', height: 40, components: [] },
      ],
    })
    expect(result.version).toBe('1.0')
    expect(result.bands).toHaveLength(3)
    expect(result.locale).toBe('tr-TR')
  })

  it('applies defaults', () => {
    const result = ReportSchema.parse({
      type: 'report', dataSource: { type: 'json' }, bands: [],
    })
    expect(result.version).toBe('1.0')
    expect(result.locale).toBe('en-US')
    expect(result.page.size).toBe('A4')
  })

  it('rejects invalid type', () => {
    expect(() => ReportSchema.parse({
      type: 'dashboard', dataSource: { type: 'json' }, bands: [],
    })).toThrow()
  })
})
```

`packages/schema/src/__tests__/json-schema-export.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { getReportJsonSchema } from '../index.js'

describe('JSON Schema Export', () => {
  it('exports valid JSON Schema object', () => {
    const jsonSchema = getReportJsonSchema()
    expect(jsonSchema).toHaveProperty('type', 'object')
    expect(jsonSchema).toHaveProperty('properties')
  })

  it('produces serializable JSON', () => {
    const jsonSchema = getReportJsonSchema()
    const serialized = JSON.stringify(jsonSchema)
    const parsed = JSON.parse(serialized)
    expect(parsed).toEqual(jsonSchema)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/schema test`
Expected: FAIL — BandSchema, ReportSchema, getReportJsonSchema not found.

- [ ] **Step 3: Implement Band, Report schemas and JSON Schema export**

`packages/schema/src/band.schema.ts`:
```typescript
import { z } from 'zod'
import { ComponentSchema } from './component.schema.js'

export const BandTypeSchema = z.enum([
  'header', 'detail', 'footer',
  'group-header', 'group-footer',
  'page-header', 'page-footer',
  'custom',
])
export type BandType = z.infer<typeof BandTypeSchema>

export const BandSchema = z.object({
  type: BandTypeSchema,
  height: z.number().positive(),
  dataBinding: z.string().optional(),
  iteratorName: z.string().optional(),
  components: z.array(ComponentSchema),
})
export type Band = z.infer<typeof BandSchema>
```

`packages/schema/src/report.schema.ts`:
```typescript
import { z } from 'zod'
import { PageSchema } from './page.schema.js'
import { DataSourceSchema } from './data-source.schema.js'
import { BandSchema } from './band.schema.js'

export const ReportSchema = z.object({
  version: z.string().default('1.0'),
  type: z.literal('report'),
  locale: z.string().default('en-US'),
  page: PageSchema.default({}),
  dataSource: DataSourceSchema,
  bands: z.array(BandSchema),
})
export type Report = z.infer<typeof ReportSchema>
```

`packages/schema/src/json-schema-export.ts`:
```typescript
import { zodToJsonSchema } from 'zod-to-json-schema'
import { ReportSchema } from './report.schema.js'

export function getReportJsonSchema() {
  return zodToJsonSchema(ReportSchema, {
    name: 'ReportSchema',
    $refStrategy: 'none',
  })
}
```

Update `packages/schema/src/index.ts` — complete file:
```typescript
export { PositionSchema, type Position } from './position.schema.js'
export {
  PageSizeSchema, type PageSize,
  OrientationSchema, type Orientation,
  MarginsSchema, type Margins,
  PageSchema, type Page,
} from './page.schema.js'
export {
  FieldTypeSchema, type FieldType,
  FieldSchema, type Field,
  DataSourceSchema, type DataSource,
} from './data-source.schema.js'
export {
  TextComponentSchema, type TextComponent,
  TableColumnSchema, type TableColumn,
  TableComponentSchema, type TableComponent,
  ComponentSchema, type Component,
} from './component.schema.js'
export {
  BandTypeSchema, type BandType,
  BandSchema, type Band,
} from './band.schema.js'
export {
  ReportSchema, type Report,
} from './report.schema.js'
export { getReportJsonSchema } from './json-schema-export.js'
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @nextreport/schema test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/schema/
git commit -m "feat(schema): add Band, Report schemas and JSON Schema export"
```

---

## Task 5: Engine Core — IR Types & Expression Tokenizer

**Files:**
- Create: `packages/engine-core/src/types.ts`
- Create: `packages/engine-core/src/expression/tokenizer.ts`
- Create: `packages/engine-core/src/__tests__/expression/tokenizer.test.ts`

- [ ] **Step 1: Create IR types (pure type definitions, no tests needed)**

`packages/engine-core/src/types.ts`:
```typescript
export interface RenderResult {
  pages: Page[]
  metadata: RenderMetadata
}

export interface RenderMetadata {
  totalPages: number
  generatedAt: string
  locale: string
}

export interface Page {
  number: number
  elements: ResolvedElement[]
}

export interface ResolvedElement {
  type: string
  position: { x: number; y: number; width: number; height: number }
  properties: Record<string, unknown>
  bandType: string
  pageBreakBefore?: boolean
}

export interface RenderOptions {
  locale?: string
}
```

- [ ] **Step 2: Write failing tests for expression tokenizer**

`packages/engine-core/src/__tests__/expression/tokenizer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { tokenize, TokenType } from '../../expression/tokenizer.js'

describe('tokenize', () => {
  it('tokenizes a simple variable', () => {
    const tokens = tokenize('customer.name')
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'customer' },
      { type: TokenType.Dot, value: '.' },
      { type: TokenType.Identifier, value: 'name' },
    ])
  })

  it('tokenizes a function call', () => {
    const tokens = tokenize("formatCurrency(price, 'TRY')")
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'formatCurrency' },
      { type: TokenType.LParen, value: '(' },
      { type: TokenType.Identifier, value: 'price' },
      { type: TokenType.Comma, value: ',' },
      { type: TokenType.String, value: 'TRY' },
      { type: TokenType.RParen, value: ')' },
    ])
  })

  it('tokenizes a number', () => {
    const tokens = tokenize('1000')
    expect(tokens).toEqual([
      { type: TokenType.Number, value: '1000' },
    ])
  })

  it('tokenizes comparison operators', () => {
    const tokens = tokenize('total > 1000')
    expect(tokens).toEqual([
      { type: TokenType.Identifier, value: 'total' },
      { type: TokenType.Operator, value: '>' },
      { type: TokenType.Number, value: '1000' },
    ])
  })

  it('tokenizes nested function call', () => {
    const tokens = tokenize("formatCurrency(sum(items, 'price'), 'TRY')")
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.Identifier, TokenType.LParen,
      TokenType.Identifier, TokenType.LParen,
      TokenType.Identifier, TokenType.Comma, TokenType.String,
      TokenType.RParen, TokenType.Comma, TokenType.String,
      TokenType.RParen,
    ])
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement tokenizer**

`packages/engine-core/src/expression/tokenizer.ts`:
```typescript
export enum TokenType {
  Identifier = 'Identifier',
  Number = 'Number',
  String = 'String',
  Dot = 'Dot',
  Comma = 'Comma',
  LParen = 'LParen',
  RParen = 'RParen',
  Operator = 'Operator',
}

export interface Token {
  type: TokenType
  value: string
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    if (ch === ' ' || ch === '\t' || ch === '\n') { i++; continue }
    if (ch === '.') { tokens.push({ type: TokenType.Dot, value: '.' }); i++; continue }
    if (ch === ',') { tokens.push({ type: TokenType.Comma, value: ',' }); i++; continue }
    if (ch === '(') { tokens.push({ type: TokenType.LParen, value: '(' }); i++; continue }
    if (ch === ')') { tokens.push({ type: TokenType.RParen, value: ')' }); i++; continue }

    if (ch === '>' || ch === '<' || ch === '=' || ch === '!') {
      let op = ch
      if (i + 1 < input.length && input[i + 1] === '=') { op += '='; i++ }
      tokens.push({ type: TokenType.Operator, value: op }); i++; continue
    }

    if (ch === "'" || ch === '"') {
      const quote = ch
      let str = ''
      i++
      while (i < input.length && input[i] !== quote) { str += input[i]; i++ }
      i++ // skip closing quote
      tokens.push({ type: TokenType.String, value: str }); continue
    }

    if (ch >= '0' && ch <= '9') {
      let num = ''
      while (i < input.length && ((input[i] >= '0' && input[i] <= '9') || input[i] === '.')) {
        num += input[i]; i++
      }
      tokens.push({ type: TokenType.Number, value: num }); continue
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let ident = ''
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) { ident += input[i]; i++ }
      tokens.push({ type: TokenType.Identifier, value: ident }); continue
    }

    throw new Error(`Unexpected character: '${ch}' at position ${i}`)
  }

  return tokens
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine-core/
git commit -m "feat(engine-core): add IR types and expression tokenizer"
```

---

## Task 6: Engine Core — Expression Parser

**Files:**
- Create: `packages/engine-core/src/expression/parser.ts`
- Create: `packages/engine-core/src/__tests__/expression/parser.test.ts`

- [ ] **Step 1: Write failing tests for expression parser**

`packages/engine-core/src/__tests__/expression/parser.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parseExpression, parseTemplate } from '../../expression/parser.js'

describe('parseExpression', () => {
  it('parses a simple variable', () => {
    const ast = parseExpression('customer.name')
    expect(ast).toEqual({ type: 'variable', path: ['customer', 'name'] })
  })

  it('parses a function call with literal args', () => {
    const ast = parseExpression("formatCurrency(price, 'TRY')")
    expect(ast).toEqual({
      type: 'functionCall', name: 'formatCurrency',
      args: [
        { type: 'variable', path: ['price'] },
        { type: 'literal', value: 'TRY' },
      ],
    })
  })

  it('parses nested function calls', () => {
    const ast = parseExpression("formatCurrency(sum(items, 'price'), 'TRY')")
    expect(ast).toEqual({
      type: 'functionCall', name: 'formatCurrency',
      args: [
        { type: 'functionCall', name: 'sum', args: [
          { type: 'variable', path: ['items'] },
          { type: 'literal', value: 'price' },
        ]},
        { type: 'literal', value: 'TRY' },
      ],
    })
  })

  it('parses comparison expression', () => {
    const ast = parseExpression('total > 1000')
    expect(ast).toEqual({
      type: 'comparison', operator: '>',
      left: { type: 'variable', path: ['total'] },
      right: { type: 'literal', value: 1000 },
    })
  })

  it('parses numeric literal', () => {
    expect(parseExpression('42')).toEqual({ type: 'literal', value: 42 })
  })
})

describe('parseTemplate', () => {
  it('parses plain text (no expressions)', () => {
    expect(parseTemplate('Hello World')).toEqual({ type: 'literal', value: 'Hello World' })
  })

  it('parses single expression', () => {
    expect(parseTemplate('{{customer.name}}')).toEqual({ type: 'variable', path: ['customer', 'name'] })
  })

  it('parses mixed text and expressions', () => {
    const ast = parseTemplate('Hello {{name}}, total: {{total}}')
    expect(ast).toEqual({
      type: 'template',
      parts: [
        { type: 'literal', value: 'Hello ' },
        { type: 'variable', path: ['name'] },
        { type: 'literal', value: ', total: ' },
        { type: 'variable', path: ['total'] },
      ],
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: FAIL — parseExpression, parseTemplate not found.

- [ ] **Step 3: Implement expression parser**

`packages/engine-core/src/expression/parser.ts`:
```typescript
import { tokenize, TokenType, type Token } from './tokenizer.js'

export type Expression =
  | { type: 'literal'; value: string | number | boolean }
  | { type: 'variable'; path: string[] }
  | { type: 'functionCall'; name: string; args: Expression[] }
  | { type: 'comparison'; operator: string; left: Expression; right: Expression }
  | { type: 'template'; parts: Expression[] }

class Parser {
  private tokens: Token[]
  private pos = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  parse(): Expression {
    return this.parseComparison()
  }

  private parseComparison(): Expression {
    const left = this.parsePrimary()
    if (this.pos < this.tokens.length && this.tokens[this.pos].type === TokenType.Operator) {
      const operator = this.tokens[this.pos].value
      this.pos++
      const right = this.parsePrimary()
      return { type: 'comparison', operator, left, right }
    }
    return left
  }

  private parsePrimary(): Expression {
    const token = this.tokens[this.pos]
    if (!token) throw new Error('Unexpected end of expression')

    if (token.type === TokenType.String) {
      this.pos++
      return { type: 'literal', value: token.value }
    }

    if (token.type === TokenType.Number) {
      this.pos++
      return { type: 'literal', value: Number(token.value) }
    }

    if (token.type === TokenType.Identifier) {
      return this.parseIdentifierOrCall()
    }

    throw new Error(`Unexpected token: ${token.type} '${token.value}'`)
  }

  private parseIdentifierOrCall(): Expression {
    const name = this.tokens[this.pos].value
    this.pos++

    // Function call: identifier followed by '('
    if (this.pos < this.tokens.length && this.tokens[this.pos].type === TokenType.LParen) {
      this.pos++ // skip '('
      const args: Expression[] = []
      while (this.pos < this.tokens.length && this.tokens[this.pos].type !== TokenType.RParen) {
        if (args.length > 0) {
          if (this.tokens[this.pos].type !== TokenType.Comma) {
            throw new Error(`Expected comma, got ${this.tokens[this.pos].type}`)
          }
          this.pos++ // skip ','
        }
        args.push(this.parseComparison())
      }
      this.pos++ // skip ')'
      return { type: 'functionCall', name, args }
    }

    // Variable with dot notation
    const path = [name]
    while (this.pos < this.tokens.length && this.tokens[this.pos].type === TokenType.Dot) {
      this.pos++ // skip '.'
      if (this.pos >= this.tokens.length || this.tokens[this.pos].type !== TokenType.Identifier) {
        throw new Error('Expected identifier after dot')
      }
      path.push(this.tokens[this.pos].value)
      this.pos++
    }
    return { type: 'variable', path }
  }
}

export function parseExpression(input: string): Expression {
  const tokens = tokenize(input)
  return new Parser(tokens).parse()
}

export function parseTemplate(input: string): Expression {
  const parts: Expression[] = []
  let lastIndex = 0
  const regex = /\{\{(.+?)\}\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'literal', value: input.slice(lastIndex, match.index) })
    }
    parts.push(parseExpression(match[1].trim()))
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < input.length) {
    parts.push({ type: 'literal', value: input.slice(lastIndex) })
  }

  if (parts.length === 0) return { type: 'literal', value: '' }
  if (parts.length === 1) return parts[0]
  return { type: 'template', parts }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine-core/
git commit -m "feat(engine-core): add expression parser with template, variable, function, comparison support"
```

---

## Task 7: Engine Core — Type Coercion, Built-in Functions & Evaluator

**Files:**
- Create: `packages/engine-core/src/expression/coerce.ts`
- Create: `packages/engine-core/src/expression/functions/registry.ts`
- Create: `packages/engine-core/src/expression/functions/format.ts`
- Create: `packages/engine-core/src/expression/functions/aggregate.ts`
- Create: `packages/engine-core/src/expression/functions/string.ts`
- Create: `packages/engine-core/src/expression/functions/conditional.ts`
- Create: `packages/engine-core/src/expression/evaluator.ts`
- Create: `packages/engine-core/src/__tests__/expression/coerce.test.ts`
- Create: `packages/engine-core/src/__tests__/expression/evaluator.test.ts`

- [ ] **Step 1: Write failing tests for coercion**

`packages/engine-core/src/__tests__/expression/coerce.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { toNumber, toDate, toBoolean, toString } from '../../expression/coerce.js'

describe('toNumber', () => {
  it('passes through numbers', () => expect(toNumber(42)).toBe(42))
  it('converts string to number', () => expect(toNumber('45000')).toBe(45000))
  it('converts float string', () => expect(toNumber('3.14')).toBe(3.14))
  it('throws on non-numeric string', () => expect(() => toNumber('abc')).toThrow())
  it('returns 0 for null', () => expect(toNumber(null)).toBe(0))
  it('returns 0 for undefined', () => expect(toNumber(undefined)).toBe(0))
})

describe('toDate', () => {
  it('passes through Date objects', () => {
    const d = new Date('2026-04-12')
    expect(toDate(d)).toEqual(d)
  })
  it('parses ISO date string', () => {
    const result = toDate('2026-04-12')
    expect(result.getFullYear()).toBe(2026)
  })
  it('throws on invalid date string', () => expect(() => toDate('not-a-date')).toThrow())
})

describe('toBoolean', () => {
  it('passes through booleans', () => expect(toBoolean(true)).toBe(true))
  it('converts "true" string', () => expect(toBoolean('true')).toBe(true))
  it('converts "false" string', () => expect(toBoolean('false')).toBe(false))
})

describe('toString', () => {
  it('converts number to string', () => expect(toString(42)).toBe('42'))
  it('passes through strings', () => expect(toString('hello')).toBe('hello'))
  it('converts null to empty string', () => expect(toString(null)).toBe(''))
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: FAIL — coerce module not found.

- [ ] **Step 3: Implement coercion utilities**

`packages/engine-core/src/expression/coerce.ts`:
```typescript
export function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isNaN(n)) throw new Error(`Cannot coerce '${v}' to number`)
    return n
  }
  throw new Error(`Cannot coerce ${typeof v} to number`)
}

export function toDate(v: unknown): Date {
  if (v instanceof Date) return v
  if (typeof v === 'string') {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) throw new Error(`Cannot coerce '${v}' to date`)
    return d
  }
  throw new Error(`Cannot coerce ${typeof v} to date`)
}

export function toBoolean(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v.toLowerCase() === 'true'
  return Boolean(v)
}

export function toString(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}
```

- [ ] **Step 4: Write failing tests for evaluator**

`packages/engine-core/src/__tests__/expression/evaluator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { evaluateExpression } from '../../expression/evaluator.js'

const sampleData = {
  companyName: 'Acme Corp',
  total: 45000,
  customer: { name: 'John', city: 'Istanbul' },
  items: [
    { name: 'Laptop', price: 44000, qty: 1 },
    { name: 'Mouse', price: 1000, qty: 3 },
  ],
}

describe('evaluateExpression', () => {
  it('resolves simple variable', () => {
    expect(evaluateExpression('{{companyName}}', sampleData)).toBe('Acme Corp')
  })

  it('resolves nested variable', () => {
    expect(evaluateExpression('{{customer.name}}', sampleData)).toBe('John')
  })

  it('resolves plain text (no expressions)', () => {
    expect(evaluateExpression('Hello World', sampleData)).toBe('Hello World')
  })

  it('resolves mixed template', () => {
    expect(evaluateExpression('Company: {{companyName}}', sampleData)).toBe('Company: Acme Corp')
  })

  it('resolves uppercase function', () => {
    expect(evaluateExpression('{{uppercase(companyName)}}', sampleData)).toBe('ACME CORP')
  })

  it('resolves concat function', () => {
    const result = evaluateExpression("{{concat(customer.name, ' from ', customer.city)}}", sampleData)
    expect(result).toBe('John from Istanbul')
  })

  it('resolves sum aggregate', () => {
    expect(evaluateExpression("{{sum(items, 'price')}}", sampleData)).toBe(45000)
  })

  it('resolves count aggregate', () => {
    expect(evaluateExpression("{{count(items)}}", sampleData)).toBe(2)
  })

  it('resolves if conditional (true branch)', () => {
    expect(evaluateExpression("{{if(total > 10000, 'VIP', 'Standard')}}", sampleData)).toBe('VIP')
  })

  it('returns undefined for missing variable', () => {
    expect(evaluateExpression('{{nonexistent}}', sampleData)).toBeUndefined()
  })

  it('handles string coercion in formatNumber', () => {
    const data = { price: '45000' }
    expect(evaluateExpression("{{formatNumber(price, 0)}}", data)).toBe('45,000')
  })
})
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: coerce tests PASS, evaluator tests FAIL.

- [ ] **Step 6: Implement built-in functions and evaluator**

`packages/engine-core/src/expression/functions/registry.ts`:
```typescript
export type BuiltinFn = (args: unknown[], locale: string) => unknown

const registry = new Map<string, BuiltinFn>()

export function registerFunction(name: string, fn: BuiltinFn): void {
  registry.set(name, fn)
}

export function getFunction(name: string): BuiltinFn | undefined {
  return registry.get(name)
}
```

`packages/engine-core/src/expression/functions/format.ts`:
```typescript
import { registerFunction } from './registry.js'
import { toNumber, toDate } from '../coerce.js'

registerFunction('formatCurrency', (args, locale) => {
  const value = toNumber(args[0])
  const currency = String(args[1] ?? 'USD')
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
})

registerFunction('formatDate', (args, _locale) => {
  const date = toDate(args[0])
  const pattern = String(args[1] ?? 'YYYY-MM-DD')
  const pad = (n: number) => String(n).padStart(2, '0')
  return pattern
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
})

registerFunction('formatNumber', (args, locale) => {
  const value = toNumber(args[0])
  const decimals = args[1] !== undefined ? toNumber(args[1]) : 0
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
})
```

`packages/engine-core/src/expression/functions/aggregate.ts`:
```typescript
import { registerFunction } from './registry.js'
import { toNumber } from '../coerce.js'

registerFunction('sum', (args) => {
  const arr = args[0]
  if (!Array.isArray(arr)) throw new Error('sum() expects an array as first argument')
  const field = String(args[1])
  return arr.reduce((acc: number, item: Record<string, unknown>) => acc + toNumber(item[field]), 0)
})

registerFunction('count', (args) => {
  const arr = args[0]
  if (!Array.isArray(arr)) throw new Error('count() expects an array')
  return arr.length
})
```

`packages/engine-core/src/expression/functions/string.ts`:
```typescript
import { registerFunction } from './registry.js'
import { toString } from '../coerce.js'

registerFunction('uppercase', (args) => toString(args[0]).toUpperCase())
registerFunction('lowercase', (args) => toString(args[0]).toLowerCase())
registerFunction('concat', (args) => args.map(a => toString(a)).join(''))
```

`packages/engine-core/src/expression/functions/conditional.ts`:
```typescript
import { registerFunction } from './registry.js'

registerFunction('if', (args) => {
  const condition = args[0]
  const trueValue = args[1]
  const falseValue = args[2]
  return condition ? trueValue : falseValue
})
```

`packages/engine-core/src/expression/evaluator.ts`:
```typescript
import { parseTemplate, type Expression } from './parser.js'
import { getFunction } from './functions/registry.js'
// Side-effect imports: register all built-in functions
import './functions/format.js'
import './functions/aggregate.js'
import './functions/string.js'
import './functions/conditional.js'

export function evaluateExpression(
  template: string,
  data: Record<string, unknown>,
  locale: string = 'en-US',
): unknown {
  const ast = parseTemplate(template)
  return evaluateNode(ast, data, locale)
}

function evaluateNode(node: Expression, data: Record<string, unknown>, locale: string): unknown {
  switch (node.type) {
    case 'literal':
      return node.value

    case 'variable':
      return resolveVariable(node.path, data)

    case 'functionCall': {
      const fn = getFunction(node.name)
      if (!fn) throw new Error(`Unknown function: ${node.name}`)
      const args = node.args.map(arg => evaluateNode(arg, data, locale))
      return fn(args, locale)
    }

    case 'comparison': {
      const left = evaluateNode(node.left, data, locale)
      const right = evaluateNode(node.right, data, locale)
      return compare(left, right, node.operator)
    }

    case 'template':
      return node.parts.map(part => {
        const val = evaluateNode(part, data, locale)
        return val === undefined || val === null ? '' : String(val)
      }).join('')
  }
}

function resolveVariable(path: string[], data: Record<string, unknown>): unknown {
  let current: unknown = data
  for (const key of path) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function compare(left: unknown, right: unknown, operator: string): boolean {
  const l = typeof left === 'string' ? Number(left) || left : left
  const r = typeof right === 'string' ? Number(right) || right : right
  switch (operator) {
    case '>': return (l as number) > (r as number)
    case '<': return (l as number) < (r as number)
    case '>=': return (l as number) >= (r as number)
    case '<=': return (l as number) <= (r as number)
    case '==': return l === r
    case '!=': return l !== r
    default: throw new Error(`Unknown operator: ${operator}`)
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/engine-core/
git commit -m "feat(engine-core): add expression evaluator with coercion and 9 built-in functions"
```

---

## Task 8: Engine Core — Band Processor

**Files:**
- Create: `packages/engine-core/src/band-processor/band-processor.ts`
- Create: `packages/engine-core/src/__tests__/band-processor.test.ts`

- [ ] **Step 1: Write failing tests for band processor**

`packages/engine-core/src/__tests__/band-processor.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { processBands } from '../../band-processor/band-processor.js'
import type { Band } from '@nextreport/schema'

const sampleData = {
  companyName: 'Acme Corp',
  items: [
    { name: 'Laptop', price: 44000, qty: 1 },
    { name: 'Mouse', price: 1000, qty: 3 },
  ],
}

describe('processBands', () => {
  it('processes header band (single instance)', () => {
    const bands: Band[] = [{
      type: 'header', height: 80,
      components: [
        { type: 'text', position: { x: 0, y: 10, width: 200, height: 30 }, properties: { content: '{{companyName}}' } },
      ],
    }]
    const result = processBands(bands, sampleData, 'en-US')
    expect(result).toHaveLength(1)
    expect(result[0].bandType).toBe('header')
    expect(result[0].elements[0].properties.content).toBe('Acme Corp')
  })

  it('processes detail band — one row per data item', () => {
    const bands: Band[] = [{
      type: 'detail', height: 25, dataBinding: 'items',
      components: [
        { type: 'text', position: { x: 0, y: 0, width: 200, height: 25 }, properties: { content: '{{item.name}}' } },
      ],
    }]
    const result = processBands(bands, sampleData, 'en-US')
    expect(result).toHaveLength(2)
    expect(result[0].elements[0].properties.content).toBe('Laptop')
    expect(result[1].elements[0].properties.content).toBe('Mouse')
  })

  it('uses custom iteratorName', () => {
    const bands: Band[] = [{
      type: 'detail', height: 25, dataBinding: 'items', iteratorName: 'product',
      components: [
        { type: 'text', position: { x: 0, y: 0, width: 200, height: 25 }, properties: { content: '{{product.name}}' } },
      ],
    }]
    const result = processBands(bands, sampleData, 'en-US')
    expect(result[0].elements[0].properties.content).toBe('Laptop')
  })

  it('processes footer with aggregate', () => {
    const bands: Band[] = [{
      type: 'footer', height: 40,
      components: [
        { type: 'text', position: { x: 0, y: 0, width: 100, height: 30 }, properties: { content: "Total: {{sum(items, 'price')}}" } },
      ],
    }]
    const result = processBands(bands, sampleData, 'en-US')
    expect(result).toHaveLength(1)
    expect(result[0].elements[0].properties.content).toBe('Total: 45000')
  })

  it('processes mixed bands in order', () => {
    const bands: Band[] = [
      { type: 'header', height: 80, components: [
        { type: 'text', position: { x: 0, y: 0, width: 200, height: 30 }, properties: { content: 'Header' } },
      ]},
      { type: 'detail', height: 25, dataBinding: 'items', components: [
        { type: 'text', position: { x: 0, y: 0, width: 200, height: 25 }, properties: { content: '{{item.name}}' } },
      ]},
      { type: 'footer', height: 40, components: [
        { type: 'text', position: { x: 0, y: 0, width: 100, height: 30 }, properties: { content: 'Footer' } },
      ]},
    ]
    const result = processBands(bands, sampleData, 'en-US')
    expect(result).toHaveLength(4) // 1 header + 2 detail + 1 footer
    expect(result.map(b => b.bandType)).toEqual(['header', 'detail', 'detail', 'footer'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: FAIL — processBands not found.

- [ ] **Step 3: Implement band processor**

`packages/engine-core/src/band-processor/band-processor.ts`:
```typescript
import type { Band, Component } from '@nextreport/schema'
import { evaluateExpression } from '../expression/evaluator.js'
import type { ResolvedElement } from '../types.js'

export interface ProcessedBand {
  bandType: string
  height: number
  elements: ResolvedElement[]
}

export function processBands(
  bands: Band[],
  data: Record<string, unknown>,
  locale: string,
): ProcessedBand[] {
  const result: ProcessedBand[] = []

  for (const band of bands) {
    if (band.type === 'detail' && band.dataBinding) {
      const array = resolveDataBinding(band.dataBinding, data)
      if (!Array.isArray(array)) continue

      const iteratorName = band.iteratorName ?? deriveIteratorName(band.dataBinding)

      for (const item of array) {
        const rowContext = { ...data, [iteratorName]: item }
        result.push({
          bandType: band.type,
          height: band.height,
          elements: resolveComponents(band.components, rowContext, band.type, locale),
        })
      }
    } else {
      result.push({
        bandType: band.type,
        height: band.height,
        elements: resolveComponents(band.components, data, band.type, locale),
      })
    }
  }

  return result
}

function resolveComponents(
  components: Component[],
  data: Record<string, unknown>,
  bandType: string,
  locale: string,
): ResolvedElement[] {
  return components.map(component => {
    const resolvedProps: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(component.properties)) {
      resolvedProps[key] = typeof value === 'string' && value.includes('{{')
        ? evaluateExpression(value, data, locale)
        : value
    }
    return {
      type: component.type,
      position: { ...component.position },
      properties: resolvedProps,
      bandType,
    }
  })
}

function resolveDataBinding(binding: string, data: Record<string, unknown>): unknown {
  const parts = binding.split('.')
  let current: unknown = data
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function deriveIteratorName(dataBinding: string): string {
  const name = dataBinding.split('.').pop() ?? dataBinding
  return name.endsWith('s') ? name.slice(0, -1) : name
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine-core/
git commit -m "feat(engine-core): add band processor with detail iteration and expression resolution"
```

---

## Task 9: Engine Core — Layout Calculator

**Files:**
- Create: `packages/engine-core/src/layout/layout-calculator.ts`
- Create: `packages/engine-core/src/__tests__/layout-calculator.test.ts`

- [ ] **Step 1: Write failing tests for layout calculator**

`packages/engine-core/src/__tests__/layout-calculator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { calculateLayout } from '../../layout/layout-calculator.js'
import type { ProcessedBand } from '../../band-processor/band-processor.js'

describe('calculateLayout', () => {
  const pageConfig = {
    size: 'A4' as const,
    orientation: 'portrait' as const,
    margins: { top: 20, right: 15, bottom: 20, left: 15 },
  }

  it('calculates absolute Y positions from band heights', () => {
    const bands: ProcessedBand[] = [
      { bandType: 'header', height: 80, elements: [
        { type: 'text', position: { x: 0, y: 10, width: 200, height: 30 }, properties: { content: 'Title' }, bandType: 'header' },
      ]},
      { bandType: 'detail', height: 25, elements: [
        { type: 'text', position: { x: 0, y: 0, width: 200, height: 25 }, properties: { content: 'Row 1' }, bandType: 'detail' },
      ]},
    ]
    const pages = calculateLayout(bands, pageConfig)
    expect(pages).toHaveLength(1)
    expect(pages[0].elements[0].position.y).toBe(30)  // margin(20) + y(10)
    expect(pages[0].elements[1].position.y).toBe(100)  // margin(20) + header(80) + y(0)
  })

  it('adds left margin to x positions', () => {
    const bands: ProcessedBand[] = [
      { bandType: 'header', height: 40, elements: [
        { type: 'text', position: { x: 10, y: 0, width: 200, height: 30 }, properties: { content: 'Test' }, bandType: 'header' },
      ]},
    ]
    const pages = calculateLayout(bands, pageConfig)
    expect(pages[0].elements[0].position.x).toBe(25) // margin(15) + x(10)
  })

  it('creates page break when content exceeds page height', () => {
    // A4 portrait: 842pt. Usable: 842 - 20 - 20 = 802pt
    const bands: ProcessedBand[] = []
    for (let i = 0; i < 40; i++) {
      bands.push({
        bandType: 'detail', height: 25, elements: [
          { type: 'text', position: { x: 0, y: 0, width: 200, height: 25 }, properties: { content: `Row ${i}` }, bandType: 'detail' },
        ],
      })
    }
    const pages = calculateLayout(bands, pageConfig)
    expect(pages.length).toBeGreaterThan(1)
    expect(pages[0].elements.length).toBe(32) // 802 / 25 = 32
    expect(pages[1].elements.length).toBe(8)
  })

  it('assigns correct page numbers', () => {
    const bands: ProcessedBand[] = []
    for (let i = 0; i < 40; i++) {
      bands.push({
        bandType: 'detail', height: 25, elements: [
          { type: 'text', position: { x: 0, y: 0, width: 200, height: 25 }, properties: { content: `Row ${i}` }, bandType: 'detail' },
        ],
      })
    }
    const pages = calculateLayout(bands, pageConfig)
    expect(pages[0].number).toBe(1)
    expect(pages[1].number).toBe(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: FAIL — calculateLayout not found.

- [ ] **Step 3: Implement layout calculator**

`packages/engine-core/src/layout/layout-calculator.ts`:
```typescript
import type { Page as PageConfig } from '@nextreport/schema'
import type { ProcessedBand } from '../band-processor/band-processor.js'
import type { Page, ResolvedElement } from '../types.js'

const PAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
}

export function calculateLayout(bands: ProcessedBand[], pageConfig: PageConfig): Page[] {
  const dimensions = PAGE_DIMENSIONS[pageConfig.size]
  const isLandscape = pageConfig.orientation === 'landscape'
  const pageHeight = isLandscape ? dimensions.width : dimensions.height
  const { top: marginTop, bottom: marginBottom, left: marginLeft } = pageConfig.margins
  const usableHeight = pageHeight - marginTop - marginBottom

  const pages: Page[] = []
  let currentPageElements: ResolvedElement[] = []
  let currentY = 0
  let pageNumber = 1

  for (const band of bands) {
    if (currentY + band.height > usableHeight && currentPageElements.length > 0) {
      pages.push({ number: pageNumber, elements: currentPageElements })
      currentPageElements = []
      currentY = 0
      pageNumber++
    }

    for (const element of band.elements) {
      currentPageElements.push({
        ...element,
        position: {
          x: marginLeft + element.position.x,
          y: marginTop + currentY + element.position.y,
          width: element.position.width,
          height: element.position.height,
        },
      })
    }
    currentY += band.height
  }

  if (currentPageElements.length > 0) {
    pages.push({ number: pageNumber, elements: currentPageElements })
  }

  return pages
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine-core/
git commit -m "feat(engine-core): add layout calculator with pagination and absolute positioning"
```

---

## Task 10: Engine Core — Pipeline Orchestrator & Public API

**Files:**
- Create: `packages/engine-core/src/pipeline/render-pipeline.ts`
- Modify: `packages/engine-core/src/index.ts`
- Create: `packages/engine-core/src/__tests__/integration/pipeline.integration.test.ts`

- [ ] **Step 1: Write failing integration tests**

`packages/engine-core/src/__tests__/integration/pipeline.integration.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { renderReport, validateReport } from '../../index.js'

const invoiceSchema = {
  version: '1.0',
  type: 'report' as const,
  locale: 'en-US',
  page: { size: 'A4' as const, orientation: 'portrait' as const, margins: { top: 20, right: 15, bottom: 20, left: 15 } },
  dataSource: { type: 'json' as const },
  bands: [
    { type: 'header' as const, height: 80, components: [
      { type: 'text' as const, position: { x: 0, y: 10, width: 200, height: 30 }, properties: { content: '{{companyName}}', fontSize: 24, fontWeight: 'bold' as const } },
    ]},
    { type: 'detail' as const, height: 25, dataBinding: 'items', components: [
      { type: 'text' as const, position: { x: 0, y: 0, width: 200, height: 25 }, properties: { content: '{{item.name}}' } },
      { type: 'text' as const, position: { x: 400, y: 0, width: 100, height: 25 }, properties: { content: "{{formatCurrency(item.price, 'USD')}}" } },
    ]},
    { type: 'footer' as const, height: 40, components: [
      { type: 'text' as const, position: { x: 400, y: 5, width: 100, height: 30 }, properties: { content: "Total: {{formatCurrency(sum(items, 'price'), 'USD')}}" } },
    ]},
  ],
}

const invoiceData = {
  companyName: 'Acme Corp',
  items: [
    { name: 'Laptop', price: 1200, qty: 1 },
    { name: 'Mouse', price: 25, qty: 3 },
  ],
}

describe('renderReport (full pipeline)', () => {
  it('renders a complete invoice report', () => {
    const result = renderReport(invoiceSchema, invoiceData)
    expect(result.metadata.totalPages).toBe(1)
    expect(result.metadata.locale).toBe('en-US')
    expect(result.pages).toHaveLength(1)

    const el = result.pages[0].elements
    expect(el).toHaveLength(6) // 1 header + 2*2 detail + 1 footer
    expect(el[0].properties.content).toBe('Acme Corp')
    expect(el[0].bandType).toBe('header')
    expect(el[1].properties.content).toBe('Laptop')
    expect(el[2].properties.content).toBe('$1,200.00')
    expect(el[3].properties.content).toBe('Mouse')
    expect(el[4].properties.content).toBe('$25.00')
    expect(el[5].properties.content).toBe('Total: $1,225.00')
  })

  it('sets absolute positions with margins', () => {
    const result = renderReport(invoiceSchema, invoiceData)
    expect(result.pages[0].elements[0].position.x).toBe(15)
    expect(result.pages[0].elements[0].position.y).toBe(30) // margin(20) + y(10)
  })

  it('generates metadata', () => {
    const result = renderReport(invoiceSchema, invoiceData)
    expect(result.metadata.totalPages).toBe(1)
    expect(result.metadata.generatedAt).toBeTruthy()
    expect(result.metadata.locale).toBe('en-US')
  })
})

describe('validateReport', () => {
  it('validates a correct schema', () => {
    const result = validateReport(invoiceSchema)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects invalid schema', () => {
    const result = validateReport({ type: 'invalid' } as any)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nextreport/engine-core test`
Expected: FAIL — renderReport, validateReport not exported.

- [ ] **Step 3: Implement render pipeline**

`packages/engine-core/src/pipeline/render-pipeline.ts`:
```typescript
import { ReportSchema, type Report } from '@nextreport/schema'
import { processBands } from '../band-processor/band-processor.js'
import { calculateLayout } from '../layout/layout-calculator.js'
import type { RenderResult, RenderOptions } from '../types.js'

export interface ValidationResult {
  valid: boolean
  errors: Array<{ path: string; message: string }>
  warnings: string[]
}

export function renderReport(
  schema: Report,
  data: Record<string, unknown>,
  options?: RenderOptions,
): RenderResult {
  const locale = options?.locale ?? schema.locale ?? 'en-US'
  const parsed = ReportSchema.parse(schema)
  const processedBands = processBands(parsed.bands, data, locale)
  const pages = calculateLayout(processedBands, parsed.page)

  return {
    pages,
    metadata: {
      totalPages: pages.length,
      generatedAt: new Date().toISOString(),
      locale,
    },
  }
}

export function validateReport(schema: unknown): ValidationResult {
  const result = ReportSchema.safeParse(schema)
  if (result.success) {
    return { valid: true, errors: [], warnings: [] }
  }
  return {
    valid: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
    warnings: [],
  }
}
```

- [ ] **Step 4: Update public API**

`packages/engine-core/src/index.ts`:
```typescript
// @nextreport/engine-core — public API
// Only pipeline functions are exported. Internal modules are NOT accessible.

export { renderReport, validateReport } from './pipeline/render-pipeline.js'
export type { ValidationResult } from './pipeline/render-pipeline.js'
export type {
  RenderResult,
  RenderMetadata,
  Page,
  ResolvedElement,
  RenderOptions,
} from './types.js'
```

- [ ] **Step 5: Run ALL tests across workspace**

Run: `pnpm test`
Expected: All tests across schema + engine-core PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine-core/ packages/schema/
git commit -m "feat(engine-core): add render pipeline — full schema-to-IR pipeline complete"
```

---

## Task 11: Verify Dependency Isolation Rules

**Files:** No new files — verification only.

- [ ] **Step 1: Verify engine-core has no forbidden imports**

Run:
```bash
grep -rn "from 'react\|from 'next\|from 'konva\|from '@nextreport/canvas\|from '@nextreport/renderer\|from '@nextreport/ui-" packages/engine-core/src/ || echo "PASS: No forbidden imports in engine-core"
```
Expected: `PASS: No forbidden imports in engine-core`

- [ ] **Step 2: Verify engine-core index.ts only exports from pipeline and types**

Run:
```bash
grep "from '\." packages/engine-core/src/index.ts
```
Expected: Only `./pipeline/render-pipeline.js` and `./types.js` — no `./expression`, `./band-processor`, `./layout`.

- [ ] **Step 3: Verify schema has zero @nextreport dependencies**

Run:
```bash
grep -rn "from '@nextreport/" packages/schema/src/ || echo "PASS: Schema has no @nextreport dependencies"
```
Expected: `PASS: Schema has no @nextreport dependencies`

- [ ] **Step 4: Run full typecheck**

Run:
```bash
pnpm typecheck
```
Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git commit --allow-empty -m "chore: verify dependency isolation rules — all boundaries enforced"
```

---

## Summary

**Phase A delivers:**
- Turborepo monorepo with 7 packages + 1 app (scaffolded)
- `@nextreport/schema`: Zod-based DSL with Page, DataSource, Component (Text/Table), Band, Report schemas + JSON Schema export
- `@nextreport/engine-core`: 4-stage pipeline (validate → expression → band-process → layout) producing renderer-agnostic IR
- Expression engine with tokenizer, recursive descent parser, evaluator, coercion, and 9 built-in functions
- Full TDD coverage: unit tests per module + integration test for the complete pipeline
- Dependency isolation rules verified

**Next:** Phase B plan (renderer-html, renderer-pdf, API routes)
