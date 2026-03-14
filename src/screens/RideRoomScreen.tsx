import { View, Text } from "react-native"
import { RouteProp } from "@react-navigation/native"

import { RootStackParamList } from "../navigation/types"

type RideRoomRouteProp = RouteProp<
  RootStackParamList,
  "RideRoom"
>

type Props = {
  route: RideRoomRouteProp
}

export default function RideRoomScreen({ route }: Props) {

  const { roomId, riderId } = route.params

  return (
    <View className="flex-1 items-center justify-center bg-zinc-900">

      <Text className="text-white text-xl">
        Room: {roomId}
      </Text>

      <Text className="text-white mt-2">
        Rider: {riderId}
      </Text>

    </View>
  )

}