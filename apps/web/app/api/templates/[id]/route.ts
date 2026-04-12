import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getTemplate, updateTemplate, deleteTemplate } from '../../../../lib/template-store'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const stored = await getTemplate(id)
    return NextResponse.json({ template: stored.template, sampleData: stored.sampleData })
  } catch {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    // Verify template exists first
    await getTemplate(id)

    const body = (await request.json()) as {
      name?: string
      description?: string
      template?: Record<string, unknown>
      sampleData?: Record<string, unknown>
    }

    const updated = await updateTemplate(id, body)
    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('ENOENT') || message.includes('no such file')) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    await deleteTemplate(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }
}
