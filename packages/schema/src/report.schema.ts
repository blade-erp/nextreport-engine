import { z } from 'zod'
import { PageSchema } from './page.schema.js'
import { DataSourceSchema } from './data-source.schema.js'
import { BandSchema } from './band.schema.js'

export const ReportSchema = z.object({
  version: z.string().default('1.0'),
  type: z.literal('report'),
  locale: z.string().default('en-US'),
  page: PageSchema.default({}),
  dataSource: DataSourceSchema,
  bands: z.array(BandSchema),
})
export type Report = z.infer<typeof ReportSchema>
