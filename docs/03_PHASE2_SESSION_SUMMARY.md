# Phase 2: Engine Maturity — Session Summary

**Date:** 2026-04-12
**Duration:** Single session
**Model:** Claude Opus 4.6 (1M context)
**Released:** v0.2.0 → v0.2.1 (patch fix)

---

## What Was Built

Phase 2 transforms NextReport Engine from an MVP into a production-capable reporting engine. Six features were implemented, browser-tested with Playwright, and deployed through the full CI/CD pipeline.

### Final Stats

| Metric         | Before (v0.1.5) | After (v0.2.1) | Delta        |
| -------------- | --------------- | -------------- | ------------ |
| Tests          | 346             | 428            | +82          |
| Test files     | 17              | 19             | +2           |
| Source files   | 70+             | 77+            | +7           |
| Commits        | 4               | —              | this session |
| Lines added    | —               | 2,130          | —            |
| Lines removed  | —               | 151            | —            |
| Files changed  | —               | 37             | —            |
| New dependency | —               | bwip-js        | barcode/QR   |

### Releases

| Version | Type  | Content                                               |
| ------- | ----- | ----------------------------------------------------- |
| v0.2.0  | minor | All 6 Phase 2 features                                |
| v0.2.1  | patch | Designer component selection fix (click bubbling bug) |

Both releases published to: npm (`@nextreport/engine`), GHCR (`ghcr.io/nextreport/engine`), GitHub Releases.

---

## Features Implemented

### 1. Template CRUD API

**Problem:** Backend developers couldn't create or manage templates — had to manually copy JSON files.

**Solution:** Filesystem-based REST API with metadata envelope.

- `POST /api/templates` — create template with name, description, schema, sample data
- `GET /api/templates` — list all templates (new + legacy format)
- `PUT /api/templates/:id` — update template
- `DELETE /api/templates/:id` — delete template
- Storage: `{id}.template.json` single-file format with `{meta, template, sampleData}`
- Backward compatible: reads legacy `{id}.json` + `{id}.data.json` files transparently

**Files:**

- `apps/web/lib/template-store.ts` — CRUD operations (new)
- `apps/web/lib/template-loader.ts` — refactored to use template-store
- `apps/web/app/api/templates/route.ts` — GET list + POST create (new)
- `apps/web/app/api/templates/[id]/route.ts` — GET + PUT + DELETE (extended)

### 2. Image Component

**Problem:** No logo or image support — invoices look incomplete without company branding.

**Solution:** Schema type + HTML renderer. Zero engine-core changes needed — the generic band-processor already resolves all string properties with `{{expressions}}`.

- URL-based images (`https://...`)
- Base64 inline images (`data:image/png;base64,...`)
- Expression-bound src: `{{companyLogo}}`
- `objectFit`: contain, cover, fill
- Schema: `{ type: "image", position, src, alt, objectFit }`

**Files:**

- `packages/schema/src/component.schema.ts` — `ImageComponentSchema` added to discriminated union
- `packages/renderer-html/src/component-renderers/image-renderer.ts` — `<img>` with absolute positioning (new)
- Tests: 8 schema + 10 renderer = 18 new tests

### 3. Barcode / QR Code Component

**Problem:** Invoices, shipping labels, inventory reports need machine-readable codes.

**Solution:** SVG rendering via bwip-js — works in both HTML and PDF (Puppeteer renders SVG natively).

- QR Code and Code128 barcode formats
- Expression-bound value: `{{orderId}}` → QR code
- Custom foreground and background colors
- Schema: `{ type: "barcode", position, value, format, color, backgroundColor }`
- Graceful fallback for empty value or render errors

**Files:**

- `packages/schema/src/component.schema.ts` — `BarcodeComponentSchema` added
- `packages/renderer-html/src/component-renderers/barcode-renderer.ts` — bwip-js SVG (new)
- Dynamic import with async init to handle `export = BwipJs` CJS types under `verbatimModuleSyntax`
- Tests: 16 schema + 7 renderer = 23 new tests

### 4. Group Header/Footer Bands

**Problem:** Can't create "employees by department with subtotals" style reports.

**Solution:** Band-processor scans for `group-header → detail → group-footer` sequences, groups data by field, iterates per group.

