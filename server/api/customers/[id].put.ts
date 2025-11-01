import { users } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().optional(),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  companyId: z.string().uuid().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  // Only sales and admin can update customers
  if (secure.role === "customer") {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  const customerId = getRouterParam(event, "id")
  if (!customerId) {
    throw createError({ statusCode: 400, statusMessage: "Customer ID is required" })
  }

  const body = await readBody(event)
  const validatedData = updateCustomerSchema.parse(body)

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
      eq(users.role, "customer") // Ensure we're only updating customers
    ))

  if (!existingCustomer) {
    throw createError({ statusCode: 404, statusMessage: "Customer not found" })
  }

  // Sales reps can only update their own customers
  if (secure.role === "sales" && existingCustomer.createdBySalesId !== secure.userId) {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  try {
    const [updatedCustomer] = await useDrizzle()
      .update(users)
      .set({
        name: validatedData.name,
        surname: validatedData.surname,
        email: validatedData.email,
        phone: validatedData.phone,
        companyId: validatedData.companyId,
        updatedAt: new Date()
      })
      .where(eq(users.id, customerId))
      .returning({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        phone: users.phone,
        role: users.role,
        companyId: users.companyId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })

    return { customer: updatedCustomer }
  } catch (error: any) {
    if (error.code === "23505" && error.constraint?.includes("email")) {
      throw createError({
        statusCode: 400,
        statusMessage: "A customer with this email already exists"
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update customer"
    })
  }
})
