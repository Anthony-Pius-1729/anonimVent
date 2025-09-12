import {
  SafeAreaView,
  TextInput,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateUserName } from "../helpers/generateUserName";
import { NGROK_BASE_URL } from "../helpers/proxyServer";

const SignUp = () => {
  const userName = generateUserName();
  const router = useRouter();

  const [username, setUserName] = useState(userName);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const data = [
    {
      id: "1",
      icon: <MaterialIcons name="chat" size={16} color={`#835442`} />,
      text: "Anonymous messaging",
    },
    {
      id: "2",
      icon: <Ionicons name="eye-off" size={16} color={`#835442`} />,
      text: "Private conversations",
    },
    {
      id: "3",
      icon: <FontAwesome name="users" size={16} color={`#835442`} />,
      text: "Connect with strangers",
    },
  ];

  const handleUserName = (text: string) => {
    setUserName(text);
  };

  const handlePassword = (text: string) => {
    setPassword(text);
  };

  const storeToken = async (token: string, user: any) => {
    try {
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));
    } catch (error) {
      console.error("Error storing token:", error);
    }
  };

  const handleSignUp = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      console.log("Starting to handle fetch");

      const res = await fetch(`${NGROK_BASE_URL}/auth/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          payload: {
            name: username.trim(),
            password: password,
          },
        }),
      });

      const data = await res.json();
      console.log("Response data:", data);

      if (!res.ok) {
        const errorMessage = data.error || `HTTP error! status: ${res.status}`;
        Alert.alert("Sign Up Failed", errorMessage);
        return;
      }

      if (data.error) {
        Alert.alert("Sign Up Failed", data.error);
        return;
      }

      if (data.token && data.user) {
        await storeToken(data.token, data.user);

        Alert.alert("Success", "Account created successfully!", [
          {
            text: "OK",
            onPress: () => router.push("/screens/Welcome"),
          },
        ]);
      } else {
        Alert.alert("Error", "Invalid response from server");
      }
    } catch (error) {
      console.error("Sign-up error:", error);
      Alert.alert(
        "Network Error",
        "Unable to connect to server. Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    Alert.alert(
      "Guest Access",
      "Continue as guest? You won't be able to save your conversations.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: () => router.push("/screens/Welcome"),
        },
      ]
    );
  };

  const renderItems = ({ item }: any) => {
    return (
      <View className="flex-row items-center w-full">
        <View className="mr-3">{item.icon}</View>
        <View className="text-base">
          <Text className="text-[#f0d2b0]">{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-1/3 relative bg-[#917053]">
        <View className="rounded-full absolute w-40 h-40 bg-[#ae906c] -top-14 -right-20 animate-pulse"></View>
        <View className="rounded-full absolute w-40 h-40 bg-[#a38765] -left-24 -bottom-5 animate-pulse"></View>
        <View className="justify-center items-center rounded-md mx-auto mt-4 bg-[#f0d2b0] w-1/4 h-24 shadow-md p-2">
          <MaterialCommunityIcons
            name="incognito"
            size={50}
            color={`#835442`}
          />
        </View>
        <View className="mt-2 justify-center items-center mx-auto">
          <FlatList
            data={data}
            renderItem={renderItems}
            keyExtractor={(item, index) => item.id ?? index.toString()}
          />
        </View>
      </View>

      <View className="flex-1 justify-center w-full items-center -mt-14 bg-[#efedec] rounded-t-3xl">
        <View className="p-6 w-full rounded-lg">
          <View className="flex-col justify-center space-y-20 items-center">
            <Text className="text-2xl font-bold mb-5">Welcome, Mortal!</Text>
            <Text className="text-sm font-medium mb-5">
              Sign Up to your anonymous space
            </Text>

            <View className="justify-start items-start w-full">
              <Text className="text-xl text-start mb-1">
                Username or UserID
              </Text>
              <TextInput
                placeholder={username}
                value={username}
                className="px-4 py-4 mb-4 rounded-lg border w-full border-slate-300 transition-all ease-linear focus:border-2 focus:border-blue-500"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text className="text-xl text-start mb-1">Password</Text>
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={handlePassword}
                className="px-4 py-4 mb-3 rounded-lg border w-full border-slate-300 transition-all ease-linear focus:border-2 focus:border-blue-500"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Pressable
              className={`rounded-md w-full p-4 items-center ${
                loading ? "bg-gray-400" : "bg-[#835442]"
              }`}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text className="text-white font-semibold">
                {loading ? "Signing Up..." : "Sign Up Anonymously"}
              </Text>
            </Pressable>

            <View className="flex-row justify-between items-center space-x-5 mt-5 w-full">
              <View className="flex-1 h-px bg-[#aaa6a1]"></View>
              <View>
                <Text className="mx-2">Or continue with</Text>
              </View>
              <View className="flex-1 h-px bg-[#aaa6a1]"></View>
            </View>

            <View className="w-full justify-center my-2">
              <TouchableOpacity
                className="p-4 rounded-lg bg-[#e4e4e4] mb-4"
                onPress={handleGuestLogin} // Fixed guest login handler
              >
                <Text className="text-lg font-semibold text-[#835442] text-center">
                  Continue as Guest
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignUp;
