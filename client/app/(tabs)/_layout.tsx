import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import "../../global.css";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ tabBarActiveTintColor: `#835442`, headerShown: false }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: () => (
            <FontAwesome size={28} name="home" color={`#835442`} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chats",
          tabBarIcon: () => (
            <MaterialIcons
              name="chat-bubble-outline"
              size={24}
              color={`#835442`}
            />
          ),
        }}
      />
    </Tabs>
  );
}
