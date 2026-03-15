import { io, Socket } from "socket.io-client"
import { getApiBaseUrl } from "../config/api"

export type RiderLocation = {
  riderId: string
  lat: number
  lng: number
  heading?: number
  speed?: number
  updatedAt: number
}

let socket: Socket | null = null

/**
 * REST: Fetch all riders currently in a room from Redis store
 */
export async function fetchRoomRiders(roomId: string): Promise<RiderLocation[]> {
  const res = await fetch(`${getApiBaseUrl()}/room/${roomId}`)
  if (!res.ok) throw new Error(`Failed to fetch riders: ${res.status}`)
  return res.json()
}

/**
 * Connect to the WebSocket server and join a room.
 * Returns the socket instance for cleanup.
 */
export function connectToRoom(
  roomId: string,
  onRiderLocation: (data: RiderLocation) => void
): Socket {
  if (socket) {
    socket.disconnect()
  }

  socket = io(getApiBaseUrl(), { transports: ["websocket"] })

  socket.on("connect", () => {
    console.log("[WS] Connected:", socket?.id)
    socket?.emit("joinRide", { roomId })
  })

  socket.on("riderLocation", (data: RiderLocation) => {
    console.log("[WS] riderLocation received:", JSON.stringify(data))
    onRiderLocation(data)
  })

  socket.on("disconnect", () => {
    console.log("[WS] Disconnected")
  })

  socket.on("connect_error", (err) => {
    console.error("[WS] Connection error:", err.message)
  })

  return socket
}

/**
 * Send this rider's location update to the server
 */
export function sendLocationUpdate(
  roomId: string,
  riderId: string,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number
) {
  if (!socket?.connected) return
  socket.emit("locationUpdate", { roomId, riderId, lat, lng, heading, speed })
}

/**
 * Disconnect from the WebSocket server
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
