import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createDocumentSlice } from './document-slice.js'
import { createDataSlice } from './data-slice.js'
import { createSelectionSlice } from './selection-slice.js'
import { createViewportSlice } from './viewport-slice.js'
import { createHistorySlice } from './history-slice.js'
import type { DocumentSlice } from './document-slice.js'
import type { DataSlice } from './data-slice.js'
import type { SelectionSlice } from './selection-slice.js'
import type { ViewportSlice } from './viewport-slice.js'
import type { HistorySlice } from './history-slice.js'

export type { DocumentSlice } from './document-slice.js'
export type { DataSlice } from './data-slice.js'
export type { SelectionSlice } from './selection-slice.js'
export type { ViewportSlice } from './viewport-slice.js'
export type { HistorySlice } from './history-slice.js'

export type DesignerStore = DocumentSlice & DataSlice & SelectionSlice & ViewportSlice & HistorySlice

export const useDesignerStore = create<DesignerStore>()(
  immer((...a) => ({
    ...createDocumentSlice(...a),
    ...createDataSlice(...a),
    ...createSelectionSlice(...a),
    ...createViewportSlice(...a),
    ...createHistorySlice(...a),
  }))
)
