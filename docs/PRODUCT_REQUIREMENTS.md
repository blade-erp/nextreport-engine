# NextReport Engine — Product Requirements Document

**Project:** NextReportEngine
**Version:** v0.1 (MVP)
**Status:** MVP Implemented

---

## 1. Product Vision

A modern, web-native, UX-first reporting engine that provides:

> **Visual report designer + runtime viewer + headless API rendering engine**

### Promise

- A schema-driven document engine for humans and AI with JSON
- Design visually. Render via API. Integrate anywhere — React, Angular, Next.js, Java, Python, .NET, etc... or AI agents and LLM friendly.

### Goals

- Replace JasperReports-style reporting needs with modern UX
- Bring FastReport's desktop ease to the web, framework-agnostic
- Simplify the developer + business user experience
- Create an AI/agent-compatible reporting DSL

---

## 2. Problem Statement

Current reporting solutions suffer from:

- **High learning curve** — XML-based schema systems (e.g., JRXML) require specialized knowledge
- **Legacy desktop tooling** — Designers feel outdated, locked to specific platforms
- **No modern web UI** — Existing tools lack contemporary UX patterns
- **Weak framework integration** — Poor React/Next.js ecosystem support
- **No API-first approach** — Most tools are designed for desktop/server, not HTTP APIs
- **AI/automation incompatibility** — Proprietary formats that LLMs cannot produce
- **Cost barrier** — Good tools are closed-source or expensive

### Market Gap

| Tool                    | Strength                        | Weakness                                          |
| ----------------------- | ------------------------------- | ------------------------------------------------- |
| JasperReports           | Powerful, open source (partial) | UX from another era, JRXML, desktop-only designer |
| FastReport              | Excellent desktop UX            | Closed source, .NET-locked, expensive             |
| Stimulsoft Reports.JS   | Modern web UX                   | Closed source, per-developer pricing              |
| ActiveReportsJS         | Enterprise-grade                | Locked to GrapeCity ecosystem, "cold" DX          |
| jsreport                | Open source, Node.js, flexible  | Code-driven (no WYSIWYG), 5-template free limit   |
| Syncfusion Bold Reports | 30+ connectors, enterprise      | .NET backend required, not truly web-native       |

**Opportunity:** Pain exists + good solutions are closed/expensive + open-source gap is real.

---

## 3. Target Audience

| Segment                       | Need                                                | Why NextReport                                   |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| **SaaS builders**             | Embedded reporting without licensing costs          | Free, API-first, React-native                    |
| **Internal tool teams**       | Invoice generation, data exports, formatted reports | Drop-in components, 5-min integration            |
| **Startups**                  | Reporting beyond HTML-to-PDF hacks, within budget   | Full engine, zero cost                           |
| **Java/.NET migration teams** | Modern alternative to JasperReports/Crystal Reports | Web-based designer, REST API                     |
| **AI/automation builders**    | Structured document generation from LLM output      | JSON schema = LLM function calling native format |

---

## 4. Scope

### Primary Goals (MVP)

- Visual report designer (drag & drop)
- Instant preview (viewer)
- Stateless API-based rendering engine
- JSON-based report schema (DSL)

### Secondary Goals

- Multi-framework compatibility (React, Next.js, Java, .NET via API)
- AI-ready report schema
- Plugin-based component system

### Non-Goals

- Full BI platform (dashboarding, OLAP)
- Spreadsheet replacement (Excel clone)
- Complex data warehouse layer
- Enterprise scheduling system

### MVP Use Case

Invoice / PDF generator with visual editor.

---

## 5. Tech Stack

| Layer             | Technology                         | Version |
| ----------------- | ---------------------------------- | ------- |
| Language          | TypeScript                         | 6+      |
| Framework         | Next.js (App Router)               | 16.2.3  |
| UI Library        | React                              | 19.2    |
| UI Components     | shadcn/ui                          | 4.2.0   |
| Styling           | TailwindCSS                        | 4.2     |
| Monorepo          | Turborepo                          | 2.9.6   |
| Package Manager   | pnpm                               | 10.33.0 |
| Canvas            | Konva.js (via abstraction adapter) | latest  |
| State Management  | Zustand + Immer                    | latest  |
| Schema Validation | Zod + zod-to-json-schema           | latest  |
| PDF Rendering     | Puppeteer                          | latest  |
| Testing           | Vitest                             | latest  |

