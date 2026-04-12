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
})
