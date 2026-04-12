# NextReport Website — Design Specification

**Date:** 2026-04-12
**Status:** Approved
**Repo:** `nextreport/nextreport.github.io`
**URL:** https://nextreport.github.io

---

## Overview

A comprehensive static website for NextReport Engine — the open-source, schema-driven reporting platform. The site serves as product marketing, documentation, interactive playground, and community hub.

**Core concept:** The website itself feels like a design canvas. Blueprint aesthetics (rulers, selection handles, component tags, dot grids, floating panels) communicate "this is a design tool" before a single word is read.

**Positioning:** Broad appeal — highlighting NextReport's own strengths rather than attacking competitors. Comparisons are factual and respectful. The tone is "here's what we offer" not "here's why they're bad."

---

## Decisions

| Decision        | Choice                                                          | Rationale                                                                                                               |
| --------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Framework       | Astro 6                                                         | Content-first, zero JS default, Lighthouse 100, MDX native, GitHub Pages deploy                                         |
| Visual identity | Blueprint / Design Canvas (Option D)                            | Website = designer canvas. Rulers, selection handles, component tags. Communicates the product's designer DNA instantly |
| Site structure  | Monolith Astro project                                          | Single repo, single deploy, consistent aesthetics across all pages                                                      |
| Language        | English                                                         | Global OSS audience, GitHub/npm ecosystem consistency                                                                   |
| Docs approach   | Custom MDX Content Collections                                  | Full control over blueprint aesthetics in docs, Pagefind for search                                                     |
| Blog scope      | Minimal (single author, tags, RSS)                              | Start lean, grow later. Content before infrastructure                                                                   |
| Playground      | Interactive (Monaco + live render)                              | `@nextreport/engine` runs in browser. Schema edit → instant output. Most compelling demo possible                       |
| Audience        | Broad — developers, SaaS builders, migration teams, AI builders | "Design visually. Render via API. Integrate anywhere." speaks to all segments                                           |

---

## Tech Stack

| Layer         | Technology             | Purpose                              |
| ------------- | ---------------------- | ------------------------------------ |
| Framework     | Astro 6                | Static site generation               |
| Styling       | Tailwind CSS 4         | Utility-first, dark theme            |
| Content       | MDX                    | Docs + blog content                  |
| Interactive   | React 19               | Playground islands only              |
| Report engine | @nextreport/engine     | Playground live render               |
| Code editor   | Monaco Editor          | Playground schema editor             |
| Search        | Pagefind               | Static full-text search (docs)       |
| Images        | Sharp (Astro built-in) | WebP/AVIF optimization, lazy loading |
| Deploy        | GitHub Pages + Actions | Automated on push to main            |
| SEO           | @astrojs/sitemap + RSS | Sitemap, Open Graph, meta            |

---

## Project Structure

