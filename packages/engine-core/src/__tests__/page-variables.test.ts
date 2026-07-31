import { describe, it, expect } from 'vitest'
import { renderReport } from '../pipeline/render-pipeline.js'
import type { Report } from '@nextreport/schema'

const text = (content: string) => ({
  type: 'text' as const,
  position: { x: 0, y: 0, width: 200, height: 20 },
  content,
  fontSize: 10,
  fontWeight: 'normal' as const,
  color: '#000000',
  textAlign: 'left' as const,
})

describe('page variables survive band processing', () => {
  it('resolves {{pageNumber}}/{{totalPages}} in page bands, mixed with data expressions', () => {
    const report: Report = {
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
          height: 20,
          components: [text('{{companyName}} — Page {{pageNumber}} of {{totalPages}}')],
        },
        {
          type: 'detail',
          height: 500,
          dataBinding: 'items',
          components: [text('{{item.name}}')],
        },
      ],
    }

    const data = {
      companyName: 'Acme Corp',
      items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
    }

    const result = renderReport(report, data)

    expect(result.metadata.totalPages).toBeGreaterThan(1)

    for (const page of result.pages) {
      const footer = page.elements.find((element) => element.bandType === 'page-footer')
      expect(footer?.properties.content).toBe(
        `Acme Corp — Page ${page.number} of ${result.metadata.totalPages}`,
      )
    }
  })
})
