import { products } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const updateProductSchema = z.object({
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

  const productId = getRouterParam(event, "id")
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: "Product ID is required" })
  }

  const body = await readBody(event)
  const validatedData = updateProductSchema.parse(body)

  // Check if product exists and belongs to the organization
  const [existingProduct] = await useDrizzle()
    .select({ id: products.id })
    .from(products)
    .where(and(
      eq(products.id, productId),
      eq(products.organisationId, secure.organisationId)
    ))

  if (!existingProduct) {
    throw createError({ statusCode: 404, statusMessage: "Product not found" })
  }

  // Update the product
  const [updatedProduct] = await useDrizzle()
    .update(products)
    .set({
      name: validatedData.name,
      description: validatedData.description || null,
      baseUnit: validatedData.baseUnit,
      basePrice: validatedData.basePrice,
      minOrderQuantity: validatedData.minOrderQuantity,
      width: validatedData.width,
      height: validatedData.height,
      depth: validatedData.depth,
      shippingPricePerUnit: validatedData.shippingPricePerUnit,
      carrierId: validatedData.carrierId
    })
    .where(eq(products.id, productId))
    .returning()

  return { product: updatedProduct }
})
