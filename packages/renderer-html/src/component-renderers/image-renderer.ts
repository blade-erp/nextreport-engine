import type { ResolvedElement } from '@nextreport/engine-core'
import { escapeHtml } from './text-renderer.js'

export function renderImage(element: ResolvedElement): string {
  const { x, y, width, height } = element.position
  const props = element.properties

  const src = typeof props.src === 'string' ? props.src : ''
  const alt = typeof props.alt === 'string' ? props.alt : ''
  const objectFit = typeof props.objectFit === 'string' ? props.objectFit : 'contain'

  const style = [
    'position:absolute',
    `left:${x}pt`,
    `top:${y}pt`,
    `width:${width}pt`,
    `height:${height}pt`,
    `object-fit:${objectFit}`,
  ].join(';')

  return `<img style="${style}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`
}
