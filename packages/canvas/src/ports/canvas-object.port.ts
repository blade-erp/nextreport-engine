export interface CanvasObjectConfig {
  id: string
  type: 'text' | 'rect' | 'group' | string
  x: number
  y: number
  width: number
  height: number
  draggable?: boolean
  text?: string
  fontSize?: number
  fontWeight?: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  [key: string]: unknown
}

export interface CanvasObjectPort {
  getId(): string
  getConfig(): CanvasObjectConfig
  update(changes: Partial<CanvasObjectConfig>): void
  select(): void
  deselect(): void
  isSelected(): boolean
  destroy(): void
}
