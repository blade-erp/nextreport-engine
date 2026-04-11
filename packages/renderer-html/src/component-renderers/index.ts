import type { ResolvedElement } from '@nextreport/engine-core'
import { renderText } from './text-renderer.js'
import { renderTable } from './table-renderer.js'

type ElementRenderer = (element: ResolvedElement) => string

const renderers: Record<string, ElementRenderer> = {
  text: renderText,
  table: renderTable,
}

export function renderElement(element: ResolvedElement): string {
  const renderer = renderers[element.type]
  if (!renderer) {
    return `<!-- unknown element type: ${element.type} -->`
  }
  return renderer(element)
}

export { renderers }
