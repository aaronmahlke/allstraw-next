import { carriers } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const updateCarrierSchema = z.object({
  name: z.string().min(1),
  basePrice: z.number().int().min(0)
})

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  if (secure.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Admin access required" })
  }

  const carrierId = getRouterParam(event, "id")
  if (!carrierId) {
    throw createError({ statusCode: 400, statusMessage: "Carrier ID is required" })
  }

  const body = await readBody(event)
  const validatedData = updateCarrierSchema.parse(body)

  // Check if carrier exists and belongs to the organization
  const [existingCarrier] = await useDrizzle()
    .select({ id: carriers.id })
    .from(carriers)
    .where(and(eq(carriers.id, carrierId), eq(carriers.organisationId, secure.organisationId)))

  if (!existingCarrier) {
    throw createError({ statusCode: 404, statusMessage: "Carrier not found" })
  }

  // Update the carrier
  const [updatedCarrier] = await useDrizzle()
    .update(carriers)
    .set({
      name: validatedData.name,
      basePrice: validatedData.basePrice
    })
    .where(eq(carriers.id, carrierId))
    .returning()

  return { carrier: updatedCarrier }
})