- `groupBy` field added to band schema
- Band-processor detects group sequences and groups data arrays using `Map` (preserves insertion order)
- Each group gets context variables: `_groupKey`, `_groupItems`, `_groupIndex`
- Subtotal aggregation: `{{sum(_groupItems, 'salary')}}` in group-footer
- Works without group-footer (header + details only)

**Files:**

- `packages/schema/src/band.schema.ts` — `groupBy: z.string().optional()` added
- `packages/engine-core/src/band-processor/band-processor.ts` — rewritten with `processGroupSequence()`, `groupBy()`, two-phase approach
- Tests: 3 band-processor + 1 schema = 4 new tests

### 5. Page Header/Footer Bands

**Problem:** No page numbers, no repeating company header on multi-page reports.

**Solution:** Layout calculator extracts page bands, reserves space, inserts on every page.

- `page-header` band repeats at top of every page
- `page-footer` band repeats at bottom of every page
- `{{pageNumber}}` and `{{totalPages}}` resolved at layout time (two-pass)
- Space reserved in usable height calculation: `usableHeight = pageHeight - margins - pageHeaderHeight - pageFooterHeight`
- Content bands start after page-header offset

**Files:**

- `packages/engine-core/src/layout/layout-calculator.ts` — rewritten with page band extraction, two-pass pagination, `resolvePageVariables()`
- Tests: 4 new layout-calculator tests (page-header insertion, page-footer with page numbers, combined header+footer, variable resolution)

### 6. Designer UX Improvements

**Problem:** Designer was click-only — no drag & drop, no resize, no save/load, no new component types.

**Solution:** Full interaction overhaul across 5 components.

**Toolbox:**

- Image and Barcode buttons added (4 tools total)
- All buttons support HTML5 drag & drop with `application/nextreport-component` MIME type
- Draggable when band is selected, cursor changes to `grab`

**CanvasArea:**

- Drop target on each band — components placed at drop coordinates
- Component drag-to-move with 3px threshold (prevents accidental drags)
- 8-directional resize handles (nw, ne, sw, se, n, s, e, w) on selected component
- Image preview (loads URL in `<img>`) and barcode placeholder text
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y/Ctrl+Shift+Z (redo), Delete/Backspace (remove), Escape (deselect)
- Band colors for all 7 types including group and page bands

**PropertyPanel:**

- Image properties: Source URL/base64, Alt Text, Object Fit (contain/cover/fill)
- Barcode properties: Value, Format (QR Code/Code128), Color
- Position & Size grid for all component types

**DesignerToolbar:**

- Save button → POST to `/api/templates` with name prompt
- Load button → GET `/api/templates`, select from numbered list
- Import button → file picker for JSON import
- Keyboard shortcut hints on undo/redo buttons

**BandManager:**

- All 7 band types in dropdown with color-coded dots
- Group-header (orange), Group-footer (red-orange), Page-header (cyan), Page-footer (teal)

**Files:** `Toolbox.tsx`, `CanvasArea.tsx`, `PropertyPanel.tsx`, `DesignerToolbar.tsx`, `BandManager.tsx`

---

## Bug Fix: Designer Component Selection (v0.2.1)

**Symptom:** Clicking a component briefly showed the property panel, then it disappeared. Properties only visible while holding mouse button and dragging.

**Root cause:** Two issues in `CanvasArea.tsx`:

1. **Click event bubbling:** Component div had `onMouseDown` with `stopPropagation()`, but this only stops the mousedown event. The subsequent `click` event (mousedown+mouseup) still bubbled to the parent band div, which called `selectBand()` — setting `selectedComponentIndex = null` and hiding the property panel.

2. **No drag threshold:** Every `mousedown` immediately started drag state, so even a simple click was treated as a zero-distance drag.

**Fix:**

1. Added `onClick={(e) => e.stopPropagation()}` on component div — click no longer reaches band handler
2. Added 3px drag threshold — real drag only starts after minimum mouse movement, simple clicks work correctly

---

## Browser Testing (Playwright)

All features were verified in a live browser session using Playwright MCP:

