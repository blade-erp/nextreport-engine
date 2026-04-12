import type { ResolvedElement } from '@nextreport/engine-core'

// bwip-js types use `export = BwipJs` which conflicts with verbatimModuleSyntax.
// The ESM build exports named functions at runtime, so we use a dynamic import.
interface BwipOptions {
  bcid: string
  text: string
  scale?: number
  barcolor?: string
  backgroundcolor?: string
  includetext?: boolean
}

let toSVG: ((opts: BwipOptions) => string) | null = null
const bwipReady = import('bwip-js').then((m) => {
  // ESM default re-exports the namespace; toSVG is either on default or top-level
  const mod = m as Record<string, unknown>
  toSVG = (mod.toSVG ?? (mod.default as Record<string, unknown>)?.toSVG) as typeof toSVG
})

const FORMAT_MAP: Record<string, string> = {
  qr: 'qrcode',
  code128: 'code128',
}

function fallbackDiv(
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  color: string,
): string {
  return `<div style="position:absolute;left:${x}pt;top:${y}pt;width:${width}pt;height:${height}pt;display:flex;align-items:center;justify-content:center;color:${color};font-size:10pt">${text}</div>`
}

export function renderBarcode(element: ResolvedElement): string {
  const { x, y, width, height } = element.position
  const props = element.properties

  const value = typeof props.value === 'string' ? props.value : ''
  const format = typeof props.format === 'string' ? props.format : 'qr'
  const color = typeof props.color === 'string' ? props.color : '#000000'
  const backgroundColor =
    typeof props.backgroundColor === 'string' ? props.backgroundColor : '#ffffff'

  if (!value) {
    return fallbackDiv(x, y, width, height, 'No value', '#999')
  }

  if (!toSVG) {
    return fallbackDiv(x, y, width, height, 'Loading...', '#999')
  }

  const bcid = FORMAT_MAP[format] ?? 'qrcode'

  try {
    const svg = toSVG({
      bcid,
      text: value,
      scale: 3,
      barcolor: color.replace('#', ''),
      backgroundcolor: backgroundColor.replace('#', ''),
      includetext: format !== 'qr',
    })

    const containerStyle = [
      'position:absolute',
      `left:${x}pt`,
      `top:${y}pt`,
      `width:${width}pt`,
      `height:${height}pt`,
      'display:flex',
      'align-items:center',
      'justify-content:center',
    ].join(';')

    const scaledSvg = svg.replace(
      /<svg /,
      '<svg style="width:100%;height:100%;object-fit:contain" ',
    )

    return `<div style="${containerStyle}">${scaledSvg}</div>`
  } catch {
    return fallbackDiv(x, y, width, height, 'Barcode error', '#c00')
  }
}

export { bwipReady }
