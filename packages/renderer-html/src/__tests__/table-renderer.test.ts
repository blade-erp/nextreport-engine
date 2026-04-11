import { describe, it, expect } from 'vitest'
import { renderTable } from '../component-renderers/table-renderer.js'
import type { ResolvedElement } from '@nextreport/engine-core'

function makeTableElement(
  columns: Array<{ header: string; field: string; width?: number }> = [],
  positionOverrides: Partial<{ x: number; y: number; width: number; height: number }> = {},
): ResolvedElement {
  return {
    type: 'table',
    bandType: 'detail',
    position: { x: 10, y: 50, width: 500, height: 100, ...positionOverrides },
    properties: {
      columns,
    },
  }
}

describe('renderTable', () => {
  it('renders a table element', () => {
    const el = makeTableElement([{ header: 'Name', field: 'name' }])
    const html = renderTable(el)
    expect(html).toContain('<table')
    expect(html).toContain('</table>')
  })

  it('renders thead with column headers', () => {
    const el = makeTableElement([
      { header: 'Name', field: 'name' },
      { header: 'Price', field: 'price' },
    ])
    const html = renderTable(el)
    expect(html).toContain('<thead>')
    expect(html).toContain('<tr>')
    expect(html).toContain('<th')
    expect(html).toContain('Name')
    expect(html).toContain('Price')
  })

  it('renders one th per column', () => {
    const el = makeTableElement([
      { header: 'Col1', field: 'col1' },
      { header: 'Col2', field: 'col2' },
      { header: 'Col3', field: 'col3' },
    ])
    const html = renderTable(el)
    const thCount = (html.match(/<th[\s>]/g) ?? []).length
    expect(thCount).toBe(3)
  })

  it('applies column width style when provided', () => {
    const el = makeTableElement([{ header: 'Name', field: 'name', width: 120 }])
    const html = renderTable(el)
    expect(html).toContain('width:120pt')
  })

  it('applies absolute position styles', () => {
    const el = makeTableElement([{ header: 'Name', field: 'name' }])
    const html = renderTable(el)
    expect(html).toContain('position:absolute')
    expect(html).toContain('left:10pt')
    expect(html).toContain('top:50pt')
    expect(html).toContain('width:500pt')
    expect(html).toContain('height:100pt')
  })

  it('handles empty columns array', () => {
    const el = makeTableElement([])
    const html = renderTable(el)
    expect(html).toContain('<table')
    expect(html).toContain('<thead>')
  })

  it('escapes HTML entities in column headers', () => {
    const el = makeTableElement([{ header: 'Name & Code', field: 'nameCode' }])
    const html = renderTable(el)
    expect(html).toContain('Name &amp; Code')
  })
})
