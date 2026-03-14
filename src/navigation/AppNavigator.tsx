import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import HomeScreen from "../screens/HomeScreen"
import RideRoomScreen from "../screens/RideRoomScreen"

import { RootStackParamList } from "./types"

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {

  return (
    <NavigationContainer>

      <Stack.Navigator
        screenOptions={{
          headerShown: false
        }}
      >

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        <Stack.Screen
          name="RideRoom"
          component={RideRoomScreen}
        />

      </Stack.Navigator>

    </NavigationContainer>
  )

}