
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "RzBFAiAq7IHa-vP8YEX8vtU_FUhYKjOi7vBMWjLN2yEAbKmYNQIhANtH3uMrlkLBSwScRikMYqgW-a5mlrp2xQeDNmM9CWg4eyJ1Ijo0LCJlIjoiMjAyNi0wMS0wMVQwMDowMDowMC4wMDArMDA6MDAifQ";
const SESSION_URL = "https://gps-staging.getfleet.ai/api/session";

export async function saveToken(token) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (e) {
    console.warn("saveToken error", e);
    return false;
  }
}

export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.warn("getToken error", e);
    return null;
  }
}

export async function removeToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (e) {
    console.warn("removeToken error", e);
    return false;
  }
}

/**
 * validateSession(token)
 */
export async function validateSession(token) {
  try {
    if (!token) return { ok: false, error: "no token" };
    const res = await fetch(`${SESSION_URL}?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return { ok: false, status: res.status };

    const json = await res.json();
    if (json && (json.id || json.email)) {
      return { ok: true, user: json };
    }
    return { ok: false, status: res.status, body: json };
  } catch (err) {
    console.warn("validateSession error", err);
    return { ok: false, error: String(err) };
  }
}
