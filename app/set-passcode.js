// app/set-passcode.js
import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { savePasscode, setPasscodeEnabled } from "../utils/passcode";

export default function SetPasscodeScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = enter, 2 = confirm
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");

  const handlePress = async (digit) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      if (step === 1) {
        setFirstPin(newPin);
        setPin("");
        setStep(2);
      } else {
        // Confirm step
        if (newPin === firstPin) {
          await savePasscode(newPin);
          await setPasscodeEnabled(true);
          Alert.alert("Success", "Passcode has been set", [
            { text: "OK", onPress: () => router.back() },
          ]);
        } else {
          Alert.alert("Error", "Passcodes do not match. Try again.");
          setPin("");
          setFirstPin("");
          setStep(1);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {step === 1 ? "Set Passcode" : "Confirm Passcode"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>
          {step === 1
            ? "Enter a 4-digit passcode"
            : "Enter the same passcode again"}
        </Text>

        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, pin.length > i && styles.dotFilled]}
            />
          ))}
        </View>

        <View style={styles.keypad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
            (key) => {
              if (key === "") return <View key="empty" style={styles.key} />;
              if (key === "del") {
                return (
                  <Pressable
                    key="del"
                    style={styles.key}
                    onPress={handleDelete}>
                    <Text style={styles.keyText}>⌫</Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={key}
                  style={styles.key}
                  onPress={() => handlePress(key)}>
                  <Text style={styles.keyText}>{key}</Text>
                </Pressable>
              );
            },
          )}
        </View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  hint: {
    color: "#aaa",
    fontSize: 15,
    marginBottom: 30,
  },
  dots: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#555",
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 280,
    justifyContent: "center",
  },
  key: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    margin: 6,
  },
  keyText: {
    color: "#fff",
    fontSize: 28,
  },
});
