import { z } from 'zod'

export const FieldTypeSchema = z.enum(['string', 'number', 'date', 'boolean', 'array'])
export type FieldType = z.infer<typeof FieldTypeSchema>

export type Field = {
  name: string
  type: FieldType
  fields?: Field[]
}

export const FieldSchema: z.ZodType<Field> = z.lazy(() =>
  z.object({
    name: z.string(),
    type: FieldTypeSchema,
    fields: z.array(FieldSchema).optional(),
  })
)

export const DataSourceSchema = z.object({
  type: z.enum(['json']),
  fields: z.array(FieldSchema).optional(),
})
export type DataSource = z.infer<typeof DataSourceSchema>
