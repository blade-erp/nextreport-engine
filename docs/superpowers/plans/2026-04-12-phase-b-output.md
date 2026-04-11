# Phase B: Output — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build renderer-html, renderer-pdf, and Next.js API routes so that a JSON report schema + data can produce HTML and PDF output via HTTP API.

**Architecture:** renderer-html converts IR to self-contained HTML with inline styles and absolute positioning. renderer-pdf wraps Puppeteer to convert HTML→PDF. API routes are thin adapters calling engine-core + renderers. Templates stored as JSON files on filesystem.

**Tech Stack:** TypeScript, Next.js (App Router), Puppeteer, Vitest

**Depends on:** Phase A (schema + engine-core complete, 110 tests passing)

---

## File Structure

```
packages/
  renderer-html/
    package.json                (update: add vitest)
    vitest.config.ts
    src/
      index.ts                  (public API: renderToHtml)
      html-renderer.ts          (IR → HTML document)
      component-renderers/
        text-renderer.ts        (ResolvedElement → HTML for text)
        table-renderer.ts       (ResolvedElement → HTML for table)
        index.ts                (renderer map by component type)
    src/__tests__/
      text-renderer.test.ts
      table-renderer.test.ts
      html-renderer.test.ts

  renderer-pdf/
    package.json                (update: add puppeteer, vitest)
    vitest.config.ts
    src/
      index.ts                  (public API: renderToPdf)
      pdf-renderer.ts           (HTML → Puppeteer → PDF buffer)
    src/__tests__/
      pdf-renderer.test.ts

apps/
  web/
    package.json                (update: add next, react, etc.)
    next.config.ts
    tsconfig.json               (update for Next.js)
    app/
      layout.tsx
      page.tsx
      api/
        render/route.ts
        validate/route.ts
        preview/route.ts
    lib/
      template-loader.ts
      data-resolvers.ts
    templates/
      invoice-v1.json
      invoice-v1.data.json
```

---

## Task 1: renderer-html — Component Renderers & HTML Document Builder

**Files:**
- Update: `packages/renderer-html/package.json` (add vitest)
- Create: `packages/renderer-html/vitest.config.ts`
- Create: `packages/renderer-html/src/component-renderers/text-renderer.ts`
- Create: `packages/renderer-html/src/component-renderers/table-renderer.ts`
- Create: `packages/renderer-html/src/component-renderers/index.ts`
- Create: `packages/renderer-html/src/html-renderer.ts`
- Update: `packages/renderer-html/src/index.ts`
- Create: `packages/renderer-html/src/__tests__/text-renderer.test.ts`
- Create: `packages/renderer-html/src/__tests__/table-renderer.test.ts`
- Create: `packages/renderer-html/src/__tests__/html-renderer.test.ts`

### Text Renderer

```typescript
// component-renderers/text-renderer.ts
import type { ResolvedElement } from '@nextreport/engine-core'

export function renderTextElement(element: ResolvedElement): string {
  const { content, fontSize, fontWeight, color, textAlign } = element.properties
  const { x, y, width, height } = element.position
  const styles = [
    `position:absolute`,
    `left:${x}pt`, `top:${y}pt`,
    `width:${width}pt`, `height:${height}pt`,
    fontSize ? `font-size:${fontSize}pt` : '',
    fontWeight ? `font-weight:${fontWeight}` : '',
    color ? `color:${color}` : '',
    textAlign ? `text-align:${textAlign}` : '',
  ].filter(Boolean).join(';')

  const escaped = escapeHtml(String(content ?? ''))
  return `<div style="${styles}">${escaped}</div>`
}
```

### Table Renderer

```typescript
// component-renderers/table-renderer.ts
// For table components, the properties include columns definition and the data
// Since tables are typically inside detail bands, the resolved element
// has pre-evaluated content. Table rendering creates an HTML table structure.
import type { ResolvedElement } from '@nextreport/engine-core'

export function renderTableElement(element: ResolvedElement): string {
  const { x, y, width, height } = element.position
  const { columns, dataBinding } = element.properties as {
    columns: Array<{ header: string; field: string; width?: number }>
    dataBinding: string
    [key: string]: unknown
  }
  // Table renders its column headers; actual data rows come from detail band iteration
  const styles = `position:absolute;left:${x}pt;top:${y}pt;width:${width}pt;height:${height}pt`
  const headerCells = (columns ?? []).map(c =>
    `<th style="padding:4pt 8pt;text-align:left;border-bottom:1pt solid #ddd">${escapeHtml(c.header)}</th>`
  ).join('')
  return `<table style="${styles};border-collapse:collapse"><thead><tr>${headerCells}</tr></thead></table>`
}
```

