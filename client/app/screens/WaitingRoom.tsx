import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NGROK_BASE_URL } from "../helpers/proxyServer";
import io from "socket.io-client";

// Define types
interface User {
  id: string;
  name: string;
  role?: string;
}

interface MatchData {
  roomId: string;
  matchedWith: User;
  match: User;
  user: any;
}

const WaitingRoom = () => {
  const [socket, setSocket] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchStatus, setSearchStatus] = useState("Looking for a match...");
  const [matchFound, setMatchFound] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams();

  const { user, role, categories } = useLocalSearchParams();

  useEffect(() => {
    const initializeSocket = async () => {
      // Get user ID from AsyncStorage or params
      const userId = await AsyncStorage.getItem("userId");

      const userPayload = {
        id: userId, // Make sure to include user ID
        user: user,
        role: role,
        cat: categories,
      };

      console.log(
        `${user} whose role is ${role} with ${categories} is in the waiting room`
      );

      const newSocket = io(`${NGROK_BASE_URL}`, {
        transports: ["websocket", "polling"],
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to server with socket ID:", newSocket.id);

        // Authenticate user first
        if (userId) {
          newSocket.emit("authenticate", userId);
        }

        // Start looking for match
        newSocket.emit("findMatch", userPayload);
        console.log("Sent findMatch request with payload:", userPayload);
      });

      newSocket.on("searchingForMatch", (data) => {
        console.log("Searching for match:", data);
        setSearchStatus("Looking for a match...");
        setIsSearching(true);
      });

      newSocket.on("matchFound", (matchData: MatchData) => {
        console.log("Match found:", matchData);
        setMatchFound(true);
        setIsSearching(false);
        setSearchStatus("Match found! Connecting...");

        router.push({
          pathname: "/(tabs)/chat",
          params: {
            roomId: matchData.roomId,
            matchedUser: JSON.stringify(matchData.matchedWith),
            userRole: role,
          },
        });
      });

      newSocket.on("matchError", (error) => {
        console.log("Match error:", error);
        setSearchStatus("Error finding match. Please try again.");
        Alert.alert("Error", "Failed to find a match. Please try again.");
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server");
        setSearchStatus("Connection lost. Reconnecting...");
      });

      newSocket.on("connect_error", (error) => {
        console.log("Connection error:", error);
        setSearchStatus("Connection error. Please check your internet.");
      });
    };

    initializeSocket();

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const cancelSearch = () => {
    Alert.alert(
      "Cancel Search",
      "Are you sure you want to cancel your search?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            if (socket) {
              socket.disconnect();
            }
            router.back();
          },
        },
      ]
    );
  };

  const refreshSearch = () => {
    if (socket && socket.connected) {
      setIsSearching(true);
      setMatchFound(false);
      setSearchStatus("Looking for a match...");

      const userPayload = {
        user: user,
        role: role,
        cat: categories,
      };

      socket.emit("findMatch", userPayload);
    } else {
      // Reconnect if disconnected
      setSearchStatus("Reconnecting...");
      // You might want to reinitialize the socket here
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f6f0]">
      {/* Header */}
      <View className="bg-[#ae906c] px-5 py-4">
        <TouchableOpacity
          onPress={cancelSearch}
          className="flex-row items-center mb-4"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-white text-lg ml-2">Cancel Search</Text>
        </TouchableOpacity>

        <Text className="text-white text-2xl font-bold text-center">
          Finding Your Match
        </Text>
      </View>

      <View className="flex-1 justify-center items-center px-6">
        {!matchFound ? (
          <>
            {/* Loading Animation */}
            <View className="items-center mb-8">
              <View className="relative">
                <ActivityIndicator size="large" color="#ae906c" />
                <View className="absolute inset-0 justify-center items-center">
                  <Ionicons name="people" size={32} color="#ae906c" />
                </View>
              </View>
            </View>

            <Text className="text-2xl font-semibold text-gray-800 text-center mb-4">
              {searchStatus}
            </Text>

            <Text className="text-gray-600 text-center mb-8 leading-6">
              We're looking for someone who matches your interests and can
              provide the support you need.
            </Text>

            {/* Search Info */}
            <View className="bg-white rounded-lg p-4 mb-6 w-full">
              <Text className="text-gray-700 font-medium mb-2">
                Looking for:{" "}
                {role === "listener" ? "Support Seekers" : "Listeners"}
              </Text>
              <Text className="text-gray-600 text-sm">
                Categories:{" "}
                {typeof categories === "string"
                  ? JSON.parse(categories || "[]").length
                  : Array.isArray(categories)
                  ? categories.length
                  : 0}{" "}
                selected
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                Your role: {role}
              </Text>
            </View>

            {/* Tips while waiting */}
            <View className="bg-blue-50 rounded-lg p-4 w-full">
              <Text className="text-blue-800 font-medium mb-2">
                💡 While you wait:
              </Text>
              <Text className="text-blue-700 text-sm">
                • Be patient - good matches take time{"\n"}• Keep an open mind
                {"\n"}• Remember to be kind and supportive
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Match found state */}
            <Ionicons name="checkmark-circle" size={80} color="#4ade80" />
            <Text className="text-2xl font-semibold text-green-600 text-center mt-4 mb-2">
              Match Found!
            </Text>
            <Text className="text-gray-600 text-center">
              Connecting you to chat...
            </Text>
            <ActivityIndicator size="small" color="#4ade80" className="mt-4" />
          </>
        )}
      </View>

      {/* Bottom Actions */}
      {!matchFound && (
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={refreshSearch}
            className="bg-white border border-[#ae906c] py-3 rounded-lg mb-3"
          >
            <Text className="text-[#ae906c] text-center font-medium">
              Refresh Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={cancelSearch}
            className="bg-red-500 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-medium">
              Cancel & Go Back
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default WaitingRoom;
