export type CanvasEventType = 'click' | 'dragstart' | 'dragend' | 'dragmove' | 'select' | 'deselect'

export interface CanvasEvent {
  type: CanvasEventType
  objectId?: string
  position?: { x: number; y: number }
  size?: { width: number; height: number }
}

export type CanvasEventHandler = (event: CanvasEvent) => void

export interface CanvasEventsPort {
  on(event: CanvasEventType, handler: CanvasEventHandler): void
  off(event: CanvasEventType, handler: CanvasEventHandler): void
  emit(event: CanvasEvent): void
}
