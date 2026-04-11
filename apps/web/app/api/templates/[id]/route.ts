import { NextRequest, NextResponse } from 'next/server'
import { loadTemplate, loadSampleData } from '../../../../lib/template-loader'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const template = await loadTemplate(id)
    const sampleData = await loadSampleData(id).catch(() => ({}))
    return NextResponse.json({ template, sampleData })
  } catch {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }
}
