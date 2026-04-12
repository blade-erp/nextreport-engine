import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { listTemplates, createTemplate } from '../../../lib/template-store'

export async function GET() {
  try {
    const templates = await listTemplates()
    return NextResponse.json({ templates })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string
      description?: string
      template?: Record<string, unknown>
      sampleData?: Record<string, unknown>
    }

    if (!body.name || !body.template) {
      return NextResponse.json({ error: 'name and template are required' }, { status: 400 })
    }

    const stored = await createTemplate({
      name: body.name,
      description: body.description,
      template: body.template,
      sampleData: body.sampleData,
    })

    return NextResponse.json(stored, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
