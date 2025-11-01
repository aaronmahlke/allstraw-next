import { users } from "~~/server/database/schema"
import { z } from "zod"

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().optional(),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  role: z.enum(["admin", "sales", "customer"])
})

export default defineEventHandler(async (event) => {
  const { secure } = await requireUserSession(event)
  if (!secure) throw createError({ statusCode: 401, statusMessage: "Unauthorized" })

  // Role-based permissions
  if (secure.role === "customer") {
    throw createError({ statusCode: 403, statusMessage: "Access denied" })
  }

  const body = await readBody(event)
  const validatedData = createUserSchema.parse(body)

  // Additional role restrictions
  if (secure.role === "sales" && validatedData.role !== "customer") {
    throw createError({
      statusCode: 403,
      statusMessage: "Sales representatives can only create customers"
    })
  }

  try {
    const [newUser] = await useDrizzle()
      .insert(users)
      .values({
        name: validatedData.name,
        surname: validatedData.surname,
        email: validatedData.email,
        phone: validatedData.phone,
        role: validatedData.role,
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
        createdAt: users.createdAt
      })

    return { user: newUser }
  } catch (error: any) {
    if (error.code === "23505" && error.constraint?.includes("email")) {
      throw createError({
        statusCode: 400,
        statusMessage: "A user with this email already exists"
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create user"
    })
  }
})
