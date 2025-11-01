import { users } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  let userList

  if (secure.role === "admin") {
    // Admins can see all users in their organization
    userList = await useDrizzle()
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdBySalesId: users.createdBySalesId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.organisationId, secure.organisationId))
      .orderBy(users.name)
  } else if (secure.role === "sales") {
    // Sales reps can only see customers they created
    userList = await useDrizzle()
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdBySalesId: users.createdBySalesId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(
        and(
          eq(users.organisationId, secure.organisationId),
          eq(users.createdBySalesId, secure.userId),
          eq(users.role, "customer")
        )
      )
      .orderBy(users.name)
  } else {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  return { users: userList }
})
