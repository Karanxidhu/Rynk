import { useEffect, useState, useMemo, useRef } from "react"
import { View, Text, FlatList, Dimensions, Pressable } from "react-native"
import { RouteProp, useNavigation } from "@react-navigation/native"
import Mapbox from "@rnmapbox/maps"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, { useSharedValue, useAnimatedStyle, withSpring, clamp, withRepeat, withTiming, Easing } from "react-native-reanimated"
import Geolocation from "@react-native-community/geolocation"

import { RootStackParamList } from "../navigation/types"
import { useRideStore } from "../store/rideStore"
import { MAPBOX_ACCESS_TOKEN } from "@env"

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN)

const SCREEN_HEIGHT = Dimensions.get("window").height
const MIN_PANEL = SCREEN_HEIGHT * 0.20
const MAX_PANEL = SCREEN_HEIGHT * 0.35
const SNAP_THRESHOLD = (MIN_PANEL + MAX_PANEL) / 2

type RideRoomRouteProp = RouteProp<
  RootStackParamList,
  "RideRoom"
>

type Props = {
  route: RideRoomRouteProp
}

function PulseMarker({ isLeader }: { isLeader?: boolean }) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0.4)

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    )
    opacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const color = isLeader ? "#f59e0b" : "#22c55e"
  const label = isLeader ? "LDR" : "YOU"

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 44, height: 44 }}>
      {/* Static Inner Ring */}
      <View style={{ position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: `${color}33`, borderWidth: 2, borderColor: `${color}66` }} />
      {/* Animated Ripple */}
      <Animated.View style={[{ position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: color }, animatedStyle]} />
      {/* Core Dot */}
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color, borderWidth: 3, borderColor: "#18181b", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "bold" }}>{label}</Text>
      </View>
    </View>
  )
}

