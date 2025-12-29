"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth, db, storage } from "@/app/firebaseConfig"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, collection, getDocs, addDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Logo } from "@/components/logo"
import Image from "next/image"
import { Users, Bed, Maximize, Calendar, MessageSquare, X, Star, User, ChevronDown, LogOut, Copy, Search, Home, Building2, Wrench, Sparkles, Settings, Moon, Sun, MoreVertical, Printer, Edit, Upload } from "lucide-react"

export default function UserPage() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [rooms, setRooms] = useState([])
  const [cottages, setCottages] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard") // "dashboard", "accommodations", "bookings", "feedback"
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedAccommodation, setSelectedAccommodation] = useState(null)
  const [bookingForm, setBookingForm] = useState({
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    paymentMethod: "",
    referenceNumber: "",
    specialRequests: "",
    senior: false,
  })
  const [seniorIdFile, setSeniorIdFile] = useState(null)
  const [seniorIdPreview, setSeniorIdPreview] = useState(null)
  const [uploadingSeniorId, setUploadingSeniorId] = useState(false)
  const [generatedReferenceNumber, setGeneratedReferenceNumber] = useState("")
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: "",
  })
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  const bookingsRef = useRef(null)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile") // "profile", "appearance"
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [openBookingMenu, setOpenBookingMenu] = useState(null)
  const [editingBooking, setEditingBooking] = useState(null)
  const [editBookingForm, setEditBookingForm] = useState({
    checkIn: "",
    checkOut: "",
    adults: 1,
    children: 0,
    specialRequests: "",
  })
  const [paymentProofFile, setPaymentProofFile] = useState(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState(null)
  const [uploadingPaymentProof, setUploadingPaymentProof] = useState(false)
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minGuests: "",
    accommodationType: "all", // "all", "room", "cottage"
  })
  const router = useRouter()
  
  // GCash mobile number
  const gcashNumber = "09059689099"

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login")
        return
      }
      setUser(u)
      
      // Check if user is superadmin - redirect to superadmin page
      if (u.email === "superadmin@jopatsresort.com") {
        router.push("/superadmin")
        return
      }
      
      // Check if user is admin - redirect to admin page
      const isAdminByEmail = u.email === "admin@jopatsresort.com"
      const userDoc = await getDoc(doc(db, "users", u.uid))
      const isAdmin = isAdminByEmail || (userDoc.exists() && userDoc.data().isAdmin)
      
      if (isAdmin) {
        router.push("/admin")
        return
      }
      
      // Load user data
      if (userDoc.exists()) {
        setUserData(userDoc.data())
      }
      
      // Load rooms and cottages
      await loadRooms()
      await loadCottages()
      
      // Load user bookings
      await loadBookings(u.uid)
      
      setLoading(false)
    })

    return () => unsub()
  }, [router])

  // Set up real-time listeners for rooms, cottages, and bookings
  useEffect(() => {
    if (!user) return

    // Real-time listener for cottages
    const cottagesUnsubscribe = onSnapshot(
      collection(db, "cottages"),
      (snapshot) => {
        const allCottages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        setCottages(allCottages)
        console.log("Cottages updated in real-time:", allCottages.length)
      },
      (error) => {
        console.error("Error listening to cottages:", error)
      }
    )

    // Real-time listener for rooms
    const roomsUnsubscribe = onSnapshot(
      collection(db, "rooms"),
      (snapshot) => {
        const allRooms = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        setRooms(allRooms)
        console.log("Rooms updated in real-time:", allRooms.length)
      },
      (error) => {
        console.error("Error listening to rooms:", error)
      }
    )

    // Real-time listener for all bookings (to check availability)
    const bookingsUnsubscribe = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const allBookingsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        setAllBookings(allBookingsData)
        
        // Update user bookings
        const userId = user.uid
        const userBookings = allBookingsData
          .filter((b) => b.userId === userId || b.guestEmail === user?.email)
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dateB - dateA
          })
        setBookings(userBookings)
      },
      (error) => {
        console.error("Error listening to bookings:", error)
      }
    )

    // Cleanup listeners on unmount
    return () => {
      cottagesUnsubscribe()
      roomsUnsubscribe()
      bookingsUnsubscribe()
    }
  }, [user])

  // Close profile menu when clicking outside (supports pointer/touch for mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener("pointerdown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [showProfileMenu])

  // Close open booking menu when tapping outside on mobile/desktop
  useEffect(() => {
    const handleOutsideBookingMenu = (event) => {
      if (openBookingMenu !== null) {
        if (bookingsRef.current && !bookingsRef.current.contains(event.target)) {
          setOpenBookingMenu(null)
        }
      }
    }

    if (openBookingMenu !== null) {
      document.addEventListener("pointerdown", handleOutsideBookingMenu)
      document.addEventListener("touchstart", handleOutsideBookingMenu)
    }

    return () => {
      document.removeEventListener("pointerdown", handleOutsideBookingMenu)
      document.removeEventListener("touchstart", handleOutsideBookingMenu)
    }
  }, [openBookingMenu])

  const loadRooms = async () => {
    try {
      const roomsSnapshot = await getDocs(collection(db, "rooms"))
      const allRooms = roomsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setRooms(allRooms)
    } catch (error) {
      console.error("Error loading rooms:", error)
    }
  }

  const loadCottages = async () => {
    try {
      const cottagesSnapshot = await getDocs(collection(db, "cottages"))
      const allCottages = cottagesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setCottages(allCottages)
    } catch (error) {
      console.error("Error loading cottages:", error)
    }
  }

  const [allBookings, setAllBookings] = useState([]) // All bookings to check availability

  const loadBookings = async (userId) => {
    try {
      // Fetch all bookings and filter/sort client-side to avoid index requirement
      const allBookingsSnapshot = await getDocs(collection(db, "bookings"))
      const allBookingsData = allBookingsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      
      // Store all bookings for availability checking
      setAllBookings(allBookingsData)
      
      // Filter user's bookings
      const userBookings = allBookingsData
        .filter((b) => b.userId === userId || b.guestEmail === user?.email)
        .sort((a, b) => {
          // Sort by createdAt descending (newest first)
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
      setBookings(userBookings)
    } catch (error) {
      console.error("Error loading bookings:", error)
      setBookings([])
      setAllBookings([])
    }
  }

  const generateReferenceNumber = () => {
    const prefix = "JOPATS"
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
    return `${prefix}-${timestamp}-${random}`
  }

  const calculateStayDuration = (checkInDate, checkOutDate) => {
    if (!checkInDate || !checkOutDate) return 0
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    return nights
  }

  const calculateBookingTotal = () => {
    if (!selectedAccommodation || !bookingForm.checkIn || !bookingForm.checkOut) return 0
    const nights = calculateStayDuration(bookingForm.checkIn, bookingForm.checkOut)
    const gross = selectedAccommodation.price * nights
    const discountPercent = bookingForm.senior ? 10 : 0
    const discountAmount = (gross * discountPercent) / 100
    const final = gross - discountAmount
    return Math.round(final * 100) / 100
  }

  const handleOpenBooking = (accommodation, type) => {
    setSelectedAccommodation({ ...accommodation, accommodationType: type })
    const refNumber = generateReferenceNumber()
    setGeneratedReferenceNumber(refNumber)
    setShowBookingModal(true)
    setBookingForm({
      checkIn: "",
      checkOut: "",
      quantity: 1,
      adults: 1,
      children: 0,
      paymentMethod: "",
      referenceNumber: refNumber,
      specialRequests: "",
      senior: false,
    })

    // Clear any previous uploaded files/previews to avoid unexpected controlled state
    setPaymentProofFile(null)
    setPaymentProofPreview(null)
    setSeniorIdFile(null)
    setSeniorIdPreview(null)
  }

  const copyReferenceNumber = () => {
    navigator.clipboard.writeText(generatedReferenceNumber || bookingForm.referenceNumber)
    alert("Reference number copied to clipboard!")
  }

  const handleSubmitBooking = async (e) => {
    e.preventDefault()
    if (!user || !selectedAccommodation) return

    if (!bookingForm.checkIn || !bookingForm.checkOut) {
      alert("Please select check-in and check-out dates")
      return
    }

    if (!bookingForm.paymentMethod) {
      alert("Please select a payment method")
      return
    }

    // Prevent new bookings if the user has unpaid pending/confirmed bookings
    const hasUnpaid = bookings.some(b => !b.paid && (b.status === "pending" || b.status === "confirmed"))
    if (hasUnpaid) {
      alert("You have unpaid bookings. Please complete payment for them before making a new booking.")
      return
    }

    const checkIn = new Date(bookingForm.checkIn)
    const checkOut = new Date(bookingForm.checkOut)
    
    if (checkOut <= checkIn) {
      alert("Check-out date must be after check-in date")
      return
    }

    if (parseInt(bookingForm.adults) < 1) {
      alert("Please enter at least 1 adult")
      return
    }

    setSubmittingBooking(true)
    try {
      // Require payment proof for all bookings (enforce prepayment)
      if (!paymentProofFile) {
        alert("Please upload proof of payment to confirm your booking.")
        setSubmittingBooking(false)
        return
      }

      // Upload payment proof
      let paymentProofURL = null
      if (paymentProofFile) {
        paymentProofURL = await uploadPaymentProof()
      }

      // Handle senior ID upload and discount
      let seniorIdURL = null
      let discountPercent = 0
      const nights = calculateStayDuration(bookingForm.checkIn, bookingForm.checkOut)
      const grossAmount = selectedAccommodation.price * nights
      if (bookingForm.senior) {
        if (!seniorIdFile) {
          alert("Please upload your Senior Citizen ID to apply the discount.")
          setSubmittingBooking(false)
          return
        }
        seniorIdURL = await uploadSeniorId()
        discountPercent = 10
      }
      const discountAmount = (grossAmount * discountPercent) / 100
      const finalAmount = grossAmount - discountAmount

      const bookingData = {
        accommodationType: selectedAccommodation.accommodationType,
        accommodationId: selectedAccommodation.id,
        accommodationName: selectedAccommodation.type,
        roomNumber: selectedAccommodation.roomNumber || selectedAccommodation.cottageNumber || null,
        userId: user.uid,
        guestName: userData?.name || user.email,
        guestEmail: user.email,
        guestPhone: userData?.phone || "",
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        adults: parseInt(bookingForm.adults) || 1,
        children: parseInt(bookingForm.children) || 0,
        paymentMethod: bookingForm.paymentMethod,
        referenceNumber: bookingForm.referenceNumber || generatedReferenceNumber,
        specialRequests: bookingForm.specialRequests || "",
        status: "pending",
        price: selectedAccommodation.price,
        grossAmount,
        discountPercent,
        discountAmount,
        finalAmount,
        seniorId: seniorIdURL,
        paymentProof: paymentProofURL,
        paid: !!paymentProofURL,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, "bookings"), bookingData)
      await loadBookings(user.uid)
      alert("Booking submitted successfully! We'll confirm your reservation soon.")
      setShowBookingModal(false)
      setSelectedAccommodation(null)
      const newRefNumber = generateReferenceNumber()
      setGeneratedReferenceNumber(newRefNumber)
      setBookingForm({
        checkIn: "",
        checkOut: "",
        adults: 1,
        children: 0,
        paymentMethod: "",
        referenceNumber: newRefNumber,
        specialRequests: "",
        senior: false,
      })
      setPaymentProofFile(null)
      setPaymentProofPreview(null)
      setSeniorIdFile(null)
      setSeniorIdPreview(null)
    } catch (error) {
      console.error("Error submitting booking:", error)
      alert("Failed to submit booking. Please try again.")
    } finally {
      setSubmittingBooking(false)
    }
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!user || !feedbackForm.comment.trim()) {
      alert("Please enter your feedback")
      return
    }

    setSubmittingFeedback(true)
    try {
      const feedbackData = {
        name: userData?.name || user.email,
        location: "",
        rating: parseInt(feedbackForm.rating) || 5,
        comment: feedbackForm.comment.trim(),
        date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
      }

      await addDoc(collection(db, "testimonials"), feedbackData)
      alert("Thank you for your feedback! We appreciate your input.")
      setShowFeedbackModal(false)
      setFeedbackForm({
        rating: 5,
        comment: "",
      })
    } catch (error) {
      console.error("Error submitting feedback:", error)
      alert("Failed to submit feedback. Please try again.")
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const calculateTotalPrice = (booking) => {
    if (!booking || !booking.checkIn || !booking.checkOut) return 0
    // Use precomputed final amount if available (after discounts)
    if (booking.finalAmount !== undefined && booking.finalAmount !== null) return booking.finalAmount
    if (!booking.price) return 0
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    return booking.price * nights
  }

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

  // Check if an accommodation is booked
  const isAccommodationBooked = (accommodationId, accommodationType) => {
    // Check if there's any confirmed or completed booking for this accommodation
    const booked = allBookings.some((booking) => {
      // Match accommodation ID and type
      if (booking.accommodationId === accommodationId && 
          booking.accommodationType === accommodationType) {
        // Only consider confirmed or completed bookings as "booked"
        // Pending bookings don't block availability yet
        if (booking.status === "confirmed" || booking.status === "completed") {
          return true
        }
      }
      return false
    })
    return booked
  }

  // Filter rooms and cottages based on search query, filters, and availability
  const filteredRooms = rooms.filter((room) => {
    // Check if room is booked
    if (isAccommodationBooked(room.id, "Room")) return false

    // Filter out rooms that are in maintenance or cleaning
    // Only show rooms with status "available" or no status (default to available)
    if (room.status && room.status !== "available") {
      return false
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const typeMatch = room.type?.toLowerCase().includes(query)
      const descMatch = room.description?.toLowerCase().includes(query)
      const featuresMatch = room.features?.some(f => f.toLowerCase().includes(query))
      const priceMatch = room.price?.toString().includes(query)
      if (!typeMatch && !descMatch && !featuresMatch && !priceMatch) return false
    }

    // Price filter
    if (filters.minPrice && room.price < parseFloat(filters.minPrice)) return false
    if (filters.maxPrice && room.price > parseFloat(filters.maxPrice)) return false

    // Guests filter
    if (filters.minGuests && room.guests < parseInt(filters.minGuests)) return false

    // Accommodation type filter
    if (filters.accommodationType === "cottage") return false

    return true
  })

  const filteredCottages = cottages.filter((cottage) => {
    // Check if cottage is booked
    if (isAccommodationBooked(cottage.id, "Cottage")) return false

    // Filter out cottages that are in maintenance or cleaning
    // Only show cottages with status "available" or no status (default to available)
    if (cottage.status && cottage.status !== "available") {
      return false
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const typeMatch = cottage.type?.toLowerCase().includes(query)
      const descMatch = cottage.description?.toLowerCase().includes(query)
      const priceMatch = cottage.price?.toString().includes(query)
      if (!typeMatch && !descMatch && !priceMatch) return false
    }

    // Price filter
    if (filters.minPrice && cottage.price < parseFloat(filters.minPrice)) return false
    if (filters.maxPrice && cottage.price > parseFloat(filters.maxPrice)) return false

    // Guests filter
    if (filters.minGuests && cottage.guests < parseInt(filters.minGuests)) return false

    // Accommodation type filter
    if (filters.accommodationType === "room") return false

    return true
  })

  const clearFilters = () => {
    setSearchQuery("")
    setFilters({
      minPrice: "",
      maxPrice: "",
      minGuests: "",
      accommodationType: "all",
    })
  }

  const hasActiveFilters = searchQuery.trim() || filters.minPrice || filters.maxPrice || filters.minGuests || filters.accommodationType !== "all"

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const handleOpenProfileSettings = () => {
    setProfileName(userData?.name || "")
    setShowProfileSettings(true)
    setShowProfileMenu(false)
  }

  const handleUpdateProfile = async () => {
    if (!user || !profileName.trim()) {
      alert("Please enter a valid name")
      return
    }

    setUpdatingProfile(true)
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { name: profileName.trim() },
        { merge: true }
      )
      setUserData({ ...userData, name: profileName.trim() })
      alert("Profile updated successfully!")
      setShowProfileSettings(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem("darkMode", newDarkMode.toString())
    if (newDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/")
  }

  const handlePaymentProofChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPaymentProofFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSeniorIdChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSeniorIdFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSeniorIdPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadSeniorId = async () => {
    if (!seniorIdFile) return null
    setUploadingSeniorId(true)
    try {
      const timestamp = Date.now()
      const storageRef = ref(storage, `senior-ids/${user.uid}/${timestamp}-${seniorIdFile.name}`)
      await uploadBytes(storageRef, seniorIdFile)
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (error) {
      console.error("Error uploading senior ID:", error)
      return null
    } finally {
      setUploadingSeniorId(false)
    }
  }

  const uploadPaymentProof = async () => {
    if (!paymentProofFile) return null
    setUploadingPaymentProof(true)
    try {
      const timestamp = Date.now()
      const storageRef = ref(storage, `payment-proofs/${user.uid}/${timestamp}-${paymentProofFile.name}`)
      await uploadBytes(storageRef, paymentProofFile)
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (error) {
      console.error("Error uploading payment proof:", error)
      return null
    } finally {
      setUploadingPaymentProof(false)
    }
  }

  const handleEditBooking = (booking) => {
    setEditingBooking(booking)
    setEditBookingForm({
      checkIn: booking.checkIn || "",
      checkOut: booking.checkOut || "",
      adults: booking.adults || 1,
      children: booking.children || 0,
      specialRequests: booking.specialRequests || "",
    })
    setOpenBookingMenu(null)
  }

  const handleUpdateBooking = async (e) => {
    e.preventDefault()
    if (!editingBooking) return

    try {
      const { updateDoc } = await import("firebase/firestore")
      await updateDoc(doc(db, "bookings", editingBooking.id), {
        checkIn: editBookingForm.checkIn,
        checkOut: editBookingForm.checkOut,
        adults: parseInt(editBookingForm.adults) || 1,
        children: parseInt(editBookingForm.children) || 0,
        specialRequests: editBookingForm.specialRequests,
      })
      alert("Booking updated successfully!")
      setEditingBooking(null)
      await loadBookings(user.uid)
    } catch (error) {
      console.error("Error updating booking:", error)
      alert("Failed to update booking. Please try again.")
    }
  }

  const handlePrintReceipt = (booking) => {
    setOpenBookingMenu(null)
    const totalPrice = calculateTotalPrice(booking)
    const nights = calculateStayDuration(booking.checkIn, booking.checkOut)
    
    const printWindow = window.open("", "_blank")
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${booking.referenceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #333; }
          .receipt-title { font-size: 18px; color: #666; margin-top: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 14px; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { color: #666; }
          .value { font-weight: 500; }
          .total-row { font-size: 18px; font-weight: bold; background: #f5f5f5; padding: 15px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-confirmed { background: #d1fae5; color: #065f46; }
          .status-completed { background: #dbeafe; color: #1e40af; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">JOPATS RESORT</div>
          <div class="receipt-title">Payment Receipt</div>
        </div>
        
        <div class="section">
          <div class="section-title">Booking Information</div>
          <div class="row">
            <span class="label">Reference Number:</span>
            <span class="value">${booking.referenceNumber || "N/A"}</span>
          </div>
          <div class="row">
            <span class="label">Booking Date:</span>
            <span class="value">${booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "N/A"}</span>
          </div>
          <div class="row">
            <span class="label">Status:</span>
            <span class="value"><span class="status status-${booking.status || "pending"}">${(booking.status || "pending").toUpperCase()}</span></span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Guest Details</div>
          <div class="row">
            <span class="label">Guest Name:</span>
            <span class="value">${booking.guestName || userData?.name || "N/A"}</span>
          </div>
          <div class="row">
            <span class="label">Email:</span>
            <span class="value">${booking.guestEmail || user?.email || "N/A"}</span>
          </div>
          <div class="row">
            <span class="label">Guests:</span>
            <span class="value">${booking.adults || 1} Adult${(booking.adults || 1) !== 1 ? "s" : ""}${booking.children > 0 ? `, ${booking.children} Child${booking.children !== 1 ? "ren" : ""}` : ""}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Accommodation Details</div>
          <div class="row">
            <span class="label">Type:</span>
            <span class="value">${booking.accommodationType || "N/A"}</span>
          </div>
          <div class="row">
            <span class="label">Room/Cottage Name:</span>
            <span class="value">${booking.accommodationName || "N/A"}</span>
          </div>
          ${booking.roomNumber ? `
          <div class="row">
            <span class="label">${booking.accommodationType === "Room" ? "Room" : "Cottage"} Number:</span>
            <span class="value">${booking.roomNumber}</span>
          </div>
          ` : ""}
          <div class="row">
            <span class="label">Check-in:</span>
            <span class="value">${booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : "N/A"}</span>
          </div>
          <div class="row">
            <span class="label">Check-out:</span>
            <span class="value">${booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : "N/A"}</span>
          </div>
          <div class="row">
            <span class="label">Duration:</span>
            <span class="value">${nights} ${nights === 1 ? "night" : "nights"}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment Details</div>
          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value">${booking.paymentMethod === "gcash" ? "GCash" : "Cash"}</span>
          </div>
          ${booking.paymentMethod === "gcash" ? `
          <div class="row">
            <span class="label">GCash Number:</span>
            <span class="value">${gcashNumber}</span>
          </div>
          ` : ""}
          <div class="row">
            <span class="label">Rate per Night:</span>
            <span class="value">₱${booking.price || 0}</span>
          </div>
          <div class="row">
            <span class="label">Number of Nights:</span>
            <span class="value">${nights}</span>
          </div>
          ${booking.discountPercent && booking.discountPercent > 0 ? `
          <div class="row">
            <span class="label">Discount:</span>
            <span class="value">${booking.discountPercent}% (−₱${booking.discountAmount?.toLocaleString() || '0'})</span>
          </div>
          <div class="row">
            <span class="label">Amount After Discount:</span>
            <span class="value">₱${booking.finalAmount?.toLocaleString() || totalPrice.toLocaleString()}</span>
          </div>
          ` : ""}

          ${ (booking.status === "cancelled" || booking.status === "no-show") && booking.refundAmount ? `
          <div class="row">
            <span class="label">Refund Amount:</span>
            <span class="value">₱${booking.refundAmount?.toLocaleString()}</span>
          </div>
          <div class="row">
            <span class="label">Refund Reason:</span>
            <span class="value">${booking.status === "cancelled" ? "Cancellation (10% fee)" : booking.status === "no-show" ? "No-show (30% fee)" : ""}</span>
          </div>
          ` : ""}
        </div>

        <div class="total-row">
          <div class="row" style="border: none; margin: 0; padding: 0;">
            <span>TOTAL AMOUNT:</span>
            <span>₱${totalPrice.toLocaleString()}</span>
          </div>
        </div>

        ${booking.specialRequests ? `
        <div class="section" style="margin-top: 20px;">
          <div class="section-title">Special Requests</div>
          <p style="color: #666; margin: 0;">${booking.specialRequests}</p>
        </div>
        ` : ""}

        <div class="footer">
          <p>Thank you for choosing Jopats Resort!</p>
          <p>For inquiries, please contact us at support@jopatsresort.com</p>
          <p>Printed on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Cancel booking with 10% fee (refund = finalAmount * 0.9)
  const handleCancelBooking = async (booking) => {
    if (!confirm("Are you sure you want to cancel this booking? A 10% cancellation fee will be applied and the rest refunded.")) return
    try {
      const finalAmt = booking.finalAmount ?? calculateTotalPrice(booking)
      const feePercent = 10
      const refundAmount = Math.round((finalAmt * (1 - feePercent / 100)) * 100) / 100
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "cancelled",
        feePercent,
        refundAmount,
        refundProcessed: false,
        cancelledAt: new Date().toISOString()
      })
      await loadBookings(user.uid)
      alert(`Booking cancelled. Refund amount: ₱${refundAmount.toLocaleString()}`)
    } catch (error) {
      console.error("Error cancelling booking:", error)
      alert("Failed to cancel booking. Please try again.")
    }
  }

  // Mark No-Show with 30% fee (refund = finalAmount * 0.7)
  const handleMarkNoShow = async (booking) => {
    if (!confirm("Mark this booking as 'No-Show'? A 30% fee will be applied and the rest refunded.")) return
    try {
      const finalAmt = booking.finalAmount ?? calculateTotalPrice(booking)
      const feePercent = 30
      const refundAmount = Math.round((finalAmt * (1 - feePercent / 100)) * 100) / 100
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "no-show",
        feePercent,
        refundAmount,
        refundProcessed: false,
        noShowAt: new Date().toISOString()
      })
      await loadBookings(user.uid)
      alert(`Booking marked as No-Show. Refund amount: ₱${refundAmount.toLocaleString()}`)
    } catch (error) {
      console.error("Error marking no-show:", error)
      alert("Failed to mark no-show. Please try again.")
    }
  }

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
      {/* Header with Logo, Tabs, and Profile */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Logo and Profile */}
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Logo />
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
                  <span className="text-sm font-medium hidden sm:block">{userData?.name || "User"}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-sm font-semibold">{userData?.name || "User"}</p>
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
          
          {/* Bottom Row: Navigation Tabs (mobile only) */}
          <div className="flex gap-2 border-t border-border md:hidden">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              onClick={() => setActiveTab("dashboard")}
              className={`rounded-none border-b-2 h-12 ${
                activeTab === "dashboard" 
                  ? "border-primary" 
                  : "border-transparent hover:border-muted-foreground/50"
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "accommodations" ? "default" : "ghost"}
              onClick={() => setActiveTab("accommodations")}
              className={`rounded-none border-b-2 h-12 ${
                activeTab === "accommodations" 
                  ? "border-primary" 
                  : "border-transparent hover:border-muted-foreground/50"
              }`}
            >
              Accommodations
            </Button>
            <Button
              variant={activeTab === "bookings" ? "default" : "ghost"}
              onClick={() => setActiveTab("bookings")}
              className={`rounded-none border-b-2 h-12 ${
                activeTab === "bookings" 
                  ? "border-primary" 
                  : "border-transparent hover:border-muted-foreground/50"
              }`}
            >
              My Bookings ({bookings.length})
            </Button>
            <Button
              variant={activeTab === "feedback" ? "default" : "ghost"}
              onClick={() => setActiveTab("feedback")}
              className={`rounded-none border-b-2 h-12 ${
                activeTab === "feedback" 
                  ? "border-primary" 
                  : "border-transparent hover:border-muted-foreground/50"
              }`}
            >
              Send Feedback
            </Button>
          </div>
        </div>
      </header>
      <section className="py-24 bg-background min-h-screen pt-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
            <aside className="hidden md:flex flex-col gap-4 p-4 bg-card rounded-lg sticky top-24 h-fit">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{userData?.name || "User"}</h4>
                  <p className="text-xs text-muted-foreground">Member</p>
                </div>
              </div>

              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center gap-3 px-3 py-2 rounded ${activeTab === "dashboard" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab("accommodations")}
                  className={`flex items-center gap-3 px-3 py-2 rounded ${activeTab === "accommodations" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Bed className="h-4 w-4" />
                  <span>Accommodations</span>
                </button>

                <button
                  onClick={() => setActiveTab("bookings")}
                  className={`flex items-center gap-3 px-3 py-2 rounded ${activeTab === "bookings" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>My Bookings ({bookings.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`flex items-center gap-3 px-3 py-2 rounded ${activeTab === "feedback" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Send Feedback</span>
                </button>
              </nav>

              <div className="mt-4 border-t border-border pt-4">
                <button onClick={handleOpenProfileSettings} className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted">
                  <Settings className="h-4 w-4" />
                  Profile Settings
                </button>
                <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded text-red-600 hover:bg-muted">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </aside>

            <div>
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <>
                {/* Hero landing for user dashboard */}
              <div className="relative rounded-lg overflow-hidden mb-8">
                <div className="absolute inset-0 z-0">
                  <Image src="/jopats.jpg" alt="Jopats Resort" fill className="object-cover brightness-75" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                </div>
                <div className="relative z-10 px-6 py-10 md:py-16 lg:py-20 max-w-7xl mx-auto">
                  <div className="max-w-3xl text-white">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold">Welcome back, {userData?.name || "Guest"} ✨</h1>
                    <p className="mt-3 text-sm md:text-lg text-white/90 leading-relaxed">Relax and unwind — explore available rooms, cottages, and manage your bookings. We saved your preferences to make booking easier.</p>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Button size="lg" className="bg-primary text-primary-foreground px-6 py-3 text-base" onClick={() => setActiveTab("accommodations")}>
                        Browse Accommodations
                      </Button>
                      <Button size="lg" variant="outline" className="px-6 py-3 text-base" onClick={() => setActiveTab("bookings")}>
                        My Bookings ({bookings.length})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Available Rooms</div>
                      <div className="text-3xl font-bold">{filteredRooms.length}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {rooms.length - filteredRooms.length} booked
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Bed className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Available Cottages</div>
                      <div className="text-3xl font-bold">{filteredCottages.length}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cottages.length - filteredCottages.length} booked
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Available</div>
                      <div className="text-3xl font-bold">{filteredRooms.length + filteredCottages.length}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {rooms.length + cottages.length} total
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Home className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">My Bookings</div>
                      <div className="text-3xl font-bold">{bookings.length}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {bookings.filter(b => b.status === "completed").length} completed
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Maintenance and Cleaning Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Rooms in Maintenance/Cleaning */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-orange-600" />
                    Rooms Status
                  </h3>
                  <div className="space-y-3">
                    {rooms.filter(r => r.status === "maintenance").length > 0 && (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-orange-800 dark:text-orange-300">Maintenance</span>
                          </div>
                          <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                            {rooms.filter(r => r.status === "maintenance").length}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-orange-700 dark:text-orange-400">
                          {rooms.filter(r => r.status === "maintenance").map(r => r.type).join(", ")}
                        </div>
                      </div>
                    )}
                    {rooms.filter(r => r.status === "cleaning").length > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800 dark:text-blue-300">Cleaning</span>
                          </div>
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                            {rooms.filter(r => r.status === "cleaning").length}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                          {rooms.filter(r => r.status === "cleaning").map(r => r.type).join(", ")}
                        </div>
                      </div>
                    )}
                    {rooms.filter(r => r.status === "maintenance" || r.status === "cleaning").length === 0 && (
                      <p className="text-sm text-muted-foreground">All rooms are available</p>
                    )}
                  </div>
                </Card>

                {/* Cottages in Maintenance/Cleaning */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-orange-600" />
                    Cottages Status
                  </h3>
                  <div className="space-y-3">
                    {cottages.filter(c => c.status === "maintenance").length > 0 && (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-orange-800 dark:text-orange-300">Maintenance</span>
                          </div>
                          <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                            {cottages.filter(c => c.status === "maintenance").length}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-orange-700 dark:text-orange-400">
                          {cottages.filter(c => c.status === "maintenance").map(c => c.type).join(", ")}
                        </div>
                      </div>
                    )}
                    {cottages.filter(c => c.status === "cleaning").length > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800 dark:text-blue-300">Cleaning</span>
                          </div>
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                            {cottages.filter(c => c.status === "cleaning").length}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                          {cottages.filter(c => c.status === "cleaning").map(c => c.type).join(", ")}
                        </div>
                      </div>
                    )}
                    {cottages.filter(c => c.status === "maintenance" || c.status === "cleaning").length === 0 && (
                      <p className="text-sm text-muted-foreground">All cottages are available</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Quick View of Available Accommodations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Available Rooms Preview */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Bed className="h-5 w-5" />
                      Available Rooms
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("accommodations")}
                    >
                      View All
                    </Button>
                  </div>
                  {filteredRooms.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No rooms available at the moment.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredRooms.slice(0, 3).map((room) => (
                        <div key={room.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          {room.image && (
                            <img
                              src={room.image}
                              alt={room.type}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.target.src = "/room1.jpg"
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{room.type}</div>
                            <div className="text-sm text-muted-foreground">
                              ₱{room.price}/night • {room.guests} Guests
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleOpenBooking(room, "Room")}
                          >
                            Book
                          </Button>
                        </div>
                      ))}
                      {filteredRooms.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{filteredRooms.length - 3} more rooms available
                        </p>
                      )}
                    </div>
                  )}
                </Card>

                {/* Available Cottages Preview */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Available Cottages
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("accommodations")}
                    >
                      View All
                    </Button>
                  </div>
                  {filteredCottages.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No cottages available at the moment.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredCottages.slice(0, 3).map((cottage) => (
                        <div key={cottage.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          {cottage.image && (
                            <img
                              src={cottage.image}
                              alt={cottage.type}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.target.src = "/cottage.jpg"
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{cottage.type}</div>
                            <div className="text-sm text-muted-foreground">
                              ₱{cottage.price} • {cottage.guests} Guests
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleOpenBooking(cottage, "Cottage")}
                          >
                            Book
                          </Button>
                        </div>
                      ))}
                      {filteredCottages.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{filteredCottages.length - 3} more cottages available
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab("accommodations")}
                  >
                    <Bed className="h-6 w-6" />
                    <span>Browse All Accommodations</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab("bookings")}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>View My Bookings</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab("feedback")}
                  >
                    <MessageSquare className="h-6 w-6" />
                    <span>Send Feedback</span>
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Accommodations Tab */}
          {activeTab === "accommodations" && (
            <>
              {/* Available Rooms and Cottages */}
              {(rooms.length > 0 || cottages.length > 0) ? (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-serif font-bold">Available Accommodations</h2>
                    <p className="text-muted-foreground">Browse and book our rooms and cottages</p>
                  </div>

                  {/* Search Box and Filters */}
                  <div className="mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Search Box */}
                      <div className="lg:col-span-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search rooms and cottages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-6 text-base"
                          />
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {/* Accommodation Type Filter */}
                        <select
                          value={filters.accommodationType}
                          onChange={(e) => setFilters({ ...filters, accommodationType: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="all">All Types</option>
                          <option value="room">Rooms Only</option>
                          <option value="cottage">Cottages Only</option>
                        </select>

                        {/* Min Guests Filter */}
                        <Input
                          type="number"
                          placeholder="Min Guests"
                          value={filters.minGuests}
                          onChange={(e) => setFilters({ ...filters, minGuests: e.target.value })}
                          className="text-sm"
                          min="1"
                        />

                        {/* Min Price Filter */}
                        <Input
                          type="number"
                          placeholder="Min Price (₱)"
                          value={filters.minPrice}
                          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                          className="text-sm"
                          min="0"
                        />

                        {/* Max Price Filter */}
                        <Input
                          type="number"
                          placeholder="Max Price (₱)"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                          className="text-sm"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="text-xs"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Rooms Section */}
                  {filteredRooms.length > 0 && (
                    <div className="mb-12">
                      <h3 className="text-2xl font-serif font-bold mb-6">Rooms</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                      <Card key={room.id} className="overflow-hidden bg-card shadow-md hover:shadow-xl transition-all duration-300 flex flex-col">
                        {/* Image Section */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {room.image ? (
                            <img
                              src={room.image}
                              alt={room.type}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = "/room1.jpg"
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground">No Image</span>
                            </div>
                          )}
                        </div>

                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-3">
                            <CardTitle className="text-2xl font-serif font-bold text-foreground">
                              {room.type}
                            </CardTitle>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-foreground">
                                ₱{room.price}
                              </span>
                              <span className="text-sm text-muted-foreground block">/night</span>
                            </div>
                          </div>
                          {room.description && (
                            <CardDescription className="text-base text-muted-foreground text-pretty leading-relaxed mt-2">
                              {room.description}
                            </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                          {/* Key Details */}
                          <div className="flex gap-6 mb-5 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{room.guests} Guests</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Bed className="h-4 w-4" />
                              <span>
                                {room.beds} {room.beds === 1 ? "Bed" : "Beds"}
                              </span>
                            </div>
                            {room.size && (
                              <div className="flex items-center gap-2">
                                <Maximize className="h-4 w-4" />
                                <span>{room.size}</span>
                              </div>
                            )}
                          </div>

                          {/* Features Tags */}
                          {room.features && room.features.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {room.features.map((feature, idx) => (
                                <span 
                                  key={idx} 
                                  className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-full"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="pt-0">
                          <Button
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-6 text-base rounded-lg transition-colors"
                            onClick={() => handleOpenBooking(room, "Room")}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Book Now
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
                  )}

                  {/* Cottages Section */}
                  {filteredCottages.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-serif font-bold mb-6">Cottages</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCottages.map((cottage) => (
                      <Card key={cottage.id} className="overflow-hidden bg-card shadow-md hover:shadow-xl transition-all duration-300 flex flex-col">
                        {/* Image Section */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {cottage.image ? (
                            <img
                              src={cottage.image}
                              alt={cottage.type}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = "/cottage.jpg"
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground">No Image</span>
                            </div>
                          )}
                        </div>

                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-3">
                            <CardTitle className="text-2xl font-serif font-bold text-foreground">
                              {cottage.type}
                            </CardTitle>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-foreground">
                                ₱{cottage.price}
                              </span>
                            </div>
                          </div>
                          {cottage.description && (
                            <CardDescription className="text-base text-muted-foreground text-pretty leading-relaxed mt-2">
                              {cottage.description}
                            </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                          {/* Key Details */}
                          <div className="flex gap-6 mb-5 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{cottage.guests} Guests</span>
                            </div>
                            {cottage.size && (
                              <div className="flex items-center gap-2">
                                <Maximize className="h-4 w-4" />
                                <span>{cottage.size}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>

                        <CardFooter className="pt-0">
                          <Button
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-6 text-base rounded-lg transition-colors"
                            onClick={() => handleOpenBooking(cottage, "Cottage")}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Book Now
                          </Button>
                        </CardFooter>
                        </Card>
                      ))}
                      </div>
                    </div>
                  )}

                  {/* No Results Message */}
                  {searchQuery.trim() && filteredRooms.length === 0 && filteredCottages.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No accommodations found</h3>
                      <p className="text-muted-foreground mb-4">
                        No rooms or cottages match your search for &quot;{searchQuery}&quot;
                      </p>
                      <Button variant="outline" onClick={() => setSearchQuery("")}>
                        Clear Search
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">No accommodations available at the moment.</p>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Browse Home Page
                  </Button>
                </Card>
              )}
            </>
          )}

          {/* My Bookings Tab */}
          {activeTab === "bookings" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold">My Bookings</h2>
                <p className="text-muted-foreground">View and manage your reservations</p>
              </div>
              {bookings.length === 0 ? (
                <Card className="p-12 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-6">Start exploring our accommodations and make your first booking!</p>
                  <Button onClick={() => setActiveTab("accommodations")}>
                    Browse Accommodations
                  </Button>
                </Card>
              ) : (
                <div ref={bookingsRef} className="grid gap-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-semibold">
                                {booking.accommodationName || booking.accommodationType}
                                {booking.roomNumber && ` - ${booking.accommodationType === "Room" ? "Room" : "Cottage"} ${booking.roomNumber}`}
                              </h3>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status || "pending")}`}>
                                {booking.status || "pending"}
                              </span>
                            </div>
                            {/* 3-dot Menu */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenBookingMenu(openBookingMenu === booking.id ? null : booking.id)}
                                className="p-2 hover:bg-muted rounded-md transition-colors"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              {openBookingMenu === booking.id && (
                                <div className="absolute right-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-10">
                                  {/* Edit allowed for owner or admin */}
                                  {(booking.userId === user?.uid || booking.guestEmail === user?.email || userData?.isAdmin) && (
                                    <button
                                      onClick={() => handleEditBooking(booking)}
                                      disabled={booking.status === "completed" || booking.status === "cancelled"}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Edit className="h-4 w-4" />
                                      Edit Booking
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handlePrintReceipt(booking)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                                  >
                                    <Printer className="h-4 w-4" />
                                    Print Receipt
                                  </button>

                                  {/* Cancel booking visible only to booking owner */}
                                  {(booking.userId === user?.uid || booking.guestEmail === user?.email) && (
                                    <button
                                      onClick={() => handleCancelBooking(booking)}
                                      disabled={booking.status === "completed" || booking.status === "cancelled"}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                      Cancel Booking
                                    </button>
                                  )}

                                  {/* Mark No-Show reserved for admins */}
                                  {userData?.isAdmin && (
                                    <button
                                      onClick={() => handleMarkNoShow(booking)}
                                      disabled={booking.status === "completed" || booking.status === "cancelled" || booking.status === "no-show"}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <User className="h-4 w-4" />
                                      Mark No-Show
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
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
                            {booking.checkIn && booking.checkOut && (
                              <div>
                                <span className="text-muted-foreground">Duration: </span>
                                <span className="font-medium">
                                  {(() => {
                                    const nights = calculateStayDuration(booking.checkIn, booking.checkOut)
                                    return nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"}` : "N/A"
                                  })()}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Guests: </span>
                              <span className="font-medium">
                                {booking.adults || 1} Adult{booking.adults !== 1 ? "s" : ""}
                                {booking.children > 0 && `, ${booking.children} Child${booking.children !== 1 ? "ren" : ""}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Payment Method: </span>
                              <span className="font-medium capitalize">
                                {booking.paymentMethod 
                                  ? booking.paymentMethod.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())
                                  : "Not specified"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reference Number: </span>
                              <span className="font-medium font-mono">
                                {booking.referenceNumber || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Discount: </span>
                              <span className="font-medium">{booking.discountPercent ? `${booking.discountPercent}%` : "—"}</span>
                              {booking.seniorId && (
                                <div className="mt-2">
                                  <a href={booking.seniorId} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">View Senior ID</a>
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Price: </span>
                              <span className="font-medium text-green-600">₱{calculateTotalPrice(booking)}</span>
                            </div>
                          </div>
                          {/* Show Payment Proof if GCash payment */}
                          {booking.paymentMethod === "gcash" && booking.paymentProof && (
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <Upload className="h-5 w-5 text-primary" />
                                <h4 className="font-semibold text-sm">Payment Proof</h4>
                              </div>
                              <a href={booking.paymentProof} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={booking.paymentProof}
                                  alt="Payment proof"
                                  className="max-h-48 rounded-lg border border-border hover:opacity-80 transition-opacity"
                                />
                              </a>
                              <p className="text-xs text-muted-foreground mt-2">Click to view full image</p>
                            </div>
                          )}
                          {booking.specialRequests && (
                            <div className="mt-3 p-3 bg-muted rounded">
                              <span className="text-sm text-muted-foreground">Special Requests: </span>
                              <span className="text-sm">{booking.specialRequests}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Send Feedback Tab */}
          {activeTab === "feedback" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold">Share Your Experience</h2>
                <p className="text-muted-foreground">We'd love to hear from you!</p>
              </div>
              <Card className="max-w-2xl mx-auto p-8">
                <form onSubmit={handleSubmitFeedback} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFeedbackForm({ ...feedbackForm, rating })}
                          className={`p-2 rounded transition-colors ${
                            feedbackForm.rating >= rating
                              ? "text-yellow-500"
                              : "text-muted-foreground hover:text-yellow-400"
                          }`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              feedbackForm.rating >= rating ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {feedbackForm.rating} out of 5 stars
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Feedback *</label>
                    <Textarea
                      value={feedbackForm.comment}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                      placeholder="Tell us about your experience at Jopats Resort..."
                      rows={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submittingFeedback}>
                    {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </form>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && selectedAccommodation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Book {selectedAccommodation.type}</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false)
                  setSelectedAccommodation(null)
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedAccommodation.type}</h3>
                    <p className="text-sm text-muted-foreground">₱{selectedAccommodation.price}/night</p>
                  </div>
                </div>
                {selectedAccommodation.description && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedAccommodation.description}</p>
                )}
              </div>
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-in Date *</label>
                    <Input
                      type="date"
                      value={bookingForm.checkIn}
                      onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-out Date *</label>
                    <Input
                      type="date"
                      value={bookingForm.checkOut}
                      onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                      min={bookingForm.checkIn || new Date().toISOString().split("T")[0]}
                      required
                    />
                    {bookingForm.checkIn && bookingForm.checkOut && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(() => {
                          const nights = calculateStayDuration(bookingForm.checkIn, bookingForm.checkOut)
                          if (nights <= 0) return "Check-out must be after check-in"
                          return `Stay duration: ${nights} ${nights === 1 ? "night" : "nights"}`
                        })()}
                      </p>
                    )}
                  </div>
                  {bookingForm.checkIn && bookingForm.checkOut && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Total Price</label>
                      <div className="text-2xl font-bold text-green-600">
                        ₱{calculateBookingTotal()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(() => {
                          const nights = calculateStayDuration(bookingForm.checkIn, bookingForm.checkOut)
                          return `${nights} ${nights === 1 ? "night" : "nights"} × ₱${selectedAccommodation.price}`
                        })()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Adults *</label>
                    <Input
                      type="number"
                      min="1"
                      value={bookingForm.adults}
                      onChange={(e) => setBookingForm({ ...bookingForm, adults: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Children</label>
                    <Input
                      type="number"
                      min="0"
                      value={bookingForm.children}
                      onChange={(e) => setBookingForm({ ...bookingForm, children: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Ages 0-17</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method *</label>
                  <select
                    value={bookingForm.paymentMethod}
                    onChange={(e) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                  </select>
                </div>
                
                {/* Reference Number */}
                <div>
                  <label className="block text-sm font-medium mb-2">Reference Number</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={bookingForm.referenceNumber || generatedReferenceNumber}
                      onChange={(e) => setBookingForm({ ...bookingForm, referenceNumber: e.target.value })}
                      placeholder="Auto-generated reference number"
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={copyReferenceNumber}
                      className="px-3"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Use this reference number for payment</p>
                </div>

                {/* Senior Discount */}
                <div className="mt-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bookingForm.senior}
                      onChange={(e) => setBookingForm({ ...bookingForm, senior: e.target.checked })}
                    />
                    <span className="text-sm">Senior Citizen Discount (10%)</span>
                  </label>
                  {bookingForm.senior && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <label className="block text-sm font-medium mb-2">Upload Senior Citizen ID *</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleSeniorIdChange}
                        className="block w-full text-sm text-muted-foreground cursor-pointer"
                      />
                      {seniorIdPreview && (
                        <div className="mt-2">
                          <img src={seniorIdPreview} alt="Senior ID preview" className="max-h-40 rounded-lg border border-border" />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">Please upload a photo or scan of your Senior Citizen ID to apply the discount.</p>
                    </div>
                  )}
                </div>

                {/* GCash Payment Section */}
                {bookingForm.paymentMethod === "gcash" && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">GCash Payment</h3>
                    </div>
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Send payment to:</strong> <span className="font-mono">{gcashNumber}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Amount:</strong> <span className="font-semibold text-green-600">₱{calculateBookingTotal().toFixed(2)}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Reference:</strong> <span className="font-mono">{bookingForm.referenceNumber || generatedReferenceNumber}</span>
                      </p>
                    </div>

                    {/* Upload Payment Proof */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Upload GCash Payment Screenshot *</label>
                      <div className="flex flex-col gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePaymentProofChange}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                        />
                        {paymentProofPreview && (
                          <div className="relative">
                            <img
                              src={paymentProofPreview}
                              alt="Payment proof preview"
                              className="max-h-48 rounded-lg border border-border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentProofFile(null)
                                setPaymentProofPreview(null)
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Please upload a screenshot of your GCash payment confirmation
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Special Requests</label>
                  <Textarea
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                    placeholder="Any special requests or notes..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowBookingModal(false)
                      setSelectedAccommodation(null)
                    }}
                    disabled={submittingBooking}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingBooking || uploadingPaymentProof || (bookingForm.paymentMethod === "gcash" && !paymentProofFile)}>
                    {uploadingPaymentProof ? "Uploading..." : submittingBooking ? "Submitting..." : "Confirm Booking"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">Edit Booking</h2>
              <button
                onClick={() => setEditingBooking(null)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-in Date</label>
                    <Input
                      type="date"
                      value={editBookingForm.checkIn}
                      onChange={(e) => setEditBookingForm({ ...editBookingForm, checkIn: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-out Date</label>
                    <Input
                      type="date"
                      value={editBookingForm.checkOut}
                      onChange={(e) => setEditBookingForm({ ...editBookingForm, checkOut: e.target.value })}
                      min={editBookingForm.checkIn || new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Adults</label>
                    <Input
                      type="number"
                      min="1"
                      value={editBookingForm.adults}
                      onChange={(e) => setEditBookingForm({ ...editBookingForm, adults: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Children</label>
                    <Input
                      type="number"
                      min="0"
                      value={editBookingForm.children}
                      onChange={(e) => setEditBookingForm({ ...editBookingForm, children: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Special Requests</label>
                  <Textarea
                    value={editBookingForm.specialRequests}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, specialRequests: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingBooking(null)}>
                    Close
                  </Button>

                  {(editingBooking.userId === user?.uid || editingBooking.guestEmail === user?.email) && editingBooking.status !== "cancelled" && editingBooking.status !== "completed" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-red-600"
                      onClick={async () => {
                        await handleCancelBooking(editingBooking)
                        setEditingBooking(null)
                      }}
                    >
                      Cancel Booking
                    </Button>
                  )}

                  <Button type="submit">
                    Update Booking
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowProfileSettings(false)
                        setActiveSettingsTab("profile")
                      }}
                      disabled={updatingProfile}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProfile} disabled={updatingProfile}>
                      {updatingProfile ? "Updating..." : "Update Profile"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeSettingsTab === "appearance" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {darkMode ? (
                        <Moon className="h-5 w-5 text-primary" />
                      ) : (
                        <Sun className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">
                          {darkMode ? "Dark theme is enabled" : "Light theme is enabled"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleDarkMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        darkMode ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          darkMode ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowProfileSettings(false)
                        setActiveSettingsTab("profile")
                      }}
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
    </main>
  )
}
