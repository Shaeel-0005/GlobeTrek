
import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebase"; // Assuming you have a firebase.js file with initialized Firebase app

export default function SignIn() {
  const [open, setOpen] = useState(false); // Modal closed by default
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const auth = getAuth(app);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setOpen(false); // Close modal on successful login
      navigate("/dashboard"); // Redirect to dashboard
    } catch (err) {
      setError(err.message);
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
                    className="text-2xl font-bold leading-6 text-gray-900"
                  >
                    Login to GlobeTrek
                  </DialogTitle>
                  {error && (
                    <div className="mt-2 flex items-center justify-center text-red-500">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                      <p>{error}</p>
                    </div>
                  )}
                </div>
                <form onSubmit={handleLogin} className="mt-5 sm:mt-6">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                  >
                    Login
                  </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
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
