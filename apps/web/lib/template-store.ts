import { readFile, writeFile, readdir, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const TEMPLATES_DIR = join(process.cwd(), 'templates')

export interface TemplateMeta {
  id: string
  name: string
  description: string
  version: string
  createdAt: string
  updatedAt: string
}

export interface StoredTemplate {
  meta: TemplateMeta
  template: Record<string, unknown>
  sampleData: Record<string, unknown>
}

export interface CreateTemplateInput {
  name: string
  description?: string
  template: Record<string, unknown>
  sampleData?: Record<string, unknown>
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
  template?: Record<string, unknown>
  sampleData?: Record<string, unknown>
}

function templatePath(id: string): string {
  return join(TEMPLATES_DIR, `${id}.template.json`)
}

function isStoredTemplate(data: unknown): data is StoredTemplate {
  return typeof data === 'object' && data !== null && 'meta' in data && 'template' in data
}

async function ensureDir(): Promise<void> {
  await mkdir(TEMPLATES_DIR, { recursive: true })
}

export async function createTemplate(input: CreateTemplateInput): Promise<StoredTemplate> {
  await ensureDir()
  const id = randomUUID()
  const now = new Date().toISOString()

  const stored: StoredTemplate = {
    meta: {
      id,
      name: input.name,
      description: input.description ?? '',
      version: '1.0',
      createdAt: now,
      updatedAt: now,
    },
    template: input.template,
    sampleData: input.sampleData ?? {},
  }

  await writeFile(templatePath(id), JSON.stringify(stored, null, 2), 'utf-8')
  return stored
}

export async function getTemplate(id: string): Promise<StoredTemplate> {
  // Try new format first
  try {
    const content = await readFile(templatePath(id), 'utf-8')
    const data: unknown = JSON.parse(content)
    if (isStoredTemplate(data)) return data
  } catch {
    // Fall through to legacy format
  }

  // Legacy format: {id}.json + {id}.data.json
  const templatePath_ = join(TEMPLATES_DIR, `${id}.json`)
  const content = await readFile(templatePath_, 'utf-8')
  const template = JSON.parse(content) as Record<string, unknown>

  let sampleData: Record<string, unknown> = {}
  try {
    const dataContent = await readFile(join(TEMPLATES_DIR, `${id}.data.json`), 'utf-8')
    sampleData = JSON.parse(dataContent) as Record<string, unknown>
  } catch {
    // No sample data file
  }

  return {
    meta: {
      id,
      name: id,
      description: '',
      version: '1.0',
      createdAt: '',
      updatedAt: '',
    },
    template,
    sampleData,
  }
}

export async function listTemplates(): Promise<TemplateMeta[]> {
  await ensureDir()
  const files = await readdir(TEMPLATES_DIR)
  const results: TemplateMeta[] = []

  // New format: *.template.json
  for (const file of files) {
    if (file.endsWith('.template.json')) {
      try {
        const content = await readFile(join(TEMPLATES_DIR, file), 'utf-8')
        const data: unknown = JSON.parse(content)
        if (isStoredTemplate(data)) {
          results.push(data.meta)
        }
      } catch {
        // Skip corrupt files
      }
    }
  }

  // Legacy format: *.json (not .data.json, not .template.json)
  for (const file of files) {
    if (
      file.endsWith('.json') &&
      !file.endsWith('.data.json') &&
      !file.endsWith('.template.json')
    ) {
      const id = file.replace('.json', '')
      results.push({
        id,
        name: id,
        description: '',
        version: '1.0',
        createdAt: '',
        updatedAt: '',
      })
    }
  }

  return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput,
): Promise<StoredTemplate> {
  const existing = await getTemplate(id)
  const now = new Date().toISOString()

  const updated: StoredTemplate = {
    meta: {
      ...existing.meta,
      name: input.name ?? existing.meta.name,
      description: input.description ?? existing.meta.description,
      updatedAt: now,
    },
    template: input.template ?? existing.template,
    sampleData: input.sampleData ?? existing.sampleData,
  }

  // Always write to new format
  await writeFile(templatePath(id), JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}

export async function deleteTemplate(id: string): Promise<void> {
  // Try new format
  try {
    await unlink(templatePath(id))
    return
  } catch {
    // Try legacy format
  }

  await unlink(join(TEMPLATES_DIR, `${id}.json`))
  // Also remove data file if exists
  try {
    await unlink(join(TEMPLATES_DIR, `${id}.data.json`))
  } catch {
    // No data file
  }
}
