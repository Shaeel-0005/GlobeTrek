'use client'

import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function SignIn() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      // 2. Get user name from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name")
        .eq("id", authData.session.user.id)
        .single();
        
      const userName = userData?.name || "User";
      
      // 3. Close dialog and navigate
      setOpen(false);
      navigate("/dashboard", { state: { userName } });
      
    } catch (err) {
      console.error("Login error:", err);
      let friendlyError = "Login failed. Please try again.";
      
      if (err.message.includes("Invalid login credentials")) {
        friendlyError = "Incorrect email or password.";
      } else if (err.message.includes("Email not confirmed")) {
        friendlyError = "Please confirm your email first.";
      }
      
      setError(friendlyError);
      setEmail("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSignup = () => {
    setOpen(false);
    navigate("/signup");
  };

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition text-white"
      >
        Sign In
      </button>
      
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-10">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <DialogTitle as="h2" className="text-2xl font-bold leading-6 text-gray-900">
                    Login to GlobeTrek
                  </DialogTitle>
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                      <p>{error}</p>
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleLogin} className="mt-5 sm:mt-6">
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
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? "Signing In..." : "Login"}
                  </button>
                </form>
                
                <p className="mt-4 text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    onClick={handleSwitchToSignup}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}