# NextReport Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive static website for NextReport Engine at nextreport.github.io with blueprint/canvas design system, interactive playground, docs, blog, and community pages.

**Architecture:** Astro 6 static site with Tailwind CSS 4 for styling, MDX Content Collections for docs/blog, React 19 islands for interactive playground (Monaco editor + @nextreport/engine live render). Blueprint design system primitives (rulers, handles, tags, grids) applied at varying intensity across pages.

**Tech Stack:** Astro 6, Tailwind CSS 4, React 19, MDX, @nextreport/engine, Monaco Editor, Pagefind, Sharp, GitHub Pages

**Spec:** `docs/specs/2026-04-12-website-design.md`

**Website directory:** `/home/cevheri/projects/nextreport/nextreport.github.io`

**Engine directory (for reference/assets):** `/home/cevheri/projects/nextreport/engine`

---

## File Map

```
nextreport.github.io/
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro          # Shell: html, head, SEO, nav, footer, dot grid
│   │   ├── DocsLayout.astro          # Docs: sidebar + content + TOC
│   │   └── BlogLayout.astro          # Blog post: meta, reading time, tags
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── DotGrid.astro         # Background dot pattern
│   │   │   ├── Ruler.astro           # Horizontal/vertical pixel ruler
│   │   │   ├── CanvasComponent.astro  # Dashed/selected border wrapper
│   │   │   ├── SelectionHandles.astro # 8 resize handles
│   │   │   ├── ComponentTag.astro     # <Name> label tag
│   │   │   ├── FloatingPanel.astro    # Properties/Layers panel
│   │   │   └── ConnectorLine.astro    # Pipeline connector with glow dot
│   │   ├── landing/
│   │   │   ├── Hero.astro
│   │   │   ├── PipelineDemo.astro
│   │   │   ├── Features.astro
│   │   │   ├── QuickStart.astro
│   │   │   ├── MultiLanguageAPI.astro
│   │   │   ├── Comparison.astro
│   │   │   └── PlaygroundCTA.astro
│   │   ├── playground/
│   │   │   ├── Playground.tsx         # Orchestrator (React island)
│   │   │   ├── SchemaEditor.tsx       # Monaco editor wrapper
│   │   │   ├── ReportPreview.tsx      # Live render output
│   │   │   └── TemplateSelector.tsx   # Template dropdown
│   │   └── common/
│   │       ├── Nav.astro
│   │       ├── Footer.astro
│   │       └── SEO.astro
│   ├── content/
│   │   ├── docs/                      # 15 MDX files (5 sections)
│   │   └── blog/                      # 3 initial posts
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
│   ├── data/
│   │   └── templates.ts              # Template definitions for gallery + playground
│   └── styles/
│       └── global.css
├── public/
│   ├── images/
│   └── favicon.svg
├── .github/workflows/deploy.yml
├── astro.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Task 1: Project Scaffold

**Files:**

- Create: `nextreport.github.io/package.json`
- Create: `nextreport.github.io/astro.config.mjs`
- Create: `nextreport.github.io/tailwind.config.ts`
- Create: `nextreport.github.io/tsconfig.json`
- Create: `nextreport.github.io/src/styles/global.css`

- [ ] **Step 1: Clone repo and init Astro 6 project**

```bash
cd /home/cevheri/projects/nextreport
git clone git@github.com:nextreport/nextreport.github.io.git
cd nextreport.github.io
pnpm create astro@latest . --template minimal --install --no-git --typescript strict
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add @astrojs/tailwind @astrojs/react @astrojs/mdx @astrojs/sitemap tailwindcss @tailwindcss/typography
pnpm add react react-dom @types/react @types/react-dom
```

- [ ] **Step 3: Configure Astro**

Write `astro.config.mjs`:

```js
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

- [ ] **Step 4: Configure Tailwind with blueprint theme**

Write `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#080b12',
          surface: '#0d1017',
          border: '#1e2433',
          dashed: '#2a3348',
        },
        accent: {
          DEFAULT: '#6366f1',
          glow: '#818cf8',
          light: '#a5b4fc',
        },
        paper: {
          bg: '#fafaf9',
          text: '#1c1917',
          border: '#e7e5e4',
          surface: '#f5f5f0',
          muted: '#a8a29e',
        },
        success: '#4ade80',
      },
      fontFamily: {
        mono: ['SF Mono', 'Cascadia Code', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
```

- [ ] **Step 5: Write global CSS**

Write `src/styles/global.css`:

```css
@import 'tailwindcss';

@layer base {
  body {
    @apply bg-canvas-bg text-slate-200 antialiased;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
pnpm dev
```

Expected: Astro dev server starts on http://localhost:4321, blank page with dark background.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro 6 project with Tailwind, React, MDX integrations"
```

---

## Task 2: Blueprint Design System Primitives

**Files:**

- Create: `src/components/canvas/DotGrid.astro`
- Create: `src/components/canvas/Ruler.astro`
- Create: `src/components/canvas/CanvasComponent.astro`
- Create: `src/components/canvas/SelectionHandles.astro`
- Create: `src/components/canvas/ComponentTag.astro`
- Create: `src/components/canvas/FloatingPanel.astro`
- Create: `src/components/canvas/ConnectorLine.astro`

- [ ] **Step 1: Create DotGrid**

```astro
---
// src/components/canvas/DotGrid.astro
interface Props {
  intensity?: 'full' | 'subtle'
}
const { intensity = 'full' } = Astro.props
const opacity = intensity === 'full' ? '0.07' : '0.03'
---

<div
  class="fixed inset-0 pointer-events-none z-0"
  style={`background-image: radial-gradient(circle, rgba(99,102,241,${opacity}) 1px, transparent 1px); background-size: 24px 24px;`}
