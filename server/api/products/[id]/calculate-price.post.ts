import { products, carriers } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const calculatePriceSchema = z.object({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  quantity: z.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  const productId = getRouterParam(event, 'id')
  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: "Product ID is required" })
  }

  const body = await readBody(event)
  const { width, height, depth, quantity } = calculatePriceSchema.parse(body)

  const [product] = await useDrizzle()
    .select({
      id: products.id,
      name: products.name,
      baseUnit: products.baseUnit,
      basePrice: products.basePrice,
      minOrderQuantity: products.minOrderQuantity,
      width: products.width,
      height: products.height,
      depth: products.depth,
      shippingPricePerUnit: products.shippingPricePerUnit,
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

  if (quantity < product.minOrderQuantity) {
    throw createError({
      statusCode: 400,
      statusMessage: `Minimum quantity is ${product.minOrderQuantity}`
    })
  }

  let units: number
  let calculation: string

  if (product.baseUnit === "piece") {
    units = quantity
    calculation = `${quantity} pieces`
  } else {
    if (!width || !height) {
      throw createError({
        statusCode: 400,
        statusMessage: "Width and height required for dimensional products"
      })
    }

    const area = width * height
    const volume = depth ? area * depth : area

    units = volume * quantity
    calculation = depth
      ? `${width} × ${height} × ${depth} × ${quantity} = ${units} ${product.baseUnit}³`
      : `${width} × ${height} × ${quantity} = ${units} ${product.baseUnit}²`
  }

  const productTotal = Math.round(product.basePrice * units)
  const shippingTotal = product.shippingPricePerUnit
    ? Math.round(product.shippingPricePerUnit * units)
    : 0
  const carrierBase = product.carrierBasePrice || 0
  const total = productTotal + shippingTotal + carrierBase

  return {
    product: {
      name: product.name,
      basePrice: product.basePrice,
      baseUnit: product.baseUnit
    },
    calculation,
    units,
    pricing: {
      basePrice: product.basePrice / 100,
      unitTotal: Math.round(product.basePrice * units) / 100,
      shippingPerUnit: product.shippingPricePerUnit ? product.shippingPricePerUnit / 100 : 0,
      shippingTotal: shippingTotal / 100,
      carrierBase: carrierBase / 100,
      total: total / 100
    },
    quantity,
    minQuantity: product.minOrderQuantity
  }
})
