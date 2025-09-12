import {
  SafeAreaView,
  TextInput,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUserName } from "../helpers/generateUserName";
import { useRouter } from "expo-router";
import { NGROK_BASE_URL } from "../helpers/proxyServer";

const Login = () => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // const NGROK_BASE_URL=`https://b701a39d2171.ngrok-free.app`

  const handleSignIn = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${NGROK_BASE_URL}/auth/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          payload: {
            name: username,
            password: password,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid login credentials");
      }

      const data = await response.json();
      console.log("Login response data:", data);
      const token = data?.data?.token;
      console.log("Extracted token:", token ? "Token found" : "Token missing");

      if (!token) throw new Error("No token received from server");

      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userName", username);

      console.log("Token stored successfully, attempting navigation...");

      try {
        router.push("/screens/Welcome");
        console.log("Navigation to Welcome screen initiated");
      } catch (navigationError) {
        console.error("Navigation error:", navigationError);
        Alert.alert(
          "Navigation Error",
          "Successfully logged in but failed to navigate to Welcome screen"
        );
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const data = [
    {
      id: "1",
      icon: <MaterialIcons name="chat" size={16} color="#835442" />,
      text: "Anonymous messaging",
    },
    {
      id: "2",
      icon: <Ionicons name="eye-off" size={16} color="#835442" />,
      text: "Private conversations",
    },
    {
      id: "3",
      icon: <FontAwesome name="users" size={16} color="#835442" />,
      text: "Connect with strangers",
    },
  ];

  const renderItems = ({ item }: any) => (
    <View className="flex-row items-center w-full">
      <View className="mr-3">{item.icon}</View>
      <Text className="text-[#f0d2b0]">{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Section */}
      <View className="h-1/3 relative bg-[#917053]">
        <View className="rounded-full absolute w-40 h-40 bg-[#ae906c] -top-14 -right-20 animate-pulse"></View>
        <View className="rounded-full absolute w-40 h-40 bg-[#a38765] -left-24 -bottom-5 animate-pulse"></View>
        <View className="justify-center items-center rounded-md mx-auto mt-4 bg-[#f0d2b0] w-1/4 h-24 shadow-md p-2">
          <MaterialCommunityIcons name="incognito" size={50} color="#835442" />
        </View>
        <View className="mt-2 justify-center items-center mx-auto">
          <FlatList
            data={data}
            renderItem={renderItems}
            keyExtractor={(item) => item.id}
          />
        </View>
      </View>

      {/* Login Section */}
      <View className="flex-1 justify-center w-full items-center -mt-14 bg-[#efedec] rounded-t-3xl">
        <View className="p-6 w-full">
          <View className="flex-col space-y-6 items-center">
            <Text className="text-2xl font-bold">Welcome Back</Text>
            <Text className="text-sm font-medium">
              Sign in to your anonymous space
            </Text>

            <View className="w-full">
              <Text className="text-lg mb-1">Username</Text>
              <TextInput
                placeholder={`Enter username here`}
                value={username}
                onChangeText={setUserName}
                className="px-4 py-4 mb-4 rounded-lg border w-full border-slate-300 focus:border-2 focus:border-blue-500"
              />

              <Text className="text-lg mb-1">Password</Text>
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                className="px-4 py-4 mb-3 rounded-lg border w-full border-slate-300 focus:border-2 focus:border-blue-500"
                secureTextEntry
              />
            </View>

            <Pressable
              onPress={handleSignIn}
              disabled={loading}
              className="bg-[#835442] rounded-md w-full p-4 items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">
                  Sign In Anonymously
                </Text>
              )}
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center space-x-2 w-full my-4">
              <View className="flex-1 h-px bg-[#aaa6a1]"></View>
              <Text className="text-gray-500">Or continue with</Text>
              <View className="flex-1 h-px bg-[#aaa6a1]"></View>
            </View>

            {/* Guest Login */}
            <TouchableOpacity className="p-4 rounded-lg bg-[#e4e4e4] w-full">
              <Text className="text-lg font-semibold text-[#835442] text-center">
                Guest
              </Text>
            </TouchableOpacity>

            {/* Reset Password */}
            <View className="flex-row w-full justify-between mt-10">
              <Text className="text-md text-[#835442]">
                Forgot your Password?
              </Text>
              <Text className="text-md underline text-[#835442]">
                Reset it here
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;
