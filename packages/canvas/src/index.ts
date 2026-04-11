// Ports (framework-agnostic interfaces)
export type { CanvasEnginePort } from './ports/canvas-engine.port.js'
export type { CanvasObjectConfig, CanvasObjectPort } from './ports/canvas-object.port.js'
export type { CanvasEventType, CanvasEvent, CanvasEventHandler, CanvasEventsPort } from './ports/canvas-events.port.js'

// Default adapter
export { KonvaEngineAdapter } from './adapters/konva/index.js'
