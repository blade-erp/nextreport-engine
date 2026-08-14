import { z } from 'zod'
import { PositionSchema } from './position.schema.js'

export const TextComponentSchema = z.object({
  type: z.literal('text'),
  position: PositionSchema,
  content: z.string(),
  fontSize: z.number().positive().default(12),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  color: z.string().default('#000000'),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
  /**
   * Whether content wraps onto additional lines. Omitted or true wraps, as
   * text always has. Set to false to keep the text on a single line and
   * truncate it with an ellipsis instead — useful for table cells and other
   * fixed-height rows where a wrapped value would be clipped mid-line.
   *
   * Optional rather than defaulted so that adding it does not make `wrap` a
   * required property of the inferred TextComponent type.
   */
  wrap: z.boolean().optional(),
})
export type TextComponent = z.infer<typeof TextComponentSchema>

export const TableColumnSchema = z.object({
  header: z.string(),
  field: z.string(),
  width: z.number().optional(),
})
export type TableColumn = z.infer<typeof TableColumnSchema>

export const TableComponentSchema = z.object({
  type: z.literal('table'),
  position: PositionSchema,
  dataBinding: z.string(),
  columns: z.array(TableColumnSchema),
})
export type TableComponent = z.infer<typeof TableComponentSchema>

export const ImageComponentSchema = z.object({
  type: z.literal('image'),
  position: PositionSchema,
  src: z.string(),
  alt: z.string().default(''),
  objectFit: z.enum(['contain', 'cover', 'fill']).default('contain'),
})
export type ImageComponent = z.infer<typeof ImageComponentSchema>

export const BarcodeComponentSchema = z.object({
  type: z.literal('barcode'),
  position: PositionSchema,
  value: z.string(),
  format: z.enum(['qr', 'code128']).default('qr'),
  color: z.string().default('#000000'),
  backgroundColor: z.string().default('#ffffff'),
})
export type BarcodeComponent = z.infer<typeof BarcodeComponentSchema>

export const ComponentSchema = z.discriminatedUnion('type', [
  TextComponentSchema,
  TableComponentSchema,
  ImageComponentSchema,
  BarcodeComponentSchema,
])
export type Component = z.infer<typeof ComponentSchema>
