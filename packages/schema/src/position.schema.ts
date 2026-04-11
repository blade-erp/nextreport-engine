import { z } from 'zod'

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
})

export type Position = z.infer<typeof PositionSchema>
