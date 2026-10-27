// app/lock.js
import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Vibration } from "react-native";
import { Colors } from "../constants/Colors";
import { verifyPasscode } from "../utils/passcode";

export default function LockScreen({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handlePress = async (digit) => {
    if (pin.length >= 4) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      const ok = await verifyPasscode(newPin);
      if (ok) {
        onSuccess();
      } else {
        setError(true);
        Vibration.vibrate(400);
        setTimeout(() => setPin(""), 400);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Passcode</Text>

      {/* Dots */}
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              pin.length > i && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </View>

      {error && <Text style={styles.errorText}>Wrong passcode</Text>}

      {/* Keypad */}
      <View style={styles.keypad}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
          (key) => {
            if (key === "") {
              return <View key="empty" style={styles.key} />;
            }
            if (key === "del") {
              return (
                <Pressable key="del" style={styles.key} onPress={handleDelete}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 40,
  },
  dots: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 16,
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
  dotError: {
    borderColor: "#FF5A5F",
    backgroundColor: "#FF5A5F",
  },
  errorText: {
    color: "#FF5A5F",
    marginBottom: 20,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 280,
    justifyContent: "center",
    marginTop: 20,
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
    fontWeight: "500",
  },
});
