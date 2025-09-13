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
    
    if (fieldErrors.name) {
      setFieldErrors(prev => ({ ...prev, name: null }));
    }
    
    if (value.trim() && value.trim().length < 2) {
      setFieldErrors(prev => ({ ...prev, name: "Name must be at least 2 characters" }));
    } else if (value.length > 100) {
      setFieldErrors(prev => ({ ...prev, name: "Name must be less than 100 characters" }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: null }));
    }
    
    if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: null }));
    }
    
    if (value && value.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: "Password must be at least 6 characters" }));
    } else if (value.length > 128) {
      setFieldErrors(prev => ({ ...prev, password: "Password must be less than 128 characters" }));
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

  // Check if email already exists by trying to send a password reset
  const checkEmailExists = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'https://example.com/reset' // dummy URL, we just want to test
      });
      
      // If no error, email exists in the system
      if (!error) {
        return true;
      }
      
      // Check specific error messages
      if (error.message.includes('User not found') || 
          error.message.includes('Unable to validate email address')) {
        return false; // Email doesn't exist
      }
      
      // For other errors, assume email doesn't exist to avoid blocking valid signups
      return false;
    } catch (err) {
      console.error("Email check error:", err);
      return false; // Assume email doesn't exist on error
    }
  };

  const parseSupabaseError = (error) => {
    console.error("Signup error:", error);
    
    const message = error?.message || "";
    const code = error?.code || "";
    
    if (message.includes("Password should be at least 6 characters") || code === "weak_password") {
      return "Password must be at least 6 characters long";
    }
    
    if (message.includes("User already registered") || 
        message.includes("email address is already registered") ||
        code === "user_already_exists") {
      return "This email is already registered. Please try signing in instead or check your email for a confirmation link if you just signed up.";
    }
    
    if (message.includes("invalid email") || code === "invalid_email") {
      return "Please enter a valid email address";
    }
    
    if (message.includes("signup is disabled") || code === "signup_disabled") {
      return "New account registration is temporarily disabled. Please try again later.";
    }
    
    if (message.includes("Email rate limit exceeded") || code === "email_rate_limit_exceeded") {
      return "Too many emails sent. Please wait a few minutes before trying again.";
    }
    
    if (message.includes("duplicate key value") || code === "23505") {
      return "This email is already registered. Please try signing in instead.";
    }
    
    if (message.includes("fetch") || message.includes("network") || code === "network_error") {
      return "Network error. Please check your internet connection and try again.";
    }
    
    return "Something went wrong during signup. Please try again.";
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
      console.log("Starting signup process for:", email.trim().toLowerCase());

      // Attempt signup - trigger should handle users table insertion automatically
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(), // Back to 'name' to match updated trigger
          }
        }
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
      console.log("User email confirmed:", authData.user.email_confirmed_at);
      console.log("User confirmation sent at:", authData.user.confirmation_sent_at);
      
      // Since we have a database trigger, the users table should be populated automatically
      // Let's verify the user was created in our users table
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error checking user profile:", profileError);
      }

      if (!userProfile) {
        console.warn("User profile not found, trigger may not be working properly");
        // Fallback: manually insert the user
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
          });

        if (insertError) {
          console.error("Manual user insert failed:", insertError);
          throw new Error("Account created but profile setup failed. Please contact support.");
        }
        
        console.log("User profile created manually as fallback");
      } else {
        console.log("User profile created by trigger:", userProfile);
      }

      // Handle success
      if (authData.session) {
        // User is automatically signed in (email confirmation disabled)
        setSuccess("✅ Account created successfully! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard", { state: { userName: name.trim() } });
        }, 1500);
      } else {
        // Email confirmation is enabled and email was sent
        setSuccess(
          "✅ Account created successfully! Please check your email inbox and click the confirmation link to activate your account."
        );
        
        // Clear the form
        setName("");
        setEmail("");
        setPassword("");
      }
      
    } catch (err) {
      console.error("Full signup error:", err);
      const friendlyError = parseSupabaseError(err);
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div
  className="fixed inset-0 bg-black/30 backdrop-blur-md transition-opacity"
  onClick={handleClose}>

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