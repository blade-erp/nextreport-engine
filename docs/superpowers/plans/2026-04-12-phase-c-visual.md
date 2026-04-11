# Phase C: Visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the canvas abstraction layer, visual report designer, and report viewer so users can design reports visually and preview them in the browser.

**Architecture:** Canvas package defines port interfaces; Konva adapter implements them. Designer uses Zustand + Immer for state with 5 slices. Component registry pattern — components register canvas renderers and property editors. Viewer renders HTML output from engine with pagination.

**Tech Stack:** React 19, Next.js (App Router), Konva.js + react-konva (via adapter), Zustand + Immer, shadcn/ui, TailwindCSS

**Depends on:** Phase A + B complete (schema, engine-core, renderer-html, renderer-pdf, API routes, 154 tests)

---

## Task 1: Canvas Package — Port Interfaces

**Files:**
- Create: `packages/canvas/src/ports/canvas-engine.port.ts`
- Create: `packages/canvas/src/ports/canvas-object.port.ts`
- Create: `packages/canvas/src/ports/canvas-events.port.ts`
- Create: `packages/canvas/src/ports/index.ts`
- Update: `packages/canvas/src/index.ts`

Port interfaces define the contract — NO implementation, NO Konva.

### CanvasEngine Port

```typescript
export interface CanvasEnginePort {
  initialize(container: HTMLDivElement, width: number, height: number): void
  destroy(): void
  getObjects(): CanvasObjectPort[]
  addObject(config: CanvasObjectConfig): CanvasObjectPort
  removeObject(id: string): void
  clear(): void
  setZoom(scale: number): void
  getZoom(): number
  setPan(x: number, y: number): void
  toJSON(): unknown
  onSelectionChange(callback: (objectId: string | null) => void): void
  onObjectModified(callback: (objectId: string, changes: Partial<CanvasObjectConfig>) => void): void
}
```

### CanvasObject Port

```typescript
export interface CanvasObjectConfig {
  id: string
  type: string  // 'text', 'rect', 'table-placeholder', etc.
  x: number
  y: number
  width: number
  height: number
  draggable?: boolean
  properties?: Record<string, unknown>
}

export interface CanvasObjectPort {
  getId(): string
  getConfig(): CanvasObjectConfig
  update(changes: Partial<CanvasObjectConfig>): void
  select(): void
  deselect(): void
  destroy(): void
}
```

### CanvasEvents Port

```typescript
export interface CanvasEventsPort {
  on(event: CanvasEventType, handler: CanvasEventHandler): void
  off(event: CanvasEventType, handler: CanvasEventHandler): void
}

export type CanvasEventType = 'click' | 'dragstart' | 'dragend' | 'dragmove' | 'resize' | 'select' | 'deselect'

export interface CanvasEvent {
  type: CanvasEventType
  objectId?: string
  position?: { x: number; y: number }
  size?: { width: number; height: number }
}

export type CanvasEventHandler = (event: CanvasEvent) => void
```

- [ ] Create port interface files
- [ ] Export from packages/canvas/src/index.ts (only ports, no adapter yet)
- [ ] Commit: `feat(canvas): add canvas port interfaces (engine, object, events)`

---

## Task 2: Canvas Package — Konva Adapter

**Files:**
- Update: `packages/canvas/package.json` (add konva, react-konva deps)
- Create: `packages/canvas/src/adapters/konva/konva-engine.adapter.ts`
- Create: `packages/canvas/src/adapters/konva/konva-object.adapter.ts`
- Create: `packages/canvas/src/adapters/konva/index.ts`
- Update: `packages/canvas/src/index.ts` (export adapter as default)

Konva adapter implements port interfaces. This is the ONLY place in the entire codebase that imports 'konva' or 'react-konva'.

The adapter translates between our port interface and Konva's API:
- CanvasEngine → Konva.Stage + Konva.Layer
- CanvasObject → Konva.Group (containing shapes based on type)
- Events → Konva event system

