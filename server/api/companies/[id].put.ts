import { companies } from "~~/server/database/schema"
import { z } from "zod"
import { eq, and } from "drizzle-orm"

const updateCompanySchema = z.object({
  name: z.string().min(1, "Company name is required")
})

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  // Only sales and admin can update companies
  if (secure.role === "customer") {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  const companyId = getRouterParam(event, "id")
  if (!companyId) {
    throw createError({ statusCode: 400, statusMessage: "Company ID is required" })
  }

  const body = await readBody(event)
  const validatedData = updateCompanySchema.parse(body)

  try {
    // Check if company exists and belongs to user's organisation
    const [existingCompany] = await useDrizzle()
      .select()
      .from(companies)
      .where(
        and(
          eq(companies.id, companyId),
          eq(companies.organisationId, secure.organisationId)
        )
      )
      .limit(1)

    if (!existingCompany) {
      throw createError({ statusCode: 404, statusMessage: "Company not found" })
    }

    // Sales reps can only update companies they created
    if (secure.role === "sales" && existingCompany.createdBySalesId !== secure.userId) {
      throw createError({ statusCode: 403, statusMessage: "Access denied" })
    }

    // Update company
    const [updatedCompany] = await useDrizzle()
      .update(companies)
      .set({
        name: validatedData.name,
        updatedAt: new Date()
      })
      .where(eq(companies.id, companyId))
      .returning({
        id: companies.id,
        name: companies.name,
        createdBySalesId: companies.createdBySalesId,
        createdAt: companies.createdAt
      })

    return { company: updatedCompany }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update company"
    })
  }
})

