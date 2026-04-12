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

  let pageWidth = dims.width
  let pageHeight = dims.height

  if (pageConfig.orientation === 'landscape') {
    pageWidth = dims.height
    pageHeight = dims.width
  }

  // Suppress unused variable lint — pageWidth used in future features
  void pageWidth

  const { top: marginTop, bottom: marginBottom, left: marginLeft } = pageConfig.margins

  // Separate page-header/footer from content bands
  const pageHeaderBands = bands.filter((b) => b.bandType === 'page-header')
  const pageFooterBands = bands.filter((b) => b.bandType === 'page-footer')
  const contentBands = bands.filter(
    (b) => b.bandType !== 'page-header' && b.bandType !== 'page-footer',
  )

  const pageHeaderHeight = pageHeaderBands.reduce((sum, b) => sum + b.height, 0)
  const pageFooterHeight = pageFooterBands.reduce((sum, b) => sum + b.height, 0)

  const usableHeight = pageHeight - marginTop - marginBottom - pageHeaderHeight - pageFooterHeight

  // First pass: paginate content bands
  const rawPages: ResolvedElement[][] = []
  let currentY = 0
  let currentPageElements: ResolvedElement[] = []

  for (const band of contentBands) {
    if (currentY + band.height > usableHeight && currentPageElements.length > 0) {
      rawPages.push(currentPageElements)
      currentPageElements = []
      currentY = 0
    }

    const contentStartY = marginTop + pageHeaderHeight

    for (const element of band.elements) {
      currentPageElements.push({
        ...element,
        position: {
          ...element.position,
          x: marginLeft + element.position.x,
          y: contentStartY + currentY + element.position.y,
        },
      })
    }

    currentY += band.height
  }

  if (currentPageElements.length > 0) {
    rawPages.push(currentPageElements)
  }

  // Ensure at least one page (for page headers/footers even with no content)
  if (rawPages.length === 0 && (pageHeaderBands.length > 0 || pageFooterBands.length > 0)) {
    rawPages.push([])
  }

  const totalPages = rawPages.length

  // Second pass: inject page-header/footer elements into each page with page variables
  const pages: Page[] = rawPages.map((elements, index) => {
    const pageNumber = index + 1
    const allElements: ResolvedElement[] = []

    // Page header at top of page
    let headerY = marginTop
    for (const band of pageHeaderBands) {
      for (const element of band.elements) {
        allElements.push({
          ...element,
          position: {
            ...element.position,
            x: marginLeft + element.position.x,
            y: headerY + element.position.y,
          },
          properties: resolvePageVariables(element.properties, pageNumber, totalPages),
        })
      }
      headerY += band.height
    }

    // Content elements
    allElements.push(
      ...elements.map((el) => ({
        ...el,
        properties: resolvePageVariables(el.properties, pageNumber, totalPages),
      })),
    )

    // Page footer at bottom of page
    let footerY = pageHeight - marginBottom - pageFooterHeight
    for (const band of pageFooterBands) {
      for (const element of band.elements) {
        allElements.push({
          ...element,
          position: {
            ...element.position,
            x: marginLeft + element.position.x,
            y: footerY + element.position.y,
          },
          properties: resolvePageVariables(element.properties, pageNumber, totalPages),
        })
      }
      footerY += band.height
    }

    return { number: pageNumber, elements: allElements }
  })

  return pages
}

function resolvePageVariables(
  properties: Record<string, unknown>,
  pageNumber: number,
  totalPages: number,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string') {
      resolved[key] = value
        .replace(/\{\{pageNumber\}\}/g, String(pageNumber))
        .replace(/\{\{totalPages\}\}/g, String(totalPages))
    } else {
      resolved[key] = value
    }
  }

  return resolved
}
