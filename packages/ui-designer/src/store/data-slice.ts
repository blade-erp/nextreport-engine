import type { StateCreator } from 'zustand'
import type { DesignerStore } from './index.js'

export interface DataSlice {
  sampleData: Record<string, unknown>
  setSampleData: (data: Record<string, unknown>) => void
}

export const createDataSlice: StateCreator<
  DesignerStore,
  [['zustand/immer', never]],
  [],
  DataSlice
> = (set) => ({
  sampleData: {},

  setSampleData: (data) =>
    set((state) => {
      state.sampleData = data
    }),
})
