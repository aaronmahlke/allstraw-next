import { users } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  if (secure.role === "customer") {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  const userId = getRouterParam(event, "id")
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "User ID is required" })
  }

  // Check if user exists and belongs to the organization
  const [existingUser] = await useDrizzle()
    .select({
      id: users.id,
      role: users.role,
      createdBySalesId: users.createdBySalesId
    })
    .from(users)
    .where(and(
      eq(users.id, userId),
      eq(users.organisationId, secure.organisationId)
    ))

  if (!existingUser) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  // Sales reps can only delete their own customers
  if (secure.role === "sales" && existingUser.createdBySalesId !== secure.userId) {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  // Prevent deletion of admins by non-admins
  if (existingUser.role === "admin" && secure.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Cannot delete admin users"
    })
  }

  // Prevent users from deleting themselves
  if (userId === secure.userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot delete your own account"
    })
  }

  try {
    await useDrizzle()
      .delete(users)
      .where(eq(users.id, userId))

    return { success: true }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to delete user"
    })
  }
})
