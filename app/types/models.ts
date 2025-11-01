import type {
  organisations,
  users,
  products,
  carriers,
  offers,
  offerItems,
  orders,
  orderItems,
  cartItems,
  addresses
} from "~~/server/database/schema"

export type DOrganisation = typeof organisations.$inferSelect
export type DUser = typeof users.$inferSelect
export type DAddress = typeof addresses.$inferSelect

export type DProduct = typeof products.$inferSelect
export type DProductCreate = typeof products.$inferInsert

export type DCarrier = typeof carriers.$inferSelect

export type DOffer = typeof offers.$inferSelect
export type DOfferItem = typeof offerItems.$inferSelect

export type DOrder = typeof orders.$inferSelect
export type DOrderItem = typeof orderItems.$inferSelect

export type DCartItem = typeof cartItems.$inferSelect

// Composite types for API responses
export type DProductWithCarrier = DProduct & {
  carrierName?: string | null
}

export type DOfferWithItems = DOffer & {
  items: DOfferItem[]
}

export type DOrderWithItems = DOrder & {
  items: DOrderItem[]
}
