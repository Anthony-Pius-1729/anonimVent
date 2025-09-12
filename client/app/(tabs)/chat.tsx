import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NGROK_BASE_URL } from "../helpers/proxyServer";

interface Message {
  id: string;
  text: string;
  sender: string;
  senderName?: string;
  createdAt: Date;
  roomId?: string;
}

interface MatchedUser {
  id: string;
  name: string;
  role?: string;
}

const chat = () => {
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [roomStatus, setRoomStatus] = useState<string>("Connecting...");
  const [usersInRoom, setUsersInRoom] = useState<number>(0);
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [connectionTimeoutId, setConnectionTimeoutId] = useState<number | null>(
    null
  );
  const [pingIntervalId, setPingIntervalId] = useState<number | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // Get parameters from navigation
  const {
    roomId,
    matchedUser: matchedUserParam,
    userRole,
  } = useLocalSearchParams();

  console.log("roomid from chat area", roomId);
  console.log("matched user param:", matchedUserParam);
  console.log("user role:", userRole);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsInitializing(true);
        console.log("Starting chat initialization...");

        // Check if roomId exists
        if (!roomId) {
          console.error("No room ID provided");
          Alert.alert("Error", "No room ID provided.");
          router.back();
          return;
        }

        // Get current user data with detailed logging
        console.log("Attempting to get user data from AsyncStorage...");
        const userId = await AsyncStorage.getItem("userId");
        const userName = await AsyncStorage.getItem("userName");

        console.log("Retrieved userId:", userId);
        console.log("Retrieved userName:", userName);

        // Check if user data exists - if not, try to continue with basic data
        if (!userId) {
          console.warn("User ID not found in AsyncStorage - checking all keys");

          // Try to get all AsyncStorage keys for debugging
          const allKeys = await AsyncStorage.getAllKeys();
          console.log("All AsyncStorage keys:", allKeys);

          // Try to continue without strict user validation for now
          console.log(
            "Continuing without userId - this might cause issues but let's try"
          );
        }

        if (!userName) {
          console.warn(
            "User name not found in AsyncStorage - continuing anyway"
          );
        }

        // Set user data - use fallback values if needed
        const finalUserId = userId || `guest_${Date.now()}`;
        const finalUserName = userName || `User_${Date.now()}`;

        setCurrentUserId(finalUserId);
        setCurrentUserName(finalUserName);
        console.log("User data set successfully:", {
          finalUserId,
          finalUserName,
        });

        // Parse matched user data
        if (matchedUserParam && typeof matchedUserParam === "string") {
          try {
            const parsedMatchedUser = JSON.parse(matchedUserParam);
            setMatchedUser(parsedMatchedUser);
            console.log("Matched user parsed:", parsedMatchedUser);
          } catch (error) {
            console.error("Error parsing matched user:", error);
            console.log("Raw matchedUserParam:", matchedUserParam);
          }
        }

        // Skip server connectivity test to speed up initialization
        console.log(
          "Skipping server connectivity test - proceeding directly to socket connection"
        );

        // Initialize socket connection
        console.log("Initializing socket connection to:", NGROK_BASE_URL);
        console.log("Room ID received:", roomId);
        console.log("User ID:", finalUserId);
        console.log("User Name:", finalUserName);

        const newSocket = io(`${NGROK_BASE_URL}`, {
          transports: ["websocket", "polling"],
          timeout: 5000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
          console.log("Connected to chat server successfully!");
          setIsConnected(true);
          setRoomStatus("Connected to server");

          // Clear the connection timeout since we connected successfully
          if (connectionTimeoutId) {
            clearTimeout(connectionTimeoutId);
            setConnectionTimeoutId(null);
          }

          // Authenticate user
          newSocket.emit("authenticate", finalUserId);
          console.log("Sent authentication for userId:", finalUserId);

          // Join the specific room
          newSocket.emit("joinRoom", roomId);
          console.log(`Joined room: ${roomId}`);

          setIsInitializing(false);
        });

        // Handle when another user connects to the room
        newSocket.on("userConnectedToRoom", (data) => {
          console.log("Another user connected to room:", data);
          setUsersInRoom(data.usersInRoom);
          setRoomStatus(`${data.usersInRoom} users connected`);
        });

        // Handle when chat room actually starts
        newSocket.on("chatRoomStarted", (data) => {
          console.log("Chat room started:", data);
          setIsRoomReady(true);
          setUsersInRoom(data.usersInRoom);
          setRoomStatus("Chat room active");

          // Show room started notification
          Alert.alert("Chat Room Started!", data.message, [
            { text: "Start Chatting!" },
          ]);
        });

        // Handle server connection acknowledgment
        newSocket.on("connectionEstablished", (data) => {
          console.log("Server connection established:", data);
          setRoomStatus("Connected to server");
        });

        // Handle authentication confirmation
        newSocket.on("authenticationConfirmed", (data) => {
          console.log("Authentication confirmed:", data);
          setRoomStatus("Authenticated successfully");
        });

        // Handle connection confirmation from server
        newSocket.on("connectionConfirmed", (data) => {
          console.log("Connection confirmed by server:", data);
        });

        // Handle ping/pong for connection health
        newSocket.on("pong", (data) => {
          console.log("Pong received from server:", data);
        });

        // Send periodic ping to check connection health
        const pingInterval = setInterval(() => {
          if (newSocket.connected) {
            newSocket.emit("ping", {
              clientTime: new Date().toISOString(),
            });
          }
        }, 30000); // Every 30 seconds

        // Store ping interval for cleanup
        setPingIntervalId(pingInterval);

        newSocket.on("receiveMessage", (msg: Message) => {
          console.log("Received message:", msg);
          setMessages((prev) => [...prev, msg]);

          // Auto-scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        // Handle room joined confirmation
        newSocket.on("roomJoined", (data) => {
          console.log("Room joined:", data);
          setUsersInRoom(data.usersInRoom);
          setRoomStatus(`Joined room (${data.usersInRoom} users)`);
        });

        // Handle when another user joins the room
        newSocket.on("userJoinedRoom", (data) => {
          console.log("User joined room:", data);
          setUsersInRoom(data.usersInRoom);
          setRoomStatus(`${data.usersInRoom} users in room`);
        });

        // Handle when room is ready for chatting
        newSocket.on("roomReady", (data) => {
          console.log("Room ready:", data);
          setIsRoomReady(true);
          setUsersInRoom(data.usersInRoom);
          setRoomStatus("Both users connected");

          // Optional: Show a toast or brief notification
          setTimeout(() => {
            Alert.alert("Room Ready", data.message, [
              { text: "Start Chatting!" },
            ]);
          }, 500);
        });

        newSocket.on("userLeftRoom", (data) => {
          console.log("User left room:", data);
          setUsersInRoom(data.usersInRoom || 0);
          setIsRoomReady(false);

          let message = data.disconnected
            ? "The other user has disconnected."
            : data.message || "The other user has left the conversation.";

          // Add disconnect reason if available
          if (data.disconnected && data.disconnectReason) {
            const reasonMessages: Record<string, string> = {
              "ping timeout": "due to poor connection",
              "transport close": "due to network issues",
              "transport error": "due to connection error",
              "io client disconnect": "voluntarily",
            };
            const reasonText =
              reasonMessages[data.disconnectReason] ||
              `(${data.disconnectReason})`;
            message += ` ${reasonText}`;
          }

          Alert.alert(
            data.disconnected ? "User Disconnected" : "User Left",
            message,
            [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]
          );
        });

        newSocket.on("matchAccepted", (data) => {
          console.log("Match accepted:", data);
          Alert.alert("Match Accepted", data.message);
        });

        newSocket.on("matchDeclined", (data) => {
          console.log("Match declined:", data);
          Alert.alert("Match Declined", data.message, [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]);
        });

        newSocket.on("connect_error", (error) => {
          console.error("Connection error:", error);
          setIsConnected(false);
          setIsInitializing(false);
          Alert.alert(
            "Connection Error",
            "Failed to connect to chat server. Please try again."
          );
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          setIsConnected(false);
        });

        newSocket.on("reconnect", (attemptNumber) => {
          console.log("Socket reconnected after", attemptNumber, "attempts");
          setIsConnected(true);
        });

        newSocket.on("reconnect_error", (error) => {
          console.log("Reconnect error:", error);
        });

        // Set a more aggressive timeout for initialization
        const timeoutId = setTimeout(() => {
          console.log(
            "Socket connection timeout - forcing initialization to complete anyway"
          );
          setIsInitializing(false);
          if (!newSocket.connected) {
            setIsConnected(false);
            setRoomStatus("Connection timeout - retrying...");
            // Don't show alert, just try to continue
            console.log("Attempting to continue despite connection issues");
          }
        }, 6000); // Reduced to 6 seconds

        // Store timeout ID to clear it if connection succeeds
        setConnectionTimeoutId(timeoutId);

        // Also set a fallback completion timer regardless of socket events
        setTimeout(() => {
          console.log("Fallback initialization completion");
          setIsInitializing(false);
          if (newSocket.connected) {
            setIsRoomReady(true);
            setRoomStatus("Connection established");
          }
        }, 3000); // Complete within 3 seconds no matter what
      } catch (error) {
        console.error("Error initializing chat:", error);
        setIsInitializing(false);
        Alert.alert(
          "Error",
          `Failed to initialize chat: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up chat component");

      // Clear connection timeout if it exists
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
        setConnectionTimeoutId(null);
      }

      // Clear ping interval if it exists
      if (pingIntervalId) {
        clearInterval(pingIntervalId);
        setPingIntervalId(null);
      }

      if (socket) {
        // Leave room before disconnecting
        if (roomId) {
          socket.emit("leaveRoom", roomId);
        }
        socket.disconnect();
      }
    };
  }, [roomId, matchedUserParam]);

  const sendMessage = () => {
    if (newMessage.trim() && socket && isConnected && isRoomReady) {
      const msg: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        sender: currentUserId,
        senderName: currentUserName,
        createdAt: new Date(),
        roomId: roomId as string,
      };

      // Add message to local state immediately
      setMessages((prev) => [...prev, msg]);

      // Send message to server
      socket.emit("sendMessage", msg);
      console.log("Sent message:", msg);

      // Clear input
      setNewMessage("");

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const leaveChat = () => {
    Alert.alert(
      "Leave Chat",
      "Are you sure you want to leave this conversation?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            if (socket && roomId) {
              socket.emit("leaveRoom", roomId);
            }
            router.back();
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender === currentUserId;

    return (
      <View className="w-full px-3 mb-2">
        <View
          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
            isCurrentUser
              ? "bg-[#ae906c] self-end rounded-br-md"
              : "bg-gray-300 self-start rounded-bl-md"
          }`}
        >
          {/* Show sender name for other users */}
          {!isCurrentUser && (
            <Text className="text-xs text-gray-600 mb-1 font-medium">
              {item.senderName || matchedUser?.name || "Anonymous"}
            </Text>
          )}

          <Text className={isCurrentUser ? "text-white" : "text-black"}>
            {item.text}
          </Text>

          <Text
            className={`text-xs mt-1 ${
              isCurrentUser ? "text-blue-100 text-right" : "text-gray-600"
            }`}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <Ionicons name="chatbubbles-outline" size={60} color="#ae906c" />
      {isRoomReady ? (
        <>
          <Text className="text-gray-500 text-center mt-4 text-lg">
            Start the conversation!
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Say hello to {matchedUser?.name || "your match"}
          </Text>
        </>
      ) : (
        <>
          <Text className="text-gray-500 text-center mt-4 text-lg">
            Waiting for connection...
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            {usersInRoom === 1
              ? "Waiting for the other user to join"
              : "Establishing connection to chat room"}
          </Text>
          {usersInRoom > 0 && (
            <Text className="text-gray-400 text-center mt-1 text-xs">
              {usersInRoom} user{usersInRoom !== 1 ? "s" : ""} in room
            </Text>
          )}
        </>
      )}
    </View>
  );

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <ActivityIndicator size="large" color="#ae906c" />
        <Text className="text-gray-600 mt-4 text-lg font-medium">
          Connecting to chat...
        </Text>
        <Text className="text-gray-500 text-base mt-2">
          Setting up your conversation
        </Text>
        <Text className="text-gray-400 text-sm mt-2">Room ID: {roomId}</Text>

        {/* Connection status */}
        <View className="mt-4 px-4 py-2 bg-gray-100 rounded-lg">
          <Text className="text-gray-600 text-sm">Status: {roomStatus}</Text>
          {isConnected && (
            <Text className="text-green-600 text-xs mt-1">
              ✓ Connected to server
            </Text>
          )}
        </View>

        {/* Manual retry button available immediately */}
        <TouchableOpacity
          className="mt-6 bg-[#ae906c] px-6 py-3 rounded-lg"
          onPress={() => {
            console.log("Manual continue pressed - skipping initialization");
            setIsInitializing(false);
            setIsConnected(true);
            setIsRoomReady(true);
            setRoomStatus("Manual continue - ready to chat");
          }}
        >
          <Text className="text-white font-medium">Continue to Chat</Text>
        </TouchableOpacity>

        <Text className="text-gray-400 text-xs mt-4 text-center">
          Taking too long? Use the button above to continue manually
        </Text>

        <Text className="text-gray-400 text-xs mt-2">
          Server: {NGROK_BASE_URL}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 py-3 border-b border-gray-200 bg-[#835442]">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={leaveChat} className="mr-3">
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <View>
                <Text className="text-white text-lg font-semibold">
                  {matchedUser?.name || "Chat"}
                </Text>
                <View className="flex-row items-center">
                  <View
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isConnected && isRoomReady
                        ? "bg-green-400"
                        : isConnected
                        ? "bg-yellow-400"
                        : "bg-red-400"
                    }`}
                  />
                  <Text className="text-blue-100 text-sm">
                    {isConnected
                      ? isRoomReady
                        ? "Ready to chat"
                        : roomStatus
                      : "Connecting..."}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Role indicator */}
          <View className="bg-black bg-opacity-20 px-2 py-1 rounded">
            <Text className="text-white text-xs">
              {userRole === "listener" ? "🎧 Listener" : "💬 Seeking Support"}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingVertical: 10,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <View className="flex-row items-center px-3 py-2 border-t border-gray-200 bg-white">
          <TextInput
            className={`flex-1 border rounded-full px-4 py-2 mr-2 ${
              isConnected && isRoomReady
                ? "border-gray-300"
                : "border-gray-200 bg-gray-50"
            }`}
            placeholder={
              !isConnected
                ? "Connecting..."
                : !isRoomReady
                ? "Waiting for other user..."
                : "Type a message..."
            }
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            editable={isConnected && isRoomReady}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            className={`p-3 rounded-full ${
              isConnected && isRoomReady && newMessage.trim()
                ? "bg-[#835442]"
                : "bg-gray-400"
            }`}
            onPress={sendMessage}
            disabled={!isConnected || !isRoomReady || !newMessage.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default chat;
