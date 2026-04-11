# NextReportEngine — Technical Design Specification

**Version:** v0.1 (MVP)
**Date:** 2026-04-12
**Status:** Approved

---

## 1. Product Summary

Modern, API-first, schema-driven reporting engine with visual designer and runtime viewer. Targets JavaScript/TypeScript/React/Next.js/Java/.NET ecosystems.

**Core promise:** Design visually. Render via API. Integrate anywhere.

**MVP use case:** Invoice / PDF generator with visual editor.

---

## 2. Architecture Overview

### 2.1 Development Approach

**Schema-First Development** — DSL is defined first, everything else is built around it.

Build order:
1. Schema (Zod definitions, types)
2. Engine Core (pipeline, expression, band processor, layout)
3. Renderers (HTML, PDF) + API routes
4. Canvas + Designer + Viewer UI

### 2.2 Monorepo Structure

```
apps/
  web/                          → Next.js 16.2.3 (App Router)
                                  Designer + Viewer + Admin + API Routes

packages/
  @nextreport/schema            → Zod schemas + TypeScript types + JSON Schema export
  @nextreport/engine-core       → Render pipeline, band processor, expression engine, layout
  @nextreport/canvas            → Canvas abstraction (ports + Konva adapter)
  @nextreport/renderer-html     → IR → HTML string (pure TypeScript, no React)
  @nextreport/renderer-pdf      → HTML → Puppeteer → PDF buffer
  @nextreport/ui-designer       → Designer React components (toolbox, canvas area, property panel)
  @nextreport/ui-viewer         → Viewer React components (pagination, print, export)
```

**Monorepo strategy:** Hybrid — internal workspace packages for MVP, selective npm publish later. `@nextreport` scope reserved for future publish.

**Dev command:** `pnpm run dev` starts everything. Zero external dependencies (no database, no Docker, no Redis).

### 2.3 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | 6.0.2 |
| Framework | Next.js (App Router) | 16.2.3 |
| UI Library | React | 19.2 |
| UI Components | shadcn/ui | 4.2.0 |
| Styling | TailwindCSS | 4.2 |
| Monorepo | Turborepo | 2.9.6 |
| Package Manager | pnpm | 10.33.0 |
| Canvas | Konva.js (via abstraction adapter) | latest |
| State Management | Zustand + Immer | latest |
| Schema Validation | Zod + zod-to-json-schema | latest |
| PDF Rendering | Puppeteer | latest |
| Testing | Vitest | latest |

---

## 3. Dependency Graph & Isolation Rules

### 3.1 Package Dependencies

```
schema (ROOT — depends on nothing)
  ↑
engine-core → schema
  ↑
renderer-html → schema + engine-core
renderer-pdf  → schema + engine-core + renderer-html
canvas        → schema (types only)
  ↑
ui-designer → canvas + schema
ui-viewer   → renderer-html + schema
  ↑
apps/web → all packages
```

### 3.2 Strict Isolation Rules

**Allowed:**
- engine-core → schema
- renderer-* → schema + engine-core
- canvas → schema (types only)
- ui-designer → canvas + schema
- ui-viewer → renderer-html + schema
- apps/web → any package

**Forbidden:**
- schema → no dependencies
- engine-core → canvas, renderer, UI, Next.js, React
- renderer-* → canvas, UI, Next.js, React
- canvas → engine-core, renderer, UI
- Any package → apps/web
- Any package → konva (except canvas adapter)

### 3.3 Key Design Rules

1. **Engine Isolation Rule** — engine-core and renderers never import Next.js, React, or Konva
2. **Konva Adapter Rule** — Konva is imported only inside `@nextreport/canvas/adapters/konva/`
3. **Component Registry Rule** — Components are not imported by engine; they register themselves
4. **Core Nothing Imports** — engine-core depends only on schema
5. **Engine-Core Modular Boundary** — Internal modules (pipeline, expression, band-processor, layout) are not exported; prevents god-package anti-pattern
6. **Schema is Root** — Root of dependency graph, depends on nothing
7. **Renderer Pluggability** — New renderers are added without touching core
8. **Phase Migration Readiness** — MVP: Next.js API Routes → Phase 2: queue + worker separation → Phase 3: standalone render engine. Boundaries are drawn from day one.

---

## 4. Report Schema (DSL)

### 4.1 Schema Structure

