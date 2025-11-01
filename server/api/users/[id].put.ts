import { users } from "~~/server/database/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().optional(),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  role: z.enum(["admin", "sales", "customer"])
})

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

  const body = await readBody(event)
  const validatedData = updateUserSchema.parse(body)

  // Additional role restrictions
  if (secure.role === "sales" && validatedData.role !== "customer") {
    throw createError({
      statusCode: 403,
      statusMessage: "Sales representatives can only manage customers"
    })
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

  // Sales reps can only update their own customers
  if (secure.role === "sales" && existingUser.createdBySalesId !== secure.userId) {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  try {
    const [updatedUser] = await useDrizzle()
      .update(users)
      .set({
        name: validatedData.name,
        surname: validatedData.surname,
        email: validatedData.email,
        phone: validatedData.phone,
        role: validatedData.role,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        surname: users.surname,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })

    return { user: updatedUser }
  } catch (error: any) {
    if (error.code === "23505" && error.constraint?.includes("email")) {
      throw createError({
        statusCode: 400,
        statusMessage: "A user with this email already exists"
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update user"
    })
  }
})
