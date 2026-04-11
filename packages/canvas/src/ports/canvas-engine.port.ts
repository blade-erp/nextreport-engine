import type { CanvasObjectConfig, CanvasObjectPort } from './canvas-object.port.js'

export interface CanvasEnginePort {
  initialize(container: HTMLDivElement, width: number, height: number): void
  destroy(): void
  addObject(config: CanvasObjectConfig): CanvasObjectPort
  removeObject(id: string): void
  getObject(id: string): CanvasObjectPort | undefined
  getObjects(): CanvasObjectPort[]
  clear(): void
  setZoom(scale: number): void
  getZoom(): number
  toJSON(): unknown
  onSelectionChange(callback: (objectId: string | null) => void): void
  onObjectModified(callback: (objectId: string, changes: Partial<CanvasObjectConfig>) => void): void
}
