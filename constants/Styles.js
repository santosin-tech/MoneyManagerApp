// constants/Styles.js
import { StyleSheet } from "react-native";
import { Colors } from "./Colors";

export const GlobalStyles = StyleSheet.create({
  // Full screen container used by every tab
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Centered placeholder content (we use this until real UI arrives)
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  // Titles
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },

  // Card style (will be used heavily later)
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
});
