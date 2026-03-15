import { useState } from "react"
import { View, Text, TextInput, Pressable, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { RootStackParamList } from "../navigation/types"
import { useRideStore } from "../store/rideStore"
import { getApiBaseUrl, setApiBaseUrl } from "../config/api"

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>()

  // Global store
  const localRiderId = useRideStore((state) => state.localRiderId)
  const setLocalRiderId = useRideStore((state) => state.setLocalRiderId)

  // Local editable state
  const [draftName, setDraftName] = useState(localRiderId)
  const [backendUrl, setBackendUrl] = useState(getApiBaseUrl())

  const handleSave = () => {
    const trimmedBackend = backendUrl.trim()
    if (!trimmedBackend) {
      Alert.alert("Invalid backend URL", "Backend URL cannot be empty.")
      return
    }

    const finalName = draftName.trim() || "Rider"
    setLocalRiderId(finalName)
    setApiBaseUrl(trimmedBackend)
    navigation.goBack()
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <SafeAreaView className="flex-1">
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-6 border-b border-zinc-800">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-zinc-900 active:bg-zinc-800"
          >
            <Text className="text-white text-lg font-bold">←</Text>
          </Pressable>

          <Text className="text-white text-lg font-bold tracking-wide">
            Profile Settings
          </Text>

          <View className="w-10" />
        </View>

        <View className="px-5 pt-8">
          
          {/* Section Label */}
          <Text className="text-zinc-400 font-medium text-sm mb-3 ml-1 uppercase tracking-widest">
            Rider Profile
          </Text>

          {/* Name Card */}
          <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 mb-8">
            
            <Text className="text-white font-medium mb-3">
              Display Name
            </Text>

            <TextInput
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 text-white px-4 py-3 rounded-xl text-base font-medium"
              placeholder="Enter your rider name..."
              placeholderTextColor="#52525B"
              value={draftName}
              onChangeText={setDraftName}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={20}
            />

            <Text className="text-zinc-500 text-xs mt-3">
              This name will be visible to other riders in the room on the map and in the live list.
            </Text>

          </View>

          {/* Backend URL Section */}
          <Text className="text-zinc-400 font-medium text-sm mb-3 ml-1 uppercase tracking-widest">
            Backend
          </Text>

          <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800/50 mb-8">
            <Text className="text-white font-medium mb-3">
              Backend URL
            </Text>

            <TextInput
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 text-white px-4 py-3 rounded-xl text-base font-medium"
              placeholder="http://localhost:6000"
              placeholderTextColor="#52525B"
              value={backendUrl}
              onChangeText={setBackendUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text className="text-zinc-500 text-xs mt-3">
              Default comes from your `.env` file. Changes are kept in memory until the app restarts.
            </Text>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            className="w-full bg-indigo-500 active:bg-indigo-600 rounded-xl py-4 items-center justify-center"
          >
            <Text className="text-white font-bold text-lg">
              Save Profile
            </Text>
          </Pressable>

        </View>

      </SafeAreaView>
    </View>
  )
}