import type { Report } from '@nextreport/schema'
import type { StateCreator } from 'zustand'
import type { DesignerStore } from './index.js'

export interface HistorySlice {
  past: Report[]
  future: Report[]
  canUndo: boolean
  canRedo: boolean
  pushHistory: () => void
  undo: () => void
  redo: () => void
}

export const createHistorySlice: StateCreator<
  DesignerStore,
  [['zustand/immer', never]],
  [],
  HistorySlice
> = (set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  pushHistory: () =>
    set((state) => {
      // Deep-clone the current report via JSON round-trip (safe for plain data)
      const snapshot = JSON.parse(JSON.stringify(state.report)) as Report
      state.past.push(snapshot)
      // Pushing a new state invalidates the future
      state.future = []
      state.canUndo = true
      state.canRedo = false
    }),

  undo: () => {
    const { past, report } = get()
    if (past.length === 0) return
    set((state) => {
      const previous = state.past.pop()!
      const currentSnapshot = JSON.parse(JSON.stringify(report)) as Report
      state.future.unshift(currentSnapshot)
      state.report = previous
      state.canUndo = state.past.length > 0
      state.canRedo = true
    })
  },

  redo: () => {
    const { future, report } = get()
    if (future.length === 0) return
    set((state) => {
      const next = state.future.shift()!
      const currentSnapshot = JSON.parse(JSON.stringify(report)) as Report
      state.past.push(currentSnapshot)
      state.report = next
      state.canUndo = true
      state.canRedo = state.future.length > 0
    })
  },
})