---

## 6. Architecture

### 6.1 High-Level Structure

```
apps/
  web/                          → Next.js (App Router)
                                  Designer + Viewer + API Routes

packages/
  @nextreport/schema            → Zod schemas + TypeScript types + JSON Schema export
  @nextreport/engine-core       → Render pipeline, band processor, expression engine, layout
  @nextreport/canvas            → Canvas abstraction (ports + Konva adapter)
  @nextreport/renderer-html     → IR → HTML string (pure TypeScript, no React)
  @nextreport/renderer-pdf      → HTML → Puppeteer → PDF buffer
  @nextreport/ui-designer       → Designer React components (toolbox, canvas area, property panel)
  @nextreport/ui-viewer         → Viewer React components (pagination, print, export)
```

### 6.2 Core Concept

The system is **schema-driven**:

```
Report JSON (DSL) + Data
       ↓
  Engine Core (4-stage pipeline)
       ↓
  Intermediate Representation (IR)
       ↓
  Renderer (HTML / PDF / ...)
       ↓
  Output
```

### 6.3 Monorepo Strategy

Hybrid approach — internal workspace packages for MVP, selective npm publish later. `@nextreport` scope reserved for future npm publish.

**Dev command:** `pnpm run dev` starts everything. Zero external dependencies (no database, no Docker, no Redis).

### 6.4 Development Approach

**Schema-First Development** — DSL is defined first, everything else is built around it.

Build order:

1. Schema (Zod definitions, types)
2. Engine Core (pipeline, expression, band processor, layout)
3. Renderers (HTML, PDF) + API routes
4. Canvas + Designer + Viewer UI

---

## 7. Dependency Graph & Isolation Rules

### 7.1 Package Dependencies

```
schema (ROOT — depends on nothing)
  ↑
engine-core → schema
  ↑
renderer-html → schema + engine-core
renderer-pdf  → schema + engine-core + renderer-html
canvas        → schema (types only)
  ↑
ui-designer → canvas + schema + engine-core
ui-viewer   → renderer-html + schema + engine-core
  ↑
apps/web → all packages
```

### 7.2 Strict Isolation Rules

**Allowed:**

- engine-core → schema
- renderer-\* → schema + engine-core
- canvas → schema (types only)
- ui-designer → canvas + schema + engine-core
- ui-viewer → renderer-html + schema + engine-core
- apps/web → any package

**Forbidden:**

- schema → no dependencies (root of graph)
- engine-core → canvas, renderer, UI, Next.js, React
- renderer-\* → canvas, UI, Next.js, React
- canvas → engine-core, renderer, UI
- Any package → apps/web
- Any package → konva (except canvas adapter)

### 7.3 Key Design Rules

1. **Engine Isolation Rule** — engine-core and renderers never import Next.js, React, or Konva
2. **Konva Adapter Rule** — Konva is imported only inside `@nextreport/canvas/adapters/konva/`
3. **Component Registry Rule** — Components are not imported by engine; they register themselves via interface
4. **Core Nothing Imports** — engine-core depends only on schema
5. **Engine-Core Modular Boundary** — Internal modules (pipeline, expression, band-processor, layout) are not exported; prevents god-package anti-pattern
6. **Schema is Root** — Root of dependency graph, depends on nothing
7. **Renderer Pluggability** — New renderers are added without touching core
8. **Phase Migration Readiness** — MVP: Next.js API Routes → Phase 2: queue + worker → Phase 3: standalone render engine. Boundaries are drawn from day one.

---

## 8. Report Schema (DSL)

