import type { Report, BandType, Component } from '@nextreport/schema'
import type { StateCreator } from 'zustand'
import type { DesignerStore } from './index.js'

export interface DocumentSlice {
  report: Report
  setReport: (report: Report) => void
  updateComponent: (
    bandIndex: number,
    componentIndex: number,
    changes: Record<string, unknown>,
  ) => void
  updateComponentPosition: (
    bandIndex: number,
    componentIndex: number,
    position: { x?: number; y?: number; width?: number; height?: number },
  ) => void
  addBand: (type: BandType, height?: number) => void
  removeBand: (index: number) => void
  addComponent: (bandIndex: number, component: Component) => void
  removeComponent: (bandIndex: number, componentIndex: number) => void
}

export const defaultReport: Report = {
  version: '1.0',
  type: 'report',
  locale: 'en-US',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 20, right: 15, bottom: 20, left: 15 },
  },
  dataSource: { type: 'json', fields: [] },
  bands: [
    { type: 'header', height: 80, components: [] },
    { type: 'detail', height: 25, components: [] },
    { type: 'footer', height: 40, components: [] },
  ],
}

export const createDocumentSlice: StateCreator<
  DesignerStore,
  [['zustand/immer', never]],
  [],
  DocumentSlice
> = (set) => ({
  report: defaultReport,

  setReport: (report) =>
    set((state) => {
      state.report = report
    }),

  updateComponent: (bandIndex, componentIndex, changes) =>
    set((state) => {
      const component = state.report.bands[bandIndex]?.components[componentIndex]
      if (component) {
        Object.assign(component, changes)
      }
    }),

  updateComponentPosition: (bandIndex, componentIndex, position) =>
    set((state) => {
      const component = state.report.bands[bandIndex]?.components[componentIndex]
      if (component) {
        Object.assign(component.position, position)
      }
    }),

  addBand: (type, height = 50) =>
    set((state) => {
      state.report.bands.push({ type, height, components: [] })
    }),

  removeBand: (index) =>
    set((state) => {
      state.report.bands.splice(index, 1)
    }),

  addComponent: (bandIndex, component) =>
    set((state) => {
      state.report.bands[bandIndex]?.components.push(component)
    }),

  removeComponent: (bandIndex, componentIndex) =>
    set((state) => {
      state.report.bands[bandIndex]?.components.splice(componentIndex, 1)
    }),
})
