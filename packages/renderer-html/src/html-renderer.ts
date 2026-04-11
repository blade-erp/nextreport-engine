import type { RenderResult } from '@nextreport/engine-core'
import { renderElement } from './component-renderers/index.js'

export interface HtmlRenderOptions {
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
}

interface PageDimensions {
  width: number
  height: number
}

const PAGE_SIZES: Record<string, PageDimensions> = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
}

function getPageDimensions(options: HtmlRenderOptions): PageDimensions {
  const size = PAGE_SIZES[options.pageSize ?? 'A4'] ?? PAGE_SIZES['A4']
  if (options.orientation === 'landscape') {
    return { width: size.height, height: size.width }
  }
  return size
}

export function renderToHtml(result: RenderResult, options: HtmlRenderOptions = {}): string {
  const dimensions = getPageDimensions(options)

  const pagesHtml = result.pages
    .map((page) => {
      const elementsHtml = page.elements.map(renderElement).join('\n    ')
      const pageStyle = [
        'position:relative',
        `width:${dimensions.width}pt`,
        `height:${dimensions.height}pt`,
        'page-break-after:always',
        'overflow:hidden',
        'margin:0 auto',
      ].join(';')
      return `  <div class="page" style="${pageStyle}">\n    ${elementsHtml}\n  </div>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f0f0f0;
    }
    .page {
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      margin: 20px auto;
    }
    @media print {
      body { background: none; }
      .page { box-shadow: none; margin: 0; }
    }
  </style>
</head>
<body>
${pagesHtml}
</body>
</html>`
}
