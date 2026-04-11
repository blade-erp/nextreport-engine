import { z } from 'zod'

export const PageSizeSchema = z.enum(['A4', 'A3', 'Letter', 'Legal'])
export type PageSize = z.infer<typeof PageSizeSchema>

export const OrientationSchema = z.enum(['portrait', 'landscape'])
export type Orientation = z.infer<typeof OrientationSchema>

export const MarginsSchema = z.object({
  top: z.number().min(0),
  right: z.number().min(0),
  bottom: z.number().min(0),
  left: z.number().min(0),
})
export type Margins = z.infer<typeof MarginsSchema>

export const PageSchema = z.object({
  size: PageSizeSchema.default('A4'),
  orientation: OrientationSchema.default('portrait'),
  margins: MarginsSchema.default({ top: 20, right: 15, bottom: 20, left: 15 }),
})
export type Page = z.infer<typeof PageSchema>
