import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  Pressable,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { useRouter } from "expo-router";
const bg = require("../../assets/images/bg-main.jpg");

const home = () => {
  const [username, setUserName] = useState("");
  const router = useRouter();

  const handleSignInLink = () => {
    router.push("../screens/Login");
  };
  const handleSignUpLink = () => {
    router.push("../screens/SignUp");
  };

  const handleUserName = (event: any) => {
    console.log(event.currentTarget.value);
    setUserName(event.currentTarget.value);
    console.log(username);
  };
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Image - Responsive height */}
        <View className="relative">
          <Image
            source={bg}
            className="w-full opacity-80"
            style={{
              height: 280, // Base height for smaller screens
              minHeight: "35%", // Minimum 35% of screen height
              maxHeight: "45%", // Maximum 45% of screen height
            }}
            resizeMode="cover"
          />
        </View>

        {/* Main Content Container */}
        <View className="flex-1 min-h-[400px] bg-white rounded-t-3xl shadow-2xl -mt-8 sm:-mt-12 md:-mt-16">
          {/* Handle bar */}
          <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-6" />

          {/* Content wrapper with responsive padding */}
          <View className="flex-1 px-6 sm:px-8 md:px-10 pb-8">
            {/* Title Section */}
            <View className="items-center mb-6 sm:mb-8">
              <Text className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 text-center">
                Anonymous Vent
              </Text>
              <Text className="text-sm sm:text-base md:text-lg mt-4 sm:mt-6 text-center text-gray-600 leading-relaxed max-w-xs sm:max-w-sm md:max-w-md">
                Sometimes the best therapy is talking to someone who doesn't
                know your name.
              </Text>
            </View>

            {/* Buttons Section */}
            <View className="w-full max-w-sm mx-auto space-y-3 sm:space-y-4">
              <TouchableOpacity
                className="py-4 sm:py-5 px-6 rounded-2xl bg-[#835442] w-full shadow-lg active:scale-95 transition-transform"
                onPress={handleSignInLink}
              >
                <Text className="text-lg sm:text-xl text-white text-center font-medium">
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-4 sm:py-5 px-6 rounded-2xl border-2 border-[#a76c55] bg-white w-full shadow-sm active:scale-95 transition-transform"
                onPress={handleSignUpLink}
              >
                <Text className="text-lg sm:text-xl text-[#835442] text-center font-medium">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Section - Responsive spacing */}
            <View className="flex-1 justify-end min-h-[60px]">
              <View className="flex-row items-center justify-center mt-6 sm:mt-8">
                <View className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#835442] rounded-full mr-2" />
                <Text className="text-xs sm:text-sm text-gray-500 text-center">
                  Safe • Anonymous • Confidential
                </Text>
                <View className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#835442] rounded-full ml-2" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default home;
