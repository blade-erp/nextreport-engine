import { describe, it, expect } from 'vitest'
import { calculateLayout } from '../layout/layout-calculator.js'
import type { ProcessedBand } from '../band-processor/band-processor.js'
import type { Page as PageConfig } from '@nextreport/schema'

// A4 portrait, margins top:20 right:15 bottom:20 left:15
const pageConfig: PageConfig = {
  size: 'A4',
  orientation: 'portrait',
  margins: { top: 20, right: 15, bottom: 20, left: 15 },
}

function makeband(bandType: string, height: number, elementY = 0, elementX = 0): ProcessedBand {
  return {
    bandType,
    height,
    elements: [
      {
        type: 'text',
        position: { x: elementX, y: elementY, width: 100, height: 20 },
        properties: { content: 'test' },
        bandType,
      },
    ],
  }
}

describe('calculateLayout', () => {
  it('calculates absolute Y positions correctly', () => {
    // header height=80, element y=10 → absolute y = marginTop(20) + currentY(0) + element.y(10) = 30
    // detail height=20, element y=0 → absolute y = marginTop(20) + currentY(80) + element.y(0) = 100
    const bands: ProcessedBand[] = [makeband('header', 80, 10), makeband('detail', 20, 0)]

    const pages = calculateLayout(bands, pageConfig)

    expect(pages).toHaveLength(1)
    expect(pages[0].elements[0].position.y).toBe(30) // 20 + 0 + 10
    expect(pages[0].elements[1].position.y).toBe(100) // 20 + 80 + 0
  })

  it('applies left margin to element x positions', () => {
    // element x=10 → absolute x = marginLeft(15) + element.x(10) = 25
    const bands: ProcessedBand[] = [makeband('header', 80, 0, 10)]

    const pages = calculateLayout(bands, pageConfig)

    expect(pages[0].elements[0].position.x).toBe(25) // 15 + 10
  })

  it('triggers a page break when content exceeds usable height', () => {
    // A4 portrait: height=842, margins top=20 bottom=20, usableHeight=802
    // 40 bands × height 25 = 1000pt total → needs 2 pages
    // bands per page: floor(802/25) = 32 bands fit in first page (32*25=800 ≤ 802), 33rd would be 825 > 802
    const bands: ProcessedBand[] = Array.from({ length: 40 }, () => makeband('detail', 25, 0))

    const pages = calculateLayout(bands, pageConfig)

    expect(pages).toHaveLength(2)
    expect(pages[0].elements).toHaveLength(32)
    expect(pages[1].elements).toHaveLength(8)
  })

  it('assigns correct page numbers', () => {
    const bands: ProcessedBand[] = Array.from({ length: 40 }, () => makeband('detail', 25, 0))

    const pages = calculateLayout(bands, pageConfig)

    expect(pages[0].number).toBe(1)
    expect(pages[1].number).toBe(2)
  })

  it('inserts page-header at the top of every page', () => {
    // A4: usable = 842 - 20 - 20 - 40 (page-header) = 762
    // 35 detail bands × 25 = 875 → floor(762/25) = 30 per page, 5 on page 2
    const pageHeader: ProcessedBand = {
      bandType: 'page-header',
      height: 40,
      elements: [
        {
          type: 'text',
          position: { x: 0, y: 5, width: 200, height: 20 },
          properties: { content: 'Company Name' },
          bandType: 'page-header',
        },
      ],
    }

    const detailBands = Array.from({ length: 35 }, () => makeband('detail', 25, 0))
    const bands = [pageHeader, ...detailBands]

    const pages = calculateLayout(bands, pageConfig)

    expect(pages).toHaveLength(2)

    // Page 1: first element should be from page-header
    const firstEl = pages[0].elements[0]
    expect(firstEl.bandType).toBe('page-header')
    expect(firstEl.position.y).toBe(25) // marginTop(20) + element.y(5)

    // Page 2: also starts with page-header
    const page2FirstEl = pages[1].elements[0]
    expect(page2FirstEl.bandType).toBe('page-header')
    expect(page2FirstEl.position.y).toBe(25)
  })

  it('inserts page-footer at the bottom of every page', () => {
    const pageFooter: ProcessedBand = {
      bandType: 'page-footer',
      height: 30,
      elements: [
        {
          type: 'text',
          position: { x: 0, y: 5, width: 200, height: 20 },
          properties: { content: 'Page {{pageNumber}} of {{totalPages}}' },
          bandType: 'page-footer',
        },
      ],
    }

    // A4: usable = 842 - 20 - 20 - 30 (footer) = 772
    // 35 × 25 = 875 → floor(772/25) = 30 per page, 5 on page 2
    const detailBands = Array.from({ length: 35 }, () => makeband('detail', 25, 0))
    const bands = [...detailBands, pageFooter]

    const pages = calculateLayout(bands, pageConfig)

    expect(pages).toHaveLength(2)

    // Page 1: last element should be from page-footer
    const page1Elements = pages[0].elements
    const lastEl = page1Elements[page1Elements.length - 1]
    expect(lastEl.bandType).toBe('page-footer')
    // Footer Y = pageHeight(842) - marginBottom(20) - footerHeight(30) + element.y(5) = 797
    expect(lastEl.position.y).toBe(797)
    expect(lastEl.properties.content).toBe('Page 1 of 2')

    // Page 2: also has footer
    const page2Elements = pages[1].elements
    const page2LastEl = page2Elements[page2Elements.length - 1]
    expect(page2LastEl.bandType).toBe('page-footer')
    expect(page2LastEl.properties.content).toBe('Page 2 of 2')
  })

  it('resolves {{pageNumber}} and {{totalPages}} in content bands too', () => {
    const bands: ProcessedBand[] = [
      {
        bandType: 'detail',
        height: 25,
        elements: [
          {
            type: 'text',
            position: { x: 0, y: 0, width: 100, height: 20 },
            properties: { content: 'Page {{pageNumber}}' },
            bandType: 'detail',
          },
        ],
      },
    ]

    const pages = calculateLayout(bands, pageConfig)
    expect(pages[0].elements[0].properties.content).toBe('Page 1')
  })

  it('reserves space for both page-header and page-footer', () => {
    const pageHeader: ProcessedBand = {
      bandType: 'page-header',
      height: 40,
      elements: [
        {
          type: 'text',
          position: { x: 0, y: 0, width: 200, height: 20 },
          properties: { content: 'Header' },
          bandType: 'page-header',
        },
      ],
    }
    const pageFooter: ProcessedBand = {
      bandType: 'page-footer',
      height: 30,
      elements: [
        {
          type: 'text',
          position: { x: 0, y: 0, width: 200, height: 20 },
          properties: { content: 'Footer' },
          bandType: 'page-footer',
        },
      ],
    }

    // A4: usable = 842 - 20 - 20 - 40 - 30 = 732
    // 30 × 25 = 750 → floor(732/25) = 29 per page, 1 on page 2
    const detailBands = Array.from({ length: 30 }, () => makeband('detail', 25, 0))
    const bands = [pageHeader, ...detailBands, pageFooter]

    const pages = calculateLayout(bands, pageConfig)

    expect(pages).toHaveLength(2)
    // Both pages should have header and footer
    expect(pages[0].elements[0].bandType).toBe('page-header')
    expect(pages[0].elements[pages[0].elements.length - 1].bandType).toBe('page-footer')
    expect(pages[1].elements[0].bandType).toBe('page-header')
    expect(pages[1].elements[pages[1].elements.length - 1].bandType).toBe('page-footer')
  })
})
