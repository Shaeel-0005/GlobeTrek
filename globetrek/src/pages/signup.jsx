import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { signup_image } from "../assets/index";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  // Real-time field validation
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);

    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: null }));
    }

    if (value.trim() && value.trim().length < 2) {
      setFieldErrors((prev) => ({
        ...prev,
        name: "Name must be at least 2 characters",
      }));
    } else if (value.length > 100) {
      setFieldErrors((prev) => ({
        ...prev,
        name: "Name must be less than 100 characters",
      }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: null }));
    }

    if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setFieldErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: null }));
    }

    if (value && value.length < 6) {
      setFieldErrors((prev) => ({
        ...prev,
        password: "Password must be at least 6 characters",
      }));
    } else if (value.length > 128) {
      setFieldErrors((prev) => ({
        ...prev,
        password: "Password must be less than 128 characters",
      }));
    }
  };

  // Client-side validation
  const validateForm = () => {
    const errors = [];

    if (!name.trim()) {
      errors.push("Name is required");
    } else if (name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    } else if (name.trim().length > 100) {
      errors.push("Name must be less than 100 characters");
    }

    if (!email.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push("Please enter a valid email address");
    }

    if (!password) {
      errors.push("Password is required");
    } else if (password.length < 6) {
      errors.push("Password must be at least 6 characters");
    } else if (password.length > 128) {
      errors.push("Password must be less than 128 characters");
    }

    return errors;
  };

  const parseSupabaseError = (error) => {
    console.error("Signup error:", error);

    const message = error?.message || "";
    const code = error?.code || "";

    if (
      message.includes("Password should be at least 6 characters") ||
      code === "weak_password"
    ) {
      return "Password must be at least 6 characters long";
    }

    if (
      message.includes("User already registered") ||
      message.includes("already registered") ||
      code === "user_already_exists"
    ) {
      return "This email is already registered. Please sign in instead.";
    }

    if (message.includes("invalid email") || code === "invalid_email") {
      return "Please enter a valid email address";
    }

    if (message.includes("signup is disabled") || code === "signup_disabled") {
      return "New account registration is temporarily disabled. Please try again later.";
    }

    if (
      message.includes("Email rate limit exceeded") ||
      code === "email_rate_limit_exceeded" ||
      message.includes("rate limit")
    ) {
      return "Too many signup attempts. Please wait a few minutes before trying again.";
    }

    if (message.includes("duplicate key value") || code === "23505") {
      return "This email is already registered. Please sign in instead.";
    }

    if (
      message.includes("fetch") ||
      message.includes("network") ||
      code === "network_error"
    ) {
      return "Network error. Please check your internet connection and try again.";
    }

    return "Something went wrong during signup. Please try again.";
  };

  // Helper function to ensure user profile exists
  const ensureUserProfile = async (userId, userName, userEmail) => {
    try {
      console.log("Checking if user profile exists...");
      
      // First, check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle(); // Use maybeSingle to avoid error if not found

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking profile:", checkError);
        throw checkError;
      }

      if (existingProfile) {
        console.log("User profile already exists");
        return { success: true, profile: existingProfile };
      }

      // Profile doesn't exist, create it
      console.log("Creating user profile...");
      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          name: userName,
          email: userEmail,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create user profile:", insertError);
        throw insertError;
      }

      console.log("User profile created successfully:", newProfile);
      return { success: true, profile: newProfile };
      
    } catch (error) {
      console.error("Error in ensureUserProfile:", error);
      return { success: false, error };
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setFieldErrors({});

    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      console.log("Starting signup process for:", trimmedEmail);

      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            name: trimmedName,
          },
          // Set email redirect URL for confirmation
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error("Auth signup error:", authError);
        throw authError;
      }

      if (!authData?.user) {
        throw new Error("No user data returned from signup");
      }

      console.log("Auth user created:", authData.user.id);
      console.log("Session exists:", !!authData.session);

      // Step 2: Ensure user profile exists in database
      // Wait a moment for trigger to complete (if it exists)
      await new Promise(resolve => setTimeout(resolve, 500));

      const profileResult = await ensureUserProfile(
        authData.user.id,
        trimmedName,
        trimmedEmail
      );

      if (!profileResult.success) {
        console.error("Profile creation failed, but auth succeeded");
        // Don't fail the signup, just log it
        console.warn("User can still login, profile will be created on first login");
      }

      // Step 3: Handle success based on whether email confirmation is required
      if (authData.session) {
        // User is automatically signed in (email confirmation disabled)
        setSuccess("✅ Account created successfully! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard", { state: { userName: trimmedName } });
        }, 1500);
      } else {
        // Email confirmation is required
        setSuccess(
          "✅ Account created! Please check your email and click the confirmation link to activate your account."
        );

        // Clear the form
        setName("");
        setEmail("");
        setPassword("");

        // Optionally redirect to a "check your email" page after a delay
        setTimeout(() => {
          navigate("/", { state: { message: "Please check your email to confirm your account" } });
        }, 5000);
      }
    } catch (err) {
      console.error("Signup error:", err);
      const friendlyError = parseSupabaseError(err);
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-xs"
        style={{ backgroundImage: `url(${signup_image})` }}
      ></div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Signup Card */}
      <div className="relative z-10 bg-white/90 backdrop-blur-lg p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Sign Up for GlobeTrek
        </h2>

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                fieldErrors.name
                  ? "border-red-500 focus:ring-red-600"
                  : "focus:ring-blue-600"
              }`}
              required
              disabled={loading}
              minLength={2}
              maxLength={100}
              placeholder="Enter your full name"
            />
            {fieldErrors.name && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? "border-red-500 focus:ring-red-600"
                  : "focus:ring-blue-600"
              }`}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                fieldErrors.password
                  ? "border-red-500 focus:ring-red-600"
                  : "focus:ring-blue-600"
              }`}
              required
              disabled={loading}
              minLength={6}
              placeholder="Create a password (min 6 characters)"
            />
            {fieldErrors.password ? (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.password}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !name.trim() ||
              !email.trim() ||
              !password ||
              Object.values(fieldErrors).some((error) => error !== null)
            }
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline font-medium"
            disabled={loading}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
