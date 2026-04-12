<p align="center">
  <h1 align="center">NextReport Engine</h1>
  <p align="center">
    <strong>A modern, schema-driven document rendering platform.</strong><br/>
    Design visually. Render via API. Integrate anywhere.
  </p>
  <p align="center">
    <a href="#why-nextreport">Why?</a> &bull;
    <a href="#quick-start">Quick Start</a> &bull;
    <a href="#architecture">Architecture</a> &bull;
    <a href="#report-schema-dsl">Schema DSL</a> &bull;
    <a href="#api-reference">API</a> &bull;
    <a href="#contributing">Contributing</a> &bull;
    <a href="docs/ROADMAP.md">Roadmap</a>
  </p>
</p>

---

<p align="center">
  <img src="docs/assets/designer-screenshot.png" alt="NextReport Designer — Visual report builder with live preview" width="900" />
  <br/>
  <em>Visual Designer with component toolbox, band manager, data fields, property editor, and live preview</em>
</p>

---

NextReport Engine is an open-source, headless reporting engine with a visual designer and runtime viewer. It replaces legacy reporting tools (JasperReports, FastReport, Crystal Reports) with a modern, web-native stack.

**Who is this for?**

- **Frontend developers** — Embed the viewer or designer in React/Next.js apps with zero config
- **Backend developers** — Generate PDF/HTML reports via a stateless REST API from Java, .NET, Python, or any HTTP client
- **SaaS builders** — Add reporting to your product without building a rendering engine from scratch
- **Business users** — Design reports visually with drag & drop, no code required
- **AI/Agent builders** — Generate reports programmatically with a JSON schema that LLMs can produce natively
- **Teams migrating from legacy tools** — Replace JasperReports, FastReport, or Crystal Reports with a modern, maintainable stack

## Why NextReport?

### The Problem

Reporting in 2026 is stuck between two bad options:

**Enterprise tools are powerful but painful.** JasperReports has a steep learning curve, relies on XML-based schemas (JRXML), and its desktop designer feels like software from a different era. Crystal Reports is similar — capable but heavy. The development experience is far from what modern teams expect.

**Modern alternatives are closed or expensive.** FastReport and Stimulsoft offer better UX, but they're proprietary and come with per-developer or per-server licensing. ActiveReportsJS is enterprise-grade but locked to the GrapeCity ecosystem. If your budget is limited or you need to customize deeply, these are dead ends.

**The open-source gap is real.** On the JavaScript/TypeScript side, there is no mature, full-featured reporting engine. Plenty of projects attempt a piece of the puzzle — a PDF library here, a drag-and-drop builder there — but a report is actually **five systems working together:** a layout engine, a visual designer, an expression engine, a data binding layer, and a multi-format renderer. Projects that tackle only one or two of these fail to deliver a usable product.

### What Makes This Different

NextReport Engine is built on the insight that **all five systems must be designed as one coherent architecture**, but **with strict boundaries** so they can evolve independently.

- **Schema-driven core** — The JSON DSL is the contract between all systems. The engine doesn't know about the designer. The renderer doesn't know about the canvas. They all speak schema.
- **Developer-first, then visual** — The API and schema work standalone. The designer is a visual layer on top, not a requirement. You can generate reports from code, from an API call, or from an AI agent — the designer is optional.
- **Built for the modern web stack** — TypeScript, React, Next.js, Tailwind. Not a Java applet. Not a desktop app. Not a legacy ActiveX control. Native web, from the ground up.
- **Open source to the core** — The engine, designer, viewer, renderers, expression engine — all open. No "community edition" that's missing the features you actually need.

### Comparison

