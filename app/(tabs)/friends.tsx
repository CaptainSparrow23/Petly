import { MenuButton } from '@/components/other/MenuButton'
import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Friends = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="w-full flex-row items-center justify-between px-6 pt-4">
        <MenuButton />
        <View className="w-12" />
      </View>
      <View className="flex-1 justify-center items-center">
        <Text>Friends List</Text>
      </View>
    </SafeAreaView>
  )
}

export default Friends