Also export a React component `KonvaCanvas` that wraps react-konva's Stage:
```typescript
export function createKonvaEngine(): CanvasEnginePort { ... }
```

- [ ] Install konva and react-konva
- [ ] Implement Konva adapter
- [ ] Export from index.ts
- [ ] Commit: `feat(canvas): add Konva adapter implementing canvas ports`

---

## Task 3: UI Packages Setup — Dependencies & Tooling

**Files:**
- Update: `packages/ui-designer/package.json`
- Update: `packages/ui-viewer/package.json`
- Update: `apps/web/package.json`

Add shared dependencies:
- ui-designer: react, zustand, immer, @nextreport/canvas, @nextreport/schema, @nextreport/engine-core
- ui-viewer: react, @nextreport/renderer-html, @nextreport/schema
- apps/web: tailwindcss, shadcn/ui related packages (already has next/react)

Setup TailwindCSS in apps/web if not already configured.

- [ ] Install dependencies
- [ ] Setup Tailwind + shadcn in apps/web
- [ ] Commit: `chore: add React, Zustand, Tailwind dependencies to UI packages`

---

## Task 4: Designer Store — Zustand + Immer Slices

**Files:**
- Create: `packages/ui-designer/src/store/document-slice.ts`
- Create: `packages/ui-designer/src/store/data-slice.ts`
- Create: `packages/ui-designer/src/store/selection-slice.ts`
- Create: `packages/ui-designer/src/store/viewport-slice.ts`
- Create: `packages/ui-designer/src/store/history-slice.ts`
- Create: `packages/ui-designer/src/store/index.ts`

### DocumentSlice
```typescript
interface DocumentSlice {
  report: Report  // from @nextreport/schema
  setReport(report: Report): void
  updateComponent(bandIndex: number, componentIndex: number, changes: Partial<Component>): void
  addBand(type: BandType, height?: number): void
  removeBand(index: number): void
  addComponent(bandIndex: number, component: Component): void
  removeComponent(bandIndex: number, componentIndex: number): void
}
```

### DataSlice
```typescript
interface DataSlice {
  sampleData: Record<string, unknown>
  setSampleData(data: Record<string, unknown>): void
  inferredFields: Field[] | null  // auto-inferred from sampleData
}
```

### SelectionSlice
```typescript
interface SelectionSlice {
  selectedBandIndex: number | null
  selectedComponentIndex: number | null
  selectBand(index: number | null): void
  selectComponent(bandIndex: number, componentIndex: number): void
  clearSelection(): void
}
```

### ViewportSlice
```typescript
interface ViewportSlice {
  zoom: number
  panX: number
  panY: number
  setZoom(zoom: number): void
  setPan(x: number, y: number): void
  resetViewport(): void
}
```

### HistorySlice
```typescript
interface HistorySlice {
  past: Report[]
  future: Report[]
  pushState(): void  // called before mutations
  undo(): void
  redo(): void
  canUndo: boolean
  canRedo: boolean
}
```

Combined store using Zustand `create` with Immer middleware.

- [ ] Implement all 5 slices
- [ ] Create combined store
- [ ] Write tests for document mutations and undo/redo
- [ ] Commit: `feat(ui-designer): add Zustand store with 5 slices and undo/redo`

---

## Task 5: Designer — React Components

**Files:**
- Create: `packages/ui-designer/src/components/Designer.tsx` (main layout)
- Create: `packages/ui-designer/src/components/CanvasArea.tsx` (center — report canvas)
- Create: `packages/ui-designer/src/components/Toolbox.tsx` (left — drag components)
- Create: `packages/ui-designer/src/components/BandManager.tsx` (left — manage bands)
- Create: `packages/ui-designer/src/components/PropertyPanel.tsx` (right — edit props)
- Create: `packages/ui-designer/src/components/DesignerToolbar.tsx` (top — actions)
- Update: `packages/ui-designer/src/index.ts`

