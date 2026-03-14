import { Text, Pressable, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useNavigation } from "@react-navigation/native"

import { RootStackParamList } from "../navigation/types"

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>

export default function HomeScreen() {

  const navigation = useNavigation<NavigationProp>()

  const joinRide = () => {

    navigation.navigate("RideRoom", {
      roomId: "ride123",
      riderId: "userABC"
    })

  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1 items-center justify-center px-6">
        
        {/* Header Section */}
        <View className="items-center mb-12">
          <View className="bg-blue-500/20 px-4 py-1.5 rounded-full mb-4">
            <Text className="text-blue-400 font-medium tracking-wide text-sm uppercase">
              Live Tracking
            </Text>
          </View>
          <Text className="text-white text-5xl font-extrabold tracking-tight text-center">
            Rynk
          </Text>
          <Text className="text-zinc-400 text-lg mt-3 text-center max-w-[280px]">
            Join your community ride and share your location in real-time.
          </Text>
        </View>

        {/* Action Button */}
        <Pressable
          onPress={joinRide}
          className="w-full bg-blue-600 active:bg-blue-700 active:scale-95 transition-all duration-200 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/30"
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            Join Ride Room
          </Text>
        </Pressable>

        {/* Secondary Info */}
        <Text className="text-zinc-500 text-sm mt-8 text-center">
          Tap to enter room ride123
        </Text>

      </View>
    </SafeAreaView>
  )

}