|                       |   NextReport   | JasperReports |  FastReport   | Stimulsoft  | ActiveReportsJS |         jsreport          |        Syncfusion         |
| --------------------- | :------------: | :-----------: | :-----------: | :---------: | :-------------: | :-----------------------: | :-----------------------: |
| **Open Source**       |      Full      |    Partial    |      No       |     No      |       No        |          Partial          |            No             |
| **Web-Native**        |      Yes       |   No (Java)   |    Partial    |     Yes     |       Yes       |       Yes (Node.js)       |  Partial (.NET backend)   |
| **Visual Designer**   |    WYSIWYG     | Desktop only  | Desktop + Web |     Web     |       Web       |        Code-based         |         Web (RDL)         |
| **Modern UX**         |      Yes       |      No       |   Moderate    |     Yes     |    Moderate     |    Developer-oriented     |        Enterprise         |
| **API-First**         |      Yes       |      No       |      No       |   Partial   |     Partial     |            Yes            |     Needs .NET server     |
| **React Integration** |     Native     |     None      |     None      |   Wrapper   |     Wrapper     |     None (standalone)     |    Wrapper (.NET dep)     |
| **Report Schema**     |      JSON      |  XML (JRXML)  |  Proprietary  | Proprietary |   Proprietary   |      HTML/Handlebars      |      XML (RDL/RDLC)       |
| **AI/LLM-Ready**      | Yes (JSON DSL) |      No       |      No       |     No      |       No        |            No             |            No             |
| **Pricing**           |      Free      |  Free / Paid  |     Paid      |    Paid     |      Paid       | Free (5 templates) / Paid | Free (small teams) / Paid |
| **Learning Curve**    |      Low       |     High      |    Medium     |   Medium    |     Medium      |          Medium           |        Medium-High        |
| **Self-Hosted**       |      Yes       |      Yes      |      Yes      |     Yes     |       Yes       |            Yes            |            Yes            |

**Key differences explained:**

- **jsreport** is the closest open-source alternative. It's a mature Node.js platform (200K+ installations) with a template-engine approach — you write HTML/Handlebars templates rather than designing visually. It's powerful for developers comfortable with code-driven reports, but lacks a true WYSIWYG designer. Free tier is limited to 5 stored templates; enterprise starts at $495/instance.

- **Syncfusion (Bold Reports)** offers a full-featured enterprise reporting suite with 30+ data connectors and RDL/RDLC format (Microsoft standard). However, it requires a .NET backend for report processing — the React component is a viewer wrapper, not a standalone engine. Community license is free for teams under $1M revenue; paid plans start around $450/year.

### Who Adopts This?

Based on the market gap, NextReport is most valuable for:

- **SaaS products** that need embedded reporting without licensing costs
- **Internal tool teams** building admin dashboards, invoice systems, or data exports
- **Startups** that can't justify enterprise reporting licenses but need more than an HTML-to-PDF hack
- **Java/.NET teams** migrating away from JasperReports who want a modern web-based alternative with a clean REST API
- **AI/automation builders** who need a reporting DSL that language models can generate natively

## Features

- **Visual Report Designer** — Three-panel layout with component toolbox, canvas area, and property editor. Undo/redo, zoom, live preview.
- **Runtime Viewer** — Render reports in the browser with pagination, print, and PDF export.
- **Headless API** — Stateless REST endpoints for rendering, validation, and preview. Send JSON, get HTML or PDF.
- **Schema-Driven DSL** — Reports are defined as JSON. Human-readable, version-controllable, LLM-friendly.
- **Expression Engine** — Template expressions with 9 built-in functions: `formatCurrency`, `formatDate`, `formatNumber`, `sum`, `count`, `uppercase`, `lowercase`, `concat`, `if`.
- **Pluggable Renderers** — HTML and PDF out of the box. Add new output formats without touching the core.
- **Canvas Abstraction** — Port/adapter pattern isolates the canvas library. Swap rendering backends without changing application code.
- **Type-Safe** — Written in TypeScript with Zod schemas. Full type inference from schema to render output.
- **Locale-Aware** — Currency, date, and number formatting respects report locale. `formatCurrency(price, 'TRY')` with `locale: "tr-TR"` outputs `₺45.000,00`.

## Quick Start

### Prerequisites

- Node.js >= 24
- pnpm 10.33+

### Install and Run

```bash
git clone https://github.com/nextreport/engine.git
cd nextreport-engine
pnpm install
pnpm run dev
```

Open http://localhost:3000 in your browser.

- **Create a report:** http://localhost:3000/new
- **Designer with invoice template:** http://localhost:3000/designer?template=invoice-v1
- **View rendered invoice:** http://localhost:3000/viewer?template=invoice-v1

### Run Tests

```bash
pnpm test
```

### Render a Report via API

```bash
curl -X POST http://localhost:3000/api/render \
  -H 'Content-Type: application/json' \
  -d '{
    "templateId": "invoice-v1",
    "data": {
      "companyName": "Acme Corp",
      "invoiceNumber": "INV-001",
      "invoiceDate": "2026-04-12",
      "items": [
        { "name": "Laptop", "quantity": 1, "unitPrice": 45000, "total": 45000 },
        { "name": "Mouse", "quantity": 3, "unitPrice": 750, "total": 2250 }
      ]
    }
  }'
```

Returns HTML by default. Add `"format": "pdf"` for PDF output.

### Integrate in Your App

