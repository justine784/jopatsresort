"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth, db, storage } from "@/app/firebaseConfig"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { collection, getDocs, doc, updateDoc, setDoc, addDoc, deleteDoc, query, orderBy, onSnapshot } from "firebase/firestore"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Logo } from "@/components/logo"
import { User, ChevronDown, Settings, LogOut, X, Moon, Sun, Lock, Menu, Home, Bed, Building2, Calendar, MessageSquare, Users, Upload, Image as ImageIcon, Wrench, Sparkles, CheckCircle, MoreVertical } from "lucide-react"

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])
  const [cottages, setCottages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddRoomModal, setShowAddRoomModal] = useState(false)
  const [showEditRoomModal, setShowEditRoomModal] = useState(false)
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState(null)
  const [openRoomMenuId, setOpenRoomMenuId] = useState(null)
  const [openCottageMenuId, setOpenCottageMenuId] = useState(null)
  const [showAddCottageModal, setShowAddCottageModal] = useState(false)
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false)
  const [addingRoom, setAddingRoom] = useState(false)
  const [updatingRoom, setUpdatingRoom] = useState(false)
  const [addingCottage, setAddingCottage] = useState(false)
  const [addingTestimonial, setAddingTestimonial] = useState(false)
  const [testimonials, setTestimonials] = useState([])
  const [activeTab, setActiveTab] = useState("bookings") // "bookings" or "users"
  const [activeSidebarItem, setActiveSidebarItem] = useState("bookings") // "dashboard", "rooms", "cottage", "bookings", "feedback", "users"
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile") // "profile", "password", "appearance"
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  // Room form state
  const [roomForm, setRoomForm] = useState({
    type: "",
    price: "",
    guests: "",
    beds: "",
    size: "",
    description: "",
    features: "",
    image: "",
  })
  const [roomImageFile, setRoomImageFile] = useState(null)
  const [roomImagePreview, setRoomImagePreview] = useState(null)
  const [uploadingRoomImage, setUploadingRoomImage] = useState(false)
  // Cottage form state
  const [cottageForm, setCottageForm] = useState({
    type: "",
    price: "",
    guests: "",
    size: "",
    description: "",
    image: "",
  })
  const [cottageImageFile, setCottageImageFile] = useState(null)
  const [cottageImagePreview, setCottageImagePreview] = useState(null)
  const [uploadingCottageImage, setUploadingCottageImage] = useState(false)
  const profileMenuRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/login")
      setUser(u)
      
      // Check if user is superadmin - redirect to superadmin page
      if (u.email === "superadmin@jopatsresort.com") {
        router.push("/superadmin")
        return
      }
      
      // Check if user is admin by email or Firestore flag
      const isAdminByEmail = u.email === "admin@jopatsresort.com"
      
      // fetch current user's doc
      const userSnapshot = await getDocs(collection(db, "users"))
      // find current user's doc
      const currentDoc = userSnapshot.docs.find((d) => d.id === u.uid)
      const userData = currentDoc ? currentDoc.data() : null
      setUserDoc(userData)
      // Set initial profile name
      if (userData) {
        setProfileName(userData.name || "")
      }
      
      // Check if user is admin (either by email or Firestore flag)
      const isAdmin = isAdminByEmail || (currentDoc && currentDoc.data().isAdmin)
      
      if (!isAdmin) {
        // not an admin
        router.push("/")
        return
      }
      // fetch all users
      const allUsers = userSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setUsers(allUsers)
      
      // fetch all bookings
      await loadBookings()
      
      // fetch rooms and cottages
      await loadRooms()
      await loadCottages()
      
      // fetch testimonials
      await loadTestimonials()
      
      setLoading(false)
    })

    return () => unsub()
  }, [router])

  // Set up real-time listener for bookings
  useEffect(() => {
    if (!user) return

    // Real-time listener for bookings
    const bookingsUnsubscribe = onSnapshot(
      query(collection(db, "bookings"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const allBookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        setBookings(allBookings)
        console.log("Bookings updated in real-time:", allBookings.length)
      },
      (error) => {
        console.error("Error listening to bookings:", error)
        // Fallback to regular load if listener fails
        loadBookings()
      }
    )

    // Cleanup listener on unmount
    return () => {
      bookingsUnsubscribe()
    }
  }, [user])

  const loadBookings = async () => {
    try {
      const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const allBookings = bookingsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setBookings(allBookings)
    } catch (error) {
      console.error("Error loading bookings:", error)
    }
  }

  const loadRooms = async () => {
    try {
      const roomsSnapshot = await getDocs(collection(db, "rooms"))
      const allRooms = roomsSnapshot.docs.map((d) => {
        const data = d.data()
        console.log("Room loaded:", d.id, data)
        return { id: d.id, ...data }
      })
      setRooms(allRooms)
      console.log("Total rooms loaded:", allRooms.length)
    } catch (error) {
      console.error("Error loading rooms:", error)
    }
  }

  const loadCottages = async () => {
    try {
      const cottagesSnapshot = await getDocs(collection(db, "cottages"))
      const allCottages = cottagesSnapshot.docs.map((d) => {
        const data = d.data()
        console.log("Cottage loaded:", d.id, data)
        return { id: d.id, ...data }
      })
      setCottages(allCottages)
      console.log("Total cottages loaded:", allCottages.length)
    } catch (error) {
      console.error("Error loading cottages:", error)
    }
  }

  const loadTestimonials = async () => {
    try {
      const testimonialsQuery = query(collection(db, "testimonials"), orderBy("date", "desc"))
      const testimonialsSnapshot = await getDocs(testimonialsQuery)
      const allTestimonials = testimonialsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setTestimonials(allTestimonials)
    } catch (error) {
      console.error("Error loading testimonials:", error)
      // If collection doesn't exist, set empty array
      setTestimonials([])
    }
  }

  const handleAddTestimonial = async (e) => {
    e.preventDefault()
    if (!testimonialForm.name || !testimonialForm.comment) {
      alert("Please fill in name and comment")
      return
    }

    setAddingTestimonial(true)
    try {
      const testimonialData = {
        name: testimonialForm.name,
        location: testimonialForm.location || "",
        rating: parseInt(testimonialForm.rating) || 5,
        comment: testimonialForm.comment,
        date: testimonialForm.date || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        createdAt: new Date().toISOString(),
      }
      
      await addDoc(collection(db, "testimonials"), testimonialData)
      await loadTestimonials()
      alert("Testimonial added successfully!")
      setShowAddTestimonialModal(false)
      setTestimonialForm({
        name: "",
        location: "",
        rating: 5,
        comment: "",
        date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      })
    } catch (error) {
      console.error("Error adding testimonial:", error)
      alert("Failed to add testimonial. Please try again.")
    } finally {
      setAddingTestimonial(false)
    }
  }

  const handleDeleteTestimonial = async (testimonialId) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return
    try {
      await deleteDoc(doc(db, "testimonials", testimonialId))
      await loadTestimonials()
      alert("Testimonial deleted successfully!")
    } catch (error) {
      console.error("Error deleting testimonial:", error)
      alert("Failed to delete testimonial. Please try again.")
    }
  }

  const handleRoomImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB")
        return
      }
      setRoomImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setRoomImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadRoomImage = async (retryCount = 0) => {
    if (!roomImageFile) return null
    
    setUploadingRoomImage(true)
    const maxRetries = 2
    
    try {
      // Sanitize filename
      const sanitizedName = roomImageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const imageRef = ref(storage, `rooms/${Date.now()}_${sanitizedName}`)
      
      // Add metadata for better upload handling
      const metadata = {
        contentType: roomImageFile.type || 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      }
      
      // Upload with metadata
      await uploadBytes(imageRef, roomImageFile, metadata)
      const downloadURL = await getDownloadURL(imageRef)
      return downloadURL
    } catch (error) {
      console.error("Error uploading image (attempt " + (retryCount + 1) + "):", error)
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (
        error.code === 'storage/retry-limit-exceeded' ||
        error.code === 'storage/network-request-failed' ||
        error.message?.includes('network')
      )) {
        console.log("Retrying image upload...")
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before retry
        return uploadRoomImage(retryCount + 1)
      }
      
      // If retries exhausted or other error, throw
      throw new Error(`Image upload failed: ${error.message || 'Network error. Please check your connection and try again.'}`)
    } finally {
      setUploadingRoomImage(false)
    }
  }

  const handleOpenEditRoom = (room) => {
    setSelectedRoomForEdit(room)
    setRoomForm({
      type: room.type || "",
      price: room.price?.toString() || "",
      guests: room.guests?.toString() || "",
      beds: room.beds?.toString() || "",
      size: room.size || "",
      description: room.description || "",
      features: room.features ? (Array.isArray(room.features) ? room.features.join(", ") : room.features) : "",
      image: room.image || "",
    })
    setRoomImageFile(null)
    setRoomImagePreview(room.image || null)
    setShowEditRoomModal(true)
  }

  const handleUpdateRoom = async (e) => {
    e.preventDefault()
    if (!selectedRoomForEdit || !roomForm.type || !roomForm.price || !roomForm.guests) {
      alert("Please fill in all required fields (Type, Price, and Guests)")
      return
    }

    setUpdatingRoom(true)
    try {
      let imageUrl = roomForm.image
      
      // Upload image if file is selected
      if (roomImageFile) {
        try {
          imageUrl = await uploadRoomImage()
          if (!imageUrl) {
            throw new Error("Image upload failed")
          }
        } catch (uploadError) {
          console.error("Image upload error:", uploadError)
          const useUrl = confirm(
            "Failed to upload image: " + (uploadError.message || "Network error") + 
            "\n\nWould you like to continue without the image or use an image URL instead?\n\nClick OK to continue without image, or Cancel to go back and add an image URL."
          )
          if (!useUrl) {
            setUpdatingRoom(false)
            return
          }
          // Continue without image or use provided URL
          imageUrl = roomForm.image || selectedRoomForEdit.image || "/room1.jpg"
        }
      }
      
      const roomData = {
        type: roomForm.type.trim(),
        price: parseFloat(roomForm.price),
        guests: parseInt(roomForm.guests),
        beds: parseInt(roomForm.beds) || 1,
        size: roomForm.size.trim() || "",
        description: roomForm.description.trim() || "",
        features: roomForm.features ? roomForm.features.split(",").map((f) => f.trim()).filter((f) => f) : [],
        image: imageUrl || selectedRoomForEdit.image || "/room1.jpg",
        updatedAt: new Date().toISOString(),
      }
      
      // Update in Firebase Firestore
      await updateDoc(doc(db, "rooms", selectedRoomForEdit.id), roomData)
      console.log("Room updated in Firebase:", selectedRoomForEdit.id)
      
      // Reload rooms to show the updated one
      await loadRooms()
      
      alert(`Room "${roomForm.type}" updated successfully!`)
      setShowEditRoomModal(false)
      setSelectedRoomForEdit(null)
      setRoomForm({
        type: "",
        price: "",
        guests: "",
        beds: "",
        size: "",
        description: "",
        features: "",
        image: "",
      })
      setRoomImageFile(null)
      setRoomImagePreview(null)
    } catch (error) {
      console.error("Error updating room:", error)
      alert(`Failed to update room: ${error.message || "Please check your connection and try again."}`)
    } finally {
      setUpdatingRoom(false)
    }
  }

  const handleAddRoom = async (e) => {
    e.preventDefault()
    if (!roomForm.type || !roomForm.price || !roomForm.guests) {
      alert("Please fill in all required fields (Type, Price, and Guests)")
      return
    }

    setAddingRoom(true)
    try {
      let imageUrl = roomForm.image
      
      // Upload image if file is selected
      if (roomImageFile) {
        try {
          imageUrl = await uploadRoomImage()
          if (!imageUrl) {
            throw new Error("Image upload failed")
          }
        } catch (uploadError) {
          console.error("Image upload error:", uploadError)
          const useUrl = confirm(
            "Failed to upload image: " + (uploadError.message || "Network error") + 
            "\n\nWould you like to continue without the image or use an image URL instead?\n\nClick OK to continue without image, or Cancel to go back and add an image URL."
          )
          if (!useUrl) {
            setAddingRoom(false)
            return
          }
          // Continue without image or use provided URL
          imageUrl = roomForm.image || "/room1.jpg"
        }
      }
      
      const roomData = {
        type: roomForm.type.trim(),
        price: parseFloat(roomForm.price),
        guests: parseInt(roomForm.guests),
        beds: parseInt(roomForm.beds) || 1,
        size: roomForm.size.trim() || "",
        description: roomForm.description.trim() || "",
        features: roomForm.features ? roomForm.features.split(",").map((f) => f.trim()).filter((f) => f) : [],
        image: imageUrl || "/room1.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      // Save to Firebase Firestore
      const docRef = await addDoc(collection(db, "rooms"), roomData)
      console.log("Room added to Firebase with ID:", docRef.id)
      console.log("Room data saved:", roomData)
      
      // Reload rooms to show the new one
      await loadRooms()
      
      alert(`Room "${roomForm.type}" added successfully to Firebase!`)
      setShowAddRoomModal(false)
      setRoomForm({
        type: "",
        price: "",
        guests: "",
        beds: "",
        size: "",
        description: "",
        features: "",
        image: "",
      })
      setRoomImageFile(null)
      setRoomImagePreview(null)
    } catch (error) {
      console.error("Error adding room to Firebase:", error)
      alert(`Failed to add room to Firebase: ${error.message || "Please check your connection and try again."}`)
    } finally {
      setAddingRoom(false)
    }
  }

  const handleCottageImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB")
        return
      }
      setCottageImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCottageImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadCottageImage = async (retryCount = 0) => {
    if (!cottageImageFile) return null
    
    setUploadingCottageImage(true)
    const maxRetries = 2
    
    try {
      // Sanitize filename
      const sanitizedName = cottageImageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const imageRef = ref(storage, `cottages/${Date.now()}_${sanitizedName}`)
      
      // Add metadata for better upload handling
      const metadata = {
        contentType: cottageImageFile.type || 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      }
      
      // Upload with metadata
      await uploadBytes(imageRef, cottageImageFile, metadata)
      const downloadURL = await getDownloadURL(imageRef)
      return downloadURL
    } catch (error) {
      console.error("Error uploading image (attempt " + (retryCount + 1) + "):", error)
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (
        error.code === 'storage/retry-limit-exceeded' ||
        error.code === 'storage/network-request-failed' ||
        error.message?.includes('network')
      )) {
        console.log("Retrying image upload...")
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds before retry
        return uploadCottageImage(retryCount + 1)
      }
      
      // If retries exhausted or other error, throw
      throw new Error(`Image upload failed: ${error.message || 'Network error. Please check your connection and try again.'}`)
    } finally {
      setUploadingCottageImage(false)
    }
  }

  const handleAddCottage = async (e) => {
    e.preventDefault()
    if (!cottageForm.type || !cottageForm.price || !cottageForm.guests) {
      alert("Please fill in all required fields (Type, Price, and Guests)")
      return
    }

    setAddingCottage(true)
    try {
      let imageUrl = cottageForm.image
      
      // Upload image if file is selected
      if (cottageImageFile) {
        try {
          imageUrl = await uploadCottageImage()
          if (!imageUrl) {
            throw new Error("Image upload failed")
          }
        } catch (uploadError) {
          console.error("Image upload error:", uploadError)
          const useUrl = confirm(
            "Failed to upload image: " + (uploadError.message || "Network error") + 
            "\n\nWould you like to continue without the image or use an image URL instead?\n\nClick OK to continue without image, or Cancel to go back and add an image URL."
          )
          if (!useUrl) {
            setAddingCottage(false)
            return
          }
          // Continue without image or use provided URL
          imageUrl = cottageForm.image || "/cottage.jpg"
        }
      }
      
      const cottageData = {
        type: cottageForm.type.trim(),
        price: parseFloat(cottageForm.price),
        guests: parseInt(cottageForm.guests),
        size: cottageForm.size.trim() || "",
        description: cottageForm.description.trim() || "",
        image: imageUrl || "/cottage.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      // Save to Firebase Firestore
      const docRef = await addDoc(collection(db, "cottages"), cottageData)
      console.log("Cottage added to Firebase with ID:", docRef.id)
      console.log("Cottage data saved:", cottageData)
      
      // Reload cottages to show the new one
      await loadCottages()
      
      alert(`Cottage "${cottageForm.type}" added successfully to Firebase!`)
      setShowAddCottageModal(false)
      setCottageForm({
        type: "",
        price: "",
        guests: "",
        size: "",
        description: "",
        image: "",
      })
      setCottageImageFile(null)
      setCottageImagePreview(null)
    } catch (error) {
      console.error("Error adding cottage to Firebase:", error)
      alert(`Failed to add cottage to Firebase: ${error.message || "Please check your connection and try again."}`)
    } finally {
      setAddingCottage(false)
    }
  }

  const handleDeleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) return
    try {
      await deleteDoc(doc(db, "rooms", roomId))
      await loadRooms()
      alert("Room deleted successfully!")
    } catch (error) {
      console.error("Error deleting room:", error)
      alert("Failed to delete room. Please try again.")
    }
  }

  const handleDeleteCottage = async (cottageId) => {
    if (!confirm("Are you sure you want to delete this cottage?")) return
    try {
      await deleteDoc(doc(db, "cottages", cottageId))
      await loadCottages()
      alert("Cottage deleted successfully!")
    } catch (error) {
      console.error("Error deleting cottage:", error)
      alert("Failed to delete cottage. Please try again.")
    }
  }

  const toggleFlag = async (uid, flag) => {
    const ref = doc(db, "users", uid)
    await updateDoc(ref, { [flag]: !users.find((u) => u.id === uid)[flag] })
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, [flag]: !u[flag] } : u)))
  }

  const removeUserDoc = async (uid) => {
    // deletes the Firestore user document. Deleting the Auth user requires admin SDK.
    await deleteDoc(doc(db, "users", uid))
    setUsers((prev) => prev.filter((u) => u.id !== uid))
  }

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const ref = doc(db, "bookings", bookingId)
      await updateDoc(ref, { status: newStatus })
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)))
    } catch (error) {
      console.error("Error updating booking:", error)
      alert("Failed to update booking status")
    }
  }

  const deleteBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to delete this booking?")) return
    try {
      await deleteDoc(doc(db, "bookings", bookingId))
      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
    } catch (error) {
      console.error("Error deleting booking:", error)
      alert("Failed to delete booking")
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/")
  }

  const handleOpenProfileSettings = () => {
    setShowProfileMenu(false)
    setShowProfileSettings(true)
    // Set current name when opening settings
    if (userDoc) {
      setProfileName(userDoc.name || "")
    } else if (user) {
      setProfileName(user.email || "")
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!user || !profileName.trim()) {
      alert("Please enter a valid name")
      return
    }

    setUpdatingProfile(true)
    try {
      const userRef = doc(db, "users", user.uid)
      const userDataToUpdate = {
        name: profileName.trim(),
        email: user.email,
        ...(userDoc || {}),
      }
      
      // Use setDoc with merge to create or update
      await setDoc(userRef, userDataToUpdate, { merge: true })
      
      // Update local state
      const updatedUserDoc = { ...userDoc, ...userDataToUpdate }
      setUserDoc(updatedUserDoc)
      setUsers((prev) => prev.map((u) => (u.id === user.uid ? { ...u, name: profileName.trim() } : u)))
      
      alert("Profile updated successfully!")
      setShowProfileSettings(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!user) {
      alert("User not found")
      return
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all password fields")
      return
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match")
      return
    }

    setChangingPassword(true)
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      
      // Update password
      await updatePassword(user, newPassword)
      
      alert("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setActiveSettingsTab("profile")
    } catch (error) {
      console.error("Error changing password:", error)
      if (error.code === "auth/wrong-password") {
        alert("Current password is incorrect")
      } else if (error.code === "auth/weak-password") {
        alert("New password is too weak")
      } else {
        alert("Failed to change password. Please try again.")
      }
    } finally {
      setChangingPassword(false)
    }
  }

  // Dark mode effect
  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem("theme")
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setDarkMode(isDark)
    applyTheme(isDark)
  }, [])

  const applyTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    applyTheme(newDarkMode)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
      // Close room/cottage menu if clicking outside
      if (!event.target.closest('.room-menu-container') && !event.target.closest('.cottage-menu-container')) {
        setOpenRoomMenuId(null)
        setOpenCottageMenuId(null)
      }
    }

    if (showProfileMenu || openRoomMenuId || openCottageMenuId) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProfileMenu, openRoomMenuId, openCottageMenuId])

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateTotalPrice = (booking) => {
    if (!booking.price || !booking.checkIn || !booking.checkOut) return 0
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    return booking.price * nights
  }

  if (loading) return <div className="p-8">Loading...</div>

  // Calculate booking statistics
  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  }

  // Check which rooms/cottages are occupied
  const getOccupiedAccommodations = () => {
    const occupiedRooms = rooms.filter((room) => {
      return bookings.some((booking) => 
        booking.accommodationId === room.id && 
        booking.accommodationType === "Room" &&
        (booking.status === "confirmed" || booking.status === "completed")
      )
    })
    
    const occupiedCottages = cottages.filter((cottage) => {
      return bookings.some((booking) => 
        booking.accommodationId === cottage.id && 
        booking.accommodationType === "Cottage" &&
        (booking.status === "confirmed" || booking.status === "completed")
      )
    })
    
    return { occupiedRooms, occupiedCottages }
  }

  const { occupiedRooms, occupiedCottages } = getOccupiedAccommodations()

  // Update room/cottage status
  const updateRoomStatus = async (roomId, status) => {
    try {
      const ref = doc(db, "rooms", roomId)
      await updateDoc(ref, { 
        status: status,
        statusUpdatedAt: new Date().toISOString()
      })
      await loadRooms()
      alert(`Room status updated to ${status}`)
    } catch (error) {
      console.error("Error updating room status:", error)
      alert("Failed to update room status")
    }
  }

  const updateCottageStatus = async (cottageId, status) => {
    try {
      const ref = doc(db, "cottages", cottageId)
      await updateDoc(ref, { 
        status: status,
        statusUpdatedAt: new Date().toISOString()
      })
      await loadCottages()
      alert(`Cottage status updated to ${status}`)
    } catch (error) {
      console.error("Error updating cottage status:", error)
      alert("Failed to update cottage status")
    }
  }

  return (
    <main className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40 overflow-hidden`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Logo />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              onClick={() => setActiveSidebarItem("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSidebarItem === "dashboard"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveSidebarItem("rooms")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSidebarItem === "rooms"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Bed className="h-5 w-5" />
              <span className="font-medium">Rooms</span>
            </button>
            <button
              onClick={() => setActiveSidebarItem("cottage")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSidebarItem === "cottage"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="font-medium">Cottage</span>
            </button>
            <button
              onClick={() => setActiveSidebarItem("bookings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSidebarItem === "bookings"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Booking Management</span>
            </button>
            <button
              onClick={() => setActiveSidebarItem("feedback")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSidebarItem === "feedback"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="font-medium">Feedback</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Header with Logo and Profile */}
        <header className="fixed top-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border" style={{ left: sidebarOpen ? "16rem" : "0" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )}
              </div>
            <div className="flex items-center gap-4">
              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{userDoc?.name || user?.email || "Admin"}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-sm font-semibold">{userDoc?.name || user?.email || "Admin"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleOpenProfileSettings}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          handleSignOut()
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors text-red-600 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <section className="py-24 bg-background min-h-screen pt-32">
        <div className="max-w-7xl mx-auto px-4">
          {/* Dashboard View */}
          {activeSidebarItem === "dashboard" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Overview of your resort management</p>
              </div>
              
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Total Bookings</div>
                  <div className="text-3xl font-bold">{bookingStats.total}</div>
                </Card>
                <Card className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Total Rooms</div>
                  <div className="text-3xl font-bold">{rooms.length}</div>
                </Card>
                <Card className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Total Cottages</div>
                  <div className="text-3xl font-bold">{cottages.length}</div>
                </Card>
                <Card className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Pending Bookings</div>
                  <div className="text-3xl font-bold text-yellow-600">{bookingStats.pending}</div>
                </Card>
              </div>

              {/* Occupied Accommodations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Occupied Rooms */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Bed className="h-5 w-5" />
                      Occupied Rooms ({occupiedRooms.length})
                    </h2>
                  </div>
                  {occupiedRooms.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No rooms are currently occupied.</p>
                  ) : (
                    <div className="space-y-3">
                      {occupiedRooms.map((room) => {
                        const roomBooking = bookings.find(
                          b => b.accommodationId === room.id && b.accommodationType === "Room"
                        )
                        return (
                          <div key={room.id} className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{room.type}</div>
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Occupied
                              </span>
                            </div>
                            {roomBooking && (
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>Guest: {roomBooking.guestName}</div>
                                <div>
                                  {roomBooking.checkIn && roomBooking.checkOut && (
                                    <>
                                      {new Date(roomBooking.checkIn).toLocaleDateString()} - {new Date(roomBooking.checkOut).toLocaleDateString()}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRoomStatus(room.id, "maintenance")}
                                className="flex-1"
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                Maintenance
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRoomStatus(room.id, "cleaning")}
                                className="flex-1"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Cleaning
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRoomStatus(room.id, "available")}
                                className="flex-1"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Available
                              </Button>
                            </div>
                            {room.status && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Status: <span className="font-medium capitalize">{room.status}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>

                {/* Occupied Cottages */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Occupied Cottages ({occupiedCottages.length})
                    </h2>
                  </div>
                  {occupiedCottages.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No cottages are currently occupied.</p>
                  ) : (
                    <div className="space-y-3">
                      {occupiedCottages.map((cottage) => {
                        const cottageBooking = bookings.find(
                          b => b.accommodationId === cottage.id && b.accommodationType === "Cottage"
                        )
                        return (
                          <div key={cottage.id} className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{cottage.type}</div>
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                Occupied
                              </span>
                            </div>
                            {cottageBooking && (
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>Guest: {cottageBooking.guestName}</div>
                                <div>
                                  {cottageBooking.checkIn && cottageBooking.checkOut && (
                                    <>
                                      {new Date(cottageBooking.checkIn).toLocaleDateString()} - {new Date(cottageBooking.checkOut).toLocaleDateString()}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCottageStatus(cottage.id, "maintenance")}
                                className="flex-1"
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                Maintenance
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCottageStatus(cottage.id, "cleaning")}
                                className="flex-1"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Cleaning
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCottageStatus(cottage.id, "available")}
                                className="flex-1"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Available
                              </Button>
                            </div>
                            {cottage.status && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Status: <span className="font-medium capitalize">{cottage.status}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* All Rooms Status Overview */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">All Rooms Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => {
                    const isOccupied = occupiedRooms.some(r => r.id === room.id)
                    const roomStatus = room.status || (isOccupied ? "occupied" : "available")
                    return (
                      <div key={room.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{room.type}</div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            roomStatus === "occupied" ? "bg-red-100 text-red-800" :
                            roomStatus === "maintenance" ? "bg-orange-100 text-orange-800" :
                            roomStatus === "cleaning" ? "bg-blue-100 text-blue-800" :
                            "bg-green-100 text-green-800"
                          }`}>
                            {roomStatus}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRoomStatus(room.id, "maintenance")}
                            disabled={roomStatus === "maintenance"}
                            className="text-xs"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Maintenance
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRoomStatus(room.id, "cleaning")}
                            disabled={roomStatus === "cleaning"}
                            className="text-xs"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Clean
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRoomStatus(room.id, "available")}
                            disabled={roomStatus === "available"}
                            className="text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* All Cottages Status Overview */}
              <Card className="p-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">All Cottages Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cottages.map((cottage) => {
                    const isOccupied = occupiedCottages.some(c => c.id === cottage.id)
                    const cottageStatus = cottage.status || (isOccupied ? "occupied" : "available")
                    return (
                      <div key={cottage.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{cottage.type}</div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            cottageStatus === "occupied" ? "bg-red-100 text-red-800" :
                            cottageStatus === "maintenance" ? "bg-orange-100 text-orange-800" :
                            cottageStatus === "cleaning" ? "bg-blue-100 text-blue-800" :
                            "bg-green-100 text-green-800"
                          }`}>
                            {cottageStatus}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCottageStatus(cottage.id, "maintenance")}
                            disabled={cottageStatus === "maintenance"}
                            className="text-xs"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Maintenance
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCottageStatus(cottage.id, "cleaning")}
                            disabled={cottageStatus === "cleaning"}
                            className="text-xs"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Clean
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCottageStatus(cottage.id, "available")}
                            disabled={cottageStatus === "available"}
                            className="text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </>
          )}

          {/* Rooms Management */}
          {activeSidebarItem === "rooms" && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-serif font-bold">Rooms Management</h1>
                  <p className="text-muted-foreground">Manage all rooms</p>
                </div>
                <Button onClick={() => setShowAddRoomModal(true)}>Add New Room</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground mb-4">No rooms added yet.</p>
                    <Button onClick={() => setShowAddRoomModal(true)}>Add Your First Room</Button>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <Card key={room.id} className="p-6 overflow-hidden relative">
                      <div className="absolute top-4 right-4 z-10 room-menu-container">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted hover:border-border shadow-sm rounded-md transition-all"
                            onClick={() => setOpenRoomMenuId(openRoomMenuId === room.id ? null : room.id)}
                            title="Room options"
                          >
                            <MoreVertical className="h-5 w-5 text-foreground" />
                          </Button>
                          {openRoomMenuId === room.id && (
                            <div className="absolute right-0 top-12 w-52 bg-background border-2 border-border rounded-lg shadow-xl z-20">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    updateRoomStatus(room.id, "maintenance")
                                    setOpenRoomMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 flex items-center gap-2.5 transition-colors"
                                >
                                  <Wrench className="h-4 w-4 text-orange-600" />
                                  Set to Maintenance
                                </button>
                                <button
                                  onClick={() => {
                                    updateRoomStatus(room.id, "cleaning")
                                    setOpenRoomMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors"
                                >
                                  <Sparkles className="h-4 w-4 text-blue-600" />
                                  Set to Cleaning
                                </button>
                                <button
                                  onClick={() => {
                                    updateRoomStatus(room.id, "available")
                                    setOpenRoomMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400 flex items-center gap-2.5 transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Set to Available
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {room.image && (
                        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                          <img
                            src={room.image}
                            alt={room.type}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "/room1.jpg"
                            }}
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold mb-4">{room.type}</h3>
                      {room.status && (
                        <div className="mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            room.status === "maintenance" ? "bg-orange-100 text-orange-800" :
                            room.status === "cleaning" ? "bg-blue-100 text-blue-800" :
                            room.status === "available" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {room.status}
                          </span>
                        </div>
                      )}
                      <div className="space-y-2 text-sm mb-4">
                        <div><span className="text-muted-foreground">Price:</span> <span className="font-medium">₱{room.price}/night</span></div>
                        <div><span className="text-muted-foreground">Capacity:</span> <span className="font-medium">{room.guests} Guests</span></div>
                        <div><span className="text-muted-foreground">Beds:</span> <span className="font-medium">{room.beds} {room.beds === 1 ? "Bed" : "Beds"}</span></div>
                        {room.size && <div><span className="text-muted-foreground">Size:</span> <span className="font-medium">{room.size}</span></div>}
                        {room.description && (
                          <div className="mt-2">
                            <p className="text-muted-foreground text-xs">{room.description}</p>
                          </div>
                        )}
                        {room.features && room.features.length > 0 && (
                          <div className="mt-2">
                            <p className="text-muted-foreground text-xs">Features: {room.features.join(", ")}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" size="sm" onClick={() => handleOpenEditRoom(room)}>Edit</Button>
                        <Button variant="ghost" className="text-red-600 hover:text-red-700" size="sm" onClick={() => handleDeleteRoom(room.id)}>Delete</Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}

          {/* Cottage Management */}
          {activeSidebarItem === "cottage" && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-serif font-bold">Cottage Management</h1>
                  <p className="text-muted-foreground">Manage all cottages</p>
                </div>
                <Button onClick={() => setShowAddCottageModal(true)}>Add New Cottage</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cottages.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground mb-4">No cottages added yet.</p>
                    <Button onClick={() => setShowAddCottageModal(true)}>Add Your First Cottage</Button>
                  </div>
                ) : (
                  cottages.map((cottage) => (
                    <Card key={cottage.id} className="p-6 overflow-hidden relative">
                      <div className="absolute top-4 right-4 z-10 cottage-menu-container">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted hover:border-border shadow-sm rounded-md transition-all"
                            onClick={() => setOpenCottageMenuId(openCottageMenuId === cottage.id ? null : cottage.id)}
                            title="Cottage options"
                          >
                            <MoreVertical className="h-5 w-5 text-foreground" />
                          </Button>
                          {openCottageMenuId === cottage.id && (
                            <div className="absolute right-0 top-12 w-52 bg-background border-2 border-border rounded-lg shadow-xl z-20">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    updateCottageStatus(cottage.id, "maintenance")
                                    setOpenCottageMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 flex items-center gap-2.5 transition-colors"
                                >
                                  <Wrench className="h-4 w-4 text-orange-600" />
                                  Set to Maintenance
                                </button>
                                <button
                                  onClick={() => {
                                    updateCottageStatus(cottage.id, "cleaning")
                                    setOpenCottageMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors"
                                >
                                  <Sparkles className="h-4 w-4 text-blue-600" />
                                  Set to Cleaning
                                </button>
                                <button
                                  onClick={() => {
                                    updateCottageStatus(cottage.id, "available")
                                    setOpenCottageMenuId(null)
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-400 flex items-center gap-2.5 transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Set to Available
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {cottage.image && (
                        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                          <img
                            src={cottage.image}
                            alt={cottage.type}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "/cottage.jpg"
                            }}
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold mb-4">{cottage.type}</h3>
                      {cottage.status && (
                        <div className="mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            cottage.status === "maintenance" ? "bg-orange-100 text-orange-800" :
                            cottage.status === "cleaning" ? "bg-blue-100 text-blue-800" :
                            cottage.status === "available" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {cottage.status}
                          </span>
                        </div>
                      )}
                      <div className="space-y-2 text-sm mb-4">
                        <div><span className="text-muted-foreground">Price:</span> <span className="font-medium">₱{cottage.price}</span></div>
                        <div><span className="text-muted-foreground">Capacity:</span> <span className="font-medium">{cottage.guests} Guests</span></div>
                        {cottage.size && <div><span className="text-muted-foreground">Size:</span> <span className="font-medium">{cottage.size}</span></div>}
                        {cottage.description && (
                          <div className="mt-2">
                            <p className="text-muted-foreground text-xs">{cottage.description}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" size="sm">Edit</Button>
                        <Button variant="ghost" className="text-red-600 hover:text-red-700" size="sm" onClick={() => handleDeleteCottage(cottage.id)}>Delete</Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}

          {/* Booking Management */}
          {activeSidebarItem === "bookings" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold">Booking Management</h1>
                <p className="text-muted-foreground">Manage all bookings and reservations.</p>
              </div>
              {/* Booking Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Bookings</div>
                  <div className="text-2xl font-bold">{bookingStats.total}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Confirmed</div>
                  <div className="text-2xl font-bold text-green-600">{bookingStats.confirmed}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Cancelled</div>
                  <div className="text-2xl font-bold text-red-600">{bookingStats.cancelled}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Completed</div>
                  <div className="text-2xl font-bold text-blue-600">{bookingStats.completed}</div>
                </Card>
              </div>

              {/* Bookings List */}
              <div className="grid gap-4">
                {bookings.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No bookings found.</p>
                  </Card>
                ) : (
                  bookings.map((booking) => (
                    <Card key={booking.id} className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold">{booking.accommodationType}</h3>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status || "pending")}`}>
                              {booking.status || "pending"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Guest: </span>
                              <span className="font-medium">{booking.guestName || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email: </span>
                              <span className="font-medium">{booking.guestEmail || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phone: </span>
                              <span className="font-medium">{booking.guestPhone || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Quantity: </span>
                              <span className="font-medium">{booking.quantity || 1}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Check-in: </span>
                              <span className="font-medium">
                                {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Check-out: </span>
                              <span className="font-medium">
                                {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Price: </span>
                              <span className="font-medium text-green-600">₱{calculateTotalPrice(booking)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Payment Method: </span>
                              <span className="font-medium capitalize">
                                {booking.paymentMethod 
                                  ? booking.paymentMethod.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())
                                  : "Not specified"}
                              </span>
                            </div>
                            {booking.referenceNumber && (
                              <div>
                                <span className="text-muted-foreground">Reference Number: </span>
                                <span className="font-medium font-mono text-xs">{booking.referenceNumber}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Adults: </span>
                              <span className="font-medium">{booking.adults || 1}</span>
                            </div>
                            {booking.children > 0 && (
                              <div>
                                <span className="text-muted-foreground">Children: </span>
                                <span className="font-medium">{booking.children}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Booked: </span>
                              <span className="font-medium">
                                {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "N/A"}
                              </span>
                            </div>
                          </div>
                          {booking.specialRequests && (
                            <div className="mt-3 p-3 bg-muted rounded">
                              <span className="text-sm text-muted-foreground">Special Requests: </span>
                              <span className="text-sm">{booking.specialRequests}</span>
                            </div>
                          )}
                          {/* Payment Proof for GCash */}
                          {booking.paymentMethod === "gcash" && booking.paymentProof && (
                            <div className="mt-3 p-3 bg-muted rounded">
                              <span className="text-sm font-medium block mb-2">GCash Payment Proof:</span>
                              <a href={booking.paymentProof} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={booking.paymentProof}
                                  alt="Payment proof"
                                  className="max-h-40 rounded-lg border border-border hover:opacity-80 transition-opacity"
                                />
                              </a>
                              <p className="text-xs text-muted-foreground mt-1">Click to view full image</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "pending")}
                              disabled={booking.status === "pending"}
                            >
                              Pending
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "completed")}
                              disabled={booking.status === "completed"}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, "cancelled")}
                              disabled={booking.status === "cancelled"}
                            >
                              Cancel
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBooking(booking.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}

          {/* Feedback Management */}
          {activeSidebarItem === "feedback" && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-serif font-bold">Feedback Management</h1>
                  <p className="text-muted-foreground">View and manage guest testimonials and feedback</p>
                </div>
                <Button variant="outline" onClick={() => setShowAddTestimonialModal(true)}>Add New Testimonial</Button>
              </div>
              <div className="grid gap-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Guest Testimonials</h3>
                  <div className="space-y-4">
                    {testimonials.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">No testimonials added yet.</p>
                        <Button variant="outline" onClick={() => setShowAddTestimonialModal(true)}>Add Your First Testimonial</Button>
                      </div>
                    ) : (
                      testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{testimonial.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {testimonial.location ? `${testimonial.location} • ` : ""}{testimonial.date}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {[...Array(testimonial.rating || 5)].map((_, i) => (
                                <span key={i} className="text-yellow-500">★</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">"{testimonial.comment}"</p>
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTestimonial(testimonial.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

        </div>
      </section>

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Profile Settings</h2>
              </div>
              <button
                onClick={() => {
                  setShowProfileSettings(false)
                  setActiveSettingsTab("profile")
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmPassword("")
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              {/* Settings Tabs */}
              <div className="flex gap-2 mb-6 border-b">
                <button
                  onClick={() => setActiveSettingsTab("profile")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeSettingsTab === "profile"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveSettingsTab("password")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeSettingsTab === "password"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Password
                </button>
                <button
                  onClick={() => setActiveSettingsTab("appearance")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeSettingsTab === "appearance"
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Appearance
                </button>
              </div>

              {/* Profile Tab */}
              {activeSettingsTab === "profile" && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Profile Name</label>
                    <Input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This name will be displayed in your profile
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProfileSettings(false)}
                      disabled={updatingProfile}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updatingProfile}>
                      {updatingProfile ? "Updating..." : "Update Name"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Password Tab */}
              {activeSettingsTab === "password" && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must be at least 6 characters long
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveSettingsTab("profile")
                        setCurrentPassword("")
                        setNewPassword("")
                        setConfirmPassword("")
                      }}
                      disabled={changingPassword}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Appearance Tab */}
              {activeSettingsTab === "appearance" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-4">Theme</label>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {darkMode ? (
                          <Moon className="h-5 w-5 text-primary" />
                        ) : (
                          <Sun className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">{darkMode ? "Dark Mode" : "Light Mode"}</p>
                          <p className="text-xs text-muted-foreground">
                            {darkMode ? "Dark theme is active" : "Light theme is active"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={toggleDarkMode}
                        className="flex items-center gap-2"
                      >
                        {darkMode ? (
                          <>
                            <Sun className="h-4 w-4" />
                            Switch to Light
                          </>
                        ) : (
                          <>
                            <Moon className="h-4 w-4" />
                            Switch to Dark
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowProfileSettings(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoomModal && selectedRoomForEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Edit Room</h2>
              <button
                onClick={() => {
                  setShowEditRoomModal(false)
                  setSelectedRoomForEdit(null)
                  setRoomForm({
                    type: "",
                    price: "",
                    guests: "",
                    beds: "",
                    size: "",
                    description: "",
                    features: "",
                    image: "",
                  })
                  setRoomImageFile(null)
                  setRoomImagePreview(null)
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateRoom} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Room Type *</label>
                    <Input
                      type="text"
                      value={roomForm.type}
                      onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                      placeholder="e.g., Deluxe Room, Family Suite"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price per Night (₱) *</label>
                    <Input
                      type="number"
                      value={roomForm.price}
                      onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                      placeholder="150"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Guests *</label>
                    <Input
                      type="number"
                      value={roomForm.guests}
                      onChange={(e) => setRoomForm({ ...roomForm, guests: e.target.value })}
                      placeholder="2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Beds</label>
                    <Input
                      type="number"
                      value={roomForm.beds}
                      onChange={(e) => setRoomForm({ ...roomForm, beds: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Size</label>
                    <Input
                      type="text"
                      value={roomForm.size}
                      onChange={(e) => setRoomForm({ ...roomForm, size: e.target.value })}
                      placeholder="e.g., 35 sqm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Room Image</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-muted transition-colors">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleRoomImageChange}
                            className="hidden"
                            disabled={uploadingRoomImage || updatingRoom}
                          />
                        </label>
                        {roomImageFile && (
                          <span className="text-sm text-muted-foreground">{roomImageFile.name}</span>
                        )}
                        {uploadingRoomImage && (
                          <span className="text-sm text-muted-foreground">Uploading...</span>
                        )}
                      </div>
                      {roomImagePreview && (
                        <div className="mt-2">
                          <img
                            src={roomImagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-md border border-border"
                          />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Or enter image URL:
                      </div>
                      <Input
                        type="text"
                        value={roomForm.image}
                        onChange={(e) => setRoomForm({ ...roomForm, image: e.target.value })}
                        placeholder="/room1.jpg or https://..."
                        disabled={!!roomImageFile}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    placeholder="Room description..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Features (comma-separated)</label>
                  <Input
                    type="text"
                    value={roomForm.features}
                    onChange={(e) => setRoomForm({ ...roomForm, features: e.target.value })}
                    placeholder="e.g., Ocean View, King Bed, Private Balcony"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditRoomModal(false)
                      setSelectedRoomForEdit(null)
                      setRoomForm({
                        type: "",
                        price: "",
                        guests: "",
                        beds: "",
                        size: "",
                        description: "",
                        features: "",
                        image: "",
                      })
                      setRoomImageFile(null)
                      setRoomImagePreview(null)
                    }}
                    disabled={updatingRoom}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updatingRoom}>
                    {updatingRoom ? "Updating..." : "Update Room"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Add New Room</h2>
              <button
                onClick={() => {
                  setShowAddRoomModal(false)
                  setRoomForm({
                    type: "",
                    price: "",
                    guests: "",
                    beds: "",
                    size: "",
                    description: "",
                    features: "",
                    image: "",
                  })
                  setRoomImageFile(null)
                  setRoomImagePreview(null)
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Room Type *</label>
                    <Input
                      type="text"
                      value={roomForm.type}
                      onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                      placeholder="e.g., Deluxe Room, Family Suite"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price per Night (₱) *</label>
                    <Input
                      type="number"
                      value={roomForm.price}
                      onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                      placeholder="150"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Guests *</label>
                    <Input
                      type="number"
                      value={roomForm.guests}
                      onChange={(e) => setRoomForm({ ...roomForm, guests: e.target.value })}
                      placeholder="2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Beds</label>
                    <Input
                      type="number"
                      value={roomForm.beds}
                      onChange={(e) => setRoomForm({ ...roomForm, beds: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Size</label>
                    <Input
                      type="text"
                      value={roomForm.size}
                      onChange={(e) => setRoomForm({ ...roomForm, size: e.target.value })}
                      placeholder="e.g., 35 sqm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Room Image</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-muted transition-colors">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleRoomImageChange}
                            className="hidden"
                            disabled={uploadingRoomImage || addingRoom}
                          />
                        </label>
                        {roomImageFile && (
                          <span className="text-sm text-muted-foreground">{roomImageFile.name}</span>
                        )}
                        {uploadingRoomImage && (
                          <span className="text-sm text-muted-foreground">Uploading...</span>
                        )}
                      </div>
                      {roomImagePreview && (
                        <div className="mt-2">
                          <img
                            src={roomImagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-md border border-border"
                          />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Or enter image URL:
                      </div>
                      <Input
                        type="text"
                        value={roomForm.image}
                        onChange={(e) => setRoomForm({ ...roomForm, image: e.target.value })}
                        placeholder="/room1.jpg or https://..."
                        disabled={!!roomImageFile}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    placeholder="Room description..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Features (comma-separated)</label>
                  <Input
                    type="text"
                    value={roomForm.features}
                    onChange={(e) => setRoomForm({ ...roomForm, features: e.target.value })}
                    placeholder="e.g., Ocean View, King Bed, Private Balcony"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddRoomModal(false)
                      setRoomForm({
                        type: "",
                        price: "",
                        guests: "",
                        beds: "",
                        size: "",
                        description: "",
                        features: "",
                        image: "",
                      })
                      setRoomImageFile(null)
                      setRoomImagePreview(null)
                    }}
                    disabled={addingRoom}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addingRoom}>
                    {addingRoom ? "Adding..." : "Add Room"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Cottage Modal */}
      {showAddCottageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Add New Cottage</h2>
              <button
                onClick={() => {
                  setShowAddCottageModal(false)
                  setCottageForm({
                    type: "",
                    price: "",
                    guests: "",
                    size: "",
                    description: "",
                    image: "",
                  })
                  setCottageImageFile(null)
                  setCottageImagePreview(null)
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCottage} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cottage Type *</label>
                    <Input
                      type="text"
                      value={cottageForm.type}
                      onChange={(e) => setCottageForm({ ...cottageForm, type: e.target.value })}
                      placeholder="e.g., Beachfront Cottage"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (₱) *</label>
                    <Input
                      type="number"
                      value={cottageForm.price}
                      onChange={(e) => setCottageForm({ ...cottageForm, price: e.target.value })}
                      placeholder="350"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Guests *</label>
                    <Input
                      type="number"
                      value={cottageForm.guests}
                      onChange={(e) => setCottageForm({ ...cottageForm, guests: e.target.value })}
                      placeholder="6"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Size</label>
                    <Input
                      type="text"
                      value={cottageForm.size}
                      onChange={(e) => setCottageForm({ ...cottageForm, size: e.target.value })}
                      placeholder="e.g., 85 sqm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Cottage Image</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-muted transition-colors">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCottageImageChange}
                            className="hidden"
                            disabled={uploadingCottageImage || addingCottage}
                          />
                        </label>
                        {cottageImageFile && (
                          <span className="text-sm text-muted-foreground">{cottageImageFile.name}</span>
                        )}
                        {uploadingCottageImage && (
                          <span className="text-sm text-muted-foreground">Uploading...</span>
                        )}
                      </div>
                      {cottageImagePreview && (
                        <div className="mt-2">
                          <img
                            src={cottageImagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-md border border-border"
                          />
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Or enter image URL:
                      </div>
                      <Input
                        type="text"
                        value={cottageForm.image}
                        onChange={(e) => setCottageForm({ ...cottageForm, image: e.target.value })}
                        placeholder="/cottage.jpg or https://..."
                        disabled={!!cottageImageFile}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={cottageForm.description}
                    onChange={(e) => setCottageForm({ ...cottageForm, description: e.target.value })}
                    placeholder="Cottage description..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddCottageModal(false)
                      setCottageForm({
                        type: "",
                        price: "",
                        guests: "",
                        beds: "",
                        size: "",
                        description: "",
                        features: "",
                        image: "",
                      })
                      setCottageImageFile(null)
                      setCottageImagePreview(null)
                    }}
                    disabled={addingCottage}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addingCottage}>
                    {addingCottage ? "Adding..." : "Add Cottage"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Testimonial Modal */}
      {showAddTestimonialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Add New Testimonial</h2>
              <button
                onClick={() => {
                  setShowAddTestimonialModal(false)
                  setTestimonialForm({
                    name: "",
                    location: "",
                    rating: 5,
                    comment: "",
                    date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
                  })
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTestimonial} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Guest Name *</label>
                    <Input
                      type="text"
                      value={testimonialForm.name}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                      placeholder="e.g., Sarah Johnson"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Input
                      type="text"
                      value={testimonialForm.location}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, location: e.target.value })}
                      placeholder="e.g., California, USA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating *</label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={testimonialForm.rating}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Rating from 1 to 5 stars</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <Input
                      type="text"
                      value={testimonialForm.date}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, date: e.target.value })}
                      placeholder="e.g., January 2025"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment/Testimonial *</label>
                  <Textarea
                    value={testimonialForm.comment}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, comment: e.target.value })}
                    placeholder="Enter the guest's testimonial..."
                    rows={4}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddTestimonialModal(false)
                      setTestimonialForm({
                        name: "",
                        location: "",
                        rating: 5,
                        comment: "",
                        date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
                      })
                    }}
                    disabled={addingTestimonial}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addingTestimonial}>
                    {addingTestimonial ? "Adding..." : "Add Testimonial"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </main>
  )
}
