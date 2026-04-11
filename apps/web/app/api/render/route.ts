import { type NextRequest, NextResponse } from 'next/server'
import { renderReport } from '@nextreport/engine-core'
import { renderToHtml } from '@nextreport/renderer-html'
import { renderToPdf } from '@nextreport/renderer-pdf'
import { loadTemplate, loadSampleData } from '@/lib/template-loader'
import { resolveData } from '@/lib/data-resolvers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      templateId?: string
      template?: Record<string, unknown>
      data?: Record<string, unknown>
      dataSourceUrl?: string
      format?: 'html' | 'pdf'
    }

    const { templateId, template, data, dataSourceUrl, format = 'html' } = body

    let schema: Record<string, unknown>
    if (templateId) {
      schema = await loadTemplate(templateId)
    } else if (template) {
      schema = template
    } else {
      return NextResponse.json({ success: false, error: 'Either templateId or template is required' }, { status: 400 })
    }

    const sampleData = templateId ? await loadSampleData(templateId).catch(() => ({})) : {}
    const resolvedData = await resolveData(data, dataSourceUrl)
    const mergedData = Object.keys(resolvedData).length > 0 ? resolvedData : sampleData

    const result = renderReport(schema as never, mergedData)

    if (format === 'pdf') {
      const html = renderToHtml(result)
      const pdfBytes = await renderToPdf(html)
      return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="report.pdf"',
        },
      })
    }

    const output = renderToHtml(result)
    return NextResponse.json({ success: true, output, metadata: result.metadata })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
