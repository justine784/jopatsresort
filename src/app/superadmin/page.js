"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebaseConfig"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export default function SuperAdminPage() {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, admins, customers
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login")
        return
      }
      setUser(u)
      
      // Check if user is superadmin
      const isSuperAdmin = u.email === "superadmin@jopatsresort.com"
      
      if (!isSuperAdmin) {
        // Check if regular admin, redirect to admin page
        const userDoc = await getDoc(doc(db, "users", u.uid))
        const isAdmin = (userDoc.exists() && userDoc.data().isAdmin) || u.email === "admin@jopatsresort.com"
        if (isAdmin) {
          router.push("/admin")
        } else {
          router.push("/user")
        }
        return
      }
      
      // Fetch all users
      await loadUsers()
    })

    return () => unsub()
  }, [router])

  const loadUsers = async () => {
    try {
      const userSnapshot = await getDocs(collection(db, "users"))
      const allUsers = userSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setUsers(allUsers)
      setLoading(false)
    } catch (error) {
      console.error("Error loading users:", error)
      setLoading(false)
    }
  }

  const toggleFlag = async (uid, flag) => {
    try {
      const ref = doc(db, "users", uid)
      const currentValue = users.find((u) => u.id === uid)?.[flag] || false
      await updateDoc(ref, { [flag]: !currentValue })
      setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, [flag]: !u[flag] } : u)))
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const removeUserDoc = async (uid) => {
    if (!confirm("Are you sure you want to delete this user document?")) return
    try {
      await deleteDoc(doc(db, "users", uid))
      setUsers((prev) => prev.filter((u) => u.id !== uid))
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/")
  }

  // Calculate statistics
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.isAdmin || u.email === "admin@jopatsresort.com").length,
    customers: users.filter((u) => !u.isAdmin && u.email !== "admin@jopatsresort.com").length,
    disabled: users.filter((u) => u.disabled).length,
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (filter === "admins") {
      return u.isAdmin || u.email === "admin@jopatsresort.com"
    }
    if (filter === "customers") {
      return !u.isAdmin && u.email !== "admin@jopatsresort.com"
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      <Navigation />
      <section className="py-24 bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage all accounts, admins, and customers.</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Total Users</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Admins</div>
              <div className="text-3xl font-bold text-blue-600">{stats.admins}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Customers</div>
              <div className="text-3xl font-bold text-green-600">{stats.customers}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-1">Disabled</div>
              <div className="text-3xl font-bold text-red-600">{stats.disabled}</div>
            </Card>
          </div>

          {/* Quick Access */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" onClick={() => router.push("/admin")}>
                View Admin Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push("/user")}>
                View Customer Page
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                View Home Page
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </Card>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All Users ({stats.total})
            </Button>
            <Button
              variant={filter === "admins" ? "default" : "outline"}
              onClick={() => setFilter("admins")}
            >
              Admins ({stats.admins})
            </Button>
            <Button
              variant={filter === "customers" ? "default" : "outline"}
              onClick={() => setFilter("customers")}
            >
              Customers ({stats.customers})
            </Button>
          </div>

          {/* Users List */}
          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No users found.</p>
              </Card>
            ) : (
              filteredUsers.map((u) => {
                const isAdminUser = u.isAdmin || u.email === "admin@jopatsresort.com"
                const isSuperAdminUser = u.email === "superadmin@jopatsresort.com"
                
                return (
                  <Card key={u.id} className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-semibold">{u.name || "(no name)"}</div>
                          {isSuperAdminUser && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                              Super Admin
                            </span>
                          )}
                          {isAdminUser && !isSuperAdminUser && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Admin
                            </span>
                          )}
                          {!isAdminUser && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Customer
                            </span>
                          )}
                          {u.disabled && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                        </div>
                        {u.phone && (
                          <div className="text-sm text-muted-foreground">Phone: {u.phone}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isSuperAdminUser && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleFlag(u.id, "isAdmin")}
                            >
                              {isAdminUser ? "Revoke Admin" : "Make Admin"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleFlag(u.id, "disabled")}
                            >
                              {u.disabled ? "Enable" : "Disable"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUserDoc(u.id)}
                            >
                              Remove Doc
                            </Button>
                          </>
                        )}
                        {isSuperAdminUser && (
                          <span className="text-sm text-muted-foreground">Protected Account</span>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
