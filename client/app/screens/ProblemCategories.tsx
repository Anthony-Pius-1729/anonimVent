import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Vibration,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { NGROK_BASE_URL } from "../helpers/proxyServer";

interface ProblemCategory {
  id: number;
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  borderColor: string;
  examples: string[];
}
interface JwtPayload {
  name?: string;
  sub?: string;
  id?: string;
  exp?: number;
  iat?: number;
}

interface ProblemCategoriesProps {
  userRole: "listener" | "support-seeker";
  onContinue: (selectedCategories: number[]) => void;
  onBack: () => void;
}

const ProblemCategories: React.FC<ProblemCategoriesProps> = ({
  userRole,
  onContinue,
  onBack,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const categories: ProblemCategory[] = [
    {
      id: 1,
      title: "Academic Stress",
      description: "School, exams, grades, academic pressure",
      icon: <Ionicons name="school" size={28} color="#4a90e2" />,
      color: "#e3f2fd",
      borderColor: "#4a90e2",
      examples: [
        "Exam anxiety",
        "Poor grades",
        "Study pressure",
        "Career confusion",
      ],
    },
    {
      id: 2,
      title: "Relationships & Heartbreak",
      description: "Dating, breakups, friendship issues",
      icon: <FontAwesome5 name="heart-broken" size={28} color="#e74c3c" />,
      color: "#ffeaea",
      borderColor: "#e74c3c",
      examples: [
        "Breakups",
        "Unrequited love",
        "Friendship conflicts",
        "Dating anxiety",
      ],
    },
    {
      id: 3,
      title: "Family Issues",
      description: "Family conflicts, expectations, relationships",
      icon: <Ionicons name="home" size={28} color="#f39c12" />,
      color: "#fef9e7",
      borderColor: "#f39c12",
      examples: [
        "Parent conflicts",
        "Family expectations",
        "Sibling issues",
        "Divorce",
      ],
    },
    {
      id: 4,
      title: "Mental Health",
      description: "Anxiety, depression, stress, emotional struggles",
      icon: <Ionicons name="medical" size={28} color="#9b59b6" />,
      color: "#f4ecf7",
      borderColor: "#9b59b6",
      examples: [
        "Anxiety attacks",
        "Depression",
        "Self-esteem",
        "Panic disorders",
      ],
    },
    {
      id: 5,
      title: "Work & Career",
      description: "Job stress, workplace issues, career decisions",
      icon: <MaterialIcons name="work" size={28} color="#27ae60" />,
      color: "#e8f5e8",
      borderColor: "#27ae60",
      examples: [
        "Job interviews",
        "Workplace stress",
        "Career choices",
        "Work-life balance",
      ],
    },
    {
      id: 6,
      title: "Social Anxiety",
      description: "Social situations, making friends, confidence",
      icon: <Ionicons name="people" size={28} color="#34495e" />,
      color: "#ecf0f1",
      borderColor: "#34495e",
      examples: [
        "Making friends",
        "Social events",
        "Public speaking",
        "Loneliness",
      ],
    },
    {
      id: 7,
      title: "Identity & Self-Worth",
      description: "Self-discovery, confidence, personal growth",
      icon: <FontAwesome5 name="user-circle" size={24} color="#e67e22" />,
      color: "#fdf2e9",
      borderColor: "#e67e22",
      examples: [
        "Self-confidence",
        "Body image",
        "Personal identity",
        "Life purpose",
      ],
    },
    {
      id: 8,
      title: "Loss & Grief",
      description: "Death, loss, major life changes",
      icon: <Ionicons name="flower" size={28} color="#8e44ad" />,
      color: "#f8f4fd",
      borderColor: "#8e44ad",
      examples: [
        "Loss of loved ones",
        "Pet loss",
        "Major life changes",
        "Grief process",
      ],
    },
    {
      id: 9,
      title: "Financial Stress",
      description: "Money problems, debt, financial planning",
      icon: <MaterialIcons name="attach-money" size={28} color="#16a085" />,
      color: "#e8f8f5",
      borderColor: "#16a085",
      examples: [
        "Student debt",
        "Money management",
        "Financial planning",
        "Job loss",
      ],
    },
    {
      id: 10,
      title: "Life Transitions",
      description: "Major changes, moving, new phases of life",
      icon: <Ionicons name="compass" size={28} color="#d35400" />,
      color: "#fef5e7",
      borderColor: "#d35400",
      examples: ["Moving cities", "Graduation", "New job", "Life changes"],
    },
    {
      id: 11,
      title: "Health Issues",
      description: "Physical health, chronic illness, medical concerns",
      icon: <FontAwesome5 name="heartbeat" size={24} color="#c0392b" />,
      color: "#fdedec",
      borderColor: "#c0392b",
      examples: [
        "Chronic illness",
        "Health anxiety",
        "Medical procedures",
        "Recovery",
      ],
    },
    {
      id: 12,
      title: "General Life Support",
      description: "General venting, daily struggles, other topics",
      icon: <Ionicons name="chatbubbles" size={28} color="#7f8c8d" />,
      color: "#f8f9fa",
      borderColor: "#7f8c8d",
      examples: [
        "Daily stress",
        "General venting",
        "Life advice",
        "Other concerns",
      ],
    },
  ];

  const toggleCategory = (categoryId: number) => {
    Vibration.vibrate(30);
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleContinue = async () => {
    console.log(
      "selected Cat details",
      selectedCategories,
      typeof selectedCategories
    );
    if (selectedCategories.length === 0) {
      return;
    }

    try {
      Vibration.vibrate(100);
      onContinue(selectedCategories);

      // Get and decode token
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        throw new Error("No auth token found");
      }

      const decoded = jwtDecode(token) as {
        name: string;
        sub: string;
        exp: number;
      };

      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        throw new Error("Token has expired");
      }

      const userId = decoded.name;

      console.log(typeof selectedCategories);

      // SEND DATA TO THE BACKEND TO STORE USER INFO SO THAT QUERY WORKS FINE

      const result = await fetch(`${NGROK_BASE_URL}/api/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          payload: {
            name: userId,
            role: userRole,
            categories: JSON.stringify(selectedCategories),
          },
        }),
      });
      router.push({
        pathname: "/screens/WaitingRoom",
        params: {
          user: userId,
          role: userRole,
          categories: JSON.stringify(selectedCategories),
        },
      });
    } catch (error) {
      console.error("Error in handleContinue:", error);
    }
  };

  const getHeaderText = () => {
    if (userRole === "listener") {
      return {
        title: "What topics can you support?",
        subtitle: "Select areas where you feel comfortable offering support",
        note: "Choose topics you have experience with or feel passionate about helping others with",
      };
    } else {
      return {
        title: "What's on your mind?",
        subtitle: "Select what you'd like to talk about",
        note: "This helps us match you with someone who understands your situation",
      };
    }
  };

  const headerText = getHeaderText();

  console.log(selectedCategories);

  const renderCategory = ({ item }: { item: ProblemCategory }) => {
    const isSelected = selectedCategories.includes(item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleCategory(item.id)}
        activeOpacity={0.7}
        style={{
          backgroundColor: isSelected ? item.color : "#fff",
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? item.borderColor : "#e0e0e0",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          marginHorizontal: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isSelected ? 0.15 : 0.05,
          shadowRadius: isSelected ? 4 : 2,
          elevation: isSelected ? 3 : 1,
          transform: [{ scale: isSelected ? 1.02 : 1 }],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <View
            style={{
              backgroundColor: isSelected
                ? "rgba(255,255,255,0.8)"
                : item.color,
              padding: 8,
              borderRadius: 8,
              marginRight: 12,
            }}
          >
            {item.icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#333",
                marginBottom: 2,
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#666",
                lineHeight: 18,
              }}
            >
              {item.description}
            </Text>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={item.borderColor}
            />
          )}
        </View>

        {/* Examples - show when selected */}
        {isSelected && (
          <View
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: "rgba(0,0,0,0.1)",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#888",
                marginBottom: 4,
              }}
            >
              Includes:
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 4,
              }}
            >
              {item.examples.map((example, index) => (
                <Text
                  key={index}
                  style={{
                    fontSize: 11,
                    color: item.borderColor,
                    backgroundColor: "rgba(255,255,255,0.8)",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {example}
                </Text>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        marginBottom: 128,
        backgroundColor: "#f8f6f0",
      }}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: "#ae906c",
          paddingTop: 20,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              marginLeft: 8,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            color: "#fff",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {headerText.title}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#f5deb3",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {headerText.subtitle}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#f5deb3",
            textAlign: "center",
            opacity: 0.9,
            fontStyle: "italic",
          }}
        >
          {headerText.note}
        </Text>
      </View>

      {/* Selected count */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: "#666",
            textAlign: "center",
          }}
        >
          {selectedCategories.length > 0
            ? `${selectedCategories.length} topic${
                selectedCategories.length > 1 ? "s" : ""
              } selected`
            : `Select ${
                userRole === "listener"
                  ? "topics you can help with"
                  : "what you want to discuss"
              }`}
        </Text>
      </View>

      {/* Categories */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Continue Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
          borderTopWidth: 1,
          borderTopColor: "#eee",
        }}
      >
        <TouchableOpacity
          onPress={handleContinue}
          disabled={selectedCategories.length === 0}
          style={{
            backgroundColor: selectedCategories.length > 0 ? "#8b4513" : "#ccc",
            paddingVertical: 16,
            borderRadius: 25,
            alignItems: "center",
            shadowColor: selectedCategories.length > 0 ? "#000" : "transparent",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: selectedCategories.length > 0 ? 3 : 0,
          }}
          activeOpacity={selectedCategories.length > 0 ? 0.8 : 1}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            {userRole === "listener"
              ? "Start Helping Others"
              : "Find Matched Support"}
            {selectedCategories.length > 0 && ` (${selectedCategories.length})`}
          </Text>
        </TouchableOpacity>

        {selectedCategories.length === 0 && (
          <Text
            style={{
              fontSize: 13,
              color: "#999",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Please select at least one topic to continue
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProblemCategories;
