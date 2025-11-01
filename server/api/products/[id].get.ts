import { products, carriers } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  const productId = getRouterParam(event, 'id')
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: "Product ID is required" })
  }

  const [product] = await useDrizzle()
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      baseUnit: products.baseUnit,
      basePrice: products.basePrice,
      minOrderQuantity: products.minOrderQuantity,
      width: products.width,
      height: products.height,
      depth: products.depth,
      shippingPricePerUnit: products.shippingPricePerUnit,
      carrierId: products.carrierId,
      carrierName: carriers.name,
      carrierBasePrice: carriers.basePrice
    })
    .from(products)
    .leftJoin(carriers, eq(carriers.id, products.carrierId))
    .where(and(
      eq(products.id, productId),
      eq(products.organisationId, secure.organisationId)
    ))

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product not found" })
  }

  return { product }
})
