import { users } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  // Only sales and admin can access customers
  if (secure.role === "customer") {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  let customerList

  if (secure.role === "admin") {
    // Admins can see all customers in their organization
    customerList = await useDrizzle()
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        phone: users.phone,
        role: users.role,
        companyId: users.companyId,
        createdBySalesId: users.createdBySalesId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(
        and(
          eq(users.organisationId, secure.organisationId),
          eq(users.role, "customer")
        )
      )
      .orderBy(users.name)
  } else if (secure.role === "sales") {
    // Sales reps can only see customers they created
    customerList = await useDrizzle()
      .select({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        phone: users.phone,
        role: users.role,
        companyId: users.companyId,
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

  return { customers: customerList }
})