**React/Next.js — Viewer Component:**

```tsx
import { ReportViewer } from '@nextreport/ui-viewer'
;<ReportViewer report={reportSchema} data={reportData} />
```

**Any Language — REST API:**

```python
# Python
response = requests.post("http://localhost:3000/api/render", json={
    "templateId": "invoice-v1",
    "data": invoice_data,
    "format": "pdf"
})
pdf_bytes = response.content
```

```java
// Java
HttpResponse response = client.post("/api/render", Map.of(
    "templateId", "invoice-v1",
    "data", invoiceData,
    "format", "pdf"
));
byte[] pdf = response.body();
```

```csharp
// C#
var response = await client.PostAsJsonAsync("/api/render", new {
    templateId = "invoice-v1",
    data = invoiceData,
    format = "pdf"
});
var pdf = await response.Content.ReadAsByteArrayAsync();
```

External consumers send **simple, flat JSON data** — they never need to know about the report schema DSL.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   apps/web (Next.js)                 │
│    Designer UI  │  Viewer UI  │  API Routes          │
└────────┬────────┴──────┬──────┴──────┬───────────────┘
         │               │             │
    ┌────┴────┐   ┌──────┴──────┐  ┌───┴────────────┐
    │  ui-    │   │  ui-viewer  │  │  renderer-html  │
    │designer │   │             │  │  renderer-pdf   │
    └────┬────┘   └──────┬──────┘  └───┬────────────┘
         │               │             │
    ┌────┴────┐          │        ┌────┴────┐
    │ canvas  │          │        │ engine- │
    │ (ports +│          └────────┤  core   │
    │  konva) │                   │         │
    └────┬────┘                   └────┬────┘
         │                             │
         └──────────┬──────────────────┘
                    │
              ┌─────┴─────┐
              │  schema   │
              │  (Zod)    │
              └───────────┘
