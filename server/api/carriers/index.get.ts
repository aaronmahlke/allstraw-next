import { carriers } from "~~/server/database/schema"
import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  const carrierList = await useDrizzle()
    .select({
      id: carriers.id,
      name: carriers.name,
      basePrice: carriers.basePrice,
      createdAt: carriers.createdAt,
      updatedAt: carriers.updatedAt
    })
    .from(carriers)
    .where(eq(carriers.organisationId, secure.organisationId))
    .orderBy(carriers.name)

  return { carriers: carrierList }
})