### 8.1 Schema Structure

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
      {
        "name": "items",
        "type": "array",
        "fields": [
          { "name": "name", "type": "string" },
          { "name": "price", "type": "number" }
        ]
      }
    ]
  },
  "bands": [
    {
      "type": "header",
      "height": 80,
      "components": [
        {
          "type": "text",
          "position": { "x": 0, "y": 10, "width": 300, "height": 30 },
          "content": "{{companyName}}",
          "fontSize": 24,
          "fontWeight": "bold"
        }
      ]
    },
    {
      "type": "detail",
      "height": 25,
      "dataBinding": "items",
      "components": [
        {
          "type": "text",
          "position": { "x": 0, "y": 0, "width": 200, "height": 25 },
          "content": "{{item.name}}"
        },
        {
          "type": "text",
          "position": { "x": 400, "y": 0, "width": 100, "height": 25 },
          "content": "{{formatCurrency(item.price, 'TRY')}}"
        }
      ]
    },
    {
      "type": "footer",
      "height": 40,
      "components": [
        {
          "type": "text",
          "position": { "x": 400, "y": 5, "width": 135, "height": 30 },
          "content": "Total: {{formatCurrency(sum(items, 'price'), 'TRY')}}",
          "fontWeight": "bold"
        }
      ]
    }
  ]
}
```

### 8.2 Band Types

| Type           | Behavior                                      | Status  |
| -------------- | --------------------------------------------- | ------- |
| `header`       | Rendered once at the top                      | MVP     |
| `detail`       | Repeated for each item in `dataBinding` array | MVP     |
| `footer`       | Rendered once at the bottom                   | MVP     |
| `group-header` | Before each group (when grouping data)        | Planned |
| `group-footer` | After each group (subtotals)                  | Planned |
| `page-header`  | Top of every page                             | Planned |
| `page-footer`  | Bottom of every page                          | Planned |
| `custom`       | User-defined band type                        | Planned |

Flexible band model — classic bands plus nesting (detail inside detail for master-detail reports) and custom bands for future extensibility.

### 8.3 Component Types

| Component | Description                                      | Status  |
| --------- | ------------------------------------------------ | ------- |
| Text      | Static text + expression binding with formatting | MVP     |
| Table     | Data-bound rows with column definitions          | MVP     |
| Image     | URL or base64 image                              | Planned |
| Barcode   | QR, Code128, EAN13                               | Planned |
| Chart     | Bar, line, pie charts                            | Planned |

### 8.4 Data Source Fields (Optional)

`dataSource.fields` is **optional**. When present, it enables:

- Designer data tree panel (field list with types)
- Expression autocomplete
- Drag & drop field binding
- Pre-render data validation

When absent, the engine still works — expression-level coercion handles type conversion. Fields are **auto-inferred** when the user pastes JSON in the wizard.

### 8.5 Validation Strategy

**Zod + JSON Schema export:**

- Development: Zod schemas provide TypeScript type inference and runtime validation
- External consumers: `zod-to-json-schema` generates standard JSON Schema for Java/.NET
- Single source of truth: Zod definitions in `@nextreport/schema`

---

## 9. Expression System

### 9.1 Syntax

Template expressions use `{{...}}` delimiters with **function call syntax** (chosen over pipe syntax for AI/LLM compatibility and universal developer familiarity):

```
{{variableName}}                              → Simple variable
{{customer.name}}                             → Nested access
{{formatCurrency(item.price, 'TRY')}}         → Function call
{{sum(items, 'total')}}                       → Aggregation
{{if(total > 1000, 'VIP', 'Standard')}}       → Conditional
```

### 9.2 Built-in Functions (MVP)

| Function         | Example                          | Description           |
| ---------------- | -------------------------------- | --------------------- |
| `formatCurrency` | `formatCurrency(price, 'TRY')`   | Locale-aware currency |
| `formatDate`     | `formatDate(date, 'DD.MM.YYYY')` | Date formatting       |
| `formatNumber`   | `formatNumber(value, 2)`         | Number formatting     |
| `sum`            | `sum(items, 'price')`            | Array field sum       |
| `count`          | `count(items)`                   | Array length          |
| `uppercase`      | `uppercase(name)`                | To upper case         |
| `lowercase`      | `lowercase(name)`                | To lower case         |
| `concat`         | `concat(first, ' ', last)`       | String join           |
| `if`             | `if(qty > 0, 'In Stock', 'Out')` | Conditional           |

### 9.3 Type Coercion

Expression-level coercion handles type mismatches gracefully (no separate data normalizer module). Each function coerces its inputs via shared utilities:

```typescript
toNumber("45000")  → 45000   // string from Java/.NET clients
toDate("2026-04-12") → Date  // ISO string to Date
toBoolean("true")  → true
toString(null)     → ""
```

### 9.4 Data Binding

Detail bands iterate over arrays. Iterator name is derived automatically:

- `dataBinding: "items"` → iterator: `item` → `{{item.name}}`
- `dataBinding: "employees"` → iterator: `employee` → `{{employee.email}}`
- Custom via `iteratorName` field on the band

---

## 10. Engine Core

### 10.1 Pipeline

```
Report Schema JSON + Data
       ↓
  ① Schema Validator (Zod parse)
       ↓
  ② Expression Engine (tokenize → parse → AST → evaluate with coercion)
       ↓
  ③ Band Processor (iterate detail bands, resolve components)
       ↓
  ④ Layout Calculator (absolute positions, pagination, page breaks)
       ↓
  OUTPUT: Intermediate Representation (IR)
