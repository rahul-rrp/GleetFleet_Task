
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { saveToken, validateSession } from "../services/authService";
import { useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Button,
  Checkbox,
  TextInput as PaperTextInput,
  Surface,
  Text,
} from "react-native-paper";

// staging demo token (valid for session check)
const DEMO_TOKEN =
  "RzBFAiAq7IHa-vP8YEX8vtU_FUhYKjOi7vBMWjLN2yEAbKmYNQIhANtH3uMrlkLBSwScRikMYqgW-a5mlrp2xQeDNmM9CWg4eyJ1Ijo0LCJlIjoiMjAyNi0wMS0wMVQwMDowMDowMC4wMDArMDA6MDAifQ";

export default function Auth({ onLogin }) {
  const navigation = useNavigation();
  const [mode, setMode] = useState("admin");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(true);

  const SignInHandler = async () => {
    if (!acceptTerms) return;
    setLoading(true);
    try {
      // Save staging demo token
      const ok = await saveToken(DEMO_TOKEN);
      console.log(ok)
      if (!ok) {
        console.warn("Failed to persist token");
        setLoading(false);
        return;
      }

      // Validate session immediately
      const res = await validateSession(DEMO_TOKEN);
      console.log(res)
      if (res.ok) {
        if (typeof onLogin === "function") {
          onLogin();
          return;
        }
        // replace on parent (safe)
        const parent = navigation.getParent();
        if (parent?.replace) parent.replace("Dashboard");
        else navigation.navigate("Dashboard");
      } else {
        console.warn("Session validation failed", res);
      }
    } catch (err) {
      console.warn("SignInHandler error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Surface style={styles.card} elevation={3}>
              <View style={styles.header}>
                <Image source={require("../../assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
                <Text variant="headlineMedium" style={styles.title}>
                  Sign in to GetFleet
                </Text>
                <Text style={styles.subtitle}>Access your fleet. Track in real time.</Text>
                <Text style={styles.subtitle}>Manage with precision.</Text>
              </View>

              <View style={styles.switchContainer}>
                <TouchableOpacity activeOpacity={0.9} style={[styles.switchButton, mode === "admin" && styles.switchButtonActive]} onPress={() => setMode("admin")}>
                  <Text style={[styles.switchText, mode === "admin" && styles.switchTextActive]}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.9} style={[styles.switchButton, mode === "drivers" && styles.switchButtonActive]} onPress={() => setMode("drivers")}>
                  <Text style={[styles.switchText, mode === "drivers" && styles.switchTextActive]}>Drivers</Text>
                </TouchableOpacity>
              </View>

              {mode === "admin" && (
                <>
                  <Text style={styles.label}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.fieldWrapper}>
                    <PaperTextInput
                      mode="outlined"
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      left={<PaperTextInput.Icon icon={({ size, color }) => <Icon name="mail" size={size} color={color} />} />}
                      outlineColor="#E5E7EB"
                      activeOutlineColor="#4F46E5"
                      style={styles.textInput}
                    />
                    <Text style={styles.helperText}>johndoe@gmail.com</Text>
                  </View>

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.fieldWrapper}>
                    <PaperTextInput
                      mode="outlined"
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      left={<PaperTextInput.Icon icon={({ size, color }) => <Icon name="lock" size={size} color={color} />} />}
                      outlineColor="#E5E7EB"
                      activeOutlineColor="#4F46E5"
                      style={styles.textInput}
                    />
                  </View>

                  <TouchableOpacity onPress={() => {}} style={styles.forgotLink} activeOpacity={0.7}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <View style={styles.checkboxRow}>
                    <Checkbox status={acceptTerms ? "checked" : "unchecked"} onPress={() => setAcceptTerms((p) => !p)} color="#4F46E5" />
                    <Text style={styles.checkboxText}>
                      I agree to the GetFleet <Text style={styles.linkText}>Terms of Use</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
                    </Text>
                  </View>

                  <Button mode="contained" onPress={SignInHandler} disabled={loading || !acceptTerms} style={styles.signInButton} contentStyle={styles.signInButtonContent}>
                    {loading ? <ActivityIndicator animating size="small" color="#fff" /> : "Sign In"}
                  </Button>
                </>
              )}

              {mode === "drivers" && (
                <>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.fieldWrapper}>
                    <PaperTextInput mode="outlined" placeholder="Enter phone or driver ID" outlineColor="#E5E7EB" activeOutlineColor="#4F46E5" left={<PaperTextInput.Icon icon={({ size, color }) => <Icon name="smartphone" size={size} color={color} />} />} style={styles.textInput} />
                  </View>

                  <Button mode="contained" style={styles.signInButton} contentStyle={styles.signInButtonContent} onPress={() => {}}>
                    Sign In as Driver
                  </Button>
                </>
              )}
            </Surface>
            <View style={{ height: 24 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#E2E8F0" },

  scrollContent: { flexGrow: 1, paddingBottom: 80, paddingTop: 50, paddingHorizontal: 24, backgroundColor: "#F1F5F9" },

  card: { borderRadius: 16, padding: 24, backgroundColor: "#FFFFFF", maxWidth: 400, width: "100%", alignSelf: "center" },

  header: { alignItems: "center", marginBottom: 16 },

  logo: { height: 80, width: 80, marginBottom: 12 },

  title: { color: "#4338CA", textAlign: "center", fontWeight: "700" },

  subtitle: { color: "#6B7280", marginTop: 2, textAlign: "center", fontSize: 13 },

  switchContainer: { flexDirection: "row", backgroundColor: "#E0E7FF", borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: "#C7D2FE", overflow: "hidden" },

  switchButton: { flex: 1, paddingVertical: 10, alignItems: "center", justifyContent: "center" },

  switchButtonActive: { backgroundColor: "#FFFFFF" },

  switchText: { fontWeight: "600", color: "#818CF8" },

  switchTextActive: { color: "#4F46E5" },

  label: { color: "#374151", marginBottom: 4, fontSize: 14 },

  required: { color: "#1E1B4B" },

  fieldWrapper: { marginBottom: 12 },

  textInput: { backgroundColor: "#FFFFFF" },

  helperText: { fontSize: 11, marginTop: 4, color: "#9CA3AF" },

  forgotLink: { alignSelf: "flex-end", marginTop: 4, marginBottom: 16 },

  forgotText: { color: "#4F46E5", fontWeight: "500", fontSize: 13 },

  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },

  checkboxText: { flex: 1, color: "#4B5563", fontSize: 13 },

  linkText: { color: "#4F46E5", fontWeight: "500" },

  signInButton: { borderRadius: 12, backgroundColor: "#4F46E5" },

  signInButtonContent: { paddingVertical: 10 },
  
});
