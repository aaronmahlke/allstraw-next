import { products, carriers } from "~~/server/database/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const { secure } = await requireUserSession(event);
    if (!secure)
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });

    const productList = await useDrizzle()
        .select({
            id: products.id,
            name: products.name,
            description: products.description,
            baseUnit: products.baseUnit,
            basePrice: products.basePrice,
            minOrderQuantity: products.minOrderQuantity,
            width: products.width,
            height: products.height,
            depth: products.depth,
            shippingPricePerUnit: products.shippingPricePerUnit,
            carrierName: carriers.name,
        })
        .from(products)
        .leftJoin(carriers, eq(carriers.id, products.carrierId))
        .where(eq(products.organisationId, secure.organisationId));

    return { products: productList };
});
