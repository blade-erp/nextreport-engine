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

  // First pass: paginate content bands. Pages that begin a page-numbering
  // section (a band with sectionStart, e.g. a statement's customer header)
  // are recorded so section-relative page variables can be resolved below.
  const rawPages: ResolvedElement[][] = []
  const sectionStartPages = new Set<number>()
  let currentY = 0
  let currentPageElements: ResolvedElement[] = []

  for (const band of contentBands) {
    if (band.pageBreakBefore && currentPageElements.length > 0) {
      rawPages.push(currentPageElements)
      currentPageElements = []
      currentY = 0
    }

    if (band.sectionStart) {
      sectionStartPages.add(rawPages.length)
    }

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

  // Section-relative numbering: page 0 implicitly starts section 1; every
  // recorded section start begins a new count.
  const sectionPageNumbers: number[] = []
  const sectionTotals: number[] = []
  {
    let sectionStart = 0
    for (let index = 0; index < totalPages; index++) {
      if (index > 0 && sectionStartPages.has(index)) {
        sectionStart = index
      }
      sectionPageNumbers[index] = index - sectionStart + 1
    }
    let sectionEnd = totalPages
    for (let index = totalPages - 1; index >= 0; index--) {
      sectionTotals[index] = sectionEnd - (index - sectionPageNumbers[index] + 1)
      if (sectionPageNumbers[index] === 1) {
        sectionEnd = index
      }
    }
  }

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
          properties: resolvePageVariables(
            element.properties,
            pageNumber,
            totalPages,
            sectionPageNumbers[index],
            sectionTotals[index],
          ),
        })
      }
      headerY += band.height
    }

    // Content elements
    allElements.push(
      ...elements.map((el) => ({
        ...el,
        properties: resolvePageVariables(
          el.properties,
          pageNumber,
          totalPages,
          sectionPageNumbers[index],
          sectionTotals[index],
        ),
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
          properties: resolvePageVariables(
            element.properties,
            pageNumber,
            totalPages,
            sectionPageNumbers[index],
            sectionTotals[index],
          ),
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
  sectionPageNumber: number,
  sectionTotalPages: number,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string') {
      resolved[key] = value
        .replace(/\{\{pageNumber\}\}/g, String(pageNumber))
        .replace(/\{\{totalPages\}\}/g, String(totalPages))
        .replace(/\{\{sectionPageNumber\}\}/g, String(sectionPageNumber))
        .replace(/\{\{sectionTotalPages\}\}/g, String(sectionTotalPages))
    } else {
      resolved[key] = value
    }
  }

  return resolved
}
