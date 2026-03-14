import { useState } from "react"
import { Text, Pressable, View, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useNavigation } from "@react-navigation/native"

import { RootStackParamList } from "../navigation/types"
import { useRideStore } from "../store/rideStore"

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>

export default function HomeScreen() {

  const navigation = useNavigation<NavigationProp>()
  const [roomId, setRoomId] = useState("")
  const localRiderId = useRideStore((state) => state.localRiderId)

  const joinRide = () => {
    
    // Default to 'ride123' if the user doesn't enter anything
    const finalRoomId = roomId.trim() || "ride123"

    navigation.navigate("RideRoom", {
      roomId: finalRoomId,
      riderId: localRiderId
    })

  }

  return (
    <View className="flex-1 bg-zinc-950">
      
      {/* Ambient Background Glow (Single Color) */}
      <View className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-50" />
      <View className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl opacity-30" />

      {/* Top Header Row with Settings Icon */}
      <View className="absolute top-14 right-5 z-50">
        <Pressable 
          onPress={() => navigation.navigate("Settings")}
          className="w-11 h-11 rounded-full items-center justify-center bg-zinc-900 border border-zinc-800"
        >
          {/* simple hamburger/settings lines */}
          <View className="w-5 h-0.5 bg-white mb-1" />
          <View className="w-5 h-0.5 bg-white mb-1" />
          <View className="w-5 h-0.5 bg-white" />
        </Pressable>
      </View>

      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 justify-center">
          
          {/* Header Section */}
          <View className="items-center mb-16">
            <View className="bg-indigo-500/10 border border-indigo-500/20 px-5 py-2 rounded-full mb-6">
              <Text className="text-indigo-400 font-semibold tracking-widest text-xs uppercase shadow-indigo-500/50">
                Sync Your Drive
              </Text>
            </View>

            <Text className="text-white text-6xl font-black tracking-tighter text-center">
              Rynk
            </Text>

            <Text className="text-zinc-400 text-base font-medium mt-2 text-center max-w-[280px]">
              Join your community ride and share your location in real-time.
            </Text>
          </View>

          {/* Input Section */}
          <View className="w-full mb-6">
            <Text className="text-zinc-400 font-medium text-sm mb-2 ml-1">
              Room ID
            </Text>
            <TextInput
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-white px-5 py-4 rounded-2xl text-lg font-medium shadow-sm transition-colors"
              placeholder="e.g. ride123"
              placeholderTextColor="#52525B"
              value={roomId}
              onChangeText={setRoomId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Action Button */}
          <Pressable
            onPress={joinRide}
            className="w-full bg-white active:bg-zinc-200 active:scale-[0.98] transition-all duration-200 py-4 rounded-2xl flex-row items-center justify-center shadow-xl shadow-white/10 overflow-hidden"
          >
            <Text className="text-zinc-950 font-bold text-lg tracking-wide">
              Join Ride Room
            </Text>
          </Pressable>

          {/* Secondary Info */}
          <Text className="text-zinc-600 font-medium text-xs mt-8 text-center uppercase tracking-widest">
            Secure • Real-time • Private
          </Text>

        </View>
      </SafeAreaView>
    </View>
  )

}