```
nextreport.github.io/
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── DocsLayout.astro
│   │   └── BlogLayout.astro
│   ├── components/
│   │   ├── canvas/                  # Blueprint design system primitives
│   │   │   ├── Ruler.astro
│   │   │   ├── CanvasComponent.astro
│   │   │   ├── SelectionHandles.astro
│   │   │   ├── ComponentTag.astro
│   │   │   ├── DotGrid.astro
│   │   │   └── FloatingPanel.astro
│   │   ├── landing/                 # Landing page sections
│   │   │   ├── Hero.astro
│   │   │   ├── PipelineDemo.astro
│   │   │   ├── Features.astro
│   │   │   ├── QuickStart.astro
│   │   │   ├── MultiLanguageAPI.astro
│   │   │   ├── Comparison.astro
│   │   │   └── PlaygroundCTA.astro
│   │   ├── playground/              # React islands
│   │   │   ├── SchemaEditor.tsx
│   │   │   ├── ReportPreview.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   └── Playground.tsx
│   │   └── common/
│   │       ├── Nav.astro
│   │       ├── Footer.astro
│   │       └── SEO.astro
│   ├── content/
│   │   ├── docs/
│   │   │   ├── getting-started/
│   │   │   │   ├── installation.mdx
│   │   │   │   ├── quick-start.mdx
│   │   │   │   └── first-report.mdx
│   │   │   ├── schema/
│   │   │   │   ├── overview.mdx
│   │   │   │   ├── bands.mdx
│   │   │   │   ├── components.mdx
│   │   │   │   ├── expressions.mdx
│   │   │   │   └── data-binding.mdx
│   │   │   ├── api/
│   │   │   │   ├── render.mdx
│   │   │   │   ├── validate.mdx
│   │   │   │   ├── preview.mdx
│   │   │   │   └── templates.mdx
│   │   │   ├── integration/
│   │   │   │   ├── react-nextjs.mdx
│   │   │   │   ├── rest-api.mdx
│   │   │   │   └── docker.mdx
│   │   │   └── advanced/
│   │   │       ├── custom-renderer.mdx
│   │   │       ├── custom-function.mdx
│   │   │       └── architecture.mdx
│   │   └── blog/
│   │       ├── introducing-nextreport.mdx
│   │       ├── why-json-schema.mdx
│   │       └── v010-release.mdx
│   ├── pages/
│   │   ├── index.astro
│   │   ├── playground.astro
│   │   ├── templates.astro
│   │   ├── community.astro
│   │   ├── about.astro
│   │   ├── docs/[...slug].astro
│   │   ├── blog/index.astro
│   │   ├── blog/[...slug].astro
│   │   └── rss.xml.ts
│   └── styles/
│       └── global.css
├── public/
│   ├── images/
│   └── favicon.svg
├── astro.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Visual Identity: Blueprint Design System

### Color Palette

```
Canvas background:   #080b12
Surface/panels:      #0d1017
Border default:      #1e2433
Border dashed:       #2a3348
Accent (indigo):     #6366f1
Accent glow:         #818cf8
Text primary:        #e2e8f0
Text secondary:      #64748b
Text muted:          #475569
Success:             #4ade80
Paper background:    #fafaf9
Paper text:          #1c1917
Paper border:        #e7e5e4
Paper surface:       #f5f5f0
```

### Blueprint Primitives

| Component          | Purpose                                 | Implementation                                                           |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------ |
| `DotGrid`          | Subtle dot pattern background           | CSS `radial-gradient`, `rgba(99,102,241,0.07)`, 24px spacing             |
| `Ruler`            | Pixel ruler (horizontal/vertical)       | Astro component, monospace tick labels, major/minor lines                |
| `CanvasComponent`  | Border wrapper for content sections     | Dashed border (unselected) or solid indigo (selected), border-radius 6px |
| `SelectionHandles` | 8 resize handles on selected components | Absolute positioned 8×8px indigo squares at corners and edges            |
| `ComponentTag`     | `<Hero>`, `<Features>` label tags       | Absolute positioned, top-left, monospace, indigo background              |
| `FloatingPanel`    | Properties/Layers side panels           | Fixed position, dark surface, prop-value rows                            |
| `ConnectorLine`    | Pipeline flow connections               | CSS gradient line with centered glowing dot                              |

### Page Intensity Map

| Page       | Rulers | Handles      | Tags                    | DotGrid | Floating Panels     |
| ---------- | ------ | ------------ | ----------------------- | ------- | ------------------- |
| Landing    | Full   | Hero section | Every section           | Full    | Properties + Layers |
| Playground | Full   | Editor panel | Editor + Preview        | Full    | No (own UI)         |
| Templates  | No     | On hover     | Each template           | Subtle  | No                  |
| Docs       | No     | No           | Subtle section headings | Subtle  | TOC as panel        |
| Blog       | No     | No           | Post metadata           | Subtle  | No                  |
| Community  | No     | No           | Section tags            | Subtle  | No                  |
| About      | No     | No           | Timeline tags           | Subtle  | No                  |

---

## Page Specifications

### Landing Page (`/`)

**Sections in order:**

1. **Nav** — Toolbar style (48px height). Logo + icon, links (Docs, Playground, Templates, Blog, Community), GitHub button, "Get Started" CTA. Sticky, backdrop blur.

2. **Ruler bar** — Horizontal ruler below nav, vertical ruler on left side. Pixel labels at intervals.

3. **Hero** — Wrapped in `CanvasComponent` with `SelectionHandles`. `<Hero>` component tag. Badge: "v0.1.0 — Open Source" with green dot. Headline: "Schema-driven reports for the modern web." (gradient text, 52px, weight 800). Subtitle. Two CTAs: "Get Started" (primary indigo) + "npm install @nextreport/engine" (secondary monospace). Centered layout.

4. **Pipeline Demo** — "How it works" section label with dashed line. Three-column grid: Left = dark code panel with JSON schema (syntax highlighted). Center = connector line with glowing dot + "Engine" label. Right = light paper rendered invoice (Acme Corp, ₺49.650 total). Both wrapped in `CanvasComponent`.

5. **Features** — 6 cards in 3×2 grid. Each card: dashed border, component tag (designer, engine, viewer, schema, expression, renderer), title, description, status dot. Hover: border becomes solid indigo, tag becomes indigo.
   - Visual Designer — WYSIWYG editor, drag & drop, live preview
   - Headless API — Stateless REST, JSON in/out, any language
   - Runtime Viewer — React component, pagination, print, export
   - JSON Schema DSL — Human-readable, version-controllable, AI-ready
   - Expression Engine — 9 built-in functions, locale-aware
   - Pluggable Renderers — HTML + PDF, extensible

6. **Quick Start** — Canvas component with file tab (`app.ts`). 5-line code example: import → renderReport → renderToHtml → renderToPdf.

7. **Multi-language API** — Tabbed code examples: curl, Python, Java, C#. "Any language, one API" message. Shows POST /api/render with templateId + data.

8. **Comparison** — Light paper document with header bar ("Feature Comparison Matrix", doc reference). Table comparing NextReport, JasperReports, FastReport, Stimulsoft, jsreport, ActiveReportsJS across: Open Source, Web-Native, Visual Designer, API-First, AI/LLM-Ready, React-Native, Cost. Respectful tone.

9. **Playground CTA** — "Try it in your browser" with mini preview screenshot linking to /playground.

10. **Footer** — Logo, nav links, GitHub/npm/docs, "Open source, MIT licensed."

### Playground (`/playground`)

Full canvas experience with rulers.

- **Top toolbar:** Template selector dropdown (Invoice, Simple List, Blank), Reset button, Copy Schema button, "Open in GitHub" link
- **Left panel (~45%):** Monaco Editor with JSON schema. Dark theme matching canvas palette. JSON language mode with report JSON Schema validation (from `getReportJsonSchema()`). Auto-complete for schema properties.
- **Right panel (~55%):** Live rendered output in iframe. `renderReport(schema, data)` → `renderToHtml(ir)` runs client-side on every change (300ms debounce). Validation errors shown below editor when schema is invalid.
- **Data flow:** Template select → load schema + sample data → editor populated → edit triggers re-render → output updates
- **All client-side** — no server calls. `@nextreport/engine` bundled as dependency.
- **React island:** `<Playground client:load />` — loads immediately since it's the page's primary content.

### Templates Gallery (`/templates`)

- Grid of template cards (rendered preview thumbnail, name, description)
- Blueprint hover effect: dashed → selected border, handles appear
- Click → detail view: full rendered preview + collapsible schema JSON + "Open in Playground" button
- MVP templates: Invoice, Simple List
- "Submit a Template" link → GitHub PR instructions

### Docs (`/docs/...`)

MDX Content Collections with custom DocsLayout.

- **Sidebar (left):** Auto-generated from content collection. Grouped by section (Getting Started, Schema, API, Integration, Advanced). Current page highlighted. Collapsible groups.
- **Content (center):** MDX rendered with code highlighting (Shiki). Blueprint hints: dot grid background (subtle), section headings with component tags.
- **TOC (right):** Floating panel style — heading list auto-generated from content. Scroll-spy highlighting.
- **Navigation:** Breadcrumb, prev/next links, "Edit on GitHub" link.
- **Search:** Pagefind integration — search input in sidebar top.

**Docs content structure:**

```
getting-started/
  installation.mdx      — npm install, prerequisites
  quick-start.mdx       — 5-minute first report
  first-report.mdx      — Step-by-step invoice creation
