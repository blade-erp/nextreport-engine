# NextReport Engine — React/Next.js Integration Guide

**Audience:** Frontend developers integrating NextReport into a React or Next.js application.

---

## Overview

You have a React/Next.js application and need to:

- Generate invoices, reports, or documents
- Show a visual report designer to your users
- Preview and export reports as PDF

NextReport gives you three integration levels — pick what you need:

| Level             | What You Get                      | Install                           |
| ----------------- | --------------------------------- | --------------------------------- |
| **Headless**      | Render reports in code, no UI     | `npm install @nextreport/engine`  |
| **Viewer**        | Embed a read-only report viewer   | Clone repo, import `ReportViewer` |
| **Full Designer** | Visual drag & drop report builder | Clone repo, import `Designer`     |

---

## Level 1: Headless — Render Reports in Code

Install the engine package:

```bash
npm install @nextreport/engine
```

### Generate HTML from a report schema

```tsx
// app/api/invoice/route.ts (Next.js API route)
import { renderReport, renderToHtml } from '@nextreport/engine'

export async function POST(request: Request) {
  const { customerName, items } = await request.json()

  const schema = {
    type: 'report' as const,
    locale: 'en-US',
    dataSource: { type: 'json' as const },
    bands: [
      {
        type: 'header' as const,
        height: 80,
        components: [
          {
            type: 'text' as const,
            position: { x: 0, y: 10, width: 400, height: 40 },
            content: '{{customerName}}',
            fontSize: 28,
            fontWeight: 'bold' as const,
          },
        ],
      },
      {
        type: 'detail' as const,
        height: 30,
        dataBinding: 'items',
        components: [
          {
            type: 'text' as const,
            position: { x: 0, y: 2, width: 250, height: 25 },
            content: '{{item.name}}',
            fontSize: 12,
          },
          {
            type: 'text' as const,
            position: { x: 350, y: 2, width: 100, height: 25 },
            content: '{{formatCurrency(item.price, "USD")}}',
            fontSize: 12,
            textAlign: 'right' as const,
          },
        ],
      },
      {
        type: 'footer' as const,
        height: 40,
        components: [
          {
            type: 'text' as const,
            position: { x: 350, y: 5, width: 100, height: 30 },
            content: 'Total: {{formatCurrency(sum(items, "price"), "USD")}}',
            fontWeight: 'bold' as const,
            textAlign: 'right' as const,
          },
        ],
      },
    ],
  }

  const data = { customerName, items }
  const ir = renderReport(schema, data)
  const html = renderToHtml(ir)

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
```

### Generate PDF

```tsx
import { renderReport, renderToHtml, renderToPdf } from '@nextreport/engine'

async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const ir = renderReport(invoiceSchema, data)
  const html = renderToHtml(ir)
  const pdf = await renderToPdf(html) // requires puppeteer installed
  return pdf
}
```

> **Note:** `renderToPdf` requires `puppeteer` as a peer dependency. Install it separately: `npm install puppeteer`

### Validate a report schema

```tsx
import { validateReport } from '@nextreport/engine'

const result = validateReport(userProvidedSchema)
if (!result.valid) {
  console.error('Schema errors:', result.errors)
}
```

---

## Level 2: Embed the Report Viewer

The viewer is a React component that renders a report with pagination, print, and PDF export.

### Setup

Clone the NextReport repo and add it as a local dependency, or import directly if using a monorepo:

```bash
git clone https://github.com/nextreport/engine.git
cd engine && pnpm install && pnpm run build
```

### Use the ReportViewer component

```tsx
'use client'
import { ReportViewer } from '@nextreport/ui-viewer'

export default function InvoicePage() {
  const report = {
    type: 'report' as const,
    locale: 'tr-TR',
    dataSource: { type: 'json' as const },
    bands: [
      // ... your report schema
    ],
  }

  const data = {
    companyName: 'Acme Corp',
    items: [
      { name: 'Widget', price: 29.99 },
      { name: 'Gadget', price: 49.99 },
    ],
  }

  return (
    <div style={{ height: '100vh' }}>
      <ReportViewer report={report} data={data} />
    </div>
  )
}
```

### Viewer features

The viewer provides out of the box:

- **Pagination** — navigate between pages with prev/next buttons
- **Print** — triggers `window.print()` with print-optimized CSS
- **PDF Export** — calls `/api/render` with `format: "pdf"`, downloads the file
- **Modes** — `read-only` (default), `print`, `embedded`

### Embedded mode (no toolbar)

```tsx
<ReportViewer report={schema} data={data} mode="embedded" />
```

---

## Level 3: Full Visual Designer

Let your users design their own reports with drag & drop.

### Use the Designer component

```tsx
'use client'
import { Designer, useDesignerStore } from '@nextreport/ui-designer'
import { useEffect } from 'react'

export default function ReportDesignerPage() {
  // Optionally pre-load a template
  useEffect(() => {
    fetch('/api/templates/invoice-v1')
      .then((r) => r.json())
      .then(({ template, sampleData }) => {
        useDesignerStore.getState().setReport(template)
        useDesignerStore.getState().setSampleData(sampleData)
      })
  }, [])

  return <Designer />
}
```

