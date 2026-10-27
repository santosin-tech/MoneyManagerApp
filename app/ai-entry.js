// app/ai-entry.js
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { parseTransactionText } from "../utils/aiParser";

export default function AIEntryScreen() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const handleParse = () => {
    if (!text.trim()) {
      Alert.alert("Empty", "Please type something first");
      return;
    }

    const parsed = parseTransactionText(text);
    if (!parsed || !parsed.amount) {
      Alert.alert(
        "Could not understand",
        'Try something like:\n"spent 2500 on lunch with Opay"\n"received 50000 salary into UBA"',
      );
      return;
    }

    setResult(parsed);
  };

  const handleUseResult = () => {
    if (!result) return;

    // Navigate to Add Transaction with the parsed data
    router.push({
      pathname: "/add-transaction",
      params: {
        aiType: result.type,
        aiAmount: String(result.amount),
        aiAccount: result.account || "",
        aiCategory: result.category || "",
        aiNote: result.note || "",
        aiToAccount: result.toAccount || "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Smart Entry</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.label}>Type what happened</Text>
        <Text style={styles.hint}>
          Examples:{"\n"}• spent 2500 on lunch with Opay{"\n"}• received 50000
          salary into UBA{"\n"}• transfer 10000 from Cash to PalmPay
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. spent 2500 on lunch with Opay"
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
        />

        <Pressable style={styles.parseBtn} onPress={handleParse}>
          <Text style={styles.parseBtnText}>Parse</Text>
        </Pressable>

        {/* Parsed Result Preview */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Understood as:</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Type</Text>
              <Text style={styles.rowValue}>{result.type}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Amount</Text>
              <Text style={styles.rowValue}>{result.amount}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Account</Text>
              <Text style={styles.rowValue}>{result.account || "—"}</Text>
            </View>
            {result.toAccount ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>To Account</Text>
                <Text style={styles.rowValue}>{result.toAccount}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Category</Text>
              <Text style={styles.rowValue}>{result.category}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Note</Text>
              <Text style={styles.rowValue}>{result.note}</Text>
            </View>

            <Pressable style={styles.useBtn} onPress={handleUseResult}>
              <Text style={styles.useBtnText}>Use this → Fill Form</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  hint: {
    color: "#888",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  parseBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  parseBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  resultCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },
  resultTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rowLabel: {
    color: "#888",
    fontSize: 14,
  },
  rowValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  useBtn: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  useBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
