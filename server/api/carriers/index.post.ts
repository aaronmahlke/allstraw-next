import { carriers } from "~~/server/database/schema"
import { z } from "zod"

const createCarrierSchema = z.object({
  name: z.string().min(1),
  basePrice: z.number().int().min(0)
})

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  if (secure.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Admin access required" })
  }

  const body = await readBody(event)
  const validatedData = createCarrierSchema.parse(body)

  const [carrier] = await useDrizzle()
    .insert(carriers)
    .values({
      ...validatedData,
      organisationId: secure.organisationId
    })
    .returning()

  return { carrier }
})
