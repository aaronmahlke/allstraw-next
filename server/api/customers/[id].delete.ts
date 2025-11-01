import { users } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  // Only sales and admin can delete customers
  if (secure.role === "customer") {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  const customerId = getRouterParam(event, "id")
  if (!customerId) {
    throw createError({ statusCode: 400, statusMessage: "Customer ID is required" })
  }

  // Check if customer exists and belongs to the organization
  const [existingCustomer] = await useDrizzle()
    .select({
      id: users.id,
      role: users.role,
      createdBySalesId: users.createdBySalesId
    })
    .from(users)
    .where(and(
      eq(users.id, customerId),
      eq(users.organisationId, secure.organisationId),
      eq(users.role, "customer") // Ensure we're only deleting customers
    ))

  if (!existingCustomer) {
    throw createError({ statusCode: 404, statusMessage: "Customer not found" })
  }

  // Sales reps can only delete their own customers
  if (secure.role === "sales" && existingCustomer.createdBySalesId !== secure.userId) {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  try {
    await useDrizzle()
      .delete(users)
      .where(eq(users.id, customerId))

    return { success: true }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete customer"
    })
  }
})
