"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/app/firebaseConfig"
import { doc, setDoc } from "firebase/firestore"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!name.trim()) return setError("Name is required")
    if (password.length < 6) return setError("Password must be at least 6 characters")
    if (password !== confirm) return setError("Passwords do not match")

    setLoading(true)
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCred.user.uid
      await setDoc(doc(db, "users", uid), {
        name,
        email,
        phone,
        createdAt: new Date().toISOString(),
        isAdmin: false,
        disabled: false,
      })
      router.push("/user")
    } catch (err) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-24 bg-background min-h-screen flex items-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold">Create account</h1>
          <p className="text-muted-foreground">Sign up to book and manage your stays.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-8 rounded-lg">
          {error && <div className="text-sm text-destructive">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-2">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone (optional)</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+1 (555) 123-4567" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="••••••" className="pr-12" />
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

          <div>
            <label className="block text-sm font-medium mb-2">Confirm password</label>
            <div className="relative">
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={showConfirm ? "text" : "password"} placeholder="••••••" className="pr-12" />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? (
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary">Sign in</Link>
          </div>
        </form>
      </div>
    </section>
  )
}
