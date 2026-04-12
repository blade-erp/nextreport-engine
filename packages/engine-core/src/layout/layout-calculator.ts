import type { Page as PageConfig } from '@nextreport/schema'
import type { ProcessedBand } from '../band-processor/band-processor.js'
import type { Page, ResolvedElement } from '../types.js'

// Page dimensions in points (width × height)
const PAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
}

export function calculateLayout(bands: ProcessedBand[], pageConfig: PageConfig): Page[] {
  const dims = PAGE_DIMENSIONS[pageConfig.size]
  if (!dims) throw new Error(`Unknown page size: ${pageConfig.size}`)

  let _pageWidth = dims.width
  let pageHeight = dims.height

  // Swap dimensions for landscape orientation
  if (pageConfig.orientation === 'landscape') {
    _pageWidth = dims.height
    pageHeight = dims.width
  }

  const { top: marginTop, bottom: marginBottom, left: marginLeft } = pageConfig.margins

  const usableHeight = pageHeight - marginTop - marginBottom

  const pages: Page[] = []
  let currentY = 0
  let currentPageElements: ResolvedElement[] = []
  let pageNumber = 1

  for (const band of bands) {
    // Check if we need a page break
    if (currentY + band.height > usableHeight && currentPageElements.length > 0) {
      pages.push({ number: pageNumber, elements: currentPageElements })
      pageNumber++
      currentPageElements = []
      currentY = 0
    }

    // Place each element in absolute coordinates
    for (const element of band.elements) {
      currentPageElements.push({
        ...element,
        position: {
          ...element.position,
          x: marginLeft + element.position.x,
          y: marginTop + currentY + element.position.y,
        },
      })
    }

    currentY += band.height
  }

  // Flush remaining elements
  if (currentPageElements.length > 0) {
    pages.push({ number: pageNumber, elements: currentPageElements })
  }

  return pages
}