```

### Design Principles

1. **Schema is the source of truth** — Everything flows from JSON. Schema defines the report, engine processes it, renderers output it.
2. **Engine isolation** — `engine-core` and renderers are pure TypeScript. No React, no Next.js, no Konva. They can run anywhere.
3. **Strict dependency boundaries** — Each package has explicit, enforced dependencies. No circular imports. Internal modules are not exposed.
4. **Pluggable everything** — Renderers, components, canvas backends — all swappable through interfaces.
5. **Stateless API** — The engine has no database, no sessions, no side effects. Send schema + data, get output.

## Packages

| Package                     | Description                                                 | Dependencies                       |
| --------------------------- | ----------------------------------------------------------- | ---------------------------------- |
| `@nextreport/schema`        | Zod schemas, TypeScript types, JSON Schema export           | None                               |
| `@nextreport/engine-core`   | Render pipeline: validate → expression → band → layout → IR | schema                             |
| `@nextreport/renderer-html` | IR → self-contained HTML with inline styles                 | schema, engine-core                |
| `@nextreport/renderer-pdf`  | HTML → PDF via Puppeteer                                    | schema, engine-core, renderer-html |
| `@nextreport/canvas`        | Canvas abstraction: port interfaces + Konva adapter         | schema                             |
| `@nextreport/ui-designer`   | Visual designer React components + Zustand store            | schema, engine-core, canvas        |
| `@nextreport/ui-viewer`     | Report viewer React component                               | schema, engine-core, renderer-html |

### Dependency Rules

```
schema         → depends on nothing (root of the graph)
engine-core    → schema only
renderer-*     → schema + engine-core
canvas         → schema only (types)
ui-designer    → canvas + schema + engine-core
ui-viewer      → renderer-html + schema + engine-core
apps/web       → all packages
```

**Forbidden:** engine-core never imports React, Next.js, or Konva. Renderers never import UI packages. No package imports from apps/web.

## Report Schema (DSL)

Reports are defined as JSON:

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
  "dataSource": { "type": "json" },
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

### Band Types

| Type           | Behavior                                      | MVP     |
| -------------- | --------------------------------------------- | ------- |
| `header`       | Rendered once at the top                      | Yes     |
| `detail`       | Repeated for each item in `dataBinding` array | Yes     |
| `footer`       | Rendered once at the bottom                   | Yes     |
| `group-header` | Before each group (when grouping data)        | Planned |
| `group-footer` | After each group (subtotals)                  | Planned |
| `page-header`  | Top of every page                             | Planned |
| `page-footer`  | Bottom of every page                          | Planned |

### Expression Syntax

Expressions use `{{...}}` delimiters with function call syntax:

```
{{variableName}}                              → Simple variable
{{customer.name}}                             → Nested access
{{formatCurrency(item.price, 'TRY')}}         → Function call
{{formatDate(orderDate, 'DD.MM.YYYY')}}       → Date formatting
{{sum(items, 'total')}}                       → Aggregation
{{if(total > 1000, 'VIP', 'Standard')}}       → Conditional
```

**Built-in Functions:**

| Function                          | Example                          | Description           |
| --------------------------------- | -------------------------------- | --------------------- |
| `formatCurrency(value, currency)` | `formatCurrency(price, 'TRY')`   | Locale-aware currency |
| `formatDate(value, pattern)`      | `formatDate(date, 'DD.MM.YYYY')` | Date formatting       |
| `formatNumber(value, decimals)`   | `formatNumber(rate, 2)`          | Number formatting     |
| `sum(array, field)`               | `sum(items, 'price')`            | Array field sum       |
| `count(array)`                    | `count(items)`                   | Array length          |
| `uppercase(value)`                | `uppercase(name)`                | To upper case         |
| `lowercase(value)`                | `lowercase(name)`                | To lower case         |
| `concat(a, b, ...)`               | `concat(first, ' ', last)`       | String join           |
| `if(condition, then, else)`       | `if(qty > 0, 'In Stock', 'Out')` | Conditional           |

### Data Binding

Detail bands iterate over arrays. The iterator variable name is derived automatically by removing the trailing `s`:

- `dataBinding: "items"` → iterator: `item` → access: `{{item.name}}`
- `dataBinding: "employees"` → iterator: `employee` → access: `{{employee.email}}`

Custom iterator name via `iteratorName` field on the band.

### Type Coercion

The expression engine handles type mismatches gracefully. Java or .NET clients often send numbers as strings — the engine coerces automatically:

```json
{ "price": "45000" }
```

`formatCurrency(price, 'TRY')` → `₺45.000,00` (string "45000" coerced to number)

## API Reference

### POST /api/render

Render a report to HTML or PDF.

**Request:**

```json
{
  "templateId": "invoice-v1",
  "data": { "companyName": "Acme", "items": [...] },
  "format": "html"
}
```

Or with inline template:

```json
{
  "template": { "type": "report", ... },
  "data": { ... },
  "format": "pdf"
}
```

**Response (HTML):**

```json
{
  "success": true,
  "output": "<!DOCTYPE html>...",
  "metadata": { "totalPages": 1, "generatedAt": "2026-04-12T...", "locale": "tr-TR" }
}
```

**Response (PDF):** Binary PDF stream with `Content-Type: application/pdf`.

### POST /api/validate

Validate a report schema without rendering.

```json
// Request
{ "template": { "type": "report", ... } }

// Response (valid)
{ "valid": true, "errors": [], "warnings": [] }

// Response (invalid)
{ "valid": false, "errors": [{ "path": "dataSource", "message": "Required" }], "warnings": [] }
```

### POST /api/preview

Lightweight render — first page only, always HTML.

```json
// Request
{ "templateId": "invoice-v1", "data": { ... } }

// Response
{ "success": true, "output": "<!DOCTYPE html>...", "metadata": { "totalPages": 1 } }
```

### GET /api/templates/:id

Load a template and its sample data.

```json
// Response
{ "template": { ... }, "sampleData": { ... } }
```

## Engine Pipeline

The render pipeline is a 4-stage transformation:

```
JSON Schema + Data
       ↓
  ① Schema Validator (Zod)
       ↓
  ② Expression Engine (parse → AST → evaluate)
       ↓
  ③ Band Processor (iterate details, resolve expressions)
       ↓
  ④ Layout Calculator (absolute positions, pagination)
       ↓
  Intermediate Representation (IR)
       ↓
  Renderer (HTML / PDF / ...)
       ↓
  Output