schema/
  overview.mdx           — Schema structure, version, type, locale, page
  bands.mdx              — Band types, nesting, dataBinding
  components.mdx         — Text, Table (+ planned: Image, Barcode, Chart)
  expressions.mdx        — Syntax, functions reference, type coercion
  data-binding.mdx       — Detail iteration, iterator naming, custom iteratorName
api/
  render.mdx             — POST /api/render (templateId mode + inline mode)
  validate.mdx           — POST /api/validate
  preview.mdx            — POST /api/preview
  templates.mdx          — GET /api/templates/:id
integration/
  react-nextjs.mdx       — ReportViewer component, Designer embedding
  rest-api.mdx           — Python, Java, C#, curl examples
  docker.mdx             — Dockerfile, docker-compose, deployment
advanced/
  custom-renderer.mdx    — How to create a new renderer (CSV, Excel)
  custom-function.mdx    — registerFunction() guide
  architecture.mdx       — Pipeline internals, dependency graph, design principles
```

### Blog (`/blog`)

- **List page:** Cards with date, title, description, tags. Sorted by date descending.
- **Post page:** MDX content, reading time (calculated), tags, published date. Subtle blueprint: dot grid, component tag on title.
- **RSS feed:** `/rss.xml` auto-generated.
- **Initial posts:**
  - "Introducing NextReport Engine" — what it is, why it exists
  - "Why JSON Schema for Reports" — technical decision deep-dive
  - "v0.1.0 Release Notes" — what shipped, stats, what's next

### Community (`/community`)

- **Contributing section** — 4 contribution paths: Component plugins, Expression functions, Renderers, Templates. Each with code example and difficulty level.
- **Roadmap** — Visual timeline: Phase 2 (Platform Expansion), Phase 3 (Collaboration & SaaS), Phase 4 (AI & Automation). Blueprint aesthetic timeline.
- **Links** — GitHub Issues, Discussions, Pull Requests with descriptions.
- **Project stats** — 346 tests, 8 packages, 42.9KB bundle, MIT license.

### About / Vision (`/about`)

- **Origin story** — "Born from firsthand pain" with JasperReports/FastReport experience.
- **The problem** — Why most reporting engine attempts fail (5 systems that must work together).
- **Strategic position** — Developer Experience × Visual Experience quadrant diagram.
- **What makes this different** — Schema as universal interface (humans, developers, AI).
- **Honest assessment** — What's hard, what determines success. Transparent tone from VISION.md.
- **Timeline** — Project history and future vision milestones.

---

## Astro Configuration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://nextreport.github.io',
  output: 'static',
  integrations: [tailwind(), react(), mdx(), sitemap()],
})
```

