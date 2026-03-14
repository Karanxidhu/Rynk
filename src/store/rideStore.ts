import { create } from "zustand"
import Geolocation from "@react-native-community/geolocation"
import { RiderLocation, fetchRoomRiders, connectToRoom, sendLocationUpdate, disconnectSocket } from "../services/rideService"

type RideStore = {
  riders: Record<string, RiderLocation>
  isLoading: boolean
  error: string | null
  isSharingLocation: boolean
  
  /** The user's own profile name, saved locally */
  localRiderId: string
  setLocalRiderId: (id: string) => void

  /** Fetch initial riders from REST, then subscribe to WS updates */
  initRoom: (roomId: string) => Promise<void>

  /** Start sharing current GPS location: fast local updates + 5s WS sends */
  startLocationSharing: (roomId: string, riderId: string) => void

  /** Stop sharing location */
  stopLocationSharing: () => void

  /** Toggle location sharing */
  toggleLocationSharing: (roomId: string, riderId: string) => void

  /** Cleanup WS connection */
  leaveRoom: () => void
}

let watchId: number | null = null
let wsInterval: ReturnType<typeof setInterval> | null = null
let latestCoords: { lat: number; lng: number; heading?: number; speed?: number } | null = null

export const useRideStore = create<RideStore>((set, get) => ({
  riders: {},
  isLoading: false,
  error: null,
  isSharingLocation: false,
  localRiderId: "userABC", // default name

  setLocalRiderId: (id: string) => set({ localRiderId: id }),

  initRoom: async (roomId: string) => {
    set({ isLoading: true, error: null, riders: {} })

    try {
      const existingRiders = await fetchRoomRiders(roomId)
      const ridersMap: Record<string, RiderLocation> = {}
      existingRiders.forEach((r) => {
        ridersMap[r.riderId] = r
      })
      set({ riders: ridersMap, isLoading: false })
    } catch (err: any) {
      console.warn("[Store] Failed to fetch initial riders:", err.message)
      set({ isLoading: false })
    }

    connectToRoom(roomId, (data: RiderLocation) => {
      set((state) => ({
        riders: {
          ...state.riders,
          [data.riderId]: {
            ...state.riders[data.riderId],
            ...data,
          },
        },
      }))
    })
  },

  startLocationSharing: (roomId: string, riderId: string) => {
    // Clean up any existing watchers
    const { stopLocationSharing } = get()
    stopLocationSharing()

    set({ isSharingLocation: true })

    // 1. watchPosition for smooth local marker updates (~1-2s)
    watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords

        // Simulator returns -1 for unavailable values
        const validHeading = heading != null && heading >= 0 ? Math.round(heading) : 0
        const validSpeed = speed != null && speed >= 0 ? Math.round(speed * 2.237) : 0 // m/s → mph

        console.log(`[GPS] lat:${latitude.toFixed(5)} lng:${longitude.toFixed(5)} hdg:${validHeading} spd:${validSpeed}`)

        // Cache latest coords for the WS interval
        latestCoords = {
          lat: latitude,
          lng: longitude,
          heading: validHeading,
          speed: validSpeed,
        }

        // Update local store immediately for smooth marker movement
        set((state) => ({
          riders: {
            ...state.riders,
            [riderId]: {
              riderId,
              lat: latitude,
              lng: longitude,
              heading: validHeading,
              speed: validSpeed,
              updatedAt: Date.now(),
            },
          },
        }))
      },
      (error) => {
        console.warn("[Location] Watch error:", error.message)
      },
      { enableHighAccuracy: true, distanceFilter: 0, interval: 1000, fastestInterval: 1000 }
    )

    // 2. Send to WS every 5 seconds (separate from local updates)
    const sendToWS = () => {
      if (!latestCoords) return
      sendLocationUpdate(
        roomId,
        riderId,
        latestCoords.lat,
        latestCoords.lng,
        latestCoords.heading,
        latestCoords.speed
      )
      console.log(`[WS] Sent: ${latestCoords.lat.toFixed(6)}, ${latestCoords.lng.toFixed(6)}`)
    }

    // Send immediately, then every 5s
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords
        
        const validHeading = heading != null && heading >= 0 ? Math.round(heading) : 0
        const validSpeed = speed != null && speed >= 0 ? Math.round(speed * 2.237) : 0

        latestCoords = {
          lat: latitude,
          lng: longitude,
          heading: validHeading,
          speed: validSpeed,
        }
        sendToWS()
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )
    wsInterval = setInterval(sendToWS, 5000)
  },

  stopLocationSharing: () => {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId)
      watchId = null
    }
    if (wsInterval) {
      clearInterval(wsInterval)
      wsInterval = null
    }
    latestCoords = null
    set({ isSharingLocation: false })
    console.log("[Location] Sharing stopped")
  },

  toggleLocationSharing: (roomId: string, riderId: string) => {
    const { isSharingLocation, startLocationSharing, stopLocationSharing } = get()
    if (isSharingLocation) {
      stopLocationSharing()
    } else {
      startLocationSharing(roomId, riderId)
    }
  },

  leaveRoom: () => {
    const { stopLocationSharing } = get()
    stopLocationSharing()

    disconnectSocket()
    set({ riders: {}, isLoading: false, error: null, isSharingLocation: false })
  },
}))
