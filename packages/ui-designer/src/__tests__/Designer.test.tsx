import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'

// The panels pull in the canvas adapter and the store; this suite only covers
// how the root element is sized, so they are stubbed out.
vi.mock('../components/DesignerToolbar.js', () => ({ DesignerToolbar: () => null }))
vi.mock('../components/Toolbox.js', () => ({ Toolbox: () => null }))
vi.mock('../components/BandManager.js', () => ({ BandManager: () => null }))
vi.mock('../components/DataSourceTree.js', () => ({ DataSourceTree: () => null }))
vi.mock('../components/CanvasArea.js', () => ({ CanvasArea: () => null }))
vi.mock('../components/PropertyPanel.js', () => ({ PropertyPanel: () => null }))
vi.mock('../components/PreviewPanel.js', () => ({ PreviewPanel: () => null }))

const { Designer } = await import('../components/Designer.js')

function rootStyle(markup: string): string {
  return /<div style="([^"]*)"/.exec(markup)?.[1] ?? ''
}

describe('Designer height', () => {
  it('fills the viewport when no height is given', () => {
    const markup = renderToStaticMarkup(<Designer />)
    expect(rootStyle(markup)).toContain('height:100vh')
  })

  it('accepts a CSS string height', () => {
    const markup = renderToStaticMarkup(<Designer height="600px" />)
    const style = rootStyle(markup)
    expect(style).toContain('height:600px')
    expect(style).not.toContain('100vh')
  })

  it('accepts a numeric height, which React renders as px', () => {
    const markup = renderToStaticMarkup(<Designer height={480} />)
    expect(rootStyle(markup)).toContain('height:480px')
  })

  it('accepts a percentage height for embedding in a sized container', () => {
    expect(rootStyle(renderToStaticMarkup(<Designer height="100%" />))).toContain('height:100%')
  })

  it('keeps the surrounding flex-column layout regardless of height', () => {
    const style = rootStyle(renderToStaticMarkup(<Designer height="50vh" />))
    expect(style).toContain('display:flex')
    expect(style).toContain('flex-direction:column')
  })
})
