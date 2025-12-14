"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth, db } from "@/app/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 1500) // Show loading for 1.5 seconds

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      // Check if user is disabled
      const ud = await getDoc(doc(db, "users", cred.user.uid))
      if (ud.exists() && ud.data().disabled) {
        await signOut(auth)
        setError("Your account has been disabled. Contact support.")
        return
      }

      // Check if user is superadmin first
      if (cred.user.email === "superadmin@jopatsresort.com") {
        router.push("/superadmin")
        return
      }
      
      // If user is admin (flag in Firestore) or special admin email, redirect to admin dashboard
      const isAdmin = (ud.exists() && ud.data().isAdmin) || cred.user.email === "admin@jopatsresort.com"
      if (isAdmin) {
        router.push("/admin")
      } else {
        router.push("/user")
      }
    } catch (err) {
      // Handle specific Firebase auth errors with user-friendly messages
      let errorMessage = "Failed to sign in. Please try again."
      
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        errorMessage = "Invalid email or password. Please check your credentials and try again."
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address. Please enter a valid email."
      } else if (err.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled. Please contact support."
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later."
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection and try again."
      } else if (err.message) {
        // Use the error message if it's available and user-friendly
        errorMessage = err.message.replace("Firebase: Error (", "").replace(")", "")
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Show loading screen with logo
  if (pageLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <Logo className="scale-200" />
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-8">
            <Logo className="scale-150" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-3">Welcome Back</h1>
          <p className="text-muted-foreground text-base">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-8 md:p-10 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Email Address</label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                type="email" 
                placeholder="you@example.com"
                className="h-12 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Password</label>
              <Input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                type="password" 
                placeholder="Enter your password"
                className="h-12 text-base"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="pt-4 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors underline-offset-4 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </section>
  )
}
