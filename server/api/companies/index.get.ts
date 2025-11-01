import { companies } from "~~/server/database/schema"
import { eq, and, ilike } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  // Only sales and admin can access companies
  if (secure.role === "customer") {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  const query = getQuery(event)
  const search = query.search as string

  let companyList

  if (search) {
    // Search companies by name
    companyList = await useDrizzle()
      .select({
        id: companies.id,
        name: companies.name,
        createdBySalesId: companies.createdBySalesId,
        createdAt: companies.createdAt
      })
      .from(companies)
      .where(
        and(
          eq(companies.organisationId, secure.organisationId),
          ilike(companies.name, `%${search}%`)
        )
      )
      .orderBy(companies.name)
      .limit(10)
  } else {
    // List all companies
    companyList = await useDrizzle()
      .select({
        id: companies.id,
        name: companies.name,
        createdBySalesId: companies.createdBySalesId,
        createdAt: companies.createdAt
      })
      .from(companies)
      .where(eq(companies.organisationId, secure.organisationId))
      .orderBy(companies.name)
  }

  // Sales reps can only see companies they created
  if (secure.role === "sales") {
    companyList = companyList.filter(company => company.createdBySalesId === secure.userId)
  }

  return { companies: companyList }
})