```

### 10.2 Internal Module Structure

```
engine-core/src/
  pipeline/          → Orchestrator (public API entry point)
  expression/        → Tokenizer, parser, evaluator, built-in functions, coerce.ts
  band-processor/    → Band iteration, grouping, nesting logic
  layout/            → Position calculation, pagination, page breaks
  index.ts           → Public API only (internal modules not exported)
```

**God-Package Prevention:** Each internal module has its own directory, responsibility, and tests. They communicate through defined internal interfaces. If any module grows too large or gains an external consumer, it gets extracted to a separate package.

### 10.3 Public API

```typescript
export { renderReport } // (schema, data, options?) → RenderResult (IR)
export { validateReport } // (schema) → ValidationResult
```

Internal modules (expression, band-processor, layout) are **not exported**.

### 10.4 Intermediate Representation (IR)

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
  type: string
  position: { x: number; y: number; width: number; height: number }
  properties: Record<string, unknown> // resolved values
  bandType: string
  pageBreakBefore?: boolean
}
```

---

## 11. Canvas Abstraction Layer

### 11.1 Ports & Adapters Pattern

```
@nextreport/canvas/src/
  ports/                    → Framework-agnostic interfaces
    canvas-engine.port.ts   → CanvasEngine interface
    canvas-object.port.ts   → CanvasObject, CanvasText, CanvasRect
    canvas-events.port.ts   → Event system interface
  adapters/
    konva/                  → ONLY Konva import point in entire codebase
      konva-engine.adapter.ts
      konva-object.adapter.ts
```

External code uses only port interfaces. The Konva adapter is the default implementation but can be swapped without affecting any consumer. If Konva is deprecated, only the adapter directory changes.

---

## 12. Component Registry

### 12.1 Interface (Split for Isolation)

```typescript
// Engine-side (no React, no Canvas dependency)
interface ComponentCoreDefinition {
  type: string
  displayName: string
  schema: ZodSchema
  defaultProperties: Record<string, unknown>
  htmlRenderer: (element: ResolvedElement) => string
}

// UI-side (extends core with React + Canvas)
interface ComponentUIDefinition extends ComponentCoreDefinition {
  icon: string
  canvasRenderer: (props, engine: CanvasEngine) => CanvasObject
  propertyEditor: React.ComponentType<{ value; onChange }>
}
```

### 12.2 Growth Strategy

- Phase 1: Registry pattern with compile-time registration
- Phase 2: Lazy loading components
- Phase 3: Full plugin marketplace with external packages

---

## 13. Designer (UI Module)

### 13.1 Layout

Three-panel layout:

- **Left panel (240px):** Component toolbox (drag source) + Band manager + Data source tree
- **Center (flex):** Canvas area — A4 paper with color-coded bands
- **Right panel (280px):** Property editor for selected component
- **Top toolbar:** Undo/Redo, Zoom, Preview toggle, Export JSON, Open Viewer
- **Bottom (toggleable):** Live preview panel (debounced HTML render in iframe)

### 13.2 Canvas

Canvas renders via Konva adapter through port interfaces. Components are drawn as objects with drag handles for resize/move.

**Two view modes:**

- **Data View (default):** Resolved values shown (`Acme Corp`, `₺45.000,00`)
- **Expression View:** Raw expressions shown (`{{companyName}}`)

### 13.3 State Management — Zustand + Immer

Five store slices:

| Slice          | Responsibility                                             |
| -------------- | ---------------------------------------------------------- |
| DocumentSlice  | Report schema (source of truth), component CRUD, band CRUD |
| DataSlice      | Sample data, inferred fields                               |
| SelectionSlice | Selected band/component tracking                           |
| ViewportSlice  | Zoom, pan                                                  |
| HistorySlice   | Undo/redo (Immer snapshots)                                |

