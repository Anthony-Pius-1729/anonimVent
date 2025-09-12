import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Vibration,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ConfirmRole from "./ConfirmRole.tsx";
import ProblemCategories from "./ProblemCategories.tsx";

interface Topic {
  id: number;
  icon: JSX.Element;
  topic: string;
  subtopic: string;
  color: string;
  actionText: string;
  role: "listener" | "support-seeker";
  route: string;
}

// Define the different screens/states
type ScreenState =
  | "welcome"
  | "confirm-role"
  | "select-categories"
  | "matching";

export default function Welcome() {
  const [clickedId, setClickedId] = useState<number | null>(null);
  const { width } = Dimensions.get("window");
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "listener" | "support-seeker" | null
  >(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>("welcome");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const handleClickedTopic = (id: number): void => {
    Vibration.vibrate(50);
    setClickedId((prevId) => (prevId === id ? null : id));
  };

  const handleActionPress = (route: string): void => {
    Vibration.vibrate(100);

    // Find the selected topic and set the role
    const selectedTopic = Topics.find((t) => t.id === clickedId);
    if (selectedTopic) {
      setSelectedRole(selectedTopic.role);
      setShowModal(true);
      setCurrentScreen("confirm-role");
    }
  };

  const handleConfirmRole = () => {
    setShowModal(false);
    setCurrentScreen("select-categories");

    console.log(`Confirmed role: ${selectedRole}`);
  };

  const handleCancelRole = () => {
    setShowModal(false);
    setSelectedRole(null);
    setCurrentScreen("welcome");
    // Keep clickedId so user can try again if they want
  };

  const handleCategoriesSelected = (categories: number[]) => {
    setSelectedCategories(categories);
    setCurrentScreen("matching");

    console.log(`Selected role: ${selectedRole}`);
    console.log(`Selected categories:`, categories);

    // Here you would typically:
    // 1. Store the user's preferences
    // 2. Start the matching process
    // 3. Navigate to matching/chat screen
    // navigation.navigate('MatchingScreen', { role: selectedRole, categories });
  };

  const handleBackFromCategories = () => {
    setCurrentScreen("welcome");
    setSelectedRole(null);
    setClickedId(null);
  };

  const Topics: Topic[] = [
    {
      id: 1,
      icon: <Ionicons name="ear-outline" size={32} color="#8b4513" />,
      topic: "Need Support",
      subtopic: "Connect with someone who will listen without judgment",
      color: "#f4e4bc",
      actionText: "Find a Listener",
      role: "support-seeker",
      route: "FindListener",
    },
    {
      id: 2,
      icon: (
        <MaterialIcons name="chat-bubble-outline" size={32} color="#8b4513" />
      ),
      topic: "Offer Support",
      subtopic: "Be there for someone who needs to talk anonymously",
      color: "#f0d2b0",
      actionText: "Become a Listener",
      role: "listener",
      route: "BecomeListener",
    },
  ];

  const renderTopicItem = ({ item }: { item: Topic }): JSX.Element => {
    const isExpanded = item.id === clickedId;

    return (
      <TouchableOpacity
        onPress={() => handleClickedTopic(item.id)}
        activeOpacity={0.7}
        style={{
          padding: 20,
          justifyContent: "center",
          backgroundColor: item.color,
          borderRadius: 16,
          width: width - 40,
          minHeight: isExpanded ? 140 : 90,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
          borderWidth: isExpanded ? 3 : 1,
          borderColor: isExpanded ? "#8b4513" : "#ddd",
          transform: [{ scale: isExpanded ? 1.02 : 1 }],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: isExpanded ? 12 : 0,
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(139, 69, 19, 0.1)",
              padding: 8,
              borderRadius: 12,
              marginRight: 12,
            }}
          >
            {item.icon}
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "600",
              color: "#8b4513",
            }}
          >
            {item.topic}
          </Text>
        </View>

        {isExpanded && (
          <View style={{ marginTop: 8 }}>
            <Text
              style={{
                fontSize: 14,
                color: "#654321",
                textAlign: "center",
                lineHeight: 20,
                fontStyle: "italic",
              }}
            >
              {item.subtopic}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render different screens based on currentScreen state
  if (currentScreen === "select-categories" && selectedRole) {
    return (
      <ProblemCategories
        userRole={selectedRole}
        onContinue={handleCategoriesSelected}
        onBack={handleBackFromCategories}
      />
    );
  }

  if (currentScreen === "matching") {
    // This would be your matching/loading screen
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#ae906c",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            padding: 40,
            borderRadius: 20,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="search" size={60} color="#8b4513" />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#8b4513",
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            Finding Your Match
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#666",
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            We're connecting you with someone who understands...
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#999",
              textAlign: "center",
              marginTop: 16,
              fontStyle: "italic",
            }}
          >
            Role:{" "}
            {selectedRole === "listener"
              ? "Offering Support"
              : "Seeking Support"}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#999",
              textAlign: "center",
              marginTop: 4,
              fontStyle: "italic",
            }}
          >
            Topics: {selectedCategories.length} selected
          </Text>

          <TouchableOpacity
            onPress={() => {
              setCurrentScreen("welcome");
              setSelectedRole(null);
              setClickedId(null);
              setSelectedCategories([]);
            }}
            style={{
              marginTop: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: "#f5f5f5",
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#666",
              }}
            >
              Start Over
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Default welcome screen
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#ae906c",
        paddingHorizontal: 20,
        paddingTop: 40,
      }}
    >
      <ConfirmRole
        role={selectedRole}
        visible={showModal}
        onConfirm={handleConfirmRole}
        onCancel={handleCancelRole}
      />

      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 28,
              fontWeight: "bold",
              color: "#fff",
              marginBottom: 8,
              textShadowColor: "rgba(0, 0, 0, 0.3)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            How would you like to connect?
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#f5deb3",
              textAlign: "center",
              opacity: 0.9,
            }}
          >
            Anonymous • Safe • Real conversations
          </Text>
        </View>

        <View style={{ alignItems: "center" }}>
          <FlatList
            data={Topics}
            renderItem={renderTopicItem}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />

          {clickedId !== null && (
            <View style={{ marginTop: 20 }}>
              <TouchableOpacity
                onPress={() =>
                  handleActionPress(
                    Topics.find((t) => t.id === clickedId)?.route || ""
                  )
                }
                style={{
                  backgroundColor: "#8b4513",
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 25,
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 3,
                  },
                  shadowOpacity: 0.2,
                  shadowRadius: 5,
                  elevation: 5,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  {Topics.find((t) => t.id === clickedId)?.actionText ||
                    "Continue"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View
        style={{
          alignItems: "center",
          marginBottom: 30,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: "#f5deb3",
            textAlign: "center",
            fontStyle: "italic",
            opacity: 0.8,
          }}
        >
          You're not alone. Connect safely and anonymously
        </Text>
      </View>
    </SafeAreaView>
  );
}