| Test                                    | Result |
| --------------------------------------- | ------ |
| Homepage loads                          | Pass   |
| Designer loads with invoice template    | Pass   |
| Toolbox shows Image + Barcode buttons   | Pass   |
| Toolbar shows Save, Load, Import        | Pass   |
| Band selection activates toolbox        | Pass   |
| Image component added to header         | Pass   |
| Image property panel (Source, Alt, Fit) | Pass   |
| Image renders from URL in canvas        | Pass   |
| Barcode component added to footer       | Pass   |
| Barcode property panel (Value, Format)  | Pass   |
| GET /api/templates returns list         | Pass   |
| POST /api/templates creates template    | Pass   |
| POST /api/render with QR barcode → SVG  | Pass   |
| Band dropdown shows all 7 types         | Pass   |
| Page-footer band added                  | Pass   |
| Undo button active after changes        | Pass   |
| Resize handles visible on selection     | Pass   |

---

## CI/CD Pipeline Results

### v0.2.0

| Job                   | Status | Duration |
| --------------------- | ------ | -------- |
| Typecheck & Build     | Pass   | 40s      |
| Lint & Format         | Pass   | 31s      |
| Test (428 tests)      | Pass   | 34s      |
| SonarCloud Analysis   | Pass   | 1m17s    |
| Docker Build (verify) | Pass   | 2m41s    |
| npm Publish           | Pass   | 1m11s    |
| Docker Push (GHCR)    | Pass   | 2m40s    |
| GitHub Release        | Pass   | 6s       |

### v0.2.1

| Job                | Status | Duration |
| ------------------ | ------ | -------- |
| CI (full)          | Pass   | 4m42s    |
| Release (full)     | Pass   | 3m38s    |
| npm Publish        | Pass   | 1m9s     |
| Docker Push (GHCR) | Pass   | 2m43s    |
| GitHub Release     | Pass   | 4s       |

---

## Architecture Decisions

### Generic Band-Processor Pattern

The band-processor's `resolveComponents()` iterates all component properties (excluding `type` and `position`) and resolves `{{expressions}}`. This means Image and Barcode components work through the pipeline with **zero engine-core changes** — the `src` or `value` field gets expression-resolved automatically. Only schema (add types) and renderer-html (add rendering) needed changes.

### Barcode Rendering Strategy

Chose bwip-js with SVG output over canvas-based or PNG approaches. SVG is:

- DOM-independent (works in Node.js headless)
- Scalable (no pixelation at any zoom)
- PDF-compatible (Puppeteer renders SVG natively)
- Self-contained (no external service calls)

Dynamic import used to work around `export = BwipJs` CJS types conflicting with `verbatimModuleSyntax`.

### Two-Phase Layout for Page Bands

Page header/footer bands require knowing total page count before rendering `{{totalPages}}`. The layout calculator uses a two-pass approach:

1. First pass: paginate content bands, count pages
2. Second pass: inject page-header/footer elements into each page with resolved `{{pageNumber}}`/`{{totalPages}}`

### Template Storage Format

Single-file `{id}.template.json` with metadata envelope `{meta, template, sampleData}` instead of separate files. Backward-compatible reader for legacy `{id}.json` format. This simplifies CRUD (one read/write per operation) while preserving existing templates.

### Click vs. Drag Separation

The designer needed both click-to-select and drag-to-move on the same element. Solution: mousedown starts a "pending" drag state, but actual position updates only begin after 3px of mouse movement. This cleanly separates click (no/minimal movement) from drag (intentional movement).

---

## Published Artifacts

| Artifact       | Location                                                    |
| -------------- | ----------------------------------------------------------- |
| npm package    | `@nextreport/engine@0.2.1`                                  |
| Docker image   | `ghcr.io/nextreport/engine:v0.2.1`                          |
| GitHub Release | https://github.com/nextreport/engine/releases/tag/v0.2.1    |
| CI Runs        | https://github.com/nextreport/engine/actions                |
| SonarCloud     | https://sonarcloud.io/project/overview?id=nextreport_engine |

---

## What's Next (Phase 3 candidates)

- Plugin system for custom components and functions
- Standalone engine server (decouple from Next.js)
- Expression editor with autocomplete in designer
- Full Konva canvas integration (replace DOM preview)
- E2E tests with Playwright
- Conditional visibility on components
- Subreports (nested report embedding)
