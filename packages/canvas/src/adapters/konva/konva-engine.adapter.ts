import Konva from 'konva'
import type { CanvasEnginePort } from '../../ports/canvas-engine.port.js'
import type { CanvasObjectConfig, CanvasObjectPort } from '../../ports/canvas-object.port.js'
import { KonvaObjectAdapter } from './konva-object.adapter.js'

export class KonvaEngineAdapter implements CanvasEnginePort {
  private stage: Konva.Stage | null = null
  private layer: Konva.Layer | null = null
  private objects = new Map<string, KonvaObjectAdapter>()

  private selectionCallback: ((objectId: string | null) => void) | null = null
  private modifiedCallback:
    | ((objectId: string, changes: Partial<CanvasObjectConfig>) => void)
    | null = null

  initialize(container: HTMLDivElement, width: number, height: number): void {
    this.stage = new Konva.Stage({ container, width, height })
    this.layer = new Konva.Layer()
    this.stage.add(this.layer)

    // Clicking empty stage area deselects all
    this.stage.on('click', (e) => {
      if (e.target === this.stage) {
        this.selectionCallback?.(null)
      }
    })
  }

  destroy(): void {
    this.stage?.destroy()
    this.stage = null
    this.layer = null
    this.objects.clear()
  }

  addObject(config: CanvasObjectConfig): CanvasObjectPort {
    if (!this.layer) throw new Error('KonvaEngineAdapter: not initialized')

    const node = this.createNode(config)
    node.id(config.id)
    node.draggable(config.draggable ?? false)

    // Cast to Konva.Node for event binding — Konva v10 union overloads are incompatible
    const eventNode = node as unknown as Konva.Node

    // Wire events on the node
    eventNode.on('click', () => {
      this.selectionCallback?.(config.id)
    })

    eventNode.on('dragstart', () => {
      this.selectionCallback?.(config.id)
    })

    eventNode.on('dragend', () => {
      const changes: Partial<CanvasObjectConfig> = {
        x: node.x(),
        y: node.y(),
      }
      this.modifiedCallback?.(config.id, changes)
      // Also update internal config
      const adapter = this.objects.get(config.id)
      if (adapter) {
        adapter.update(changes)
      }
    })

    eventNode.on('dragmove', () => {
      const changes: Partial<CanvasObjectConfig> = {
        x: node.x(),
        y: node.y(),
      }
      this.modifiedCallback?.(config.id, changes)
    })

    this.layer.add(node)
    this.layer.batchDraw()

    const adapter = new KonvaObjectAdapter(node, config)
    this.objects.set(config.id, adapter)
    return adapter
  }

  removeObject(id: string): void {
    const adapter = this.objects.get(id)
    if (adapter) {
      adapter.destroy()
      this.objects.delete(id)
    }
  }

  getObject(id: string): CanvasObjectPort | undefined {
    return this.objects.get(id)
  }

  getObjects(): CanvasObjectPort[] {
    return Array.from(this.objects.values())
  }

  clear(): void {
    for (const adapter of this.objects.values()) {
      adapter.destroy()
    }
    this.objects.clear()
    this.layer?.batchDraw()
  }

  setZoom(scale: number): void {
    if (!this.stage) throw new Error('KonvaEngineAdapter: not initialized')
    this.stage.scale({ x: scale, y: scale })
    this.stage.batchDraw()
  }

  getZoom(): number {
    return this.stage?.scaleX() ?? 1
  }

  toJSON(): unknown {
    return this.stage?.toJSON() ?? null
  }

  onSelectionChange(callback: (objectId: string | null) => void): void {
    this.selectionCallback = callback
  }

  onObjectModified(
    callback: (objectId: string, changes: Partial<CanvasObjectConfig>) => void,
  ): void {
    this.modifiedCallback = callback
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private createNode(config: CanvasObjectConfig): Konva.Group | Konva.Shape {
    switch (config.type) {
      case 'rect':
        return new Konva.Rect({
          x: config.x,
          y: config.y,
          width: config.width,
          height: config.height,
          fill: config.fill ?? 'transparent',
          stroke: config.stroke,
          strokeWidth: config.strokeWidth ?? 0,
          opacity: config.opacity ?? 1,
        })

      case 'text': {
        // A text object is rendered as a Group containing an optional background
        // Rect and a Text node so we can honour fill (background) separately.
        const group = new Konva.Group({
          x: config.x,
          y: config.y,
          width: config.width,
          height: config.height,
          opacity: config.opacity ?? 1,
        })

        // Background rect (uses fill as background colour when present)
        const bg = new Konva.Rect({
          x: 0,
          y: 0,
          width: config.width,
          height: config.height,
          fill: config.fill ?? 'transparent',
        })

        const textNode = new Konva.Text({
          x: 0,
          y: 0,
          width: config.width,
          height: config.height,
          text: config.text ?? '',
          fontSize: config.fontSize ?? 14,
          fontStyle: config.fontWeight ?? 'normal',
          fill: '#000000',
          verticalAlign: 'middle',
          align: 'left',
        })

        group.add(bg)
        group.add(textNode)
        return group
      }

      case 'group':
        return new Konva.Group({
          x: config.x,
          y: config.y,
          width: config.width,
          height: config.height,
          opacity: config.opacity ?? 1,
        })

      default:
        // Fallback: render as a Rect
        return new Konva.Rect({
          x: config.x,
          y: config.y,
          width: config.width,
          height: config.height,
          fill: config.fill ?? 'transparent',
          stroke: config.stroke,
          strokeWidth: config.strokeWidth ?? 0,
          opacity: config.opacity ?? 1,
        })
    }
  }
}
