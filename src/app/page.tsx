"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cormorant, Inter } from "next/font/google";
import { supabase } from "@/lib/supabase";

const cormorant = Cormorant({ subsets: ["latin"], weight: ["300", "400", "600"] });
const inter = Inter({ subsets: ["latin"] });

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    // 1️⃣ Authenticate with Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const user = data.user;

    if (!user) {
      setError("Authentication failed.");
      return;
    }

    // 2️⃣ Fetch role from public.users
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError("User profile not found.");
      return;
    }

    // 3️⃣ Check role
    if (profile.role !== "admin" && profile.role !== "super_admin") {
      await supabase.auth.signOut();
      setError("You are not authorized to access the admin dashboard.");
      return;
    }

    // ✅ Admin → proceed
    router.push("/dashboard");
  };

  return (
    <div className={`flex min-h-screen ${inter.className}`}>
      {/* Left Side - Branding (UNCHANGED) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/loginchtmbg.jpg')" }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-2 overflow-hidden">
              <img src="/chtmlogo.png" alt="CHTM Logo" className="w-full h-full object-contain" />
            </div>

            <div className="text-center">
              <h1
                className="text-6xl font-bold tracking-tight"
                style={{ fontFamily: "Montserrat, serif", color: "#FF0080" }}
              >
                CHTM-RRS
              </h1>
              <p className="text-base font-medium mt-1 tracking-wide">
                ROOM RESERVATION SYSTEM
              </p>
            </div>

            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center p-2 overflow-hidden">
              <img src="/gclogo.png" alt="GC Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <p
            className="text-left flex items-center mt-8"
            style={{
              width: "430px",
              height: "96px",
              fontWeight: 500,
              fontSize: "20px",
              lineHeight: "32px",
              textShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
            }}
          >
            "Enhancing service excellence through the College of Hospitality and Tourism Management"
          </p>

          <div
            className="w-48 h-1 bg-pink-600 mt-4 self-start"
            style={{ marginLeft: "calc((100% - 430px) / 2)" }}
          ></div>

          <p
            className="mt-6 text-white text-sm font-semibold self-start"
            style={{ marginLeft: "calc((100% - 430px) / 2)" }}
          >
            CHTM Department
          </p>
        </div>
      </div>

      {/* Right Side - ADMIN LOGIN ONLY */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-2xl px-8">
          <div className="mb-12">
            <h2
              className={`text-7xl font-light mb-2 ${cormorant.className}`}
              style={{ color: "#3D5A4C" }}
            >
              Admin Login
            </h2>
            <div className="w-64 h-1 bg-pink-600 mb-4"></div>
            <p className="text-gray-600 text-base font-medium">
              Sign in to access the admin dashboard.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className={`block text-lg font-medium mb-2 ${cormorant.className}`}
                style={{ color: "#3D5A4C" }}
              >
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-gray-50 text-black"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-lg font-medium mb-2 ${cormorant.className}`}
                style={{ color: "#3D5A4C" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-gray-50 text-black"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full text-white py-4 px-4 text-lg rounded-md transition-colors font-medium"
              style={{ backgroundColor: "#3D5A4C" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2d4339")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3D5A4C")}
            >
              Sign in →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}