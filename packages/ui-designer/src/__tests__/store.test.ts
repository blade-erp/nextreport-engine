import { describe, it, expect, beforeEach } from 'vitest'
import { useDesignerStore } from '../store/index.js'
import { defaultReport } from '../store/document-slice.js'

// Reset store to a clean state before each test
beforeEach(() => {
  useDesignerStore.setState({
    report: JSON.parse(JSON.stringify(defaultReport)),
    sampleData: {},
    selectedBandIndex: null,
    selectedComponentIndex: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
  })
})

// ---------------------------------------------------------------------------
// Document mutations
// ---------------------------------------------------------------------------

describe('document slice — setReport', () => {
  it('replaces the entire report', () => {
    const newReport = JSON.parse(JSON.stringify(defaultReport))
    newReport.locale = 'tr-TR'
    useDesignerStore.getState().setReport(newReport)
    expect(useDesignerStore.getState().report.locale).toBe('tr-TR')
  })
})

describe('document slice — addBand', () => {
  it('adds a band to the bands array', () => {
    const before = useDesignerStore.getState().report.bands.length
    useDesignerStore.getState().addBand('page-header', 30)
    expect(useDesignerStore.getState().report.bands).toHaveLength(before + 1)
    const added = useDesignerStore.getState().report.bands[before]
    expect(added.type).toBe('page-header')
    expect(added.height).toBe(30)
  })

  it('uses default height of 50 when not specified', () => {
    const before = useDesignerStore.getState().report.bands.length
    useDesignerStore.getState().addBand('custom')
    const added = useDesignerStore.getState().report.bands[before]
    expect(added.height).toBe(50)
  })
})

describe('document slice — removeBand', () => {
  it('removes the band at the given index', () => {
    const before = useDesignerStore.getState().report.bands.length
    useDesignerStore.getState().removeBand(0)
    expect(useDesignerStore.getState().report.bands).toHaveLength(before - 1)
  })
})

describe('document slice — addComponent', () => {
  it('adds a component to the specified band', () => {
    const component = {
      type: 'text' as const,
      position: { x: 0, y: 0, width: 100, height: 20 },
      content: 'Hello',
      fontSize: 12,
      fontWeight: 'normal' as const,
      color: '#000000',
      textAlign: 'left' as const,
    }
    useDesignerStore.getState().addComponent(0, component)
    expect(useDesignerStore.getState().report.bands[0].components).toHaveLength(1)
    expect(useDesignerStore.getState().report.bands[0].components[0]).toMatchObject({ content: 'Hello' })
  })
})

describe('document slice — removeComponent', () => {
  it('removes a component from the specified band', () => {
    const component = {
      type: 'text' as const,
      position: { x: 0, y: 0, width: 100, height: 20 },
      content: 'Remove me',
      fontSize: 12,
      fontWeight: 'normal' as const,
      color: '#000000',
      textAlign: 'left' as const,
    }
    useDesignerStore.getState().addComponent(0, component)
    expect(useDesignerStore.getState().report.bands[0].components).toHaveLength(1)
    useDesignerStore.getState().removeComponent(0, 0)
    expect(useDesignerStore.getState().report.bands[0].components).toHaveLength(0)
  })
})

describe('document slice — updateComponent', () => {
  it('merges changes into the component', () => {
    const component = {
      type: 'text' as const,
      position: { x: 0, y: 0, width: 100, height: 20 },
      content: 'Original',
      fontSize: 12,
      fontWeight: 'normal' as const,
      color: '#000000',
      textAlign: 'left' as const,
    }
    useDesignerStore.getState().addComponent(0, component)
    useDesignerStore.getState().updateComponent(0, 0, { content: 'Updated', fontSize: 16 })
    const updated = useDesignerStore.getState().report.bands[0].components[0]
    expect(updated).toMatchObject({ content: 'Updated', fontSize: 16 })
  })
})

describe('document slice — updateComponentPosition', () => {
  it('updates position fields', () => {
    const component = {
      type: 'text' as const,
      position: { x: 0, y: 0, width: 100, height: 20 },
      content: 'Pos test',
      fontSize: 12,
      fontWeight: 'normal' as const,
      color: '#000000',
      textAlign: 'left' as const,
    }
    useDesignerStore.getState().addComponent(0, component)
    useDesignerStore.getState().updateComponentPosition(0, 0, { x: 50, y: 10, width: 200 })
    const pos = useDesignerStore.getState().report.bands[0].components[0].position
    expect(pos.x).toBe(50)
    expect(pos.y).toBe(10)
    expect(pos.width).toBe(200)
    expect(pos.height).toBe(20) // unchanged
  })
})

