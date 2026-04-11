# Phase D: Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Add onboarding wizard, simple-list template, live preview sync between designer and viewer, and polish the overall UX for the "< 5 min first report" experience.

**Architecture:** Wizard is a multi-step modal/page in apps/web. Live preview uses engine-core client-side in the designer to render real-time HTML. Templates are static JSON files.

**Tech Stack:** React, Next.js, Zustand, engine-core (client-side)

**Depends on:** Phase A + B + C complete (173 tests, designer + viewer working)

---

## Task 1: Simple List Template

**Files:**
- Create: `apps/web/templates/simple-list-v1.json`
- Create: `apps/web/templates/simple-list-v1.data.json`

A basic table-style report with header title and detail rows. Demonstrates the simplest report possible.

Schema: header with title text, detail band with 3 fields (name, department, email), footer with count.

Sample data: 6 employee records.

- [ ] Create template and sample data
- [ ] Verify renders in viewer: `/viewer?template=simple-list-v1`
- [ ] Commit: `feat(web): add simple-list template`

---

## Task 2: Onboarding Wizard

**Files:**
- Create: `apps/web/app/new/page.tsx` (wizard page)
- Create: `apps/web/components/wizard/WizardStepTemplate.tsx`
- Create: `apps/web/components/wizard/WizardStepData.tsx`
- Create: `apps/web/components/wizard/WizardStepComplete.tsx`

### Wizard Flow (3 steps)

**Step 1 — Choose Template:**
- Grid of template cards: Invoice, Simple List, Blank Report
- Each card shows template name, description, small preview icon
- Click → selects template, moves to step 2

**Step 2 — Connect Data:**
- If template selected: shows "Use sample data" option (pre-selected) + "Paste JSON" option
- Paste JSON: textarea for pasting custom JSON data
- "Use sample data" loads the template's .data.json
- Next button → step 3

**Step 3 — Open Designer:**
- Summary: "Your report is ready!"
- Shows selected template name + data source
- "Open Designer" button → navigates to /designer?template=X with data in sessionStorage
- "Open Viewer" button → navigates to /viewer?template=X

### Navigation

- `/new` → wizard page
- Home page updated: "Create New Report" button links to `/new`
- Returning users: wizard is always at `/new`, not forced on every visit

- [ ] Implement 3-step wizard
- [ ] Update home page with "Create New Report" link
- [ ] Verify wizard flow end-to-end
- [ ] Commit: `feat(web): add onboarding wizard for new report creation`

---

## Task 3: Live Preview in Designer

**Files:**
- Create: `packages/ui-designer/src/components/PreviewPanel.tsx`
- Modify: `packages/ui-designer/src/components/Designer.tsx`

### How it works

Add a toggleable preview panel at the bottom of the designer (or as a split view). When enabled:

1. On every document change, run `renderReport(report, sampleData)` + `renderToHtml(result)` client-side
2. Display the HTML in a sandboxed iframe
3. Debounce renders (300ms) to avoid excessive computation
4. Toggle button in toolbar: "Preview" on/off

### Implementation

```tsx
// PreviewPanel.tsx
function PreviewPanel() {
  const report = useDesignerStore(s => s.report)
  const sampleData = useDesignerStore(s => s.sampleData)
  const [html, setHtml] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const ir = renderReport(report, sampleData)
        const output = renderToHtml(ir)
        setHtml(output)
      } catch { /* ignore render errors during editing */ }
    }, 300) // debounce
    return () => clearTimeout(timer)
  }, [report, sampleData])

  return (
    <div style={{ borderTop: '1px solid #3d3d5c', height: 300, background: '#fff' }}>
      <iframe srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' }} />
    </div>
  )
}
```

Update Designer.tsx to include PreviewPanel below the main content area, controlled by a toggle state.

- [ ] Implement PreviewPanel with debounced rendering
- [ ] Add preview toggle to DesignerToolbar
- [ ] Integrate into Designer layout
- [ ] Commit: `feat(ui-designer): add live preview panel with debounced rendering`

---

## Task 4: Designer UX Polish

**Files:**
- Modify: `packages/ui-designer/src/components/CanvasArea.tsx`
- Modify: `packages/ui-designer/src/components/DesignerToolbar.tsx`
- Modify: `apps/web/app/page.tsx`

### Polish items

1. **Data Source panel in left sidebar** — Show inferred field tree from sampleData (companyName, invoiceDate, items[].name, etc.) so users can see what fields are available for expressions

2. **Better canvas expression preview** — Use engine-core's evaluateExpression for proper preview (with function support) instead of simple regex replace

3. **Home page polish** — Better layout, clear CTAs, branding

- [ ] Add DataSourceTree to left panel
- [ ] Improve expression preview in CanvasArea
- [ ] Polish home page
- [ ] Commit: `feat(web): polish designer UX with data tree and improved expression preview`

---

## Summary

Phase D delivers:
- Simple List template (second use case beyond invoice)
- 3-step onboarding wizard (template → data → designer)
- Live preview panel in designer (debounced, iframe-based)
- Data source field tree in designer
- Improved expression preview with engine-core evaluation
- Polished home page