```json
{
  "version": "1.0",
  "type": "report",
  "locale": "tr-TR",
  "page": {
    "size": "A4",
    "orientation": "portrait",
    "margins": { "top": 20, "right": 15, "bottom": 20, "left": 15 }
  },
  "dataSource": {
    "type": "json",
    "fields": [
      { "name": "companyName", "type": "string" },
      { "name": "invoiceDate", "type": "date" },
      { "name": "items", "type": "array", "fields": [
        { "name": "name", "type": "string" },
        { "name": "price", "type": "number" },
        { "name": "qty", "type": "number" }
      ]}
    ]
  },
  "bands": [
    {
      "type": "header",
      "height": 80,
      "components": [...]
    },
    {
      "type": "detail",
      "height": 25,
      "dataBinding": "items",
      "components": [...]
    },
    {
      "type": "footer",
      "height": 40,
      "components": [...]
    }
  ]
}
```

### 4.2 Component Schema

```json
{
  "type": "text",
  "position": { "x": 0, "y": 10, "width": 200, "height": 30 },
  "properties": {
    "content": "{{formatCurrency(item.price, 'TRY')}}",
    "fontSize": 24,
    "fontWeight": "bold",
    "color": "#1a1a1a"
  }
}
```

### 4.3 Band Types

**MVP:** `header`, `detail`, `footer`

**Future (schema-defined, not yet implemented):** `group-header`, `group-footer`, `page-header`, `page-footer`, `custom`

Flexible band model — classic bands are supported plus nesting (detail inside detail for master-detail reports) and custom bands for future extensibility.

### 4.4 Data Source Fields — Optional

`dataSource.fields` is **optional**. When present, it powers:
- Designer data tree panel (field list with types)
- Expression autocomplete
- Drag & drop field binding
- Pre-render data validation

When absent, the engine still works — expression-level coercion handles type conversion. Designer features that depend on field metadata are limited (user writes expressions manually).

When the user pastes JSON in the wizard, fields are **auto-inferred** from the data structure. User can optionally refine inferred types (e.g., mark a string field as "date").

### 4.5 Validation Strategy

**Zod + JSON Schema export:**
- Development: Zod schemas provide TypeScript type inference and runtime validation
- External: `zod-to-json-schema` generates standard JSON Schema for Java/.NET consumers
- Single source of truth: Zod definitions in `@nextreport/schema`

---

## 5. Engine Core

### 5.1 Pipeline

```
Report Schema JSON + Data
    ↓
① Schema Validator (Zod parse)
    ↓
② Expression Engine (parse → AST → evaluate with coercion)
    ↓
③ Band Processor (iterate detail bands, resolve components)
    ↓
④ Layout Calculator (positions, pagination, page breaks)
    ↓
OUTPUT: Intermediate Representation (IR)
```

### 5.2 Internal Module Structure

```
engine-core/src/
  pipeline/          → Orchestrator (public API entry point)
  expression/        → Expression parser, evaluator, built-in functions, coerce.ts
  band-processor/    → Band iteration, grouping, nesting logic
  layout/            → Position calculation, pagination, page breaks
  index.ts           → Public API only (internal modules not exported)
```

**⚠ God-Package Prevention:** Each internal module has its own directory, responsibility, and tests. They communicate through defined internal interfaces. External consumers access only the public API. If any module grows too large or gains an external consumer, it gets extracted to a separate package.

### 5.3 Public API

```typescript
// Only these are exported from @nextreport/engine-core
export { renderReport }        // (schema, data, options) → RenderResult (IR)
export { validateReport }      // (schema) → ValidationResult
export { createReportContext }  // (schema, data) → ReportContext (reusable)

export type { RenderResult, ValidationResult, ReportContext }
```

### 5.4 Intermediate Representation (IR)

```typescript
interface RenderResult {
  pages: Page[]
  metadata: { totalPages: number; generatedAt: string; locale: string }
}

interface Page {
  number: number
  elements: ResolvedElement[]
}

interface ResolvedElement {
  type: "text" | "table" | string    // component type from registry
  position: { x: number; y: number; width: number; height: number }
  properties: Record<string, unknown> // resolved values (expressions evaluated)
  bandType: "header" | "detail" | "footer" | string
  pageBreakBefore?: boolean
}
```

### 5.5 Expression System

**Syntax:** `{{variable}}` for simple binding, `{{function(args)}}` for formatted values.

