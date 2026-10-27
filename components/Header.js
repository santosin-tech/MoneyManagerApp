// components/Header.js
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

export default function Header({
  title,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
}) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable onPress={onBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}

      <Text style={styles.title}>{title}</Text>

      {rightIcon ? (
        <Pressable onPress={onRightPress} style={styles.iconButton}>
          <Ionicons name={rightIcon} size={24} color="#fff" />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
