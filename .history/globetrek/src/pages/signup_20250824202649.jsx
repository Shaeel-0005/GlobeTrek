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

    try {
      // 1. Create auth user with metadata
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }, // ✅ pass name as metadata
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
          navigate("/dashboard", { state: { userName: name } });
        } else {
          setError(
            "Account created! Please check your email to confirm your account, then sign in."
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
        friendlyError = "This email is already registered. Try signing in.";
      } else if (err.message.includes("invalid email")) {
        friendlyError = "Please enter a valid email address.";
      }

      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up for GlobeTrek</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
