import { type NextRequest, NextResponse } from 'next/server'
import { validateReport } from '@nextreport/engine-core'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { template: Record<string, unknown> }

    const { template } = body
    if (!template) {
      return NextResponse.json({ success: false, error: 'template is required' }, { status: 400 })
    }

    const result = validateReport(template as never)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
