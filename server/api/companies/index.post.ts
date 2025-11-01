import { companies } from "~~/server/database/schema"
import { z } from "zod"

const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required")
})

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  // Only sales and admin can create companies
  if (secure.role === "customer") {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  const body = await readBody(event)
  const validatedData = createCompanySchema.parse(body)

  try {
    const [newCompany] = await useDrizzle()
      .insert(companies)
      .values({
        name: validatedData.name,
        organisationId: secure.organisationId,
        createdBySalesId: secure.userId
      })
      .returning({
        id: companies.id,
        name: companies.name,
        createdBySalesId: companies.createdBySalesId,
        createdAt: companies.createdAt
      })

    return { company: newCompany }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create company"
    })
  }
})
