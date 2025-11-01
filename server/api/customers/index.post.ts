import { users } from "~~/server/database/schema"
import { z } from "zod"

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().optional(),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  companyId: z.string().uuid().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  // Only sales and admin can create customers
  if (secure.role === "customer") {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  const body = await readBody(event)
  const validatedData = createCustomerSchema.parse(body)

  try {
    const [newCustomer] = await useDrizzle()
      .insert(users)
      .values({
        name: validatedData.name,
        surname: validatedData.surname,
        email: validatedData.email,
        phone: validatedData.phone,
        role: "customer", // Always customer
        companyId: validatedData.companyId,
        organisationId: secure.organisationId,
        createdBySalesId: secure.role === "sales" ? secure.userId : undefined
      })
      .returning({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        phone: users.phone,
        role: users.role,
        companyId: users.companyId,
        createdAt: users.createdAt
      })

    return { customer: newCustomer }
  } catch (error: any) {
    if (error.code === "23505" && error.constraint?.includes("email")) {
      throw createError({
        statusCode: 400,
        statusMessage: "A customer with this email already exists"
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create customer"
    })
  }
})
