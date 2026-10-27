// components/FloatingActionButton.js
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";

export default function FloatingActionButton({ onPress }) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: Math.max(insets.bottom, 16) + 12,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
      onPress={onPress}>
      <Ionicons name="add" size={32} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
  },
});
