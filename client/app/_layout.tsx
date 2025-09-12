import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="screens/Login" options={{ headerShown: false }} />
      <Stack.Screen name="screens/Welcome" options={{ headerShown: false }} />
      <Stack.Screen name="screens/SignUp" options={{ headerShown: false }} />
      <Stack.Screen
        name="screens/ConfirmRole"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="screens/ProblemCategories"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="screens/WaitingRoom"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