### Designer features

- **Left panel:** Component toolbox (Text, Table) + Band manager + Data source field tree
- **Center:** Canvas showing the report with band-colored sections
- **Right panel:** Property editor (content, font, color, position)
- **Toolbar:** Undo/Redo, Zoom, Live Preview toggle, Export JSON, Open Viewer
- **Live Preview:** Toggleable bottom panel showing rendered HTML in real-time

### Get the report JSON from the designer

```tsx
import { useDesignerStore } from '@nextreport/ui-designer'

// Read current report schema
const report = useDesignerStore.getState().report
const json = JSON.stringify(report, null, 2)

// Save to your backend
await fetch('/api/save-template', {
  method: 'POST',
  body: json,
  headers: { 'Content-Type': 'application/json' },
})
```

### Connect your own data

```tsx
import { useDesignerStore } from '@nextreport/ui-designer'

// Load data from your API
const customerData = await fetch('/api/customers/123').then((r) => r.json())

// Set as sample data — designer will show resolved values
useDesignerStore.getState().setSampleData(customerData)
```

---

## Typical Architecture

```
┌─────────────────────────────────────┐
│         Your React/Next.js App       │
│                                      │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ Designer  │  │  Your Pages      │ │
│  │ Component │  │  (dashboard,     │ │
│  │           │  │   settings, etc) │ │
│  └─────┬─────┘  └────────┬────────┘ │
│        │                  │          │
│  ┌─────▼──────────────────▼────────┐ │
│  │    ReportViewer Component       │ │
│  └─────────────┬───────────────────┘ │
│                │                     │
│  ┌─────────────▼───────────────────┐ │
│  │  @nextreport/engine (npm)       │ │
│  │  renderReport + renderToHtml    │ │
│  └─────────────┬───────────────────┘ │
│                │                     │
│  ┌─────────────▼───────────────────┐ │
│  │  Your API Routes                │ │
│  │  /api/render (HTML/PDF)         │ │
│  │  /api/save-template             │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Report Schema Quick Reference

### Minimal report

```json
{
  "type": "report",
  "dataSource": { "type": "json" },
  "bands": [
    {
      "type": "detail",
      "height": 30,
      "dataBinding": "items",
      "components": [
        {
          "type": "text",
          "position": { "x": 0, "y": 0, "width": 200, "height": 25 },
          "content": "{{item.name}}"
        }
      ]
    }
  ]
}
```

### Expression functions available

| Function         | Example                                            | Result                   |
| ---------------- | -------------------------------------------------- | ------------------------ |
| `formatCurrency` | `{{formatCurrency(price, 'USD')}}`                 | `$1,200.00`              |
| `formatCurrency` | `{{formatCurrency(price, 'TRY')}}` (locale: tr-TR) | `₺1.200,00`              |
| `formatDate`     | `{{formatDate(date, 'DD.MM.YYYY')}}`               | `12.04.2026`             |
| `formatNumber`   | `{{formatNumber(rate, 2)}}`                        | `3.14`                   |
| `sum`            | `{{sum(items, 'price')}}`                          | Total of all item prices |
| `count`          | `{{count(items)}}`                                 | Number of items          |
| `uppercase`      | `{{uppercase(name)}}`                              | `ACME CORP`              |
| `if`             | `{{if(total > 100, 'VIP', 'Standard')}}`           | `VIP` or `Standard`      |

### Band types

- `header` — rendered once at top
- `detail` — repeated for each item in `dataBinding` array (`items` → iterator: `item`)
- `footer` — rendered once at bottom

### Page configuration

```json
{
  "page": {
    "size": "A4",
    "orientation": "portrait",
    "margins": { "top": 20, "right": 15, "bottom": 20, "left": 15 }
  },
  "locale": "en-US"
}
```

Sizes: `A4`, `A3`, `Letter`, `Legal`. Orientations: `portrait`, `landscape`.

---

## Common Patterns

### Store templates in your database

```tsx
// Save
const schema = useDesignerStore.getState().report
await db.template.create({ data: { name: 'Invoice', schema: JSON.stringify(schema) } })

// Load
const template = await db.template.findUnique({ where: { id } })
const schema = JSON.parse(template.schema)
const ir = renderReport(schema, data)
```

### Generate PDF on the server and send to client

```tsx
// API route
export async function GET(request: Request) {
  const template = await loadTemplate('invoice-v1')
  const data = await fetchInvoiceData(invoiceId)
  const ir = renderReport(template, data)
  const html = renderToHtml(ir)
  const pdf = await renderToPdf(html)

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    },
  })
}
```

---

## Next Steps

- Browse the [full README](https://github.com/nextreport/engine) for API reference
- Check [PRODUCT_REQUIREMENTS.md](../PRODUCT_REQUIREMENTS.md) for schema DSL details
- See [ROADMAP.md](../ROADMAP.md) for upcoming features (plugin system, collaboration)
