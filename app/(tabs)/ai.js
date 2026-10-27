// app/(tabs)/ai.js
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/Styles";
import { Colors } from "../../constants/Colors";
import { useApp } from "../../context/AppContext";

export default function AIScreen() {
  const router = useRouter();
  const { formatMoney } = useApp();

  return (
    <View style={GlobalStyles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Assistant</Text>
      </View>

      <Pressable
        style={{
          margin: 20,
          padding: 16,
          backgroundColor: Colors.primary,
          borderRadius: 12,
        }}
        onPress={() => router.push("/ai-entry")}>
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>
          Smart Text Entry
        </Text>
      </Pressable>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Voice Entry Card */}
        <View style={styles.voiceCard}>
          <View style={styles.voiceIconContainer}>
            <Ionicons name="mic" size={32} color="#fff" />
          </View>
          <Text style={styles.voiceTitle}>Voice Entry</Text>
          <Text style={styles.voiceSubtitle}>
            Say something like “Spent 1500 on Garri and Milk using Cash”
          </Text>
          <Pressable
            style={{
              margin: 16,
              padding: 16,
              backgroundColor: Colors.primary,
              borderRadius: 12,
              alignItems: "center",
            }}
            onPress={() => router.push("/voice-entry")}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              🎤 Voice Entry
            </Text>
          </Pressable>
          <Text style={styles.comingSoonBadge}>Coming Soon</Text>
        </View>

        {/* Quick Insights */}
        <Text style={styles.sectionTitle}>Quick Insights</Text>

        <View style={styles.insightCard}>
          <Ionicons name="trending-up-outline" size={22} color="#4CAF50" />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Spending Pattern</Text>
            <Text style={styles.insightText}>
              Your main spending category will appear here once you have more
              transactions.
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Ionicons name="wallet-outline" size={22} color="#2196F3" />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Cash Flow</Text>
            <Text style={styles.insightText}>
              Income vs Expense summary will be shown here.
            </Text>
          </View>
        </View>

        {/* Budget Suggestions */}
        <Text style={styles.sectionTitle}>Budget Suggestions</Text>

        <View style={styles.budgetCard}>
          <Ionicons name="bulb-outline" size={24} color="#FF9800" />
          <Text style={styles.budgetTitle}>Smart Budget Recommendations</Text>
          <Text style={styles.budgetText}>
            The AI will analyze your spending and suggest monthly budgets for
            your categories.
          </Text>
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonText}>Coming in later phases</Text>
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={20} color="#888" />
          <Text style={styles.tipText}>
            The offline AI engine will work completely without internet. It will
            parse your voice or text and automatically fill the transaction
            form.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    color: "#fff",
    paddingTop: 32,
    fontSize: 24,
    fontWeight: "700",
  },
  voiceCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#333",
  },
  voiceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  voiceTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  voiceSubtitle: {
    color: "#aaa",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  voiceButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  comingSoonBadge: {
    marginTop: 12,
    color: "#888",
    fontSize: 12,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  insightText: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 18,
  },
  budgetCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  budgetTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },
  budgetText: {
    color: "#aaa",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  comingSoonContainer: {
    marginTop: 14,
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  comingSoonText: {
    color: "#888",
    fontSize: 12,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
    gap: 10,
  },
  tipText: {
    flex: 1,
    color: "#777",
    fontSize: 13,
    lineHeight: 18,
  },
});
