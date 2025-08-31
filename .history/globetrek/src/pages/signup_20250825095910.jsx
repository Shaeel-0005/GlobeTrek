import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

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
    
    // Clear field error when user starts typing
    if (fieldErrors.name) {
      setFieldErrors(prev => ({ ...prev, name: null }));
    }
    
    // Real-time validation
    if (value.trim() && value.trim().length < 2) {
      setFieldErrors(prev => ({ ...prev, name: "Name must be at least 2 characters" }));
    } else if (value.length > 100) {
      setFieldErrors(prev => ({ ...prev, name: "Name must be less than 100 characters" }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear field error when user starts typing
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: null }));
    }
    
    // Real-time validation
    if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear field error when user starts typing
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: null }));
    }
    
    // Real-time validation
    if (value && value.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: "Password must be at least 6 characters" }));
    } else if (value.length > 128) {
      setFieldErrors(prev => ({ ...prev, password: "Password must be less than 128 characters" }));
    }
  };
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

  // Enhanced error parsing
  const parseSupabaseError = (error) => {
    console.error("Full error object:", error);
    
    const message = error?.message || "";
    const code = error?.code || "";
    const details = error?.details || "";
    const hint = error?.hint || "";
    
    // Auth-related errors
    if (message.includes("Password should be at least 6 characters") || code === "weak_password") {
      return "Password must be at least 6 characters long";
    }
    
    if (message.includes("User already registered") || 
        message.includes("email address is already registered") ||
        code === "user_already_exists") {
      return "This email is already registered. Please try signing in instead.";
    }
    
    if (message.includes("invalid email") || code === "invalid_email") {
      return "Please enter a valid email address";
    }
    
    if (message.includes("Password is too weak")) {
      return "Password is too weak. Please include numbers, letters, and special characters";
    }
    
    if (message.includes("signup is disabled") || code === "signup_disabled") {
      return "New account registration is temporarily disabled. Please try again later.";
    }
    
    if (message.includes("Email rate limit exceeded") || code === "email_rate_limit_exceeded") {
      return "Too many emails sent. Please wait a few minutes before trying again.";
    }
    
    // Database-related errors
    if (message.includes("duplicate key value") || code === "23505") {
      if (details.includes("users_email_key")) {
        return "This email is already registered. Please try signing in instead.";
      }
      return "An account with this information already exists";
    }
    
    if (code === "23503") { // Foreign key violation
      return "There was a problem linking your account. Please try again.";
    }
    
    if (code === "23502") { // Not null violation
      return "Required information is missing. Please fill all fields.";
    }
    
    // Network and connection errors
    if (message.includes("fetch") || 
        message.includes("network") || 
        message.includes("Failed to fetch") ||
        code === "network_error") {
      return "Network error. Please check your internet connection and try again.";
    }
    
    if (message.includes("timeout") || code === "timeout") {
      return "Request timed out. Please try again.";
    }
    
    // Server errors
    if (message.includes("Internal server error") || 
        code === "internal_server_error" ||
        message.includes("500")) {
      return "Server error. Please try again in a few moments.";
    }
    
    // Custom application errors
    if (message.includes("Failed to create user profile")) {
      return "Failed to create your profile. Please try again.";
    }
    
    // Rate limiting
    if (message.includes("rate limit") || code === "rate_limit_exceeded") {
      return "Too many requests. Please wait a moment and try again.";
    }
    
    // Default fallback
    return "Something went wrong. Please try again or contact support if the problem persists.";
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError("");
    setSuccess("");
    setFieldErrors({});
    
    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]); // Show first error
      return;
    }
    
    setLoading(true);
    
    let authUserId = null;
    
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData?.user) {
        throw new Error("No user data returned from signup");
      }

      authUserId = authData.user.id;

      // 2. Insert into custom users table with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: authData.user.id,
              name: name.trim(),
              email: email.trim().toLowerCase(),
            });

          if (!insertError) {
            break; // Success, exit retry loop
          }
          
          if (retryCount === maxRetries - 1) {
            throw insertError; // Last attempt failed
          }
          
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        } catch (retryError) {
          if (retryCount === maxRetries - 1) {
            throw retryError;
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // 3. Handle session / confirmation
      if (authData.session) {
        // User is automatically signed in (email confirmation disabled)
        setSuccess("✅ Account created successfully! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard", { state: { userName: name.trim() } });
        }, 1500);
      } else {
        // Email confirmation is enabled
        setSuccess(
          "✅ Account created! Please check your email inbox and confirm your account before signing in."
        );
        
        // Clear the form on success
        setName("");
        setEmail("");
        setPassword("");
      }
      
    } catch (err) {
      console.error("Signup error:", err);
      
      // If we created an auth user but failed to create the profile,
      // we should attempt cleanup (note: this requires admin privileges)
      if (authUserId && err.message?.includes("users")) {
        try {
          // This will only work if you have admin access configured
          // Otherwise, you might need a serverless function for cleanup
          console.log("Attempting to cleanup auth user:", authUserId);
          // await supabase.auth.admin.deleteUser(authUserId);
        } catch (cleanupError) {
          console.error("Failed to cleanup auth user:", cleanupError);
        }
      }
      
      const friendlyError = parseSupabaseError(err);
      setError(friendlyError);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up for GlobeTrek</h2>

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
                fieldErrors.name ? 'border-red-500 focus:ring-red-600' : 'focus:ring-blue-600'
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
                fieldErrors.email ? 'border-red-500 focus:ring-red-600' : 'focus:ring-blue-600'
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
                fieldErrors.password ? 'border-red-500 focus:ring-red-600' : 'focus:ring-blue-600'
              }`}
              required
              disabled={loading}
              minLength={6}
              placeholder="Create a password (min 6 characters)"
            />
            {fieldErrors.password ? (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim() || !password || 
                     Object.values(fieldErrors).some(error => error !== null)}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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