## Content Collections

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content'

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.string(),
    order: z.number(),
  }),
})

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  }),
})

export const collections = { docs, blog }
```

## GitHub Pages Deploy

GitHub Actions workflow on push to main: checkout → pnpm install → pnpm build → upload dist/ → deploy pages.

## SEO & Performance

- Every page: title, description, Open Graph, Twitter Card via `SEO.astro`
- Sitemap: auto-generated by `@astrojs/sitemap`
- RSS: `/rss.xml` for blog
- Lighthouse target: 100/100 (zero JS on non-playground pages)
- Images: Astro `<Image>` with Sharp, WebP/AVIF, lazy loading
- Fonts: System font stack (no external font loading)
- Playground JS: Only loaded on `/playground` via `client:visible`

## Assets

Screenshots from engine repo (`screenshots/`) to be copied to `public/images/`:

- `10-home-final.png` — Engine app overview
- `16-designer-live-preview.png` — Designer with live preview
- `06-viewer.png` — Report viewer
- `11-wizard-step1.png` through `14-wizard-step3.png` — Onboarding wizard

---

## Out of Scope

- Dark/light mode toggle (dark only for MVP)
- i18n / multi-language site
- User authentication or login
- Database or CMS backend
- E-commerce or payment
- Analytics dashboard (basic analytics via Plausible/Umami can be added later)
