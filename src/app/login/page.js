"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth"
import { auth, db } from "@/app/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetMessage, setResetMessage] = useState("")
  const [resetError, setResetError] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 1500) // Show loading for 1.5 seconds

    return () => clearTimeout(timer)
  }, [])

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setResetError("")
    setResetMessage("")
    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setResetMessage("Password reset email sent! Check your inbox.")
      setResetEmail("")
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setResetError("No account found with this email.")
      } else if (err.code === "auth/invalid-email") {
        setResetError("Invalid email address.")
      } else {
        setResetError("Failed to send reset email. Please try again.")
      }
    } finally {
      setResetLoading(false)
    }
  }

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
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-foreground">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password"
                  className="h-12 text-base pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-8 w-full max-w-md">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Reset Password</h2>
            <p className="text-muted-foreground text-sm mb-6">Enter your email and we&apos;ll send you a link to reset your password.</p>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {resetMessage && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 text-sm p-4 rounded-lg">
                  {resetMessage}
                </div>
              )}
              {resetError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg">
                  {resetError}
                </div>
              )}
              
              <Input
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                type="email"
                placeholder="Enter your email"
                className="h-12 text-base"
                required
              />
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetEmail("")
                    setResetMessage("")
                    setResetError("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