### 13.4 Live Preview

Debounced (300ms) client-side rendering: schema changes → `renderReport()` + `renderToHtml()` → iframe display. Toggleable via toolbar button.

---

## 14. Viewer (Runtime UI)

### 14.1 Component

```tsx
<ReportViewer report={schema} data={data} mode="read-only" />
```

### 14.2 Modes

- **Read-only:** Rendered report with pagination navigation
- **Print:** Print-optimized CSS, `window.print()` trigger
- **Embedded:** Embeddable in other apps as React component

### 14.3 Features

- Pagination UI (page navigation)
- Zoom in/out
- Print trigger
- PDF export (calls `/api/render` with `format: "pdf"`, triggers download)
- Toolbar (all controls)

---

## 15. API Server (Headless Engine)

### 15.1 Endpoints

| Method | Endpoint             | Description                          |
| ------ | -------------------- | ------------------------------------ |
| POST   | `/api/render`        | Render report to HTML or PDF         |
| POST   | `/api/validate`      | Validate report schema               |
| POST   | `/api/preview`       | Lightweight render (first page only) |
| GET    | `/api/templates/:id` | Load template + sample data          |

### 15.2 Render API

**Mode 1 — Template reference (95% of use cases):**

```json
{
  "templateId": "invoice-v1",
  "data": { "companyName": "Acme", "items": [...] },
  "format": "html"
}
```

External consumers (Java, .NET, Python) send **simple, flat JSON data**. They never see the DSL schema.

**Mode 2 — Full schema (AI agent / dynamic generation):**

```json
{
  "template": { ... },
  "data": { ... },
  "format": "pdf"
}
```

### 15.3 Engine Isolation

Route handlers are thin HTTP adapters — parse request, call engine, return response. Zero business logic. This enables the Phase 3 migration to standalone Fastify/Hono server with no engine changes.

### 15.4 Growth Strategy

- **MVP:** Next.js API Routes (single deploy, `pnpm run dev`)
- **Phase 2:** Queue + worker separation (BullMQ for heavy renders)
- **Phase 3:** Standalone render engine (Fastify/Hono). Same imports, different HTTP framework.

---

## 16. Data Flow

### 16.1 Engine is Data-Agnostic

Engine always receives resolved plain JavaScript objects. It never fetches data. Data fetching is the caller's responsibility.

```typescript
renderReport(schema, data) // data = plain object, already resolved
```

### 16.2 Data Resolvers (apps/web)

| Resolver                       | MVP | Future  |
| ------------------------------ | --- | ------- |
| Inline JSON (API body)         | Yes | Yes     |
| JSON paste (wizard)            | Yes | Yes     |
| Sample data (template-bundled) | Yes | Yes     |
| URL fetch                      | Yes | Yes     |
| Database connection            | No  | Phase 2 |
| GraphQL                        | No  | Phase 2 |

### 16.3 External Consumer Flow

Java/.NET/Python clients fetch their own data and send it via REST:

```
POST /api/render { "templateId": "invoice-v1", "data": { ... } }
```

They never interact with the DSL schema directly.

---

## 17. Onboarding Wizard

### 17.1 Three-Step Flow

1. **Choose Template:** Invoice, Simple List, Blank Report
2. **Connect Data:** Use sample data (default) or paste custom JSON
3. **Ready:** Summary + "Open Designer" / "Open Viewer" actions

### 17.2 Template Storage (MVP)

Filesystem-based JSON files. `templateId` = filename.

```
apps/web/templates/
  invoice-v1.json           → template schema
  invoice-v1.data.json      → matching sample data
  simple-list-v1.json
  simple-list-v1.data.json
```

Phase 2+ moves to database with CRUD API and versioning.

---

## 18. Integration Strategy

### npm Package

```bash
npm install @nextreport/engine
```

```typescript
import { renderReport, renderToHtml, validateReport } from '@nextreport/engine'

const ir = renderReport(schema, data)
const html = renderToHtml(ir)
```

The `@nextreport/engine` package bundles schema, engine-core, renderer-html, and renderer-pdf into a single installable package with ESM, CJS, and full TypeScript declarations.