### Component Renderer Map

```typescript
// component-renderers/index.ts
import type { ResolvedElement } from '@nextreport/engine-core'
import { renderTextElement } from './text-renderer.js'
import { renderTableElement } from './table-renderer.js'

type ComponentRenderer = (element: ResolvedElement) => string

const renderers: Record<string, ComponentRenderer> = {
  text: renderTextElement,
  table: renderTableElement,
}

export function renderElement(element: ResolvedElement): string {
  const renderer = renderers[element.type]
  if (!renderer) return `<!-- unknown component: ${element.type} -->`
  return renderer(element)
}
```

### HTML Document Builder

```typescript
// html-renderer.ts
import type { RenderResult } from '@nextreport/engine-core'
import { renderElement } from './component-renderers/index.js'

// A4 dimensions in points
const PAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
}

export interface HtmlRenderOptions {
  pageSize?: string
  orientation?: string
}

export function renderToHtml(result: RenderResult, options?: HtmlRenderOptions): string {
  const pageSize = options?.pageSize ?? 'A4'
  const orientation = options?.orientation ?? 'portrait'
  const dim = PAGE_DIMENSIONS[pageSize] ?? PAGE_DIMENSIONS.A4
  const width = orientation === 'landscape' ? dim.height : dim.width
  const height = orientation === 'landscape' ? dim.width : dim.height

  const pagesHtml = result.pages.map(page => {
    const elementsHtml = page.elements.map(el => renderElement(el)).join('\n    ')
    return `  <div class="page" data-page="${page.number}" style="position:relative;width:${width}pt;height:${height}pt;overflow:hidden;page-break-after:always">
    ${elementsHtml}
  </div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#fff; }
  .page { background:#fff; margin:0 auto; }
  @media print { .page { margin:0; page-break-after:always; } }
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`
}
```

### Public API

```typescript
// index.ts
export { renderToHtml } from './html-renderer.js'
export type { HtmlRenderOptions } from './html-renderer.js'
```

### Tests

Test text-renderer: renders div with correct position styles, handles content escaping, applies font properties.
Test table-renderer: renders table with header row.
Test html-renderer: full document with DOCTYPE, pages, elements. Multi-page support.

Integration test: run engine-core renderReport → renderToHtml → verify HTML contains resolved values.

- [ ] Write tests (TDD)
- [ ] Implement component renderers
- [ ] Implement html-renderer
- [ ] Update index.ts
- [ ] Verify all tests pass
- [ ] Commit: `feat(renderer-html): add HTML renderer with text and table component support`

---

## Task 2: renderer-pdf — Puppeteer-Based PDF Renderer

**Files:**
- Update: `packages/renderer-pdf/package.json` (add puppeteer, vitest)
- Create: `packages/renderer-pdf/vitest.config.ts`
- Create: `packages/renderer-pdf/src/pdf-renderer.ts`
- Update: `packages/renderer-pdf/src/index.ts`
- Create: `packages/renderer-pdf/src/__tests__/pdf-renderer.test.ts`

### PDF Renderer

```typescript
// pdf-renderer.ts
import puppeteer from 'puppeteer'

export interface PdfRenderOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal'
  landscape?: boolean
}

export async function renderToPdf(html: string, options?: PdfRenderOptions): Promise<Uint8Array> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: options?.format ?? 'A4',
      landscape: options?.landscape ?? false,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    return new Uint8Array(pdf)
  } finally {
    await browser.close()
  }
}
```

### Tests

Test: generates PDF buffer from HTML (verify starts with %PDF magic bytes), returns Uint8Array.
Note: Puppeteer tests require Chrome binary. If not available in CI, mark as integration test.

- [ ] Write tests
- [ ] Implement pdf-renderer
- [ ] Update index.ts: `export { renderToPdf } from './pdf-renderer.js'`
- [ ] Verify tests pass
- [ ] Commit: `feat(renderer-pdf): add Puppeteer-based PDF renderer`

---

## Task 3: apps/web — Next.js Setup & Template Storage

**Files:**
- Update: `apps/web/package.json` (add next, react, react-dom, etc.)
- Create: `apps/web/next.config.ts`
- Update: `apps/web/tsconfig.json`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/lib/template-loader.ts`
- Create: `apps/web/lib/data-resolvers.ts`
- Create: `apps/web/templates/invoice-v1.json`
- Create: `apps/web/templates/invoice-v1.data.json`

### Template Loader

```typescript
// lib/template-loader.ts
import { readFile } from 'fs/promises'
import { join } from 'path'

const TEMPLATES_DIR = join(process.cwd(), 'templates')

export async function loadTemplate(templateId: string) {
  const filePath = join(TEMPLATES_DIR, `${templateId}.json`)
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

export async function loadSampleData(templateId: string) {
  const filePath = join(TEMPLATES_DIR, `${templateId}.data.json`)
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}
```

### Data Resolvers

```typescript
// lib/data-resolvers.ts
export async function resolveData(
  requestData: Record<string, unknown> | undefined,
  dataSourceUrl?: string,
): Promise<Record<string, unknown>> {
  if (requestData) return requestData
  if (dataSourceUrl) {
    const response = await fetch(dataSourceUrl)
    return response.json()
  }
  return {}
}
```

### Invoice Template

Sample invoice-v1.json with header (company name, date), detail band (items), footer (total).
Sample invoice-v1.data.json with Acme Corp, 3 line items.

- [ ] Install Next.js and React dependencies
- [ ] Create Next.js config and layout
- [ ] Create template loader and data resolvers
- [ ] Create invoice template files
- [ ] Verify `pnpm --filter @nextreport/web dev` starts
- [ ] Commit: `feat(web): add Next.js app with template storage and data resolvers`

---

## Task 4: apps/web — API Routes

**Files:**
- Create: `apps/web/app/api/render/route.ts`
- Create: `apps/web/app/api/validate/route.ts`
- Create: `apps/web/app/api/preview/route.ts`

### POST /api/render

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { renderReport } from '@nextreport/engine-core'
import { renderToHtml } from '@nextreport/renderer-html'
import { renderToPdf } from '@nextreport/renderer-pdf'
import { loadTemplate } from '../../../lib/template-loader'
import { resolveData } from '../../../lib/data-resolvers'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { templateId, template, data, format = 'html' } = body

  // Load template from ID or use inline template
  const reportSchema = templateId ? await loadTemplate(templateId) : template
  if (!reportSchema) return NextResponse.json({ error: 'Template required' }, { status: 400 })

  const resolvedData = await resolveData(data)
  const ir = renderReport(reportSchema, resolvedData)

  if (format === 'pdf') {
    const html = renderToHtml(ir, { pageSize: reportSchema.page?.size, orientation: reportSchema.page?.orientation })
    const pdf = await renderToPdf(html, { format: reportSchema.page?.size })
    return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf' } })
  }

  const html = renderToHtml(ir, { pageSize: reportSchema.page?.size, orientation: reportSchema.page?.orientation })
  return NextResponse.json({ success: true, output: html, metadata: ir.metadata })
}
```

### POST /api/validate

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateReport } from '@nextreport/engine-core'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = validateReport(body.template)
  return NextResponse.json(result)
}
```

### POST /api/preview

```typescript
// Same as render but lightweight — first page only, always HTML
```

- [ ] Create render route (supports templateId + data, or inline template + data)
- [ ] Create validate route
- [ ] Create preview route
- [ ] Test with curl: `curl -X POST http://localhost:3000/api/render -H 'Content-Type: application/json' -d '{"templateId":"invoice-v1","data":{...}}'`
- [ ] Commit: `feat(web): add API routes for render, validate, and preview`

---

## Task 5: End-to-End Integration Test

**Files:**
- Create: `packages/renderer-html/src/__tests__/integration.test.ts`

Full pipeline test: schema JSON → engine-core renderReport → renderer-html renderToHtml → verify HTML output contains all resolved values, correct structure, multiple pages.

- [ ] Write integration test
- [ ] Verify all workspace tests pass: `pnpm test`
- [ ] Commit: `test: add end-to-end integration test for schema → HTML pipeline`

---

## Summary

Phase B delivers:
- renderer-html: IR → self-contained HTML with text and table components
- renderer-pdf: HTML → PDF via Puppeteer
- apps/web: Next.js with API routes (/render, /validate, /preview)
- Template storage (filesystem-based)
- Data resolvers (inline JSON, URL fetch)
- curl-testable headless engine
