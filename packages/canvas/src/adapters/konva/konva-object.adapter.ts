import Konva from 'konva'
import type { CanvasObjectConfig, CanvasObjectPort } from '../../ports/canvas-object.port.js'

const SELECTION_STROKE = '#0096ff'
const SELECTION_STROKE_WIDTH = 2

export class KonvaObjectAdapter implements CanvasObjectPort {
  private config: CanvasObjectConfig
  private selected = false
  private originalStroke: string | undefined
  private originalStrokeWidth: number | undefined

  constructor(
    private readonly node: Konva.Node,
    config: CanvasObjectConfig,
  ) {
    this.config = { ...config }
  }

  getId(): string {
    return this.config.id
  }

  getConfig(): CanvasObjectConfig {
    return { ...this.config }
  }

  update(changes: Partial<CanvasObjectConfig>): void {
    this.config = { ...this.config, ...changes }
    // Map CanvasObjectConfig fields to Konva attrs
    const attrs: Record<string, unknown> = {}
    if (changes.x !== undefined) attrs['x'] = changes.x
    if (changes.y !== undefined) attrs['y'] = changes.y
    if (changes.width !== undefined) attrs['width'] = changes.width
    if (changes.height !== undefined) attrs['height'] = changes.height
    if (changes.draggable !== undefined) attrs['draggable'] = changes.draggable
    if (changes.fill !== undefined) attrs['fill'] = changes.fill
    if (changes.stroke !== undefined) attrs['stroke'] = changes.stroke
    if (changes.strokeWidth !== undefined) attrs['strokeWidth'] = changes.strokeWidth
    if (changes.opacity !== undefined) attrs['opacity'] = changes.opacity
    if (changes.text !== undefined) attrs['text'] = changes.text
    if (changes.fontSize !== undefined) attrs['fontSize'] = changes.fontSize
    if (changes.fontWeight !== undefined) attrs['fontStyle'] = changes.fontWeight
    this.node.setAttrs(attrs)
    this.node.getLayer()?.batchDraw()
  }

  select(): void {
    this.selected = true
    // Save current stroke values before overriding
    const currentStroke = this.node.getAttr('stroke') as string | undefined
    const currentStrokeWidth = this.node.getAttr('strokeWidth') as number | undefined
    if (currentStroke !== SELECTION_STROKE) {
      this.originalStroke = currentStroke
      this.originalStrokeWidth = currentStrokeWidth
    }
    this.node.setAttrs({ stroke: SELECTION_STROKE, strokeWidth: SELECTION_STROKE_WIDTH })
    this.node.getLayer()?.batchDraw()
  }

  deselect(): void {
    this.selected = false
    this.node.setAttrs({
      stroke: this.originalStroke ?? this.config.stroke,
      strokeWidth: this.originalStrokeWidth ?? this.config.strokeWidth ?? 0,
    })
    this.node.getLayer()?.batchDraw()
  }

  isSelected(): boolean {
    return this.selected
  }

  destroy(): void {
    this.node.destroy()
    this.node.getLayer()?.batchDraw()
  }

  /** Expose the underlying Konva node (used by KonvaEngineAdapter internally). */
  getNode(): Konva.Node {
    return this.node
  }
}
