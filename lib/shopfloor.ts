import { redis, SHOPFLOOR_CHANNEL } from "./redis"

export type ShopFloorEvent =
  | { type: "work_order_released"; workOrderId: string }
  | { type: "work_order_completed"; workOrderId: string }
  | { type: "work_order_cancelled"; workOrderId: string }

export async function publishShopFloorEvent(event: ShopFloorEvent): Promise<void> {
  await redis.publish(SHOPFLOOR_CHANNEL, JSON.stringify(event))
}
