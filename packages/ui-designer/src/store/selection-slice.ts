import type { StateCreator } from 'zustand'
import type { DesignerStore } from './index.js'

export interface SelectionSlice {
  selectedBandIndex: number | null
  selectedComponentIndex: number | null
  selectBand: (index: number | null) => void
  selectComponent: (bandIndex: number, componentIndex: number) => void
  clearSelection: () => void
}

export const createSelectionSlice: StateCreator<
  DesignerStore,
  [['zustand/immer', never]],
  [],
  SelectionSlice
> = (set) => ({
  selectedBandIndex: null,
  selectedComponentIndex: null,

  selectBand: (index) =>
    set((state) => {
      state.selectedBandIndex = index
      state.selectedComponentIndex = null
    }),

  selectComponent: (bandIndex, componentIndex) =>
    set((state) => {
      state.selectedBandIndex = bandIndex
      state.selectedComponentIndex = componentIndex
    }),

  clearSelection: () =>
    set((state) => {
      state.selectedBandIndex = null
      state.selectedComponentIndex = null
    }),
})
