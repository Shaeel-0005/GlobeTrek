import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
const handleSignup = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setSuccess("");

  try {
    // 1. Create auth user with metadata
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (authError) throw authError;

    if (data?.user) {
      // 2. Insert into public.users
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        name,
        email,
      });

      if (insertError) {
        console.error("❌ Insert failed:", insertError);
        throw insertError;
      }

      // 3. Handle session / confirmation
      if (data.session) {
        // ✅ Logged in instantly (if email confirmations are OFF)
        navigate("/dashboard", { state: { userName: name } });
      } else {
        // ✅ User created, needs to confirm email
        setSuccess(
          "✅ Account created! Please check your email to confirm before signing in."
        );
      }
    }
  } catch (err) {
    console.error("❌ Signup error:", err);

    let friendlyError = "Something went wrong. Please try again.";

    if (err.message.includes("Password should be at least 6 characters")) {
      friendlyError = "Password must be at least 6 characters.";
    } else if (
      err.message.includes("duplicate key value") ||
      err.message.includes("User already registered")
    ) {
      friendlyError =
        "This email is already registered. Please check your inbox for a confirmation email or try signing in.";
    } else if (err.message.includes("invalid email")) {
      friendlyError = "Please enter a valid email address.";
    }

    setError(friendlyError);
  } finally {
    setLoading(false);
  }
};
