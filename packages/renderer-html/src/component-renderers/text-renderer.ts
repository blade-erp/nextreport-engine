import type { ResolvedElement } from '@nextreport/engine-core'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderText(element: ResolvedElement): string {
  const { x, y, width, height } = element.position
  const props = element.properties

  const content = typeof props.content === 'string' ? props.content : ''
  const fontSize = typeof props.fontSize === 'number' ? props.fontSize : 12
  const fontWeight = typeof props.fontWeight === 'string' ? props.fontWeight : 'normal'
  const color = typeof props.color === 'string' ? props.color : '#000000'
  const textAlign = typeof props.textAlign === 'string' ? props.textAlign : 'left'
  const wrap = props.wrap !== false

  const style = [
    'position:absolute',
    `left:${x}pt`,
    `top:${y}pt`,
    `width:${width}pt`,
    `height:${height}pt`,
    `font-size:${fontSize}pt`,
    `font-weight:${fontWeight}`,
    `color:${color}`,
    `text-align:${textAlign}`,
    // Bands have fixed heights, so text that is taller than its element (long
    // content, or wrapped onto extra lines) must not bleed into the band below.
    'overflow:hidden',
    // With wrapping off the value stays on one line, so the clipped overflow
    // is horizontal and text-overflow can mark it with an ellipsis.
    ...(wrap ? [] : ['white-space:nowrap', 'text-overflow:ellipsis']),
  ].join(';')

  return `<div style="${style}">${escapeHtml(content)}</div>`
}
