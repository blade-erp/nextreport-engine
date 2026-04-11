import { readFile } from 'fs/promises'
import { join } from 'path'

const TEMPLATES_DIR = join(process.cwd(), 'templates')

export async function loadTemplate(templateId: string) {
  const filePath = join(TEMPLATES_DIR, `${templateId}.json`)
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

export async function loadSampleData(templateId: string) {
  const filePath = join(TEMPLATES_DIR, `${templateId}.data.json`)
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}
