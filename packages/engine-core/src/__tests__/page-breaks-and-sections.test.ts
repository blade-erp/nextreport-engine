import { describe, it, expect } from 'vitest'
import { renderReport } from '../pipeline/render-pipeline.js'
import { evaluateExpression } from '../expression/evaluator.js'
import type { Report } from '@nextreport/schema'

const text = (content: string) => ({
  type: 'text' as const,
  position: { x: 0, y: 0, width: 300, height: 14 },
  content,
  fontSize: 10,
  fontWeight: 'normal' as const,
  color: '#000000',
  textAlign: 'left' as const,
})

function statementReport(): Report {
  return {
    version: '1.0',
    type: 'report',
    locale: 'en-US',
    page: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
    },
    dataSource: { type: 'json' },
    bands: [
      {
        type: 'page-footer',
        height: 16,
        components: [
          text(
            'Page {{sectionPageNumber}} of {{sectionTotalPages}} — sheet {{pageNumber}}/{{totalPages}}',
          ),
        ],
      },
      {
        type: 'group-header',
        height: 30,
        dataBinding: 'invoices',
        groupBy: 'customer',
        resetPageNumber: true,
        components: [text('Statement for {{_groupKey}}')],
      },
      {
        type: 'detail',
        height: 100,
        dataBinding: 'invoices',
        components: [text('{{invoice.number}}')],
      },
      {
        type: 'group-footer',
        height: 20,
        components: [text("Balance: {{sum(_groupItems, 'amount')}}")],
      },
    ],
  }
}

describe('group page breaks and section numbering', () => {
  // 100pt detail rows, ~772pt usable: Acme's 9 rows need 2 pages, Blade's 3 fit on 1.
  const data = {
    invoices: [
      ...Array.from({ length: 9 }, (_, i) => ({
        customer: 'Acme',
        number: `A-${i}`,
        amount: '10.50',
      })),
      ...Array.from({ length: 3 }, (_, i) => ({ customer: 'Blade', number: `B-${i}`, amount: 5 })),
    ],
  }

  it('starts each group after the first on a fresh page', () => {
    const result = renderReport(statementReport(), data)

    // Acme spills across pages; Blade must begin on its own page regardless.
    const bladeHeaderPage = result.pages.find((page) =>
      page.elements.some((el) => el.properties.content === 'Statement for Blade'),
    )
    expect(bladeHeaderPage).toBeDefined()
    const bladeElements = bladeHeaderPage!.elements.filter((el) => el.bandType !== 'page-footer')
    expect(
      bladeElements.every(
        (el) =>
          String(el.properties.content).includes('Blade') ||
          String(el.properties.content).startsWith('B-') ||
          String(el.properties.content).startsWith('Balance'),
      ),
    ).toBe(true)
  })

  it('numbers pages within each section and keeps global numbering available', () => {
    const result = renderReport(statementReport(), data)
    const footers = result.pages.map(
      (page) => page.elements.find((el) => el.bandType === 'page-footer')!.properties.content,
    )

    // 3 pages total: Acme pages 1-2 of 2, Blade page 1 of 1.
    expect(footers).toEqual([
      'Page 1 of 2 — sheet 1/3',
      'Page 2 of 2 — sheet 2/3',
      'Page 1 of 1 — sheet 3/3',
    ])
  })

  it('sums string amounts in the statement footer', () => {
    const result = renderReport(statementReport(), data)
    const balances = result.pages
      .flatMap((page) => page.elements)
      .filter((el) => String(el.properties.content).startsWith('Balance:'))
      .map((el) => el.properties.content)

    expect(balances).toEqual(['Balance: 94.5', 'Balance: 15'])
  })
})

describe('ratio and avg aggregates', () => {
  const rows = [
    { onTime: 1, lines: 1, daysLate: 0 },
    { onTime: 0, lines: 1, daysLate: '6' },
    { onTime: 1, lines: 1, daysLate: 0 },
    { onTime: 0, lines: 1, daysLate: 2 },
  ]

  it('ratio() is ratio-of-sums', () => {
    expect(evaluateExpression("{{ratio(rows, 'onTime', 'lines')}}", { rows }, 'en-US')).toBe(0.5)
  })

  it('formatPercent renders a fraction as a percentage', () => {
    expect(
      evaluateExpression("{{formatPercent(ratio(rows, 'onTime', 'lines'), 1)}}", { rows }, 'en-US'),
    ).toBe('50.0%')
  })

  it('avg() coerces numeric strings', () => {
    expect(evaluateExpression("{{avg(rows, 'daysLate')}}", { rows }, 'en-US')).toBe(2)
  })

  it('ratio() guards division by zero', () => {
    expect(evaluateExpression("{{ratio(rows, 'onTime', 'missing')}}", { rows }, 'en-US')).toBe(0)
  })
})
