import { z } from 'zod'
import { ComponentSchema } from './component.schema.js'

export const BandTypeSchema = z.enum([
  'header',
  'detail',
  'footer',
  'group-header',
  'group-footer',
  'page-header',
  'page-footer',
  'custom',
])
export type BandType = z.infer<typeof BandTypeSchema>

export const BandSchema = z.object({
  type: BandTypeSchema,
  height: z.number().positive(),
  dataBinding: z.string().optional(),
  iteratorName: z.string().optional(),
  groupBy: z.string().optional(),
  /**
   * Start a new page before this band. On a group-header it means "between
   * group instances": every instance after the first starts a new page.
   */
  pageBreakBefore: z.boolean().optional(),
  /**
   * Group-header only: each group instance starts a new page-numbering
   * section. `{{sectionPageNumber}}`/`{{sectionTotalPages}}` in page bands
   * then count within the section (e.g. per-customer statement numbering).
   * Implies pageBreakBefore.
   */
  resetPageNumber: z.boolean().optional(),
  components: z.array(ComponentSchema),
})
export type Band = z.infer<typeof BandSchema>
