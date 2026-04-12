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
  components: z.array(ComponentSchema),
})
export type Band = z.infer<typeof BandSchema>
