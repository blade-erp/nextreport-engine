import { getTemplate } from './template-store'

export async function loadTemplate(templateId: string) {
  const stored = await getTemplate(templateId)
  return stored.template
}

export async function loadSampleData(templateId: string) {
  const stored = await getTemplate(templateId)
  return stored.sampleData
}
