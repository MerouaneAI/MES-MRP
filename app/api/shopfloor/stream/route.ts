import { auth } from "@/auth"
import { makeSubscriber, SHOPFLOOR_CHANNEL } from "@/lib/redis"

export const dynamic = "force-dynamic" // Trap #11: never statically cache a stream

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const encoder = new TextEncoder()
  const subscriber = makeSubscriber() // Trap #10: each stream needs its OWN connection

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(data))
      send(`retry: 3000\n\n`) // tell the browser how fast to reconnect

      await subscriber.subscribe(SHOPFLOOR_CHANNEL)
      subscriber.on("message", (_channel, message) => {
        send(`event: shopfloor\ndata: ${message}\n\n`)
      })

      // Heartbeat so proxies don't drop the idle connection.
      const heartbeat = setInterval(() => send(`: ping\n\n`), 15000)

      // Clean up when the client disconnects (Trap #11).
      const close = async () => {
        clearInterval(heartbeat)
        try { await subscriber.unsubscribe(SHOPFLOOR_CHANNEL) } catch {}
        subscriber.disconnect()
        try { controller.close() } catch {}
      }
      req.signal.addEventListener("abort", close)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
