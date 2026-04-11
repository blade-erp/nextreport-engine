import type { ResolvedElement } from '@nextreport/engine-core'
import { escapeHtml } from './text-renderer.js'

interface TableColumn {
  header: string
  field: string
  width?: number
}

export function renderTable(element: ResolvedElement): string {
  const { x, y, width, height } = element.position
  const props = element.properties

  const columns = Array.isArray(props.columns)
    ? (props.columns as TableColumn[])
    : []

  const style = [
    'position:absolute',
    `left:${x}pt`,
    `top:${y}pt`,
    `width:${width}pt`,
    `height:${height}pt`,
    'border-collapse:collapse',
  ].join(';')

  const headers = columns
    .map((col) => {
      const thStyle = col.width !== undefined ? ` style="width:${col.width}pt"` : ''
      return `<th${thStyle}>${escapeHtml(col.header)}</th>`
    })
    .join('')

  return `<table style="${style}"><thead><tr>${headers}</tr></thead></table>`
}