### Designer (main layout)
Three-panel layout using CSS grid/flex:
- Left sidebar (240px): Toolbox + BandManager
- Center (flex-1): CanvasArea
- Right sidebar (280px): PropertyPanel
- Top: DesignerToolbar

### CanvasArea
- Uses @nextreport/canvas ports to render the report
- Reads report schema from DocumentSlice
- Renders bands as colored horizontal regions
- Renders components as positioned rectangles with content
- Click to select → updates SelectionSlice
- Drag to move → updates component position in DocumentSlice
- Zoom/pan from ViewportSlice

For MVP, render using simple DOM divs (not full Konva integration yet) that represent the canvas. Each band is a section, each component is an absolutely positioned div within the band. This gives us a working designer without full Konva complexity.

### Toolbox
List of available components (Text, Table). Each is a div that can be dragged. On drop into CanvasArea → adds component to selected band via DocumentSlice.

### BandManager
Shows list of bands with colored indicators. Click to select band. Buttons: add band, remove band.

### PropertyPanel
When a component is selected (SelectionSlice), shows its editable properties:
- Content (text input with expression support)
- Font size (number input)
- Font weight (toggle)
- Color (text input)
- Text align (button group)
- Position (x, y, width, height inputs)

Changes update DocumentSlice which triggers canvas re-render.

### DesignerToolbar
- Undo/Redo buttons (from HistorySlice)
- Zoom controls (from ViewportSlice)
- Preview button → navigates to viewer with current report
- Export JSON button → downloads report schema as JSON file

- [ ] Implement all components
- [ ] Export Designer from index.ts
- [ ] Commit: `feat(ui-designer): add Designer with canvas, toolbox, property panel, toolbar`

---

## Task 6: Viewer — ReportViewer Component

**Files:**
- Create: `packages/ui-viewer/src/ReportViewer.tsx`
- Create: `packages/ui-viewer/src/ViewerToolbar.tsx`
- Create: `packages/ui-viewer/src/Pagination.tsx`
- Update: `packages/ui-viewer/src/index.ts`

### ReportViewer
Takes report schema + data, calls renderReport + renderToHtml, displays result in an iframe or sanitized div.

```tsx
interface ReportViewerProps {
  report: Report
  data: Record<string, unknown>
  mode?: 'read-only' | 'print' | 'embedded'
}
```

### ViewerToolbar
- Page navigation (Pagination component)
- Zoom in/out
- Print button (window.print trigger)
- Export PDF button (calls /api/render with format=pdf, triggers download)

### Pagination
Shows: "Page 1 of 3" with prev/next buttons.

- [ ] Implement ReportViewer, Toolbar, Pagination
- [ ] Export from index.ts
- [ ] Commit: `feat(ui-viewer): add ReportViewer with pagination, print, and PDF export`

---

## Task 7: apps/web — Designer & Viewer Pages

**Files:**
- Create: `apps/web/app/designer/page.tsx`
- Create: `apps/web/app/viewer/page.tsx`
- Update: `apps/web/app/page.tsx` (add navigation links)

### Designer Page
```tsx
// /designer — loads Designer component
// Initializes store with default blank report or template
// Query param: ?template=invoice-v1 loads from template storage
```

### Viewer Page
```tsx
// /viewer — loads ReportViewer component
// Query params: ?template=invoice-v1 or receives report via state/context
// Loads sample data if template is specified
```

### Home Page Update
Add links to /designer and /viewer pages.

- [ ] Create designer page
- [ ] Create viewer page
- [ ] Update home page with navigation
- [ ] Verify: `pnpm --filter @nextreport/web dev` → open browser → navigate to /designer
- [ ] Commit: `feat(web): add designer and viewer pages`

---

## Summary

Phase C delivers:
- Canvas abstraction with port interfaces and Konva adapter
- Visual Designer with 3-panel layout (toolbox, canvas, properties)
- Zustand + Immer store with 5 slices and undo/redo
- Report Viewer with pagination, print, PDF export
- Designer and Viewer pages in Next.js app
- Working end-to-end: design visually → preview → export
