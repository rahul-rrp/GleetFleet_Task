
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  TOKEN: "APP_TOKEN",
  USER: "APP_USER",
};

export async function saveToken(token) {
  try {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
    return true;
  } catch (e) {
    console.warn("storageService.saveToken", e);
    return false;
  }
}

export async function getToken() {
  try {
    return await AsyncStorage.getItem(KEYS.TOKEN);
  } catch (e) {
    console.warn("storageService.getToken", e);
    return null;
  }
}

export async function removeToken() {
  try {
    await AsyncStorage.removeItem(KEYS.TOKEN);
    return true;
  } catch (e) {
    console.warn("storageService.removeToken", e);
    return false;
  }
}

export async function saveUser(user) {
  try {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user || {}));
    return true;
  } catch (e) {
    console.warn("storageService.saveUser", e);
    return false;
  }
}

export async function getUser() {
  try {
    const s = await AsyncStorage.getItem(KEYS.USER);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    console.warn("storageService.getUser", e);
    return null;
  }
}

export async function removeUser() {
  try {
    await AsyncStorage.removeItem(KEYS.USER);
    return true;
  } catch (e) {
    console.warn("storageService.removeUser", e);
    return false;
  }
}
