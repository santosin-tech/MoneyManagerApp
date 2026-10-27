// utils/passcode.js
import * as SecureStore from "expo-secure-store";

const PASSCODE_KEY = "app_passcode";
const ENABLED_KEY = "passcode_enabled";

export async function isPasscodeEnabled() {
  try {
    const value = await SecureStore.getItemAsync(ENABLED_KEY);
    return value === "true";
  } catch (e) {
    return false;
  }
}

export async function setPasscodeEnabled(enabled) {
  await SecureStore.setItemAsync(ENABLED_KEY, enabled ? "true" : "false");
}

export async function savePasscode(code) {
  await SecureStore.setItemAsync(PASSCODE_KEY, code);
}

export async function getPasscode() {
  return await SecureStore.getItemAsync(PASSCODE_KEY);
}

export async function verifyPasscode(input) {
  const stored = await getPasscode();
  return stored === input;
}

export async function removePasscode() {
  await SecureStore.deleteItemAsync(PASSCODE_KEY);
  await SecureStore.setItemAsync(ENABLED_KEY, "false");
}
