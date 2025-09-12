import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Vibration,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

interface ConfirmRoleProps {
  role: "listener" | "support-seeker" | null;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface RoleInfo {
  title: string;
  icon: JSX.Element;
  expectations: string[];
  guidelines: string[];
  commitment: string;
  warningText?: string;
}

const ConfirmRole: React.FC<ConfirmRoleProps> = ({
  role,
  visible,
  onConfirm,
  onCancel,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const { width, height } = Dimensions.get("window");

  const roleInfo: Record<string, RoleInfo> = {
    listener: {
      title: "Become a Listener",
      icon: <Ionicons name="ear-outline" size={40} color="#8b4513" />,
      expectations: [
        "Listen without judgment or giving unsolicited advice",
        "Provide emotional support and validation",
        "Maintain complete confidentiality",
        "Be present and engaged during conversations",
        "Respect boundaries and personal limits",
      ],
      guidelines: [
        "Use empathetic and supportive language",
        "Ask open-ended questions to encourage sharing",
        "Avoid sharing your own similar experiences",
        'Don\'t try to "fix" or solve their problems',
        "Know when to suggest professional help",
      ],
      commitment:
        "You'll be matched with someone who needs support. Sessions typically last 15-45 minutes.",
      warningText:
        "Remember: You're not a therapist. If someone mentions self-harm or danger, guide them to emergency resources.",
    },
    "support-seeker": {
      title: "Find Support",
      icon: (
        <MaterialIcons name="chat-bubble-outline" size={40} color="#8b4513" />
      ),
      expectations: [
        "Share openly about what's on your mind",
        "Be respectful to your matched listener",
        "Understand this is peer support, not therapy",
        "Take breaks if you feel overwhelmed",
        "Report any inappropriate behavior",
      ],
      guidelines: [
        "You can share as much or as little as you want",
        "Your identity remains completely anonymous",
        "End the conversation anytime you need to",
        "Use the rating system to help improve matches",
        "Consider professional help for ongoing issues",
      ],
      commitment:
        "You'll be connected with a trained listener who volunteers their time to support you.",
      warningText:
        "Crisis Support: If you're in immediate danger, please contact emergency services or a crisis hotline.",
    },
  };

  const currentRole = role ? roleInfo[role] : null;

  if (!currentRole || !visible) return null;

  const handleConfirm = () => {
    if (acknowledged) {
      Vibration.vibrate(100);
      onConfirm();
      setAcknowledged(false);
    }
  };

  const handleCancel = () => {
    Vibration.vibrate(50);
    onCancel();
    setAcknowledged(false);
  };

  const toggleAcknowledgment = () => {
    setAcknowledged(!acknowledged);
    Vibration.vibrate(30);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8f6f0",
        }}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "#ae906c",
            paddingTop: 60,
            paddingHorizontal: 20,
            paddingBottom: 20,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <TouchableOpacity
            onPress={handleCancel}
            style={{
              position: "absolute",
              top: 60,
              right: 20,
              padding: 8,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={{ alignItems: "center", marginTop: 20 }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: 16,
                borderRadius: 50,
                marginBottom: 12,
              }}
            >
              {currentRole.icon}
            </View>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "bold",
                color: "#fff",
                textAlign: "center",
              }}
            >
              {currentRole.title}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ padding: 20 }}>
            {/* Commitment */}
            <View
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 12,
                marginBottom: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: "#333",
                  lineHeight: 22,
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                {currentRole.commitment}
              </Text>
            </View>

            {/* Expectations */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#8b4513",
                  marginBottom: 12,
                }}
              >
                What's Expected
              </Text>
              {currentRole.expectations.map((expectation, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 10,
                    backgroundColor: "#fff",
                    padding: 15,
                    borderRadius: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#4CAF50"
                    style={{ marginRight: 10, marginTop: 2 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#333",
                      lineHeight: 20,
                      flex: 1,
                    }}
                  >
                    {expectation}
                  </Text>
                </View>
              ))}
            </View>

            {/* Guidelines */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#8b4513",
                  marginBottom: 12,
                }}
              >
                Helpful Guidelines
              </Text>
              {currentRole.guidelines.map((guideline, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 10,
                    backgroundColor: "#f0f8ff",
                    padding: 15,
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: "#2196F3",
                  }}
                >
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#2196F3"
                    style={{ marginRight: 10, marginTop: 2 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#333",
                      lineHeight: 20,
                      flex: 1,
                    }}
                  >
                    {guideline}
                  </Text>
                </View>
              ))}
            </View>

            {/* Warning/Important Info */}
            {currentRole.warningText && (
              <View
                style={{
                  backgroundColor: "#fff3cd",
                  padding: 16,
                  borderRadius: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: "#ffc107",
                  marginBottom: 25,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  <Ionicons
                    name="warning"
                    size={24}
                    color="#f57c00"
                    style={{ marginRight: 12, marginTop: 2 }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#333",
                      fontWeight: "500",
                      lineHeight: 20,
                      flex: 1,
                    }}
                  >
                    {currentRole.warningText}
                  </Text>
                </View>
              </View>
            )}

            {/* Acknowledgment */}
            <TouchableOpacity
              onPress={toggleAcknowledgment}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 8,
                marginBottom: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: acknowledged ? "#4CAF50" : "#ccc",
                  backgroundColor: acknowledged ? "#4CAF50" : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {acknowledged && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: "#333",
                  flex: 1,
                  lineHeight: 22,
                }}
              >
                I understand my role and agree to follow these guidelines
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
            borderTopWidth: 1,
            borderTopColor: "#eee",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={handleCancel}
              style={{
                flex: 1,
                backgroundColor: "#f5f5f5",
                paddingVertical: 16,
                borderRadius: 25,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#ddd",
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#666",
                }}
              >
                Go Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!acknowledged}
              style={{
                flex: 2,
                backgroundColor: acknowledged ? "#8b4513" : "#ccc",
                paddingVertical: 16,
                borderRadius: 25,
                alignItems: "center",
                shadowColor: acknowledged ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: acknowledged ? 3 : 0,
              }}
              activeOpacity={acknowledged ? 0.8 : 1}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#fff",
                }}
              >
                {role === "listener" ? "Start Listening" : "Find Support"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmRole;
