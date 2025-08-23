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
      console.log("🔐 Attempting signup with:", { email, password: "***" });
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      console.log("📝 Signup response:", { authData, authError });
      
      if (authError) throw authError;
      
      if (authData.user) {
        console.log("✅ User created in auth:", authData.user.id);
        
        // 2. Insert user data into users table
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            name: name,
            email: email,
          });
          
        console.log("📊 Insert result:", { insertError });
        
        if (insertError) {
          console.error("Insert failed but user exists in auth");
          throw insertError;
        }
        
        // Check if we have a session (user is immediately logged in)
        if (authData.session) {
          console.log("🎉 User signed up and logged in!");
          navigate("/dashboard", { state: { userName: name } });
        } else {
          console.log("📧 Email confirmation required");
          setError("Account created! Please check your email to confirm your account, then try signing in.");
        }
      }
    }catch (err) {
  console.error("❌ Signup error:", err);

  let friendlyError = "Something went wrong. Please try again.";

  if (err.message.includes("Password should be at least 6 characters")) {
    friendlyError = "Your password is too short. It must be at least 6 characters.";
  } else if (err.message.includes("duplicate key value") || err.message.includes("User already registered")) {
    friendlyError = "This email is already registered. Try signing in instead.";
  } else if (err.message.includes("invalid email")) {
    friendlyError = "Please enter a valid email address.";
  } else if (err.message.includes("network")) {
    friendlyError = "Network issue. Please check your internet and try again.";
  } else if (err.message.includes("Database error")) {
    friendlyError = "We couldn’t save your details. Please try again later.";
  }

  setError(friendlyError);
}
finally {
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
        
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              disabled={loading}
              minLength={6}
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