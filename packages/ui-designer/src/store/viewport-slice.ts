import type { StateCreator } from 'zustand'
import type { DesignerStore } from './index.js'

export interface ViewportSlice {
  zoom: number
  panX: number
  panY: number
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  resetViewport: () => void
}

export const createViewportSlice: StateCreator<
  DesignerStore,
  [['zustand/immer', never]],
  [],
  ViewportSlice
> = (set) => ({
  zoom: 1,
  panX: 0,
  panY: 0,

  setZoom: (zoom) =>
    set((state) => {
      state.zoom = zoom
    }),

  setPan: (x, y) =>
    set((state) => {
      state.panX = x
      state.panY = y
    }),

  resetViewport: () =>
    set((state) => {
      state.zoom = 1
      state.panX = 0
      state.panY = 0
    }),
})