Function syntax chosen over pipe syntax for:
- Universal familiarity (Java, .NET, Python, JS developers all know `f(x, y)`)
- AI/LLM nativity (function calling is LLM's native format)
- JSON-friendly representation

**Expression-level type coercion:** Each built-in function handles its own type conversion via a shared `coerce.ts` utility (~50 lines). No separate data normalizer module.

```typescript
// expression/coerce.ts
export function toNumber(v: unknown): number   // "45000" → 45000
export function toDate(v: unknown): Date       // "2026-04-12" → Date
export function toBoolean(v: unknown): boolean // "true" → true
export function toString(v: unknown): string   // any → string
```

**MVP built-in functions:**

| Function | Example | Description |
|----------|---------|-------------|
| formatCurrency | `formatCurrency(price, 'TRY')` | Locale-aware currency format |
| formatDate | `formatDate(date, 'DD.MM.YYYY')` | Date formatting |
| formatNumber | `formatNumber(value, 2)` | Number formatting with decimals |
| sum | `sum(items, 'price')` | Array field sum |
| count | `count(items)` | Array length |
| uppercase | `uppercase(name)` | To upper case |
| lowercase | `lowercase(name)` | To lower case |
| concat | `concat(first, ' ', last)` | String concatenation |
| if | `if(total > 1000, 'VIP', 'Standard')` | Conditional expression |

---

## 6. Canvas Abstraction Layer

### 6.1 Structure

```
@nextreport/canvas/src/
  ports/                    → Framework-agnostic interfaces
    canvas-engine.port.ts   → CanvasEngine interface
    canvas-object.port.ts   → CanvasObject, CanvasText, CanvasRect, etc.
    canvas-events.port.ts   → Event system interface
    index.ts
  adapters/
    konva/                  → ONLY Konva import point in entire codebase
      konva-engine.adapter.ts
      konva-object.adapter.ts
      index.ts
  index.ts                  → Exports ports + default adapter
```

### 6.2 Ports & Adapters Pattern

External code uses only port interfaces. The Konva adapter is the default implementation but can be swapped without affecting any consumer.

If Konva is deprecated or a better library emerges, only the adapter directory changes. Zero impact on ui-designer, engine-core, or any other package.

---

## 7. Component Registry

### 7.1 ComponentDefinition Interface

The interface is split into two layers so that engine-core never depends on React or Canvas:

```typescript
// Engine-side interface (used by engine-core + renderer-html)
// Lives in @nextreport/schema — no React, no Canvas dependency
interface ComponentCoreDefinition {
  type: string                        // "text", "table"
  displayName: string                 // "Text Block", "Data Table"
  schema: ZodSchema                   // DSL validation for this component
  defaultProperties: Record<string, unknown>
  htmlRenderer: (element: ResolvedElement) => string
}

// UI-side interface (used by ui-designer only)
// Extends core with React + Canvas dependencies
interface ComponentUIDefinition extends ComponentCoreDefinition {
  icon: string                        // icon identifier
  canvasRenderer: (props, engine: CanvasEngine) => CanvasObject
  propertyEditor: React.ComponentType<{ value, onChange }>
}
```

Engine-core uses `ComponentCoreDefinition` only. ui-designer uses the full `ComponentUIDefinition`. This preserves engine isolation — engine-core never imports React or Canvas types.
```

### 7.2 Registry Pattern

```typescript
ComponentRegistry.register(textComponent)
ComponentRegistry.register(tableComponent)

// Engine resolves by type — never imports concrete components
const def = ComponentRegistry.get('text')
const html = def.htmlRenderer(resolvedElement)
```

**Composition root:** `apps/web` registers all components at startup. Engine-core knows the `ComponentRegistry` interface but no concrete component.

### 7.3 MVP Components

**Must have:** Text, Table
**Could have:** Image, Barcode

### 7.4 Growth Strategy

- Phase 1: Registry pattern with compile-time registration
- Phase 2: Lazy loading components
- Phase 3: Full plugin marketplace

---

## 8. API Server

### 8.1 Endpoints (Next.js Route Handlers)

```
apps/web/app/api/
  render/route.ts       → POST /api/render
  validate/route.ts     → POST /api/validate
  preview/route.ts      → POST /api/preview
```

### 8.2 POST /api/render

**Mode 1 — Template reference (normal usage, 95% of cases):**
```json
{
  "templateId": "invoice-v1",
  "data": { "companyName": "Acme", "items": [...] },
  "format": "html" | "pdf"
}
```

External consumers (Java, .NET, Python) send only simple, flat data JSON. They never see the complex DSL schema.

**Mode 2 — Full schema (advanced, AI agent / dynamic generation):**
```json
{
  "template": { ... },
  "data": { ... },
  "format": "html" | "pdf"
}
```

**Response (HTML):**
```json
{ "success": true, "output": "<html>...</html>", "metadata": { "pages": 3, "generatedAt": "..." } }
```

**Response (PDF):** `Content-Type: application/pdf` → binary stream

### 8.3 POST /api/validate

```json
// Input
{ "template": { ... } }

// Output
{ "valid": true, "errors": [], "warnings": [] }
```

### 8.4 POST /api/preview

Lightweight render — first page only.

```json
// Input
{ "templateId": "invoice-v1", "data": { ... } }

// Output
{ "success": true, "output": "<html>...</html>", "metadata": { "pages": 1 } }
```

### 8.5 Engine Isolation in Route Handlers

Route handlers are thin HTTP adapters — parse request, call engine, return response. Zero business logic.

```typescript
import { renderReport } from '@nextreport/engine-core'
import { renderToHtml } from '@nextreport/renderer-html'
```

### 8.6 Growth Strategy

- MVP: Next.js API Routes (single deploy, `pnpm run dev`)
- Phase 2: Queue + worker separation (BullMQ for heavy renders)
- Phase 3: Standalone render engine (Fastify/Hono). Same engine imports, different HTTP framework.

---

## 9. Renderers

### 9.1 renderer-html

**Input:** IR (RenderResult from engine-core)
**Output:** HTML string

Pure TypeScript, no React, no browser dependencies. Produces self-contained HTML with inline styles.

### 9.2 renderer-pdf

**Input:** HTML string (from renderer-html)
**Output:** PDF buffer

MVP implementation: Puppeteer renders HTML → PDF. This approach gives consistent HTML↔PDF output with a single rendering pipeline.

### 9.3 Pluggability

New renderers (Excel, DOCX, etc.) consume the same IR from engine-core. Adding a renderer never requires changes to core.

---

## 10. Designer UI

### 10.1 Layout

Three-panel layout:

- **Left panel:** Component toolbox (drag source) + Band manager + Data source tree
- **Center:** Canvas area — A4 paper with color-coded bands. Canvas-based (via Konva adapter).
- **Right panel:** Property editor for selected component (content, font, color, position)
- **Top toolbar:** Undo/Redo, Zoom, Preview button

### 10.2 Canvas-Based Designer

Canvas renders via Konva adapter through port interfaces. Components are drawn as canvas objects with drag handles for resize/move.

**Two view modes:**
- **Data View (default):** Resolved values shown (`Acme Corp`, `₺45.000,00`)
- **Expression View:** Raw expressions shown (`{{companyName}}`, `{{formatCurrency(...)}}`)

Detail bands show first N rows from sample data, not just one row.

### 10.3 State Management — Zustand + Immer

Five store slices:

```typescript
DocumentSlice {
  report: ReportSchema        // the DSL JSON — source of truth
  updateComponent(bandIndex, componentIndex, props)
  addBand(type), removeBand(index)
  addComponent(bandIndex, definition)
}

DataSlice {
  sampleData: object          // from wizard or user-provided
  resolvedPreview: RenderResult  // engine-core output, real-time
}

SelectionSlice {
  selectedBand: number | null
  selectedComponent: string | null
}

ViewportSlice {
  zoom: number
  pan: { x: number; y: number }
}

HistorySlice {
  past: ReportSchema[]        // undo stack (Immer snapshots)
  future: ReportSchema[]      // redo stack
}
```

**Real-time preview loop:** Component changes → DocumentSlice updates → engine-core.renderReport(schema, sampleData) runs client-side → canvas re-renders with resolved values. Target: < 100ms cycle.

---

## 11. Viewer UI

### 11.1 Main Component

```tsx
<ReportViewer report={schema} data={data} />
```

### 11.2 Modes

- **Read-only:** Rendered report with pagination navigation
- **Print:** Print-optimized CSS, `window.print()` trigger
- **Embedded:** Embeddable in other apps as React component

### 11.3 Responsibilities

- Pagination UI (page navigation)
- Zoom in/out
- Print trigger
- PDF export trigger (calls API)
- Toolbar (export, print, zoom controls)

---

## 12. Onboarding Wizard

### 12.1 Three-Step Flow

1. **Template Select:** Invoice, Simple List, Blank Report (+ user-saved templates in future)
2. **Data Source Connect:** JSON paste, JSON URL, Sample data (auto-matched to template)
3. **Designer Opens:** Pre-populated with template + data. First-time users see tooltip guides.

### 12.2 Template Storage (MVP)

```
apps/web/templates/
  invoice-v1.json           → template schema
  invoice-v1.data.json      → matching sample data
  simple-list-v1.json
  simple-list-v1.data.json
```

Filesystem-based. `templateId` = filename. Phase 2+ moves to database with CRUD API and versioning.

### 12.3 Returning Users

Wizard shows on first visit or "New Report" click. Otherwise, last edited report opens directly in designer.

---

## 13. Data Flow

### 13.1 Engine is Data-Agnostic

Engine always receives resolved plain JavaScript objects. It never fetches data from any source. Data fetching is the caller's responsibility.

```typescript
// Engine's contract:
renderReport(schema, data)  // data = plain object, already resolved
```

### 13.2 Data Resolvers (apps/web)

```
apps/web/lib/data-resolvers/
  json-resolver.ts      → inline JSON or JSON paste
  url-resolver.ts       → fetch(url) → JSON
  (future) db-resolver.ts
  (future) graphql-resolver.ts
```

API route handler resolves data before calling engine:
```typescript
const data = await resolveData(schema.dataSource, requestBody.data)
const result = renderReport(schema, data)
```

### 13.3 External Consumer Flow

Java/.NET/Python clients fetch their own data and send it directly:
```
POST /api/render { "templateId": "invoice-v1", "data": { ... plain JSON ... } }
```

They never interact with the DSL schema.

---

## 14. Internationalization

### 14.1 MVP Scope

**Report content locale only.** UI stays English.

Report schema has a `locale` field. Expression functions use it for formatting:
- `formatCurrency(price, 'TRY')` → locale-aware output (`₺45.000,00` for `tr-TR`)
- `formatDate(date, 'DD.MM.YYYY')` → locale-aware date

### 14.2 Future

Phase 2+: UI i18n (designer and viewer in multiple languages).

---

## 15. Testing Strategy

### 15.1 MVP Scope

**Unit + Integration tests. No E2E in MVP.**

- **Unit tests:** Each package has its own unit tests (Vitest)
- **Integration tests:** Cross-package pipeline tests (schema → engine-core → renderer-html)
- **E2E tests:** Phase 2 (Playwright for designer UI)

### 15.2 Key Test Scenarios

- Schema validation (valid/invalid schemas)
- Expression evaluation (all built-in functions + coercion)
- Band processing (header/detail/footer iteration)
- HTML rendering (IR → correct HTML output)
- PDF generation (HTML → PDF buffer)
- API endpoints (render, validate, preview)

---

## 16. Development Phases

### Phase A: Foundation (Schema + Engine)

1. Turborepo + pnpm workspace scaffold
2. `@nextreport/schema` — Zod definitions, types, JSON Schema export
3. `@nextreport/engine-core` — Pipeline, expression engine, band processor, layout
4. Unit + integration tests (JSON in → IR out)

### Phase B: Output (Renderers + API)

5. `@nextreport/renderer-html` — IR → HTML string
6. `@nextreport/renderer-pdf` — HTML → Puppeteer → PDF
7. `apps/web` API routes (/render, /validate, /preview)
8. curl/Postman testing — headless engine working

### Phase C: Visual (Canvas + Designer + Viewer)

9. `@nextreport/canvas` — Ports + Konva adapter
10. `@nextreport/ui-designer` — Toolbox, canvas area, property panel
11. `@nextreport/ui-viewer` — Pagination, print, export UI
12. `apps/web` pages — Designer + Viewer + Wizard

### Phase D: Polish

13. Templates (invoice, simple-list)
14. Onboarding wizard
15. Live preview (designer ↔ viewer sync)

---

## 17. Success Metrics

- < 5 min first report creation
- < 1 sec preview response (HTML)
- < 3 sec PDF generation (basic reports)
- Zero-config integration for React
- Zero external dependencies at startup (no DB, no Docker)

---

## 18. Future Roadmap (Post-MVP)

- Phase 2: Plugin system, advanced layout, PDF optimization, template versioning, queue + worker
- Phase 3: Collaboration, SaaS mode, standalone render engine
- Phase 4: AI report generation, MCP server integration, natural language → schema