export default function RideRoomScreen({ route }: Props) {
  const { roomId, riderId } = route.params
  const navigation = useNavigation()

  const riders = useRideStore((s) => s.riders)
  const isLoading = useRideStore((s) => s.isLoading)
  const isSharingLocation = useRideStore((s) => s.isSharingLocation)
  const initRoom = useRideStore((s) => s.initRoom)
  const leaveRoom = useRideStore((s) => s.leaveRoom)
  const startLocationSharing = useRideStore((s) => s.startLocationSharing)
  const toggleLocationSharing = useRideStore((s) => s.toggleLocationSharing)

  // Leader tracking
  const [leaderId, setLeaderId] = useState<string | null>(null)

  // Panel height as a shared value for 60fps animation
  const panelHeight = useSharedValue(MAX_PANEL)
  const startHeight = useSharedValue(MAX_PANEL)

  // Navigation mode state (centers and rotates map with user)
  const [isNavigating, setIsNavigating] = useState(false)
  const cameraRef = useRef<Mapbox.Camera>(null)

  // Initial camera center — set once from user GPS on mount
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null)

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setInitialCenter([position.coords.longitude, position.coords.latitude])
      },
      () => {
        setInitialCenter([77.69735317483831, 12.93025742029852])
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )

    initRoom(roomId)

    const timer = setTimeout(() => {
      startLocationSharing(roomId, riderId)
    }, 1500)

    return () => {
      clearTimeout(timer)
      leaveRoom()
    }
  }, [roomId])

  const ridersList = Object.values(riders)

  // Real navigation route coordinates
  const [routeCoords, setRouteCoords] = useState<number[][] | null>(null)
  const lastFetchTime = useRef<number>(0)

  // Fetch real route from Mapbox Directions API
  useEffect(() => {
    if (!leaderId) {
      setRouteCoords(null)
      return
    }

    const me = riders[riderId]
    const leader = riders[leaderId]
    
    if (!me || !leader) return

    const fetchRoute = async () => {
      // Throttle API calls to max one per 2 seconds to avoid limit exhaustion
      const now = Date.now()
      if (now - lastFetchTime.current < 2000) return
      lastFetchTime.current = now

      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${me.lng},${me.lat};${leader.lng},${leader.lat}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`
        const response = await fetch(url)
        const json = await response.json()

        if (json.routes && json.routes.length > 0) {
          setRouteCoords(json.routes[0].geometry.coordinates)
        }
      } catch (err) {
        console.warn("[Mapbox] Failed to fetch route:", err)
      }
    }

    fetchRoute()
  }, [leaderId, riders[riderId]?.lat, riders[riderId]?.lng, leaderId ? riders[leaderId]?.lat : undefined, leaderId ? riders[leaderId]?.lng : undefined])

  // Build the navigation line GeoJSON from the fetched route
  const navigationLine = useMemo(() => {
    if (!routeCoords || routeCoords.length === 0) return null

    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: routeCoords,
          },
        },
      ],
    }
  }, [routeCoords])

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startHeight.value = panelHeight.value
    })
    .onUpdate((event) => {
      const newHeight = startHeight.value - event.translationY
      panelHeight.value = clamp(newHeight, MIN_PANEL, MAX_PANEL)
    })
    .onEnd(() => {
      panelHeight.value = withSpring(
        panelHeight.value > SNAP_THRESHOLD ? MAX_PANEL : MIN_PANEL,
        { damping: 20, stiffness: 200 }
      )
    })

  const animatedPanelStyle = useAnimatedStyle(() => ({
    height: panelHeight.value,
  }))

  const handleRiderPress = (pressedRiderId: string) => {
    if (pressedRiderId === riderId) return // Can't follow yourself
    
    setLeaderId((prev) => {
      if (prev === pressedRiderId) {
        setIsNavigating(false)
        return null
      }
      setIsNavigating(true) // Auto-start navigation mode when selecting a new leader
      return pressedRiderId
    })
  }

  // Trigger camera reset animation when navigation is turned off
  useEffect(() => {
    if (!isNavigating && initialCenter) {
      const me = riders[riderId]
      const targetCenter = me ? [me.lng, me.lat] : initialCenter
      
      // Short delay allows the native module to process the followUserLocation disable
      // before we fire the reset animation, preventing a race condition where it gets ignored.
      setTimeout(() => {
        cameraRef.current?.setCamera({
          centerCoordinate: targetCenter,
          zoomLevel: 14,
          pitch: 0,
          heading: 0,
          animationDuration: 1000,
          animationMode: "easeTo",
        })
      }, 100)
    }
  }, [isNavigating])

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Back Button */}
      <Pressable
        onPress={() => navigation.goBack()}
        className="absolute top-14 left-5 z-50 bg-zinc-900/90 border border-zinc-800 w-11 h-11 rounded-full items-center justify-center"
      >
        <Text className="text-white text-lg font-bold">←</Text>
      </Pressable>

      {/* Location Sharing Toggle */}
      <Pressable
        onPress={() => toggleLocationSharing(roomId, riderId)}
        className={`absolute top-14 right-5 z-50 border px-4 h-11 rounded-full flex-row items-center justify-center ${
          isSharingLocation
            ? "bg-indigo-500/90 border-indigo-400/50"
            : "bg-zinc-900/90 border-zinc-800"
        }`}
      >
        <View className={`w-2.5 h-2.5 rounded-full mr-2 ${
          isSharingLocation ? "bg-green-400" : "bg-zinc-500"
        }`} />
        <Text className={`text-sm font-semibold ${
          isSharingLocation ? "text-white" : "text-zinc-400"
        }`}>
          {isSharingLocation ? "Live" : "Paused"}
        </Text>
      </Pressable>

      {/* Leader indicator */}
      {leaderId && riders[leaderId] && (
        <View className="absolute top-28 left-0 right-0 z-50 items-center">
          <View className="bg-amber-500/90 px-4 py-2 rounded-full flex-row items-center shadow-lg">
            <View className="w-2 h-2 rounded-full bg-white mr-2" />
            <Text className="text-white text-sm font-semibold">
              Following {leaderId}
            </Text>
            <Pressable onPress={() => {
              setLeaderId(null)
              setIsNavigating(false)
            }} className="ml-2 px-1">
              <Text className="text-white/70 text-sm font-bold">✕</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Recenter Button (shows when following but user panned away) */}
      {leaderId && !isNavigating && (
        <Pressable
          onPress={() => setIsNavigating(true)}
          className="absolute bottom-[38%] right-5 z-50 bg-indigo-500 w-14 h-14 rounded-full items-center justify-center shadow-lg border-[3px] border-zinc-900"
        >
          <View className="w-6 h-6 rounded-full border-2 border-white items-center justify-center">
            <View className="w-2 h-2 rounded-full bg-white" />
          </View>
        </Pressable>
      )}

      {/* Full-screen Map */}
      <Mapbox.MapView 
        style={{ flex: 1 }} 
        styleURL={Mapbox.StyleURL.Dark}
        onPress={() => {
          // If user interacts with map, break navigation lock
          if (isNavigating) setIsNavigating(false)
        }}
        onMapIdle={() => {}}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={initialCenter ? {
            zoomLevel: 14,
            centerCoordinate: initialCenter,
            pitch: 0,
            heading: 0,
          } : undefined}
          followUserLocation={isNavigating}
          followUserMode={isNavigating ? Mapbox.UserTrackingMode.FollowWithCourse : undefined}
          followZoomLevel={isNavigating ? 17.5 : undefined}
          followPitch={isNavigating ? 60 : undefined}
          onUserTrackingModeChange={(e) => {
            // Mapbox fires this when the user breaks the follow lock by panning
            if (!e.nativeEvent.payload.followUserLocation && isNavigating) {
              setIsNavigating(false)
            }
          }}
        />

        {/* Navigation line from user to leader */}
        {navigationLine && (
          <Mapbox.ShapeSource id="navigationLine" shape={navigationLine}>
            <Mapbox.LineLayer
              id="navigationLineLayer"
              style={{
                lineColor: "#f59e0b",
                lineWidth: 3,
                lineDasharray: [2, 2],
                lineCap: "round",
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Rider markers */}
        {ridersList.map((rider) => {
          const isMe = rider.riderId === riderId
          const isLeader = rider.riderId === leaderId
          return (
            <Mapbox.MarkerView
              key={rider.riderId}
              id={rider.riderId}
              coordinate={[rider.lng, rider.lat]}
            >
              {isMe ? (
                <PulseMarker />
              ) : isLeader ? (
                <PulseMarker isLeader={true} />
              ) : (
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#6366f1", borderWidth: 3, borderColor: "#18181b", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
                    {rider.riderId.substring(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
            </Mapbox.MarkerView>
          )
        })}
      </Mapbox.MapView>

      {/* Draggable Floating Bottom Panel */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(9, 9, 11, 0.92)",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: "rgba(63, 63, 70, 0.5)",
          },
          animatedPanelStyle,
        ]}
      >
        {/* Drag Handle */}
        <GestureDetector gesture={panGesture}>
          <Animated.View className="items-center pt-3 pb-4">
            <View className="w-10 h-1.5 bg-zinc-600 rounded-full" />
          </Animated.View>
        </GestureDetector>

        {/* Modern Header */}
        <View className="px-5 pb-4 flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center mb-1">
              <View className="bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 mr-3">
                <Text className="text-indigo-400 font-bold text-lg tracking-widest">
                  {roomId}
                </Text>
              </View>
              {isLoading ? (
                <View className="flex-row items-center bg-zinc-800/80 px-2.5 py-1 rounded-md">
                  <View className="w-1.5 h-1.5 rounded-full bg-zinc-400 mr-2" />
                  <Text className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Connecting</Text>
                </View>
              ) : (
                <View className="flex-row items-center bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20">
                  <View className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2" />
                  <Text className="text-green-400 text-xs font-semibold uppercase tracking-wider">Live</Text>
                </View>
              )}
            </View>
            <Text className="text-zinc-500 text-xs font-medium">
              {ridersList.length} {ridersList.length === 1 ? "rider" : "riders"} in room
            </Text>
          </View>
          
          {/* Optional: Add a subtle invite or share button here later if needed */}
          <View className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center">
             <Text className="text-zinc-400 text-lg">↑</Text>
          </View>
        </View>

        {/* Rider List */}
        <FlatList
          data={[...ridersList].sort((a, b) => {
            if (a.riderId === riderId) return 1
            if (b.riderId === riderId) return -1
            return 0
          })}
          keyExtractor={(item) => item.riderId}
          className="px-5"
          renderItem={({ item }) => {
            const isMe = item.riderId === riderId
            const isLeader = item.riderId === leaderId
            return (
              <Pressable onPress={() => handleRiderPress(item.riderId)}>
                <View className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border ${
                  isLeader
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-zinc-900/80 border-zinc-800/50"
                }`}>
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                      isMe ? "bg-green-500/20"
                      : isLeader ? "bg-amber-500/20"
                      : "bg-indigo-500/20"
                    }`}>
                      <Text className={`font-bold text-lg ${
                        isMe ? "text-green-400"
                        : isLeader ? "text-amber-400"
                        : "text-indigo-400"
                      }`}>
                        {item.riderId.substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white font-semibold text-base">{item.riderId}</Text>
                      <Text className={`text-xs mt-0.5 ${isLeader ? "text-amber-400" : "text-zinc-500"}`}>
                        {isMe ? "You" : isLeader ? "Leader" : "Tap to follow"}
                      </Text>
                    </View>
                  </View>
                  {!isMe && (
                    <View className="items-end bg-zinc-950 px-3 py-2 rounded-xl">
                      <Text className="text-zinc-300 text-sm font-medium">{Math.round(item.speed || 0)} <Text className="text-zinc-500 text-xs">mph</Text></Text>
                      <Text className="text-zinc-500 text-[10px] uppercase tracking-wider mt-1">{Math.round(item.heading || 0)}° HDG</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-zinc-500 text-sm">
                {isLoading ? "Loading riders..." : "No riders in this room yet"}
              </Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  )
}