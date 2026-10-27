// app/voice-entry.js
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { parseTransactionText } from "../utils/aiParser";

// Try to load Voice (will be null inside Expo Go)
let Voice = null;
try {
  Voice = require("@react-native-voice/voice").default;
} catch (e) {
  Voice = null;
}

export default function VoiceEntryScreen() {
  const router = useRouter();

  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(!!Voice);

  useEffect(() => {
    if (!Voice) {
      setVoiceAvailable(false);
      setError(
        "Voice recognition is not available in Expo Go.\nIt will work in a Development Build.",
      );
      return;
    }

    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0] || "";
      setSpokenText(text);
      if (text) {
        const result = parseTransactionText(text);
        setParsed(result);
      }
    };
    Voice.onSpeechError = (e) => {
      setIsListening(false);
      setError(e.error?.message || "Speech recognition error");
    };

    return () => {
      try {
        Voice.destroy().then(Voice.removeAllListeners);
      } catch (e) {}
    };
  }, []);

  const startListening = async () => {
    if (!Voice) {
      Alert.alert(
        "Voice not available",
        "Speech recognition does not work inside Expo Go.\n\nYou can still use Smart Text Entry, or later we can create a Development Build.",
        [
          {
            text: "Use Smart Text Entry",
            onPress: () => router.push("/ai-entry"),
          },
          { text: "OK", style: "cancel" },
        ],
      );
      return;
    }

    try {
      setError("");
      setSpokenText("");
      setParsed(null);
      await Voice.start("en-US");
    } catch (e) {
      setError("Could not start voice recognition.");
      console.log("Voice start error:", e);
    }
  };

  const stopListening = async () => {
    if (!Voice) return;
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.log("Voice stop error:", e);
    }
  };

  const handleUseResult = () => {
    if (!parsed || !parsed.amount) {
      Alert.alert("Nothing to use", "Please speak a clear transaction first.");
      return;
    }

    router.push({
      pathname: "/add-transaction",
      params: {
        aiType: parsed.type,
        aiAmount: String(parsed.amount),
        aiAccount: parsed.account || "",
        aiCategory: parsed.category || "",
        aiNote: parsed.note || "",
        aiToAccount: parsed.toAccount || "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Voice Entry</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>
          {voiceAvailable
            ? "Tap the microphone and say something like:\n“spent two thousand five hundred on lunch with Opay”"
            : "Voice recognition needs a Development Build.\nFor now use Smart Text Entry."}
        </Text>

        <Pressable
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={isListening ? stopListening : startListening}>
          {isListening ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Ionicons name="mic" size={48} color="#fff" />
          )}
        </Pressable>

        <Text style={styles.status}>
          {isListening ? "Listening..." : "Tap to speak"}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Fallback button */}
        {!voiceAvailable && (
          <Pressable
            style={styles.fallbackButton}
            onPress={() => router.push("/ai-entry")}>
            <Text style={styles.fallbackButtonText}>
              Open Smart Text Entry instead
            </Text>
          </Pressable>
        )}

        {spokenText ? (
          <View style={styles.resultBox}>
            <Text style={styles.label}>You said:</Text>
            <Text style={styles.spokenText}>{spokenText}</Text>
          </View>
        ) : null}

        {parsed && parsed.amount > 0 ? (
          <View style={styles.resultBox}>
            <Text style={styles.label}>Understood as:</Text>
            <Text style={styles.row}>Type: {parsed.type}</Text>
            <Text style={styles.row}>Amount: {parsed.amount}</Text>
            <Text style={styles.row}>Account: {parsed.account || "—"}</Text>
            <Text style={styles.row}>Category: {parsed.category || "—"}</Text>
            <Text style={styles.row}>Note: {parsed.note || "—"}</Text>

            <Pressable style={styles.useButton} onPress={handleUseResult}>
              <Text style={styles.useButtonText}>Use this → Fill Form</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
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
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  hint: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  micButtonActive: {
    backgroundColor: "#FF5A5F",
  },
  status: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  error: {
    color: "#FF5A5F",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  fallbackButton: {
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  fallbackButtonText: {
    color: "#fff",
    fontSize: 15,
  },
  resultBox: {
    width: "100%",
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  label: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 8,
  },
  spokenText: {
    color: "#fff",
    fontSize: 16,
  },
  row: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 4,
  },
  useButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },
  useButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