- **npm:** https://www.npmjs.com/package/@nextreport/engine
- **GitHub:** https://github.com/cevheri/nextreport-engine

### React / Next.js (Viewer Component)

```tsx
import { ReportViewer } from '@nextreport/ui-viewer'
<ReportViewer report={schema} data={data} />
```

### Any Language via REST API

```
POST /api/render
{
  "templateId": "invoice-v1",
  "data": { ... },
  "format": "pdf"
}
→ PDF binary stream
```

### Embedded Mode

```tsx
<ReportViewer report={schema} data={data} mode="embedded" />
```

---

## 19. AI / Agent Compatibility

The system is designed for future AI integration:

- **JSON schema** is the native output format of LLM function calling
- **Function expression syntax** matches how LLMs generate code
- **Stateless API** works with any agent framework
- **Template + data separation** means AI generates schema, caller provides data

Future flow:

```
"Create invoice report for customers"
   ↓
LLM → JSON schema (valid report DSL)
   ↓
Engine → renderReport(schema, data) → PDF
```

Planned: MCP server integration, natural language → schema generation, AI-assisted expression writing.

---

## 20. Internationalization

### MVP Scope

**Report content locale only.** UI stays English.

Report schema has a `locale` field. Expression functions use it:

- `formatCurrency(price, 'TRY')` with `locale: "tr-TR"` → `₺45.000,00`
- `formatDate(date, 'DD.MM.YYYY')` → locale-aware date

### Future

Phase 2+: UI i18n (designer and viewer in multiple languages), RTL support.

---

## 21. Testing Strategy

### MVP

**Unit + Integration tests. No E2E in MVP.**

| Level       | Scope                                                             | Tool                 |
| ----------- | ----------------------------------------------------------------- | -------------------- |
| Unit        | Per-package (schema validation, expression evaluation, rendering) | Vitest               |
| Integration | Cross-package pipeline (schema → engine → renderer)               | Vitest               |
| E2E         | Designer UI flows                                                 | Playwright (Phase 2) |

### Key Test Scenarios

- Schema validation (valid/invalid schemas)
- Expression evaluation (all built-in functions + type coercion)
- Band processing (header/detail/footer iteration, nested data)
- Layout calculation (pagination, page breaks, margins)
- HTML rendering (IR → correct HTML output)
- PDF generation (HTML → valid PDF buffer)
- API endpoints (render, validate, preview)

---

## 22. Success Metrics

- < 5 min first report creation (from `git clone` to rendered report)
- < 1 sec preview response (HTML rendering)
- < 3 sec PDF generation (basic reports)
- Zero-config integration for React
- Zero external dependencies at startup (no database, no Docker, no Redis)

---

## 23. Key Design Principles

1. **API-first architecture** — Every feature accessible via HTTP
2. **Schema-driven system** — JSON DSL is the contract between all subsystems
3. **Stateless engine design** — No database, no sessions, no side effects
4. **Framework-agnostic usage** — Works from any language via REST
5. **UI/engine separation** — Designer is optional, engine works standalone
6. **Extensible plugin architecture** — Components, functions, renderers all pluggable
7. **Engine isolation** — Core never depends on UI frameworks
8. **Phase migration readiness** — Boundaries drawn from day one for future scaling

---

## 24. Future Roadmap

### Phase 2 — Platform Expansion

- Plugin system & component marketplace
- Advanced layout engine (grouping, nesting, auto-height)
- Native PDF generation (no Puppeteer dependency)
- Template versioning with database storage
- Queue + worker separation for heavy renders
- Advanced designer UX (full Konva, drag & drop, resize handles)

### Phase 3 — Collaboration & SaaS

- User authentication & authorization
- Real-time collaborative editing
- Standalone render engine (Fastify/Hono)
- SaaS mode with subscription billing

### Phase 4 — AI & Automation

- AI report generation (natural language → schema)
- MCP server integration
- Smart data binding (AI-powered field mapping)
- Report intelligence (layout optimization, accessibility audit)

---

## 25. Related Documents

- [README.md](../README.md) — Project overview, quick start, contributing guide
- [ROADMAP.md](ROADMAP.md) — Detailed product roadmap with timeline
- [VISION.md](VISION.md) — Market analysis, strategy, business model thinking