/>
```

- [ ] **Step 2: Create Ruler**

```astro
---
// src/components/canvas/Ruler.astro
interface Props {
  direction: 'horizontal' | 'vertical'
}
const { direction } = Astro.props
const ticks = direction === 'horizontal'
  ? [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
  : [0, 60, 120, 180, 240, 300, 360, 420, 480]
---

{direction === 'horizontal' ? (
  <div class="h-[22px] bg-canvas-surface border-b border-canvas-border flex items-end relative overflow-hidden">
    <div class="flex w-full px-[42px] relative h-full">
      {ticks.map((tick, i) => (
        <div class="absolute bottom-0 flex flex-col items-center" style={`left: ${(i / (ticks.length - 1)) * 100}%`}>
          {tick % 200 === 0 && <span class="text-[8px] text-slate-600 font-mono mb-[1px]">{tick}</span>}
          <div class={`w-px ${tick % 200 === 0 ? 'h-3 bg-slate-600' : 'h-2 bg-canvas-dashed'}`} />
        </div>
      ))}
    </div>
  </div>
) : (
  <div class="w-[22px] bg-canvas-surface border-r border-canvas-border relative flex-shrink-0">
    {ticks.map((tick, i) => (
      <div class="absolute right-0 flex items-center" style={`top: ${tick}px`}>
        {tick % 120 === 0 && (
          <span class="text-[8px] text-slate-600 font-mono -rotate-90 mr-[2px] whitespace-nowrap">{tick}</span>
        )}
        <div class={`h-px ${tick % 120 === 0 ? 'w-3 bg-slate-600' : 'w-2 bg-canvas-dashed'}`} />
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 3: Create CanvasComponent**

```astro
---
// src/components/canvas/CanvasComponent.astro
interface Props {
  selected?: boolean
  tag?: string
  class?: string
}
const { selected = false, tag, class: className = '' } = Astro.props
const borderClass = selected
  ? 'border-[1.5px] border-accent rounded-md'
  : 'border-[1.5px] border-dashed border-canvas-dashed rounded-md hover:border-slate-600'
---

<div class:list={['relative', borderClass, className]}>
  {tag && (
    <div class:list={[
      'absolute -top-[9px] left-3 text-[9px] font-semibold font-mono px-[7px] py-[2px] rounded-[3px] z-10',
      selected ? 'bg-accent text-white' : 'bg-canvas-surface text-slate-500'
    ]}>
      &lt;{tag}&gt;
    </div>
  )}
  <slot />
</div>
```

- [ ] **Step 4: Create SelectionHandles**

```astro
---
// src/components/canvas/SelectionHandles.astro
---

<Fragment>
  <div class="absolute -top-1 -left-1 w-2 h-2 bg-accent rounded-sm" />
  <div class="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-sm" />
  <div class="absolute -bottom-1 -left-1 w-2 h-2 bg-accent rounded-sm" />
  <div class="absolute -bottom-1 -right-1 w-2 h-2 bg-accent rounded-sm" />
  <div class="absolute -top-1 left-1/2 -ml-1 w-2 h-2 bg-accent rounded-sm" />
  <div class="absolute -bottom-1 left-1/2 -ml-1 w-2 h-2 bg-accent rounded-sm" />
  <div class="absolute top-1/2 -left-1 -mt-1 w-2 h-2 bg-accent rounded-sm" />
  <div class="absolute top-1/2 -right-1 -mt-1 w-2 h-2 bg-accent rounded-sm" />
</Fragment>
```

- [ ] **Step 5: Create ComponentTag**

```astro
---
// src/components/canvas/ComponentTag.astro
interface Props {
  name: string
  selected?: boolean
}
const { name, selected = false } = Astro.props
---

<div class:list={[
  'absolute -top-[9px] left-3 text-[9px] font-semibold font-mono px-[7px] py-[2px] rounded-[3px] z-10',
  selected ? 'bg-accent text-white' : 'bg-canvas-surface text-slate-500'
]}>
  &lt;{name}&gt;
</div>
```

- [ ] **Step 6: Create FloatingPanel**

```astro
---
// src/components/canvas/FloatingPanel.astro
interface Props {
  title: string
  position?: 'right' | 'left'
  class?: string
}
const { title, position = 'right', class: className = '' } = Astro.props
const posClass = position === 'right'
  ? 'fixed top-[70px] right-5'
  : 'fixed bottom-5 left-[42px]'
---

<div class:list={[
  posClass, 'w-[220px] bg-canvas-surface border border-canvas-border rounded-lg overflow-hidden z-50 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hidden xl:block',
  className
]}>
  <div class="px-3.5 py-2.5 bg-[#111825] border-b border-canvas-border text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
    {title}
  </div>
  <slot />
</div>
```

- [ ] **Step 7: Create ConnectorLine**

```astro
---
// src/components/canvas/ConnectorLine.astro
interface Props {
  label?: string
}
const { label } = Astro.props
---

<div class="flex flex-col items-center justify-center">
  <div class="w-full h-0.5 relative" style="background: linear-gradient(90deg, #1e2433 0%, #6366f1 40%, #6366f1 60%, #1e2433 100%);">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-accent rounded-full shadow-[0_0_12px_rgba(99,102,241,0.4)]" />
  </div>
  {label && (
    <span class="text-[9px] uppercase tracking-wider text-accent font-semibold mt-2">{label}</span>
  )}
</div>
```

- [ ] **Step 8: Verify all components import correctly**

Create a temporary test page `src/pages/test-canvas.astro`:

```astro
---
import DotGrid from '../components/canvas/DotGrid.astro'
import Ruler from '../components/canvas/Ruler.astro'
import CanvasComponent from '../components/canvas/CanvasComponent.astro'
import SelectionHandles from '../components/canvas/SelectionHandles.astro'
import FloatingPanel from '../components/canvas/FloatingPanel.astro'
import ConnectorLine from '../components/canvas/ConnectorLine.astro'
---

<html lang="en">
<head><title>Canvas Test</title></head>
<body class="bg-canvas-bg text-slate-200">
  <DotGrid />
  <Ruler direction="horizontal" />
  <div class="flex">
    <Ruler direction="vertical" />
    <div class="p-12">
      <CanvasComponent selected tag="TestComponent">
        <SelectionHandles />
        <div class="p-8">
          <h1 class="text-2xl font-bold">Blueprint Test</h1>
        </div>
      </CanvasComponent>
      <div class="mt-8 w-64">
        <ConnectorLine label="Engine" />
      </div>
    </div>
  </div>
  <FloatingPanel title="Properties" position="right">
    <div class="px-3.5 py-2 border-b border-canvas-border/50 flex justify-between">
      <span class="text-[10px] text-slate-500">Component</span>
      <span class="text-[10px] text-accent-light font-mono bg-canvas-surface px-1.5 rounded">Test</span>
    </div>
  </FloatingPanel>
</body>
</html>
```

Run `pnpm dev`, open http://localhost:4321/test-canvas. Verify: dot grid, rulers, selected component with handles, connector line, floating panel.

- [ ] **Step 9: Delete test page and commit**

```bash
rm src/pages/test-canvas.astro
git add -A
git commit -m "feat: add blueprint design system primitives (7 canvas components)"
```

---

## Task 3: Base Layout, Nav, Footer, SEO

**Files:**

- Create: `src/components/common/SEO.astro`
- Create: `src/components/common/Nav.astro`
- Create: `src/components/common/Footer.astro`
- Create: `src/layouts/BaseLayout.astro`
- Create: `public/favicon.svg`

- [ ] **Step 1: Create SEO component**

```astro
---
// src/components/common/SEO.astro
interface Props {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
}
const { title, description, image = '/images/og-default.png', type = 'website' } = Astro.props
const canonicalURL = new URL(Astro.url.pathname, Astro.site)
const fullTitle = title === 'NextReport' ? title : `${title} — NextReport`
---

<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content={new URL(image, Astro.site)} />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={new URL(image, Astro.site)} />
```

- [ ] **Step 2: Create Nav component**

```astro
---
// src/components/common/Nav.astro
const links = [
  { href: '/docs/getting-started/installation', label: 'Docs' },
  { href: '/playground', label: 'Playground' },
  { href: '/templates', label: 'Templates' },
  { href: '/blog', label: 'Blog' },
  { href: '/community', label: 'Community' },
]
const currentPath = Astro.url.pathname
---

<nav class="flex justify-between items-center px-5 h-12 bg-canvas-surface/90 backdrop-blur-xl border-b border-canvas-border sticky top-0 z-[100]">
  <div class="flex items-center gap-4">
    <a href="/" class="flex items-center gap-2">
      <div class="w-[26px] h-[26px] bg-gradient-to-br from-accent to-purple-500 rounded-[5px] flex items-center justify-center font-bold text-xs text-white">N</div>
      <span class="font-semibold text-sm text-slate-200">NextReport</span>
    </a>
    <div class="w-px h-6 bg-canvas-border" />
    <div class="flex">
      {links.map(({ href, label }) => (
        <a
          href={href}
          class:list={[
            'text-xs font-medium px-3 py-1.5 rounded-[5px] transition-colors',
            currentPath.startsWith(href) ? 'text-slate-200 bg-accent/10' : 'text-slate-500 hover:text-slate-200 hover:bg-accent/5'
          ]}
        >
          {label}
        </a>
      ))}
    </div>
  </div>
  <div class="flex items-center gap-2">
    <a
      href="https://github.com/nextreport/engine"
      target="_blank"
      rel="noopener"
      class="text-slate-400 text-xs px-3 py-1.5 rounded-[5px] border border-canvas-border hover:border-slate-600 hover:text-slate-200 transition-colors"
    >
      GitHub
    </a>
    <a href="/docs/getting-started/installation" class="bg-accent text-white text-xs font-medium px-3.5 py-1.5 rounded-[5px]">
      Get Started
    </a>
  </div>
</nav>
```

- [ ] **Step 3: Create Footer component**

```astro
---
// src/components/common/Footer.astro
---

<footer class="max-w-[900px] mx-auto px-12 py-8 border-t border-canvas-border flex justify-between items-center text-[11px] text-slate-600">
  <div>NextReport Engine — Open source, MIT licensed.</div>
  <div class="flex gap-4 font-mono">
    <a href="https://github.com/nextreport/engine" target="_blank" rel="noopener" class="hover:text-slate-400 transition-colors">GitHub</a>
    <a href="https://www.npmjs.com/package/@nextreport/engine" target="_blank" rel="noopener" class="hover:text-slate-400 transition-colors">npm</a>
    <a href="/docs/getting-started/installation" class="hover:text-slate-400 transition-colors">Docs</a>
  </div>
</footer>
```

- [ ] **Step 4: Create favicon**

Write `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="url(#g)"/>
  <text x="16" y="22" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="18" fill="white">N</text>
</svg>
```

- [ ] **Step 5: Create BaseLayout**

```astro
---
// src/layouts/BaseLayout.astro
import SEO from '../components/common/SEO.astro'
import Nav from '../components/common/Nav.astro'
import Footer from '../components/common/Footer.astro'
import DotGrid from '../components/canvas/DotGrid.astro'
import '../styles/global.css'

interface Props {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
  dotGridIntensity?: 'full' | 'subtle'
}
const { title, description, image, type, dotGridIntensity = 'subtle' } = Astro.props
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <SEO title={title} description={description} image={image} type={type} />
  </head>
  <body>
    <DotGrid intensity={dotGridIntensity} />
    <Nav />
    <main class="relative z-10">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 6: Update index.astro to use BaseLayout**

Write `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
---

<BaseLayout
  title="NextReport"
  description="Schema-driven reports for the modern web. Design visually. Render via API. Integrate anywhere."
  dotGridIntensity="full"
>
  <div class="flex items-center justify-center min-h-[60vh]">
    <p class="text-slate-500">Landing page — coming next</p>
  </div>
</BaseLayout>
```

- [ ] **Step 7: Verify dev server**

Run `pnpm dev`. Verify: dark background, dot grid, sticky nav with all links, footer, favicon.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add BaseLayout, Nav, Footer, SEO, favicon"
```

---

## Task 4: Landing Page — Hero Section

**Files:**

- Create: `src/components/landing/Hero.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create Hero component**

```astro
---
// src/components/landing/Hero.astro
import CanvasComponent from '../canvas/CanvasComponent.astro'
import SelectionHandles from '../canvas/SelectionHandles.astro'
import Ruler from '../canvas/Ruler.astro'
---

<Ruler direction="horizontal" />
<div class="flex">
  <Ruler direction="vertical" />
  <section class="flex-1 px-12 pt-20 pb-10">
    <div class="max-w-[900px] mx-auto">
      <CanvasComponent selected tag="Hero">
        <SelectionHandles />
        <div class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-accent-glow font-mono bg-canvas-bg px-1.5">
          w: 900 · h: auto
        </div>
        <div class="px-12 py-14 text-center">
          <div class="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-xs text-accent-light mb-6">
            <div class="w-1.5 h-1.5 bg-success rounded-full" />
            v0.1.0 — Open Source
          </div>
          <h1 class="text-[52px] font-extrabold leading-[1.1] tracking-tight mb-4 bg-gradient-to-b from-gray-100 to-slate-400 bg-clip-text text-transparent">
            Schema-driven reports<br />for the modern web.
          </h1>
          <p class="text-[17px] text-slate-500 leading-relaxed mb-8 max-w-[520px] mx-auto">
            Design visually. Render via API. Integrate anywhere.<br />
            Open source reporting engine — from JSON to beautiful documents.
          </p>
          <div class="flex gap-2.5 justify-center">
            <a href="/docs/getting-started/installation" class="bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
              Get Started
            </a>
            <a href="/playground" class="bg-accent/5 text-accent-light px-6 py-2.5 rounded-lg text-sm font-medium font-mono border border-accent/20 hover:border-accent/40 transition-colors">
              npm install @nextreport/engine
            </a>
          </div>
        </div>
      </CanvasComponent>
    </div>
  </section>
</div>
```

- [ ] **Step 2: Update index.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Hero from '../components/landing/Hero.astro'
---

<BaseLayout
  title="NextReport"
  description="Schema-driven reports for the modern web. Design visually. Render via API. Integrate anywhere."
  dotGridIntensity="full"
>
  <Hero />
</BaseLayout>
```

- [ ] **Step 3: Verify in browser**

Run `pnpm dev`. Verify: rulers (top + left), hero with selection handles, gradient heading, badge with green dot, two CTAs, dimension label.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add landing page Hero section with blueprint aesthetics"
```

---

## Task 5: Landing Page — Pipeline Demo + Features

**Files:**

- Create: `src/components/landing/PipelineDemo.astro`
- Create: `src/components/landing/Features.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create PipelineDemo component**

```astro
---
// src/components/landing/PipelineDemo.astro
import CanvasComponent from '../canvas/CanvasComponent.astro'
import ConnectorLine from '../canvas/ConnectorLine.astro'
---

<section class="px-12 py-12">
  <div class="max-w-[900px] mx-auto">
    <div class="flex items-center gap-3 text-[10px] uppercase tracking-[2px] text-slate-600 font-semibold mb-8">
      How it works
      <span class="flex-1 h-px bg-canvas-border" />
      <span class="text-[9px] text-canvas-dashed font-mono tracking-normal normal-case">// schema + data → rendered document</span>
    </div>

    <div class="grid grid-cols-[1fr_64px_1fr] items-stretch">
      <!-- Input: JSON schema -->
      <CanvasComponent tag="SchemaInput">
        <div class="p-6 font-mono bg-canvas-bg/60">
          <div class="flex justify-between items-center mb-4 pb-3 border-b border-canvas-border">
            <span class="text-[10px] uppercase tracking-[1.5px] text-slate-600 font-semibold font-sans">Input — JSON Schema</span>
            <span class="text-[10px] text-accent font-mono bg-[#141b27] px-2.5 py-0.5 rounded">report.json</span>
          </div>
          <div class="text-[12px] leading-[1.9] text-slate-500">
            <div><span class="text-canvas-dashed">{"{"}</span></div>
            <div>  <span class="text-accent-glow">"type"</span><span class="text-canvas-dashed">:</span> <span class="text-emerald-300">"report"</span><span class="text-canvas-dashed">,</span></div>
            <div>  <span class="text-accent-glow">"locale"</span><span class="text-canvas-dashed">:</span> <span class="text-emerald-300">"tr-TR"</span><span class="text-canvas-dashed">,</span></div>
            <div>  <span class="text-accent-glow">"bands"</span><span class="text-canvas-dashed">: [</span></div>
            <div>    <span class="text-canvas-dashed">{"{"}</span> <span class="text-accent-glow">"type"</span><span class="text-canvas-dashed">:</span> <span class="text-emerald-300">"header"</span> <span class="text-canvas-dashed">{"}"},</span></div>
            <div>    <span class="text-canvas-dashed">{"{"}</span> <span class="text-accent-glow">"type"</span><span class="text-canvas-dashed">:</span> <span class="text-emerald-300">"detail"</span><span class="text-canvas-dashed">,</span></div>
            <div>      <span class="text-accent-glow">"dataBinding"</span><span class="text-canvas-dashed">:</span> <span class="text-emerald-300">"items"</span> <span class="text-canvas-dashed">{"}"},</span></div>
            <div>    <span class="text-canvas-dashed">{"{"}</span> <span class="text-accent-glow">"type"</span><span class="text-canvas-dashed">:</span> <span class="text-emerald-300">"footer"</span> <span class="text-canvas-dashed">{"}"}</span></div>
            <div>  <span class="text-canvas-dashed">]</span></div>
            <div><span class="text-canvas-dashed">{"}"}</span></div>
          </div>
        </div>
      </CanvasComponent>

      <!-- Connector -->
      <ConnectorLine label="Engine" />

      <!-- Output: rendered invoice -->
      <div class="relative">
        <div class="absolute -top-[9px] left-3 bg-[#1e2a40] text-slate-500 text-[9px] font-semibold font-mono px-[7px] py-[2px] rounded-[3px] z-10">&lt;Output&gt;</div>
        <div class="bg-paper-bg rounded-md overflow-hidden text-paper-text shadow-[0_8px_40px_rgba(0,0,0,0.5)] h-full">
          <div class="px-4 py-2 bg-paper-surface border-b border-paper-border flex justify-between items-center text-[10px] text-paper-muted">
            <span>invoice-v1.html</span>
            <span>Page 1 / 1</span>
          </div>
          <div class="p-5">
            <div class="flex justify-between mb-3 pb-2.5 border-b-2 border-paper-text">
              <div>
                <div class="text-lg font-bold text-stone-900">Acme Corp</div>
                <div class="text-[10px] text-paper-muted">Technology Solutions</div>
              </div>
              <div class="text-[10px] text-stone-500 text-right leading-relaxed">
                <strong class="text-stone-600">Invoice #INV-001</strong><br />12.04.2026
              </div>
            </div>
            <table class="w-full text-[11px]">
              <thead>
                <tr class="text-[9px] uppercase tracking-wider text-paper-muted border-b border-paper-border">
                  <th class="text-left py-1.5 font-semibold">Item</th>
                  <th class="text-right py-1.5 font-semibold">Qty</th>
                  <th class="text-right py-1.5 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody class="text-stone-600">
                <tr class="border-b border-stone-100"><td class="py-[7px]">Laptop Pro 16"</td><td class="text-right">1</td><td class="text-right font-mono text-[10px]">₺45.000</td></tr>
                <tr class="border-b border-stone-100"><td class="py-[7px]">Wireless Mouse</td><td class="text-right">3</td><td class="text-right font-mono text-[10px]">₺2.250</td></tr>
                <tr class="border-b border-stone-100"><td class="py-[7px]">USB-C Hub</td><td class="text-right">2</td><td class="text-right font-mono text-[10px]">₺2.400</td></tr>
                <tr class="border-t-2 border-paper-text"><td class="py-2.5 font-bold text-stone-900" colspan="2">Total</td><td class="text-right font-bold text-stone-900 font-mono text-[10px]">₺49.650</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Create Features component**

```astro
---
// src/components/landing/Features.astro
const features = [
  { tag: 'designer', title: 'Visual Designer', description: 'Three-panel WYSIWYG editor. Drag & drop, live preview, undo/redo.', status: 'ready' },
  { tag: 'engine', title: 'Headless API', description: 'Stateless REST API. Send JSON, get HTML or PDF. Any language.', status: 'ready' },
  { tag: 'viewer', title: 'Runtime Viewer', description: 'React component. Pagination, zoom, print, PDF export built-in.', status: 'ready' },
  { tag: 'schema', title: 'JSON Schema DSL', description: 'Human-readable, version-controllable, AI/LLM-friendly report definitions.', status: 'zod v4' },
  { tag: 'expression', title: 'Expression Engine', description: 'formatCurrency, formatDate, sum, count, if — locale-aware functions.', status: '9 functions' },
  { tag: 'renderer', title: 'Pluggable Output', description: 'HTML + PDF built-in. Add CSV, Excel, DOCX without touching core.', status: 'html + pdf' },
]
---

<section class="px-12 py-12">
  <div class="max-w-[900px] mx-auto">
    <div class="flex items-center gap-3 text-[10px] uppercase tracking-[2px] text-slate-600 font-semibold mb-8">
      Components
      <span class="flex-1 h-px bg-canvas-border" />
      <span class="text-[9px] text-canvas-dashed font-mono tracking-normal normal-case">// hover to select</span>
    </div>

    <div class="grid grid-cols-3 gap-3.5">
      {features.map(({ tag, title, description, status }) => (
        <div class="group relative border-[1.5px] border-dashed border-canvas-dashed rounded-md p-5 bg-canvas-bg/40 hover:border-accent hover:border-solid hover:bg-accent/[0.02] transition-all cursor-default">
          <div class="absolute -top-[9px] left-3 text-[9px] font-semibold font-mono px-[7px] py-[2px] rounded-[3px] bg-[#141b27] text-slate-500 group-hover:bg-accent group-hover:text-white transition-colors">
            {tag}
          </div>
          <h3 class="text-[15px] font-semibold text-slate-200 mb-1.5">{title}</h3>
          <p class="text-xs text-slate-500 leading-relaxed">{description}</p>
          <div class="flex items-center gap-[5px] mt-2.5 text-[10px] text-success font-mono">
            <div class="w-[5px] h-[5px] bg-success rounded-full" />
            {status}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add to index.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Hero from '../components/landing/Hero.astro'
import PipelineDemo from '../components/landing/PipelineDemo.astro'
import Features from '../components/landing/Features.astro'
---

<BaseLayout
  title="NextReport"
  description="Schema-driven reports for the modern web. Design visually. Render via API. Integrate anywhere."
  dotGridIntensity="full"
>
  <Hero />
  <PipelineDemo />
  <Features />
</BaseLayout>
```

- [ ] **Step 4: Verify in browser**

Run `pnpm dev`. Verify: pipeline demo (dark JSON left → connector → light invoice right), features grid with hover effects and component tags.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add PipelineDemo and Features sections to landing page"
```

---

## Task 6: Landing Page — QuickStart, Multi-language API, Comparison, CTA

**Files:**

- Create: `src/components/landing/QuickStart.astro`
- Create: `src/components/landing/MultiLanguageAPI.astro`
- Create: `src/components/landing/Comparison.astro`
- Create: `src/components/landing/PlaygroundCTA.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create QuickStart**

```astro
---
// src/components/landing/QuickStart.astro
import CanvasComponent from '../canvas/CanvasComponent.astro'
---

<section class="px-12 py-12">
  <div class="max-w-[900px] mx-auto">
    <CanvasComponent tag="QuickStart">
      <div class="border-b border-canvas-border px-5 py-3 flex justify-between items-center">
        <div>
          <div class="text-sm font-semibold text-slate-200">5 lines to your first report</div>
          <div class="text-xs text-slate-500">Install, import, render. No configuration needed.</div>
        </div>
        <span class="text-[10px] text-accent font-mono bg-[#141b27] px-2.5 py-0.5 rounded">app.ts</span>
      </div>
      <div class="p-6 font-mono text-[13px] leading-[2] bg-canvas-bg/40">
        <div class="text-canvas-dashed italic">// npm install @nextreport/engine</div>
        <div><span class="text-accent-glow">import</span> <span class="text-canvas-dashed">{`{`}</span> renderReport<span class="text-canvas-dashed">,</span> renderToHtml <span class="text-canvas-dashed">{`}`}</span> <span class="text-accent-glow">from</span> <span class="text-emerald-300">'@nextreport/engine'</span></div>
        <div>&nbsp;</div>
        <div><span class="text-accent-glow">const</span> ir   <span class="text-canvas-dashed">=</span> renderReport<span class="text-canvas-dashed">(</span>schema<span class="text-canvas-dashed">,</span> data<span class="text-canvas-dashed">)</span>    <span class="text-canvas-dashed italic">// JSON → IR</span></div>
        <div><span class="text-accent-glow">const</span> html <span class="text-canvas-dashed">=</span> renderToHtml<span class="text-canvas-dashed">(</span>ir<span class="text-canvas-dashed">)</span>         <span class="text-canvas-dashed italic">// IR → HTML</span></div>
        <div><span class="text-accent-glow">const</span> pdf  <span class="text-canvas-dashed">=</span> <span class="text-accent-glow">await</span> renderToPdf<span class="text-canvas-dashed">(</span>html<span class="text-canvas-dashed">)</span> <span class="text-canvas-dashed italic">// HTML → PDF</span></div>
      </div>
    </CanvasComponent>
  </div>
</section>
```

- [ ] **Step 2: Create MultiLanguageAPI**

```astro
---
// src/components/landing/MultiLanguageAPI.astro
import CanvasComponent from '../canvas/CanvasComponent.astro'

const tabs = [
  { id: 'curl', label: 'curl' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'csharp', label: 'C#' },
]

const snippets: Record<string, string> = {
  curl: `curl -X POST http://localhost:3000/api/render \\
  -H 'Content-Type: application/json' \\
  -d '{
    "templateId": "invoice-v1",
    "data": { "companyName": "Acme Corp", "items": [...] },
    "format": "pdf"
  }'`,
  python: `import requests

response = requests.post("http://localhost:3000/api/render", json={
    "templateId": "invoice-v1",
    "data": {"companyName": "Acme Corp", "items": [...]},
    "format": "pdf"
})
pdf_bytes = response.content`,
  java: `HttpResponse response = client.send(
    HttpRequest.newBuilder()
        .uri(URI.create("http://localhost:3000/api/render"))
        .header("Content-Type", "application/json")
        .POST(BodyPublishers.ofString("""
            {"templateId": "invoice-v1",
             "data": {"companyName": "Acme Corp"},
             "format": "pdf"}"""))
        .build(),
    BodyHandlers.ofByteArray());
byte[] pdf = response.body();`,
  csharp: `var response = await client.PostAsJsonAsync("/api/render", new {
    templateId = "invoice-v1",
    data = new { companyName = "Acme Corp", items = new[] {...} },
    format = "pdf"
});
var pdf = await response.Content.ReadAsByteArrayAsync();`,
}
---

<section class="px-12 py-12">
  <div class="max-w-[900px] mx-auto">
    <div class="flex items-center gap-3 text-[10px] uppercase tracking-[2px] text-slate-600 font-semibold mb-8">
      Any language, one API
      <span class="flex-1 h-px bg-canvas-border" />
    </div>

    <CanvasComponent tag="API">
      <div class="border-b border-canvas-border px-5 py-2 flex gap-0">
        {tabs.map(({ id, label }, i) => (
          <button
            data-tab={id}
            class:list={[
              'api-tab px-3 py-1.5 text-xs font-medium rounded-[5px] transition-colors',
              i === 0 ? 'text-white bg-accent' : 'text-slate-500 hover:text-slate-300'
            ]}
          >
            {label}
          </button>
        ))}
      </div>
      <div class="p-6 font-mono text-xs leading-relaxed bg-canvas-bg/40">
        {Object.entries(snippets).map(([id, code], i) => (
          <pre
            data-content={id}
            class:list={['api-content whitespace-pre-wrap text-slate-400', i !== 0 && 'hidden']}
          >{code}</pre>
        ))}
      </div>
    </CanvasComponent>
  </div>
</section>

<script>
  document.querySelectorAll('.api-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const id = (tab as HTMLElement).dataset.tab!
      document.querySelectorAll('.api-tab').forEach(t => {
        t.classList.toggle('text-white', (t as HTMLElement).dataset.tab === id)
        t.classList.toggle('bg-accent', (t as HTMLElement).dataset.tab === id)
        t.classList.toggle('text-slate-500', (t as HTMLElement).dataset.tab !== id)
      })
      document.querySelectorAll('.api-content').forEach(c => {
        c.classList.toggle('hidden', (c as HTMLElement).dataset.content !== id)
      })
    })
  })
</script>
```

- [ ] **Step 3: Create Comparison**

```astro
---
// src/components/landing/Comparison.astro
const rows = [
  { feature: 'Open Source', values: ['Full', 'Partial', 'No', 'No', 'Partial', 'No'] },
  { feature: 'Web-Native', values: ['Yes', 'Java', 'Partial', 'Yes', 'Yes', 'Yes'] },
  { feature: 'Visual Designer', values: ['WYSIWYG', 'Desktop', 'Desktop+Web', 'Web', 'Code only', 'Web'] },
  { feature: 'API-First', values: ['Yes', 'No', 'No', 'Partial', 'Yes', 'Partial'] },
  { feature: 'AI/LLM-Ready', values: ['JSON DSL', 'XML', 'Proprietary', 'Proprietary', 'HTML tmpl', 'Proprietary'] },
  { feature: 'React-Native', values: ['Yes', 'None', 'None', 'Wrapper', 'None', 'Wrapper'] },
  { feature: 'Cost', values: ['Free', 'Free/Paid', 'Paid', 'Paid', '5 free', 'Paid'] },
]
const tools = ['NextReport', 'JasperReports', 'FastReport', 'Stimulsoft', 'jsreport', 'ActiveReportsJS']

function valueClass(val: string): string {
  if (['Full', 'Yes', 'WYSIWYG', 'JSON DSL', 'Free'].includes(val)) return 'text-green-600 font-semibold'
  if (['Partial', 'Free/Paid', 'Desktop+Web', 'Wrapper', '5 free', 'Desktop', 'Web'].includes(val)) return 'text-amber-600'
  return 'text-stone-400 text-[11px]'
}
---

<section class="px-12 py-12">
  <div class="max-w-[900px] mx-auto">
    <div class="flex items-center gap-3 text-[10px] uppercase tracking-[2px] text-slate-600 font-semibold mb-3">
      Comparison
      <span class="flex-1 h-px bg-canvas-border" />
      <span class="text-[9px] text-canvas-dashed font-mono tracking-normal normal-case">// rendered as document</span>
    </div>
    <p class="text-slate-500 text-sm mb-8">We respect every tool on this list — we've used many of them for years.</p>

    <div class="bg-paper-bg rounded-lg overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)] text-paper-text">
      <div class="px-5 py-3 bg-paper-surface border-b border-paper-border flex justify-between items-center">
        <span class="text-xs font-semibold text-stone-600">Feature Comparison Matrix</span>
        <span class="text-[10px] text-paper-muted font-mono">REF-2026-001</span>
      </div>
      <table class="w-full text-[12px] border-collapse">
        <thead>
          <tr>
            <th class="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-stone-500 border-b-2 border-paper-border font-semibold w-[18%]">Feature</th>
            {tools.map(tool => (
              <th class="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-stone-500 border-b-2 border-paper-border font-semibold">{tool}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ feature, values }, i) => (
            <tr class={i % 2 === 0 ? 'bg-accent/[0.03]' : ''}>
              <td class:list={['px-4 py-2.5 border-b border-stone-100', i % 2 === 0 && 'text-accent font-semibold']}>
                {feature}
              </td>
              {values.map(val => (
                <td class:list={['px-3 py-2.5 border-b border-stone-100', valueClass(val)]}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Create PlaygroundCTA**

```astro
---
// src/components/landing/PlaygroundCTA.astro
import CanvasComponent from '../canvas/CanvasComponent.astro'
---

<section class="px-12 py-16">
  <div class="max-w-[900px] mx-auto text-center">
    <CanvasComponent tag="CTA">
      <div class="px-12 py-12">
        <h2 class="text-3xl font-bold text-slate-200 mb-3">Try it in your browser</h2>
        <p class="text-slate-500 mb-8">Edit a JSON schema, see the rendered report instantly. No install required.</p>
        <a href="/playground" class="inline-flex bg-accent text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
          Open Playground
        </a>
      </div>
    </CanvasComponent>
  </div>
</section>
```

- [ ] **Step 5: Add Floating Panels to landing page and wire up all sections**

Update `src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Hero from '../components/landing/Hero.astro'
import PipelineDemo from '../components/landing/PipelineDemo.astro'
import Features from '../components/landing/Features.astro'
import QuickStart from '../components/landing/QuickStart.astro'
import MultiLanguageAPI from '../components/landing/MultiLanguageAPI.astro'
import Comparison from '../components/landing/Comparison.astro'
import PlaygroundCTA from '../components/landing/PlaygroundCTA.astro'
import FloatingPanel from '../components/canvas/FloatingPanel.astro'
---

<BaseLayout
  title="NextReport"
  description="Schema-driven reports for the modern web. Design visually. Render via API. Integrate anywhere."
  dotGridIntensity="full"
>
  <Hero />
  <PipelineDemo />
  <Features />
  <QuickStart />
  <MultiLanguageAPI />
  <Comparison />
  <PlaygroundCTA />

  <!-- Floating: Properties Panel -->
  <FloatingPanel title="Properties — Hero" position="right">
    <div class="px-3.5 py-2 border-b border-canvas-border/50 flex justify-between"><span class="text-[10px] text-slate-500">Component</span><span class="text-[10px] text-accent-light font-mono bg-[#141b27] px-1.5 rounded">&lt;Hero&gt;</span></div>
    <div class="px-3.5 py-2 border-b border-canvas-border/50 flex justify-between"><span class="text-[10px] text-slate-500">Width</span><span class="text-[10px] text-accent-light font-mono bg-[#141b27] px-1.5 rounded">900px</span></div>
    <div class="px-3.5 py-2 border-b border-canvas-border/50 flex justify-between"><span class="text-[10px] text-slate-500">Font Size</span><span class="text-[10px] text-accent-light font-mono bg-[#141b27] px-1.5 rounded">52px</span></div>
    <div class="px-3.5 py-2 border-b border-canvas-border/50 flex justify-between"><span class="text-[10px] text-slate-500">Font Weight</span><span class="text-[10px] text-accent-light font-mono bg-[#141b27] px-1.5 rounded">800</span></div>
    <div class="px-3.5 py-2 flex justify-between"><span class="text-[10px] text-slate-500">Color</span><span class="text-[10px] text-accent-light font-mono bg-[#141b27] px-1.5 rounded">#f1f5f9</span></div>
  </FloatingPanel>

  <!-- Floating: Layers Panel -->
  <FloatingPanel title="Layers" position="left">
    <div class="px-3.5 py-1.5 border-b border-canvas-border/50 flex items-center gap-2 text-[11px] text-slate-200 bg-accent/5"><span class="text-[10px] text-accent w-4 text-center">▸</span> Hero</div>
    <div class="px-3.5 py-1.5 border-b border-canvas-border/50 flex items-center gap-2 text-[11px] text-slate-400"><span class="text-[10px] text-slate-600 w-4 text-center">▸</span> Pipeline Demo</div>
    <div class="px-3.5 py-1.5 border-b border-canvas-border/50 flex items-center gap-2 text-[11px] text-slate-400"><span class="text-[10px] text-slate-600 w-4 text-center">▸</span> Features</div>
    <div class="px-3.5 py-1.5 border-b border-canvas-border/50 flex items-center gap-2 text-[11px] text-slate-400"><span class="text-[10px] text-slate-600 w-4 text-center">▸</span> Quick Start</div>
    <div class="px-3.5 py-1.5 border-b border-canvas-border/50 flex items-center gap-2 text-[11px] text-slate-400"><span class="text-[10px] text-slate-600 w-4 text-center">▸</span> API</div>
    <div class="px-3.5 py-1.5 border-b border-canvas-border/50 flex items-center gap-2 text-[11px] text-slate-400"><span class="text-[10px] text-slate-600 w-4 text-center">▸</span> Comparison</div>
    <div class="px-3.5 py-1.5 flex items-center gap-2 text-[11px] text-slate-400"><span class="text-[10px] text-slate-600 w-4 text-center">▸</span> Footer</div>
  </FloatingPanel>
</BaseLayout>
```

- [ ] **Step 6: Verify complete landing page**

Run `pnpm dev`. Scroll through all sections. Verify: QuickStart code block, API tabs switch between languages, comparison table on paper, CTA section, both floating panels visible on wide screens.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: complete landing page with QuickStart, API, Comparison, CTA sections"
```

---

## Task 7: Content Collections + Docs Infrastructure

**Files:**

- Create: `src/content.config.ts`
- Create: `src/layouts/DocsLayout.astro`
- Create: `src/pages/docs/[...slug].astro`
- Create: `src/content/docs/getting-started/installation.mdx` (first doc to test infrastructure)

- [ ] **Step 1: Create content config**

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const docs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.string(),
    order: z.number(),
  }),
})

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
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

- [ ] **Step 2: Create DocsLayout**

```astro
---
// src/layouts/DocsLayout.astro
import BaseLayout from './BaseLayout.astro'
import { getCollection } from 'astro:content'

interface Props {
  title: string
  description: string
  section: string
  headings: { depth: number; slug: string; text: string }[]
}
const { title, description, section, headings } = Astro.props

const allDocs = await getCollection('docs')

const sections: Record<string, { label: string; order: number }> = {
  'getting-started': { label: 'Getting Started', order: 1 },
  'schema': { label: 'Schema', order: 2 },
  'api': { label: 'API', order: 3 },
  'integration': { label: 'Integration', order: 4 },
  'advanced': { label: 'Advanced', order: 5 },
}

const grouped = Object.entries(sections)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key, { label }]) => ({
    key,
    label,
    docs: allDocs
      .filter(d => d.data.section === key)
      .sort((a, b) => a.data.order - b.data.order),
  }))

const currentSlug = Astro.url.pathname.replace(/^\/docs\//, '').replace(/\/$/, '')

const tocHeadings = headings.filter(h => h.depth <= 3)
---

<BaseLayout title={title} description={description} dotGridIntensity="subtle">
  <div class="max-w-[1200px] mx-auto flex gap-0 min-h-screen">
    <!-- Sidebar -->
    <aside class="w-[240px] flex-shrink-0 border-r border-canvas-border px-4 py-6 sticky top-12 h-[calc(100vh-48px)] overflow-y-auto">
      {grouped.map(({ key, label, docs }) => (
        <div class="mb-5">
          <div class="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 px-2">{label}</div>
          {docs.map(doc => (
            <a
              href={`/docs/${doc.id}`}
              class:list={[
                'block text-[13px] px-2 py-1 rounded transition-colors',
                currentSlug === doc.id
                  ? 'text-slate-200 bg-accent/10 font-medium'
                  : 'text-slate-500 hover:text-slate-300'
              ]}
            >
              {doc.data.title}
            </a>
          ))}
        </div>
      ))}
    </aside>

    <!-- Content -->
    <article class="flex-1 px-10 py-8 max-w-none min-w-0">
      <div class="mb-6">
        <div class="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">{sections[section]?.label}</div>
        <h1 class="text-3xl font-bold text-slate-100">{title}</h1>
        <p class="text-slate-500 mt-1">{description}</p>
      </div>
      <div class="prose prose-invert prose-slate max-w-none prose-headings:text-slate-200 prose-p:text-slate-400 prose-a:text-accent-light prose-code:text-accent-light prose-pre:bg-canvas-surface prose-pre:border prose-pre:border-canvas-border">
        <slot />
      </div>
    </article>

    <!-- TOC -->
    {tocHeadings.length > 0 && (
      <aside class="w-[200px] flex-shrink-0 hidden lg:block">
        <div class="sticky top-[70px] border border-canvas-border rounded-lg overflow-hidden bg-canvas-surface/80 mx-4 mt-6">
          <div class="px-3.5 py-2.5 bg-[#111825] border-b border-canvas-border text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            On this page
          </div>
          {tocHeadings.map(h => (
            <a
              href={`#${h.slug}`}
              class:list={[
                'block px-3.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors border-b border-canvas-border/30 last:border-0',
                h.depth === 3 && 'pl-6'
              ]}
            >
              {h.text}
            </a>
          ))}
        </div>
      </aside>
    )}
  </div>
</BaseLayout>
```

- [ ] **Step 3: Create docs page route**

```astro
---
// src/pages/docs/[...slug].astro
import { getCollection, render } from 'astro:content'
import DocsLayout from '../../layouts/DocsLayout.astro'

export async function getStaticPaths() {
  const docs = await getCollection('docs')
  return docs.map(doc => ({
    params: { slug: doc.id },
    props: { doc },
  }))
}

const { doc } = Astro.props
const { Content, headings } = await render(doc)
---

<DocsLayout
  title={doc.data.title}
  description={doc.data.description}
  section={doc.data.section}
  headings={headings}
>
  <Content />
</DocsLayout>
```

- [ ] **Step 4: Create first doc (installation) to test infrastructure**

````mdx
---
title: Installation
description: Install NextReport Engine and get started in minutes.
section: getting-started
order: 1
---

## Requirements

- Node.js >= 22
- npm, pnpm, or yarn

## Install

```bash
npm install @nextreport/engine
```
````

```bash
pnpm add @nextreport/engine
```

```bash
yarn add @nextreport/engine
```

## Verify

```typescript
import { renderReport, renderToHtml, validateReport } from '@nextreport/engine'

const schema = {
  type: 'report' as const,
  dataSource: { type: 'json' as const },
  bands: [],
}

const result = validateReport(schema)
console.log(result.valid) // true
```

If `validateReport` returns `{ valid: true }`, the installation is working correctly.

## Optional: PDF Support

For PDF generation, install Puppeteer separately:

```bash
npm install puppeteer
```

PDF rendering requires Chromium. Puppeteer downloads it automatically on install.

## Next Steps

- [Quick Start](/docs/getting-started/quick-start) — Create your first report in 5 minutes
- [Playground](/playground) — Try it in your browser without installing anything

````

- [ ] **Step 5: Verify docs infrastructure**

Run `pnpm dev`. Navigate to http://localhost:4321/docs/getting-started/installation. Verify: sidebar with "Getting Started" section, content renders with code highlighting, TOC panel on right.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add docs infrastructure (Content Collections, DocsLayout, sidebar, TOC)"
````

---

## Task 8: Docs Content (14 remaining MDX files)

**Files:**

- Create: 14 MDX files across `src/content/docs/` subdirectories

Each file follows the same frontmatter pattern. This task creates all remaining docs content based on the engine's README, PRODUCT_REQUIREMENTS.md, and source code documentation.

- [ ] **Step 1: Create getting-started docs (2 files)**

Write `src/content/docs/getting-started/quick-start.mdx` and `src/content/docs/getting-started/first-report.mdx`.

`quick-start.mdx` (order: 2): 5-minute walkthrough — import engine, define minimal schema, render to HTML. Include the invoice example from README.

`first-report.mdx` (order: 3): Step-by-step invoice creation with detailed explanation of bands, components, expressions, data binding.

- [ ] **Step 2: Create schema docs (5 files)**

Write all files in `src/content/docs/schema/`:

- `overview.mdx` (order: 1): Schema structure — version, type, locale, page config
- `bands.mdx` (order: 2): Band types (header, detail, footer), nesting, dataBinding, iteratorName
- `components.mdx` (order: 3): Text, Table components. Planned: Image, Barcode, Chart
- `expressions.mdx` (order: 4): Syntax `{{...}}`, all 9 functions table with examples, type coercion
- `data-binding.mdx` (order: 5): Detail band iteration, automatic iterator naming, custom iteratorName

Content source: `docs/01_PRODUCT_REQUIREMENTS.md` sections 8-9.

- [ ] **Step 3: Create API docs (4 files)**

Write all files in `src/content/docs/api/`:

- `render.mdx` (order: 1): POST /api/render — templateId mode, inline template mode, format options
- `validate.mdx` (order: 2): POST /api/validate — request/response examples
- `preview.mdx` (order: 3): POST /api/preview — first page only rendering
- `templates.mdx` (order: 4): GET /api/templates/:id — load template + sample data

Content source: README.md API Reference section.

- [ ] **Step 4: Create integration docs (3 files)**

Write all files in `src/content/docs/integration/`:

- `react-nextjs.mdx` (order: 1): ReportViewer component usage, Designer embedding
- `rest-api.mdx` (order: 2): Python, Java, C#, curl examples
- `docker.mdx` (order: 3): Dockerfile, docker-compose, deployment instructions

Content source: README.md Integration and Docker sections.

- [ ] **Step 5: Create advanced docs (3 files)**

Write all files in `src/content/docs/advanced/`:

- `custom-renderer.mdx` (order: 1): How to create a new renderer consuming IR
- `custom-function.mdx` (order: 2): registerFunction() API, example implementation
- `architecture.mdx` (order: 3): Pipeline internals, dependency graph, design principles

Content source: README.md Contributing section + PRODUCT_REQUIREMENTS.md sections 10-12.

- [ ] **Step 6: Install and configure Pagefind for docs search**

```bash
pnpm add @pagefind/default-ui
```

Pagefind indexes the built HTML at build time. Add a build script to `package.json`:

```json
{
  "scripts": {
    "postbuild": "npx pagefind --site dist"
  }
}
```

Add a search input to the docs sidebar in `DocsLayout.astro`, above the section list:

```html
<div id="search" class="mb-4"></div>
<script>
  import { PagefindUI } from '@pagefind/default-ui'
  new PagefindUI({ element: '#search', showSubResults: true })
</script>
```

- [ ] **Step 7: Verify all docs render**

Run `pnpm dev`. Navigate through every docs page via sidebar. Verify: all pages render, sidebar shows correct sections and order, links work.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add all docs content (15 MDX files across 5 sections)"
```

---

## Task 9: Blog Infrastructure + Content

**Files:**

- Create: `src/layouts/BlogLayout.astro`
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[...slug].astro`
- Create: `src/pages/rss.xml.ts`
- Create: `src/content/blog/introducing-nextreport.mdx`
- Create: `src/content/blog/why-json-schema.mdx`
- Create: `src/content/blog/v010-release.mdx`

- [ ] **Step 1: Create BlogLayout**

```astro
---
// src/layouts/BlogLayout.astro
import BaseLayout from './BaseLayout.astro'

interface Props {
  title: string
  description: string
  date: Date
  tags: string[]
}
const { title, description, date, tags } = Astro.props

const readingTime = Math.ceil(Astro.slots.has('default') ? 5 : 3)
const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
---

<BaseLayout title={title} description={description} type="article" dotGridIntensity="subtle">
  <article class="max-w-[700px] mx-auto px-6 py-12">
    <div class="mb-8">
      <div class="flex items-center gap-3 text-xs text-slate-500 mb-3">
        <time datetime={date.toISOString()}>{formattedDate}</time>
        <span>·</span>
        <span>{readingTime} min read</span>
      </div>
      <div class="relative">
        <div class="absolute -top-[9px] left-0 text-[9px] font-semibold font-mono px-[7px] py-[2px] rounded-[3px] bg-canvas-surface text-slate-500">
          &lt;Post&gt;
        </div>
        <h1 class="text-3xl font-bold text-slate-100 pt-2">{title}</h1>
      </div>
      <div class="flex gap-2 mt-3">
        {tags.map(tag => (
          <span class="text-[10px] text-accent-light bg-accent/10 px-2 py-0.5 rounded-full font-mono">{tag}</span>
        ))}
      </div>
    </div>
    <div class="prose prose-invert prose-slate max-w-none prose-headings:text-slate-200 prose-p:text-slate-400 prose-a:text-accent-light prose-code:text-accent-light prose-pre:bg-canvas-surface prose-pre:border prose-pre:border-canvas-border">
      <slot />
    </div>
    <div class="mt-12 pt-6 border-t border-canvas-border">
      <a href="/blog" class="text-sm text-accent-light hover:text-accent transition-colors">← Back to blog</a>
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 2: Create blog listing page**

```astro
---
// src/pages/blog/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro'
import { getCollection } from 'astro:content'

const posts = (await getCollection('blog'))
  .filter(p => !p.data.draft)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
---

<BaseLayout title="Blog" description="News, tutorials, and insights from the NextReport team." dotGridIntensity="subtle">
  <div class="max-w-[700px] mx-auto px-6 py-12">
    <h1 class="text-3xl font-bold text-slate-100 mb-8">Blog</h1>
    <div class="space-y-6">
      {posts.map(post => (
        <a href={`/blog/${post.id}`} class="block group border border-canvas-border rounded-lg p-5 hover:border-accent/40 transition-colors">
          <div class="flex items-center gap-3 text-xs text-slate-500 mb-2">
            <time datetime={post.data.date.toISOString()}>
              {post.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <div class="flex gap-1.5">
              {post.data.tags.map(tag => (
                <span class="text-[10px] text-accent-light bg-accent/10 px-1.5 py-0.5 rounded-full font-mono">{tag}</span>
              ))}
            </div>
          </div>
          <h2 class="text-lg font-semibold text-slate-200 group-hover:text-accent-light transition-colors">{post.data.title}</h2>
          <p class="text-sm text-slate-500 mt-1">{post.data.description}</p>
        </a>
      ))}
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Create blog post route**

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, render } from 'astro:content'
import BlogLayout from '../../layouts/BlogLayout.astro'

export async function getStaticPaths() {
  const posts = await getCollection('blog')
  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
  }))
}

const { post } = Astro.props
const { Content } = await render(post)
---

<BlogLayout title={post.data.title} description={post.data.description} date={post.data.date} tags={post.data.tags}>
  <Content />
</BlogLayout>
```

- [ ] **Step 4: Create RSS feed**

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())

  return rss({
    title: 'NextReport Blog',
    description: 'News, tutorials, and insights from the NextReport team.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}`,
    })),
  })
}
```

Install RSS dependency: `pnpm add @astrojs/rss`

- [ ] **Step 5: Create 3 initial blog posts**

Write `src/content/blog/introducing-nextreport.mdx`:

- Frontmatter: title "Introducing NextReport Engine", date 2026-04-12, tags: [announcement, open-source]
- Content: What it is, why it exists (from VISION.md origin story), what shipped in v0.1.0, what's next

Write `src/content/blog/why-json-schema.mdx`:

- Frontmatter: title "Why JSON Schema for Reports", date 2026-04-12, tags: [architecture, design-decisions]
- Content: Why JSON not XML, function syntax choice for AI compatibility, Zod validation, schema-as-contract principle

Write `src/content/blog/v010-release.mdx`:

- Frontmatter: title "v0.1.0 Release Notes", date 2026-04-12, tags: [release]
- Content: Stats (346 tests, 8 packages, 42.9KB), what shipped, known issues, what's next

- [ ] **Step 6: Verify blog**

Run `pnpm dev`. Verify: blog listing at /blog, each post renders, tags display, back link works, /rss.xml returns valid XML.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add blog infrastructure (listing, layout, RSS) and 3 initial posts"
```

---

## Task 10: Interactive Playground

**Files:**

- Create: `src/data/templates.ts`
- Create: `src/components/playground/Playground.tsx`
- Create: `src/components/playground/SchemaEditor.tsx`
- Create: `src/components/playground/ReportPreview.tsx`
- Create: `src/components/playground/TemplateSelector.tsx`
- Create: `src/pages/playground.astro`

- [ ] **Step 1: Install playground dependencies**

```bash
pnpm add @nextreport/engine @monaco-editor/react monaco-editor
```

- [ ] **Step 2: Create template data**

```ts
// src/data/templates.ts
export interface TemplateDefinition {
  id: string
  name: string
  description: string
  schema: Record<string, unknown>
  sampleData: Record<string, unknown>
}

export const templates: TemplateDefinition[] = [
  {
    id: 'invoice-v1',
    name: 'Invoice',
    description: 'Professional invoice with line items and totals.',
    schema: {
      type: 'report',
      locale: 'tr-TR',
      page: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 15, bottom: 20, left: 15 },
      },
      dataSource: { type: 'json' },
      bands: [
        {
          type: 'header',
          height: 80,
          components: [
            {
              type: 'text',
              position: { x: 0, y: 10, width: 300, height: 30 },
              content: '{{companyName}}',
              fontSize: 24,
              fontWeight: 'bold',
            },
            {
              type: 'text',
              position: { x: 400, y: 10, width: 135, height: 20 },
              content: 'Invoice #{{invoiceNumber}}',
              fontSize: 12,
            },
            {
              type: 'text',
              position: { x: 400, y: 30, width: 135, height: 20 },
              content: '{{formatDate(invoiceDate, "DD.MM.YYYY")}}',
              fontSize: 11,
            },
          ],
        },
        {
          type: 'detail',
          height: 25,
          dataBinding: 'items',
          components: [
            {
              type: 'text',
              position: { x: 0, y: 0, width: 250, height: 25 },
              content: '{{item.name}}',
            },
            {
              type: 'text',
              position: { x: 260, y: 0, width: 60, height: 25 },
              content: '{{item.quantity}}',
            },
            {
              type: 'text',
              position: { x: 330, y: 0, width: 100, height: 25 },
              content: '{{formatCurrency(item.unitPrice, "TRY")}}',
            },
            {
              type: 'text',
              position: { x: 440, y: 0, width: 100, height: 25 },
              content: '{{formatCurrency(item.total, "TRY")}}',
              fontWeight: 'bold',
            },
          ],
        },
        {
          type: 'footer',
          height: 40,
          components: [
            {
              type: 'text',
              position: { x: 400, y: 5, width: 135, height: 30 },
              content: 'Total: {{formatCurrency(sum(items, "total"), "TRY")}}',
              fontWeight: 'bold',
              fontSize: 14,
            },
          ],
        },
      ],
    },
    sampleData: {
      companyName: 'Acme Corp',
      invoiceNumber: 'INV-001',
      invoiceDate: '2026-04-12',
      items: [
        { name: 'Laptop Pro 16"', quantity: 1, unitPrice: 45000, total: 45000 },
        { name: 'Wireless Mouse', quantity: 3, unitPrice: 750, total: 2250 },
        { name: 'USB-C Hub', quantity: 2, unitPrice: 1200, total: 2400 },
      ],
    },
  },
  {
    id: 'simple-list-v1',
    name: 'Simple List',
    description: 'Basic list with header and detail rows.',
    schema: {
      type: 'report',
      locale: 'en-US',
      dataSource: { type: 'json' },
      bands: [
        {
          type: 'header',
          height: 50,
          components: [
            {
              type: 'text',
              position: { x: 0, y: 10, width: 400, height: 30 },
              content: '{{title}}',
              fontSize: 20,
              fontWeight: 'bold',
            },
          ],
        },
        {
          type: 'detail',
          height: 25,
          dataBinding: 'items',
          components: [
            {
              type: 'text',
              position: { x: 0, y: 0, width: 300, height: 25 },
              content: '{{item.name}}',
            },
            {
              type: 'text',
              position: { x: 350, y: 0, width: 100, height: 25 },
              content: '{{item.value}}',
            },
          ],
        },
      ],
    },
    sampleData: {
      title: 'Product Catalog',
      items: [
        { name: 'Widget Alpha', value: '$29.99' },
        { name: 'Widget Beta', value: '$49.99' },
        { name: 'Widget Gamma', value: '$19.99' },
      ],
    },
  },
]
```

- [ ] **Step 3: Create SchemaEditor**

```tsx
// src/components/playground/SchemaEditor.tsx
import Editor from '@monaco-editor/react'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SchemaEditor({ value, onChange }: Props) {
  return (
    <Editor
      height="100%"
      language="json"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        padding: { top: 16 },
      }}
    />
  )
}
```

- [ ] **Step 4: Create ReportPreview**

```tsx
// src/components/playground/ReportPreview.tsx
import { useEffect, useRef } from 'react'

interface Props {
  html: string
  error: string | null
}

export default function ReportPreview({ html, error }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }
  }, [html])

  if (error) {
    return (
      <div className="p-6 text-sm">
        <div className="text-red-400 font-semibold mb-2">Validation Error</div>
        <pre className="text-red-300/70 text-xs whitespace-pre-wrap font-mono">{error}</pre>
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0 bg-white rounded-b-md"
      title="Report Preview"
      sandbox="allow-same-origin"
    />
  )
}
```

- [ ] **Step 5: Create TemplateSelector**

```tsx
// src/components/playground/TemplateSelector.tsx
import { templates } from '../../data/templates'

interface Props {
  selectedId: string
  onSelect: (id: string) => void
  onReset: () => void
  onCopy: () => void
}

export default function TemplateSelector({ selectedId, onSelect, onReset, onCopy }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#0d1017] border-b border-[#1e2433]">
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="bg-[#141b27] text-slate-300 text-xs px-3 py-1.5 rounded border border-[#1e2433] outline-none focus:border-[#6366f1]"
      >
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        onClick={onReset}
        className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 transition-colors"
      >
        Reset
      </button>
      <button
        onClick={onCopy}
        className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 transition-colors"
      >
        Copy Schema
      </button>
      <div className="flex-1" />
      <a
        href="https://github.com/nextreport/engine"
        target="_blank"
        rel="noopener"
        className="text-xs text-[#a5b4fc] hover:text-[#6366f1] transition-colors"
      >
        Open in GitHub →
      </a>
    </div>
  )
}
```

- [ ] **Step 6: Create Playground orchestrator**

```tsx
// src/components/playground/Playground.tsx
import { useState, useCallback, useRef, useEffect } from 'react'
import SchemaEditor from './SchemaEditor'
import ReportPreview from './ReportPreview'
import TemplateSelector from './TemplateSelector'
import { templates } from '../../data/templates'
import { renderReport, renderToHtml, validateReport } from '@nextreport/engine'

export default function Playground() {
  const [templateId, setTemplateId] = useState(templates[0].id)
  const template = templates.find((t) => t.id === templateId) ?? templates[0]
  const [schemaText, setSchemaText] = useState(JSON.stringify(template.schema, null, 2))
  const [html, setHtml] = useState('')
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const doRender = useCallback((text: string, data: Record<string, unknown>) => {
    try {
      const schema = JSON.parse(text)
      const validation = validateReport(schema)
      if (!validation.valid) {
        setError(
          validation.errors
            .map((e: { path: string; message: string }) => `${e.path}: ${e.message}`)
            .join('\n'),
        )
        setHtml('')
        return
      }
      const ir = renderReport(schema, data)
      const output = renderToHtml(ir)
      setHtml(output)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
      setHtml('')
    }
  }, [])

  const handleSchemaChange = useCallback(
    (value: string) => {
      setSchemaText(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => doRender(value, template.sampleData), 300)
    },
    [doRender, template.sampleData],
  )

  const handleTemplateSelect = useCallback(
    (id: string) => {
      const t = templates.find((t) => t.id === id) ?? templates[0]
      setTemplateId(id)
      const text = JSON.stringify(t.schema, null, 2)
      setSchemaText(text)
      doRender(text, t.sampleData)
    },
    [doRender],
  )

  const handleReset = useCallback(() => {
    const text = JSON.stringify(template.schema, null, 2)
    setSchemaText(text)
    doRender(text, template.sampleData)
  }, [template, doRender])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(schemaText)
  }, [schemaText])

  useEffect(() => {
    doRender(schemaText, template.sampleData)
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <TemplateSelector
        selectedId={templateId}
        onSelect={handleTemplateSelect}
        onReset={handleReset}
        onCopy={handleCopy}
      />
      <div className="flex flex-1 min-h-0">
        <div className="w-[45%] border-r border-[#1e2433]">
          <SchemaEditor value={schemaText} onChange={handleSchemaChange} />
        </div>
        <div className="w-[55%] bg-[#0a0e16]">
          <ReportPreview html={html} error={error} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create playground page**

```astro
---
// src/pages/playground.astro
import BaseLayout from '../layouts/BaseLayout.astro'
import Ruler from '../components/canvas/Ruler.astro'
import Playground from '../components/playground/Playground'
---

<BaseLayout title="Playground" description="Edit a JSON schema and see the rendered report instantly. No install required." dotGridIntensity="full">
  <Ruler direction="horizontal" />
  <Playground client:load />
</BaseLayout>
```

- [ ] **Step 8: Verify playground**

Run `pnpm dev`. Navigate to /playground. Verify: Monaco editor loads with invoice schema, right panel shows rendered invoice, template selector switches between Invoice and Simple List, editing schema triggers re-render after 300ms, invalid JSON shows error.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add interactive playground with Monaco editor and live engine render"
```

---

## Task 11: Templates Gallery

**Files:**

- Create: `src/pages/templates.astro`

- [ ] **Step 1: Create templates page**

```astro
---
// src/pages/templates.astro
import BaseLayout from '../layouts/BaseLayout.astro'
import { templates } from '../data/templates'
---

<BaseLayout title="Templates" description="Browse report templates. Open in playground to customize." dotGridIntensity="subtle">
  <div class="max-w-[900px] mx-auto px-12 py-12">
    <h1 class="text-3xl font-bold text-slate-100 mb-2">Templates</h1>
    <p class="text-slate-500 mb-8">Start with a template, customize in the playground.</p>

    <div class="grid grid-cols-2 gap-4">
      {templates.map(t => (
        <a
          href={`/playground?template=${t.id}`}
          class="group relative border-[1.5px] border-dashed border-canvas-dashed rounded-md overflow-hidden hover:border-accent hover:border-solid transition-all"
        >
          <div class="absolute -top-[9px] left-3 text-[9px] font-semibold font-mono px-[7px] py-[2px] rounded-[3px] bg-[#141b27] text-slate-500 group-hover:bg-accent group-hover:text-white transition-colors z-10">
            {t.id}
          </div>
          <div class="bg-paper-bg p-4 h-32 flex items-center justify-center">
            <div class="text-paper-muted text-sm italic">Preview</div>
          </div>
          <div class="p-4 bg-canvas-bg/60">
            <h3 class="text-sm font-semibold text-slate-200">{t.name}</h3>
            <p class="text-xs text-slate-500 mt-1">{t.description}</p>
          </div>
        </a>
      ))}
    </div>

    <div class="mt-12 text-center">
      <p class="text-slate-500 text-sm mb-3">Have a template to share?</p>
      <a href="https://github.com/nextreport/engine/pulls" target="_blank" rel="noopener" class="text-sm text-accent-light hover:text-accent transition-colors">
        Submit a Template via GitHub PR →
      </a>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Verify templates page**

Run `pnpm dev`. Navigate to /templates. Verify: 2 template cards with hover effects, clicking opens playground, submit link works.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add templates gallery page"
```

---

## Task 12: Community + About Pages

**Files:**

- Create: `src/pages/community.astro`
- Create: `src/pages/about.astro`

- [ ] **Step 1: Create Community page**

```astro
---
// src/pages/community.astro
import BaseLayout from '../layouts/BaseLayout.astro'

const contributions = [
  {
    title: 'Component Plugins',
    difficulty: 'Beginner',
    description: 'Implement ComponentCoreDefinition to add Image, Barcode, Chart, Shape, or Divider components.',
    code: `interface ComponentCoreDefinition {
  type: string
  displayName: string
  schema: ZodSchema
  defaultProperties: Record<string, unknown>
  htmlRenderer: (element: ResolvedElement) => string
}`,
  },
  {
    title: 'Expression Functions',
    difficulty: 'Beginner',
    description: 'Register new built-in functions: avg, min, max, join, substring, replace, round, abs, now.',
    code: `registerFunction('avg', (args) => {
  const arr = args[0] as unknown[]
  const field = String(args[1])
  const values = arr.map(item =>
    Number((item as Record<string, unknown>)[field]))
  return values.reduce((a, b) => a + b, 0) / values.length
})`,
  },
  {
    title: 'Renderers',
    difficulty: 'Intermediate',
    description: 'Create new output formats (CSV, Excel, DOCX, Markdown) that consume the IR.',
    code: `import type { RenderResult } from '@nextreport/engine-core'

export function renderToCSV(result: RenderResult): string {
  // Transform IR pages/elements into CSV format
}`,
  },
  {
    title: 'Templates',
    difficulty: 'Beginner',
    description: 'Create .json template + .data.json sample data. Ideas: receipt, shipping label, certificate.',
    code: null,
  },
]

const phases = [
  { version: 'v0.2', title: 'Plugin System + Advanced Layout', status: 'next' },
  { version: 'v0.3', title: 'PDF Optimization + Template Versioning', status: 'planned' },
  { version: 'v1.0', title: 'Auth + Collaboration + Standalone Engine', status: 'planned' },
  { version: 'v2.0', title: 'AI Integration + MCP Server', status: 'planned' },
]
---

<BaseLayout title="Community" description="Contribute to NextReport Engine. Join the community." dotGridIntensity="subtle">
  <div class="max-w-[900px] mx-auto px-12 py-12">
    <h1 class="text-3xl font-bold text-slate-100 mb-2">Community</h1>
    <p class="text-slate-500 mb-10">NextReport is built by its community. Here's how to get involved.</p>

    <!-- Contributing -->
    <div class="mb-12">
      <div class="flex items-center gap-3 text-[10px] uppercase tracking-[2px] text-slate-600 font-semibold mb-6">
        <span class="text-[9px] font-mono bg-canvas-surface text-slate-500 px-[7px] py-[2px] rounded-[3px]">&lt;Contributing&gt;</span>
        <span class="flex-1 h-px bg-canvas-border" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        {contributions.map(c => (
          <div class="border border-canvas-border rounded-lg overflow-hidden">
            <div class="px-4 py-3 bg-canvas-surface/50 border-b border-canvas-border flex justify-between items-center">
              <span class="text-sm font-semibold text-slate-200">{c.title}</span>
              <span class="text-[10px] text-success font-mono">{c.difficulty}</span>
            </div>
            <div class="px-4 py-3">
              <p class="text-xs text-slate-500 mb-3">{c.description}</p>
              {c.code && (
                <pre class="text-[11px] font-mono text-slate-400 bg-canvas-bg/60 p-3 rounded overflow-x-auto">{c.code}</pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>

    <!-- Roadmap -->
    <div class="mb-12">
      <div class="flex items-center gap-3 text-[10px] uppercase tracking-[2px] text-slate-600 font-semibold mb-6">
        <span class="text-[9px] font-mono bg-canvas-surface text-slate-500 px-[7px] py-[2px] rounded-[3px]">&lt;Roadmap&gt;</span>
        <span class="flex-1 h-px bg-canvas-border" />
      </div>

      <div class="space-y-3">
        {phases.map(p => (
          <div class="flex items-center gap-4 px-4 py-3 border border-canvas-border rounded-lg">
            <span class="text-xs font-mono text-accent font-semibold w-12">{p.version}</span>
            <span class="text-sm text-slate-300 flex-1">{p.title}</span>
            <span class:list={['text-[10px] font-mono', p.status === 'next' ? 'text-success' : 'text-slate-500']}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>

    <!-- Links -->
    <div class="flex gap-4">
      <a href="https://github.com/nextreport/engine/issues" target="_blank" rel="noopener" class="flex-1 text-center px-4 py-3 border border-canvas-border rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:border-accent/40 transition-colors">Issues</a>
      <a href="https://github.com/nextreport/engine/discussions" target="_blank" rel="noopener" class="flex-1 text-center px-4 py-3 border border-canvas-border rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:border-accent/40 transition-colors">Discussions</a>
      <a href="https://github.com/nextreport/engine/pulls" target="_blank" rel="noopener" class="flex-1 text-center px-4 py-3 border border-canvas-border rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:border-accent/40 transition-colors">Pull Requests</a>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Create About page**

```astro
---
// src/pages/about.astro
import BaseLayout from '../layouts/BaseLayout.astro'
---

<BaseLayout title="About" description="The story behind NextReport Engine — why it exists and where it's going." dotGridIntensity="subtle">
  <div class="max-w-[700px] mx-auto px-6 py-12">
    <h1 class="text-3xl font-bold text-slate-100 mb-8">About NextReport</h1>

    <div class="prose prose-invert prose-slate max-w-none prose-headings:text-slate-200 prose-p:text-slate-400 prose-a:text-accent-light prose-strong:text-slate-300">

      <h2>Origin Story</h2>
      <p>This project was born from firsthand pain. Years of working with JasperReports in Java ecosystems — wrestling with JRXML schemas, fighting desktop-only designers, and watching business users struggle with tools built for a different era.</p>
      <p>JasperReports is open source and powerful, but the UX hasn't evolved. FastReport offered the desktop experience we wished Jasper had — intuitive drag & drop, instant preview — but it's closed source and locked to the .NET ecosystem.</p>
      <p>The question was simple: <strong>Why doesn't a modern, web-native reporting engine exist as open source?</strong></p>

      <h2>The Five-System Problem</h2>
      <p>A reporting engine is actually five products working together:</p>
      <ol>
        <li><strong>Layout engine</strong> — Pagination, positioning, page breaks</li>
        <li><strong>Visual designer</strong> — Drag & drop, property editing, real-time preview</li>
        <li><strong>Expression engine</strong> — Data binding, formatting functions, conditionals</li>
        <li><strong>Data binding layer</strong> — Connecting external data to report templates</li>
        <li><strong>Multi-format renderer</strong> — HTML, PDF, Excel, print</li>
      </ol>
      <p>Most projects tackle one or two and call it a reporting tool. They fail because users need all five working together coherently.</p>

      <h2>Our Approach</h2>
      <p>Build all five as one coherent system, but with strict boundaries so they can evolve independently. The JSON schema is the contract — each subsystem only knows the schema, not each other.</p>
      <p>This means the same report can be created by a business user in the designer, by a developer in code, or by an AI agent — and they all produce identical output.</p>

      <h2>What's Hard (Honest Assessment)</h2>
      <p>The layout engine is the hardest part of any reporting tool. Pagination, orphan/widow control, keep-together, multi-column layouts — genuinely difficult problems.</p>
      <p>PDF fidelity — matching HTML pixel-for-pixel in PDF — is a known hard problem. Puppeteer helps but is heavy.</p>
      <p>And adoption takes time. Open-source developer tools typically need 6-18 months to build meaningful community.</p>

      <h2>What Determines Success</h2>
      <p>It's not the code — it's adoption. Great first experience (< 5 minutes to first report), excellent documentation, active community, visible progress, and real-world templates.</p>

    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Verify both pages**

Run `pnpm dev`. Navigate to /community and /about. Verify: content renders, links work, styling is consistent.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Community and About pages"
```

---

## Task 13: GitHub Pages Deploy + SEO Polish

**Files:**

- Create: `.github/workflows/deploy.yml`
- Create: `public/images/.gitkeep`

- [ ] **Step 1: Copy screenshots from engine repo**

```bash
cp /home/cevheri/projects/nextreport/engine/docs/assets/designer-screenshot.png public/images/
cp /home/cevheri/projects/nextreport/engine/screenshots/10-home-final.png public/images/
cp /home/cevheri/projects/nextreport/engine/screenshots/16-designer-live-preview.png public/images/
cp /home/cevheri/projects/nextreport/engine/screenshots/06-viewer.png public/images/
```

- [ ] **Step 2: Create GitHub Actions deploy workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Add .nojekyll for GitHub Pages**

```bash
touch public/.nojekyll
```

- [ ] **Step 4: Verify build succeeds**

```bash
pnpm build
```

Expected: Build completes without errors, `dist/` directory contains all HTML pages.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add GitHub Pages deploy workflow and production assets"
```

---

## Task 14: Final Verification

- [ ] **Step 1: Run production build**

```bash
pnpm build && pnpm preview
```

- [ ] **Step 2: Verify all pages**

Open http://localhost:4321 and navigate:

- `/` — Landing page: all 8 sections render, floating panels visible on desktop, API tabs work
- `/playground` — Monaco editor loads, template selector works, live render updates
- `/templates` — Gallery cards link to playground
- `/docs/getting-started/installation` — Sidebar, content, TOC all render
- `/blog` — Post listing, individual posts, tags
- `/community` — Contributing, roadmap, links
- `/about` — Full content renders
- `/rss.xml` — Valid XML

- [ ] **Step 3: Check build output size**

```bash
du -sh dist/
```

Expected: Under 5MB (excluding images). Zero JS on non-playground pages.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: final polish and verification"
```

- [ ] **Step 5: Push to GitHub**

```bash
git push origin main
```
