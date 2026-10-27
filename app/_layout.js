import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { initializeDatabase } from "../database/db";
import { AppProvider } from "../context/AppContext";
import { isPasscodeEnabled } from "../utils/passcode";
import LockScreen from "./lock";

export default function RootLayout() {
  const [locked, setLocked] = useState(true); // start locked until we check
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const prepare = async () => {
      try {
        await initializeDatabase();
        const enabled = await isPasscodeEnabled();
        setLocked(enabled); // if passcode is enabled → stay locked
      } catch (e) {
        console.log("Init error:", e.message);
        setLocked(false);
      } finally {
        setChecking(false);
      }
    };
    prepare();
  }, []);

  if (checking) {
    return null; // or a simple loading view
  }

  if (locked) {
    return <LockScreen onSuccess={() => setLocked(false)} />;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        />
      </AppProvider>
    </SafeAreaProvider>
  );
}
