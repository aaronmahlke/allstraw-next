// allstraw/server/database/schema.ts
import { relations } from "drizzle-orm";
import {
    integer,
    numeric,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uuid,
    boolean,
    jsonb,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

type DimensionRange = {
    min: number;
    max: number;
    step: number;
} | null;

export const userRoleEnum = pgEnum("user_role", ["admin", "sales", "customer"]);

export const baseUnitEnum = pgEnum("base_unit", ["cm", "m", "piece"]);

export const offerStatusEnum = pgEnum("offer_status", [
    "draft",
    "sent",
    "accepted",
    "rejected",
    "expired",
]);

export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
]);

export const addressTypeEnum = pgEnum("address_type", [
    "shipping",
    "billing",
    "general",
]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type AddressType = (typeof addressTypeEnum.enumValues)[number];

const timestamps = {
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
    deletedAt: timestamp(),
};

const organisationId = {
    organisationId: uuid()
        .notNull()
        .references(() => organisations.id),
};

export const organisations = pgTable("organisations", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    name: text().notNull(),
    ...timestamps,
});

export const addresses = pgTable("addresses", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    customerId: uuid().references(() => users.id),
    address1: text().notNull(),
    address2: text(),
    address3: text(),
    city: text().notNull(),
    state: text().notNull(),
    zip: text().notNull(),
    country: text().notNull(),
    ...timestamps,
});

export const users = pgTable("users", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    name: text().notNull(),
    surname: text(),
    phone: text(),
    email: text().notNull().unique(),
    password: text(),
    role: userRoleEnum().notNull().default("customer"),
    resetPasswordToken: text(),
    resetPasswordTokenValidUntil: timestamp(),
    createdBySalesId: uuid(),
    commissionRate: numeric({ precision: 5, scale: 2 }), // e.g., 5.50 for 5.5%
    ...organisationId,
    ...timestamps,
});

export const sessions = pgTable("sessions", {
    token: text().primaryKey(),
    userId: uuid().references(() => users.id),
    ...timestamps,
});

export const carriers = pgTable("carriers", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    name: text().notNull(),
    basePrice: integer().notNull(),
    ...organisationId,
    ...timestamps,
});

export const products = pgTable("products", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    name: text().notNull(),
    description: text(),
    width: jsonb().$type<DimensionRange>(),
    height: jsonb().$type<DimensionRange>(),
    depth: jsonb().$type<DimensionRange>(),
    baseUnit: baseUnitEnum().notNull(),
    basePrice: integer().notNull(),
    minOrderQuantity: integer().notNull().default(1),
    shippingPricePerUnit: integer(),
    carrierId: uuid().references(() => carriers.id),
    ...organisationId,
    ...timestamps,
});

export const cartItems = pgTable("cart_items", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    userId: uuid()
        .notNull()
        .references(() => users.id),
    productId: uuid()
        .notNull()
        .references(() => products.id),
    width: numeric({ precision: 10, scale: 3 }).notNull(),
    height: numeric({ precision: 10, scale: 3 }).notNull(),
    depth: numeric({ precision: 10, scale: 3 }),
    quantity: integer().notNull().default(1),
    ...timestamps,
});

export const offers = pgTable("offers", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    customerId: uuid()
        .notNull()
        .references(() => users.id),
    createdBySalesId: uuid().notNull(),
    status: offerStatusEnum().notNull().default("draft"),
    subtotal: integer().notNull(),
    shippingCost: integer().notNull(),
    total: integer().notNull(),
    validUntil: timestamp(),
    notes: text(),
    ...organisationId,
    ...timestamps,
});

export const offerItems = pgTable("offer_items", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    offerId: uuid()
        .notNull()
        .references(() => offers.id),
    productId: uuid()
        .notNull()
        .references(() => products.id),
    width: numeric({ precision: 10, scale: 3 }).notNull(),
    height: numeric({ precision: 10, scale: 3 }).notNull(),
    depth: numeric({ precision: 10, scale: 3 }),
    quantity: integer().notNull(),
    unitPrice: integer().notNull(),
    lineTotal: integer().notNull(),
    ...timestamps,
});

export const orders = pgTable("orders", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    userId: uuid()
        .notNull()
        .references(() => users.id),
    offerId: uuid().references(() => offers.id),
    status: orderStatusEnum().notNull().default("pending"),
    subtotal: integer().notNull(),
    shippingCost: integer().notNull(),
    total: integer().notNull(),
    shippingAddress: jsonb().notNull(),
    ...timestamps,
});

export const orderItems = pgTable("order_items", {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    orderId: uuid()
        .notNull()
        .references(() => orders.id),
    productId: uuid()
        .notNull()
        .references(() => products.id),
    width: numeric({ precision: 10, scale: 3 }).notNull(),
    height: numeric({ precision: 10, scale: 3 }).notNull(),
    depth: numeric({ precision: 10, scale: 3 }),
    quantity: integer().notNull(),
    unitPrice: integer().notNull(),
    lineTotal: integer().notNull(),
    ...timestamps,
});

// Relations
export const carriersRelations = relations(carriers, ({ many }) => ({
    products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    carrier: one(carriers, {
        fields: [products.carrierId],
        references: [carriers.id],
    }),
    cartItems: many(cartItems),
    orderItems: many(orderItems),
    offerItems: many(offerItems),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
    createdBySales: one(users, {
        fields: [users.createdBySalesId],
        references: [users.id],
    }),
    cartItems: many(cartItems),
    orders: many(orders),
    offers: many(offers, {
        relationName: "customerOffers",
    }),
    createdOffers: many(offers, {
        relationName: "salesOffers",
    }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    user: one(users, {
        fields: [cartItems.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [cartItems.productId],
        references: [products.id],
    }),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
    customer: one(users, {
        fields: [offers.customerId],
        references: [users.id],
        relationName: "customerOffers",
    }),
    createdBySales: one(users, {
        fields: [offers.createdBySalesId],
        references: [users.id],
        relationName: "salesOffers",
    }),
    items: many(offerItems),
    orders: many(orders),
}));

export const offerItemsRelations = relations(offerItems, ({ one }) => ({
    offer: one(offers, {
        fields: [offerItems.offerId],
        references: [offers.id],
    }),
    product: one(products, {
        fields: [offerItems.productId],
        references: [products.id],
    }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    offer: one(offers, {
        fields: [orders.offerId],
        references: [offers.id],
    }),
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));
