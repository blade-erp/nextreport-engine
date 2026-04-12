import { type NextRequest, NextResponse } from 'next/server'
import { renderReport } from '@nextreport/engine-core'
import type { RenderResult } from '@nextreport/engine-core'
import { renderToHtml } from '@nextreport/renderer-html'
import { loadTemplate, loadSampleData } from '@/lib/template-loader'
import { resolveData } from '@/lib/data-resolvers'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      templateId?: string
      template?: Record<string, unknown>
      data?: Record<string, unknown>
      dataSourceUrl?: string
    }

    const { templateId, template, data, dataSourceUrl } = body

    let schema: Record<string, unknown>
    if (templateId) {
      schema = await loadTemplate(templateId)
    } else if (template) {
      schema = template
    } else {
      return NextResponse.json(
        { success: false, error: 'Either templateId or template is required' },
        { status: 400 },
      )
    }

    const sampleData = templateId ? await loadSampleData(templateId).catch(() => ({})) : {}
    const resolvedData = await resolveData(data, dataSourceUrl)
    const mergedData = Object.keys(resolvedData).length > 0 ? resolvedData : sampleData

    const result = renderReport(schema as never, mergedData)

    const firstPageResult: RenderResult = {
      pages: result.pages.slice(0, 1),
      metadata: { ...result.metadata, totalPages: 1 },
    }

    const output = renderToHtml(firstPageResult)
    return NextResponse.json({ success: true, output, metadata: firstPageResult.metadata })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