// ---------------------------------------------------------------------------
// History (undo / redo)
// ---------------------------------------------------------------------------

describe('history slice — undo/redo', () => {
  it('canUndo is false initially', () => {
    expect(useDesignerStore.getState().canUndo).toBe(false)
  })

  it('canRedo is false initially', () => {
    expect(useDesignerStore.getState().canRedo).toBe(false)
  })

  it('pushHistory + mutation + undo restores previous state', () => {
    const originalBandCount = useDesignerStore.getState().report.bands.length

    useDesignerStore.getState().pushHistory()
    useDesignerStore.getState().addBand('custom', 60)
    expect(useDesignerStore.getState().report.bands).toHaveLength(originalBandCount + 1)
    expect(useDesignerStore.getState().canUndo).toBe(true)

    useDesignerStore.getState().undo()
    expect(useDesignerStore.getState().report.bands).toHaveLength(originalBandCount)
  })

  it('undo + redo restores the latest state', () => {
    const originalBandCount = useDesignerStore.getState().report.bands.length

    useDesignerStore.getState().pushHistory()
    useDesignerStore.getState().addBand('custom', 60)

    useDesignerStore.getState().undo()
    expect(useDesignerStore.getState().report.bands).toHaveLength(originalBandCount)
    expect(useDesignerStore.getState().canRedo).toBe(true)

    useDesignerStore.getState().redo()
    expect(useDesignerStore.getState().report.bands).toHaveLength(originalBandCount + 1)
    expect(useDesignerStore.getState().canRedo).toBe(false)
  })

  it('canUndo reflects state correctly', () => {
    expect(useDesignerStore.getState().canUndo).toBe(false)
    useDesignerStore.getState().pushHistory()
    expect(useDesignerStore.getState().canUndo).toBe(true)
    useDesignerStore.getState().undo()
    expect(useDesignerStore.getState().canUndo).toBe(false)
  })

  it('canRedo reflects state correctly', () => {
    useDesignerStore.getState().pushHistory()
    useDesignerStore.getState().addBand('custom')
    expect(useDesignerStore.getState().canRedo).toBe(false)
    useDesignerStore.getState().undo()
    expect(useDesignerStore.getState().canRedo).toBe(true)
    useDesignerStore.getState().redo()
    expect(useDesignerStore.getState().canRedo).toBe(false)
  })

  it('pushHistory clears the future', () => {
    useDesignerStore.getState().pushHistory()
    useDesignerStore.getState().addBand('custom')
    useDesignerStore.getState().undo()
    expect(useDesignerStore.getState().canRedo).toBe(true)

    // New push clears future
    useDesignerStore.getState().pushHistory()
    expect(useDesignerStore.getState().canRedo).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('selection slice', () => {
  it('selectComponent sets both bandIndex and componentIndex', () => {
    useDesignerStore.getState().selectComponent(2, 5)
    expect(useDesignerStore.getState().selectedBandIndex).toBe(2)
    expect(useDesignerStore.getState().selectedComponentIndex).toBe(5)
  })

  it('selectBand sets band index and clears component index', () => {
    useDesignerStore.getState().selectComponent(2, 5)
    useDesignerStore.getState().selectBand(1)
    expect(useDesignerStore.getState().selectedBandIndex).toBe(1)
    expect(useDesignerStore.getState().selectedComponentIndex).toBeNull()
  })

  it('clearSelection resets to null', () => {
    useDesignerStore.getState().selectComponent(1, 2)
    useDesignerStore.getState().clearSelection()
    expect(useDesignerStore.getState().selectedBandIndex).toBeNull()
    expect(useDesignerStore.getState().selectedComponentIndex).toBeNull()
  })

  it('selectBand(null) clears selection', () => {
    useDesignerStore.getState().selectComponent(1, 2)
    useDesignerStore.getState().selectBand(null)
    expect(useDesignerStore.getState().selectedBandIndex).toBeNull()
    expect(useDesignerStore.getState().selectedComponentIndex).toBeNull()
  })
})
