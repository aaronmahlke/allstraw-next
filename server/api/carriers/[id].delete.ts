import { carriers } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"

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

  // Check if carrier exists and belongs to the organization
  const [existingCarrier] = await useDrizzle()
    .select({ id: carriers.id })
    .from(carriers)
    .where(and(
      eq(carriers.id, carrierId),
      eq(carriers.organisationId, secure.organisationId)
    ))

  if (!existingCarrier) {
    throw createError({ statusCode: 404, statusMessage: "Carrier not found" })
  }

  // Delete the carrier
  await useDrizzle()
    .delete(carriers)
    .where(eq(carriers.id, carrierId))

  return { success: true }
})
