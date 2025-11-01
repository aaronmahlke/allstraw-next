import { products } from "~~/server/database/schema"
import { z } from "zod"

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  baseUnit: z.enum(["cm", "m", "piece"]),
  basePrice: z.number().int().positive(),
  minOrderQuantity: z.number().int().positive().default(1),
  width: z.object({
    min: z.number(),
    max: z.number(),
    step: z.number()
  }).nullable().optional(),
  height: z.object({
    min: z.number(),
    max: z.number(),
    step: z.number()
  }).nullable().optional(),
  depth: z.object({
    min: z.number(),
    max: z.number(),
    step: z.number()
  }).nullable().optional(),
  shippingPricePerUnit: z.number().int().nullable().optional(),
  carrierId: z.string().uuid().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  if (secure.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Admin access required" })
  }

  const body = await readBody(event)
  const validatedData = createProductSchema.parse(body)

  const [product] = await useDrizzle()
    .insert(products)
    .values({
      ...validatedData,
      organisationId: secure.organisationId
    })
    .returning()

  return { product }
})
