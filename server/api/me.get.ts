import { organisations, users } from "~~/server/database/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const { secure } = await requireUserSession(event);
    if (!secure)
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const [user] = await useDrizzle()
        .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            organisationId: organisations.id,
            organisationName: organisations.name,
        })
        .from(users)
        .innerJoin(organisations, eq(organisations.id, users.organisationId))
        .where(eq(users.id, secure.userId));
    return user;
});
