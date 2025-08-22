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
  const [open, setOpen] = useState(false); // Modal closed by default
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getFriendlyError = (message) => {
    switch (message) {
      case "Invalid login credentials":
        return "Incorrect email or password.";
      case "Email not confirmed":
        return "Please confirm your email first.";
      case "Too many requests":
        return "Too many attempts. Try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Fetch user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', session.user.id)
        .single();
      if (userError) throw userError;

      setOpen(false); // Close modal on successful login
      navigate('/dashboard', { state: { userName: userData.name } }); // Pass name to dashboard
    } catch (err) {
      const friendlyMessage = getFriendlyError(err.message);
      setError(friendlyMessage);
      setEmail("");
      setPassword("");
      console.error("Login error:", err.message);
    }
  };

  const handleSwitchToSignup = () => {
    setOpen(false); // Close login modal
    navigate("/signup"); // Navigate to signup page
  };

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition text-white"
      >
        Sign In
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-10"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[enter]:ease-out data-[leave]:duration-200 data-[leave]:ease-in"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[enter]:ease-out data-[leave]:duration-200 data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
            >
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <DialogTitle
                    as="h2"
                    className="text-2xl font-bold leading-6 text-gray-
900">
Login to GlobeTrek
        

{error && (

<exclamationtriangleicon class="h-5 w-5 mr-2"> <p>{error}</p> </exclamationtriangleicon>
)}
Email
{email}
 setEmail(e.target.value)} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600" required />
Password
••••••••••
 setPassword(e.target.value)} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600" required />
<button type="submit" class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"> Login </button>

                  Don't have an account?{" "}
                  <button onclick="{handleSwitchToSignup}" class="text-blue-600 hover:underline font-medium">
                    Sign Up
                  </button>
                

); }