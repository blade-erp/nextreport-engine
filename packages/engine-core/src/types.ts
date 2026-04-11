export interface RenderResult {
  pages: Page[]
  metadata: RenderMetadata
}

export interface RenderMetadata {
  totalPages: number
  generatedAt: string
  locale: string
}

export interface Page {
  number: number
  elements: ResolvedElement[]
}

export interface ResolvedElement {
  type: string
  position: { x: number; y: number; width: number; height: number }
  properties: Record<string, unknown>
  bandType: string
  pageBreakBefore?: boolean
}

export interface RenderOptions {
  locale?: string
}
