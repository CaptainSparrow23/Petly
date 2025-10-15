import { MenuButton } from "@/components/MenuButton";
import { useGlobalContext } from "@/lib/global-provider";
import { useWeeklyFocusData } from "@/hooks/account";
import { Camera } from "lucide-react-native";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Account = () => {
  const { user } = useGlobalContext();
  const { weeklyData, loading, error, refetch } = useWeeklyFocusData();
  const screenWidth = Dimensions.get('window').width;

  // Calculate max minutes for chart scaling
  const maxMinutes = Math.max(...weeklyData.map(d => d.totalMinutes), 10); // Minimum 10 for better visual

  return (
    <SafeAreaView className="h-full bg-white">
      <MenuButton />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="pb-20 px-7"
        className="w-full px-4"
      >
        <View className="flex-row justify-center flex mt-5">
          <View className="flex flex-col items-center relative mt-5">
            <Image
              source={{ uri: user?.avatar }}
              className="size-44 relative rounded-full"
            />
            <TouchableOpacity className="absolute bottom-11 right-2 bg-white rounded-full p-2 shadow-md">
              <Camera size={20} color="#000" />
            </TouchableOpacity>
            <Text className="text-2xl top-3 font-rubik-bold mt-2">{user?.name}</Text>
          </View>
        </View>

        {/* Weekly Focus Chart Section */}
        <View className="mt-10 bg-gray-50 rounded-2xl p-6">
          <Text className="text-xl font-rubik-bold mb-4 text-center">Weekly Focus Time</Text>
          
          {loading ? (
            <View className="flex-row justify-center py-8">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="ml-2 text-gray-600">Loading...</Text>
            </View>
          ) : error ? (
            <View className="py-8">
              <Text className="text-red-500 text-center mb-2">Error loading data</Text>
              <Text className="text-gray-600 text-center text-sm">{error}</Text>
              <TouchableOpacity 
                onPress={refetch}
                className="bg-blue-500 rounded-lg px-4 py-2 mt-3 self-center"
              >
                <Text className="text-white font-rubik-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Chart */}
              <View className="flex-row items-end justify-between h-40 mb-4 px-2">
                {weeklyData.map((day, index) => {
                  const barHeight = maxMinutes > 0 ? (day.totalMinutes / maxMinutes) * 120 : 0;
                  
                  return (
                    <View key={day.date} className="flex-1 items-center mx-1">
                      {/* Bar */}
                      <View 
                        className="bg-blue-500 rounded-t-md w-8 mb-2"
                        style={{ 
                          height: Math.max(barHeight, day.totalMinutes > 0 ? 8 : 2),
                          backgroundColor: day.totalMinutes > 0 ? '#2563eb' : '#e5e7eb'
                        }}
                      />
                      
                      {/* Minutes label */}
                      <Text className="text-xs text-gray-600 mb-1">
                        {day.totalMinutes}m
                      </Text>
                      
                      {/* Day label */}
                      <Text className="text-xs font-rubik-medium text-gray-800">
                        {day.dayName}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Weekly Stats */}
              <View className="bg-white rounded-xl p-4 mt-4">
                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600">Total Week</Text>
                    <Text className="text-lg font-rubik-bold text-blue-600">
                      {Math.floor(weeklyData.reduce((sum, day) => sum + day.totalMinutes, 0))} mins
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600">Best Day</Text>
                    <Text className="text-lg font-rubik-bold text-green-600">
                      {Math.max(...weeklyData.map(d => d.totalMinutes))} mins
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600">Avg/Day</Text>
                    <Text className="text-lg font-rubik-bold text-orange-600">
                      {Math.floor(weeklyData.reduce((sum, day) => sum + day.totalMinutes, 0) / 7)} mins
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <View className="flex-1 mt-10 border-t border-gray-200"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;