```

The IR is renderer-agnostic — pages with positioned, resolved elements. Any renderer can consume it to produce output in any format.

## Project Structure

```
nextreport-engine/
├── apps/
│   └── web/                    Next.js application
│       ├── app/                App Router pages + API routes
│       ├── lib/                Template loader, data resolvers
│       └── templates/          Built-in report templates
├── packages/
│   ├── schema/                 Zod schemas + JSON Schema export
│   ├── engine-core/            Render pipeline (4 internal modules)
│   │   ├── pipeline/           Orchestrator (public API)
│   │   ├── expression/         Tokenizer, parser, evaluator, functions
│   │   ├── band-processor/     Band iteration + expression resolution
│   │   └── layout/             Position calculation + pagination
│   ├── renderer-html/          IR → HTML
│   ├── renderer-pdf/           HTML → PDF (Puppeteer)
│   ├── canvas/                 Canvas abstraction
│   │   ├── ports/              Framework-agnostic interfaces
│   │   └── adapters/konva/     Konva.js implementation
│   ├── ui-designer/            Visual designer React components
│   │   ├── components/         Designer, CanvasArea, Toolbox, etc.
│   │   └── store/              Zustand + Immer (5 slices)
│   └── ui-viewer/              Report viewer component
└── docs/
    ├── ROADMAP.md              Product roadmap
    └── superpowers/
        ├── specs/              Design specifications
        └── plans/              Implementation plans
```

## Contributing

We welcome contributions! NextReportEngine is designed with contribution-friendly boundaries.

### Easiest Ways to Contribute

**1. Add a Component Plugin** (beginner-friendly)

Implement the `ComponentCoreDefinition` interface to add a new report component:

```typescript
interface ComponentCoreDefinition {
  type: string // e.g., "image"
  displayName: string // e.g., "Image"
  schema: ZodSchema // Validation schema
  defaultProperties: Record<string, unknown>
  htmlRenderer: (element: ResolvedElement) => string
}
```

Components needed: Image, Barcode, Chart, Shape, Divider/Line, Page Number.

**2. Add an Expression Function**

Register a new built-in function:

```typescript
import { registerFunction } from './registry.js'

registerFunction('avg', (args) => {
  const arr = args[0] as unknown[]
  const field = String(args[1])
  const values = arr.map((item) => Number((item as Record<string, unknown>)[field]))
  return values.reduce((a, b) => a + b, 0) / values.length
})
```

Functions needed: `avg`, `min`, `max`, `join`, `substring`, `replace`, `round`, `abs`, `now`, `pageNumber`.

**3. Add a Renderer**

Create a new package that consumes the IR (Intermediate Representation):

```typescript
import type { RenderResult } from '@nextreport/engine-core'

export function renderToCSV(result: RenderResult): string {
  // Transform IR pages/elements into CSV format
}
```

Renderers needed: CSV, Excel (xlsx), DOCX, Markdown, plain text.

**4. Add a Template**

Create a `.json` template + `.data.json` sample data in `apps/web/templates/`. Good templates: receipt, shipping label, report card, certificate, time sheet.

### Development Setup

```bash
git clone https://github.com/nextreport/engine.git
cd nextreport-engine
pnpm install
pnpm test           # Run all 190 tests
pnpm run dev        # Start dev server
```

### Coding Guidelines

- **Engine isolation:** `engine-core` and renderers must not import React, Next.js, or Konva
- **Konva adapter rule:** Konva is imported only in `packages/canvas/src/adapters/konva/`
- **Internal modules:** `engine-core` exports only `renderReport` and `validateReport` — internal modules (expression, band-processor, layout) are not public API
- **TDD:** Write tests first, verify they fail, implement, verify they pass
- **ESM:** Use `.js` extensions in all TypeScript imports
- **No over-engineering:** YAGNI. Don't add features, abstractions, or error handling for scenarios that don't exist yet

### Pull Request Process

1. Fork the repo and create a feature branch
2. Write tests for your changes
3. Ensure `pnpm test` passes (all 190+ tests)
4. Ensure `pnpm typecheck` passes
5. Submit a PR with a clear description

## Tech Stack

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Language  | TypeScript                    |
| Framework | Next.js (App Router)          |
| UI        | React, shadcn/ui, TailwindCSS |
| Monorepo  | Turborepo + pnpm workspaces   |
| Canvas    | Konva.js (via adapter)        |
| State     | Zustand + Immer               |
| Schema    | Zod + zod-to-json-schema      |
| PDF       | Puppeteer                     |
| Testing   | Vitest                        |

## Roadmap

See [ROADMAP.md](docs/ROADMAP.md) for the full product roadmap.

**Coming next:**

- Plugin system & component marketplace
- Advanced layout (grouping, nested details, auto-height)
- Native PDF generation (no Puppeteer dependency)
- Template versioning with database storage
- AI report generation via MCP server

## License

[MIT](LICENSE)

---

<p align="center">
  <strong>NextReport Engine</strong> — Schema-driven reports for the modern web.<br/>
  <a href="docs/ROADMAP.md">Roadmap</a> &bull;
  <a href="#contributing">Contribute</a> &bull;
  <a href="#api-reference">API Docs</a>
</p>
