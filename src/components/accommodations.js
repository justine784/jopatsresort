"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Users, Bed, Maximize } from "lucide-react"
import { Logo } from "@/components/logo"
import { db } from "@/app/firebaseConfig"
import { collection, onSnapshot } from "firebase/firestore"

// Fallback static accommodations
const staticAccommodations = [
  {
    type: "Deluxe Room",
    image: "/room1.jpg",
    images: null,
    price: "₱150",
    guests: 2,
    beds: 1,
    size: "35 sqm",
    description: "Spacious rooms with stunning ocean views, perfect for couples seeking comfort and elegance.",
    features: ["Ocean View", "King Bed", "Private Balcony", "Mini Bar"],
    accommodationType: "Room",
  },
  {
    type: "Family Suite",
    image: "/family.jpg",
    images: ["/family.jpg", "/room1.jpg", "/room2.jpg"],
    price: "₱250",
    guests: 4,
    beds: 2,
    size: "55 sqm",
    description: "Comfortable suites designed for families with separate living areas and modern amenities.",
    features: ["Two Bedrooms", "Living Room", "Kitchenette", "Garden View"],
    accommodationType: "Room",
  },
  {
    type: "Cottage",
    image: "/cottage.jpg",
    images: null,
    price: "₱350",
    guests: 6,
    beds: 3,
    size: "85 sqm",
    description: "Exclusive beachfront cottages offering ultimate privacy and luxury for your tropical escape.",
    features: ["Beachfront", "Private Pool", "Outdoor Deck", "Full Kitchen"],
    accommodationType: "Cottage",
  },
]

export function Accommodations() {
  const router = useRouter()
  const [accommodations, setAccommodations] = useState(staticAccommodations)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let roomsData = []
    let cottagesData = []

    const updateAccommodations = () => {
      // Filter available rooms and cottages
      const availableRooms = roomsData.filter((acc) => {
        return !acc.status || acc.status === "available"
      })
      
      const availableCottages = cottagesData.filter((acc) => {
        return !acc.status || acc.status === "available"
      })

      // Maintain display: 2 rooms and 1 cottage (or as many as available)
      const roomsToShow = availableRooms.slice(0, 2) // Take first 2 rooms
      const cottagesToShow = availableCottages.slice(0, 1) // Take first 1 cottage
      
      const combinedAccommodations = [...roomsToShow, ...cottagesToShow]

      if (combinedAccommodations.length > 0) {
        setAccommodations(combinedAccommodations)
      } else {
        // Fallback to static if no Firebase data
        setAccommodations(staticAccommodations)
      }
      setLoading(false)
    }

    // Set up real-time listener for rooms
    const roomsUnsubscribe = onSnapshot(
      collection(db, "rooms"),
      (snapshot) => {
        roomsData = snapshot.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            type: data.type || "Room",
            image: data.image || "/room1.jpg",
            images: null,
            price: `₱${data.price || 0}`,
            guests: data.guests || 2,
            beds: data.beds || 1,
            size: data.size || "",
            description: data.description || "",
            features: Array.isArray(data.features) ? data.features : [],
            accommodationType: "Room",
            status: data.status || null,
          }
        })
        updateAccommodations()
      },
      (error) => {
        console.error("Error loading rooms:", error)
        setLoading(false)
      }
    )

    // Set up real-time listener for cottages
    const cottagesUnsubscribe = onSnapshot(
      collection(db, "cottages"),
      (snapshot) => {
        cottagesData = snapshot.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            type: data.type || "Cottage",
            image: data.image || "/cottage.jpg",
            images: null,
            price: `₱${data.price || 0}`,
            guests: data.guests || 4,
            beds: null, // Cottages don't have beds
            size: data.size || "",
            description: data.description || "",
            features: [], // Cottages don't have features in the new structure
            accommodationType: "Cottage",
            status: data.status || null,
          }
        })
        updateAccommodations()
      },
      (error) => {
        console.error("Error loading cottages:", error)
        setLoading(false)
      }
    )

    // Cleanup listeners on unmount
    return () => {
      roomsUnsubscribe()
      cottagesUnsubscribe()
    }
  }, [])
  return (
    <section id="accommodations" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 text-balance">
            Our Accommodations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Choose from our carefully designed rooms and cottages, each offering unique comfort and style
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
            <div className="flex flex-col items-center gap-6">
              <div className="animate-pulse">
                <Logo className="scale-150" />
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <p className="text-muted-foreground text-sm mt-2">Loading accommodations...</p>
            </div>
          </div>
        ) : accommodations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No accommodations available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {accommodations.map((accommodation, index) => (
              <Card 
                key={accommodation.id || index} 
                className="overflow-hidden bg-card shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Image Section */}
                <div className="relative">
                  {accommodation.images && accommodation.images.length > 1 ? (
                    // Multiple images layout for Family Suite
                    <div className="aspect-[4/3] grid grid-cols-2 gap-1 overflow-hidden">
                      <div className="row-span-2 relative">
                        <Image
                          src={accommodation.images[0] || "/placeholder.svg"}
                          alt={`${accommodation.type} - Main view`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "/room1.jpg"
                          }}
                        />
                      </div>
                      <div className="relative">
                        <Image
                          src={accommodation.images[1] || "/placeholder.svg"}
                          alt={`${accommodation.type} - Bedroom`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "/room1.jpg"
                          }}
                        />
                      </div>
                      <div className="relative">
                        <Image
                          src={accommodation.images[2] || "/placeholder.svg"}
                          alt={`${accommodation.type} - Bathroom`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "/room1.jpg"
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Single image layout
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img
                        src={accommodation.image || "/placeholder.svg"}
                        alt={accommodation.type}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = accommodation.accommodationType === "Cottage" ? "/cottage.jpg" : "/room1.jpg"
                        }}
                      />
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          accommodation.accommodationType === "Room" 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {accommodation.accommodationType}
                        </span>
                      </div>
                      <CardTitle className="text-2xl font-serif font-bold text-foreground">
                        {accommodation.type}
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-foreground">
                        {accommodation.price}
                      </span>
                      {accommodation.accommodationType === "Room" && (
                        <span className="text-sm text-muted-foreground block">/night</span>
                      )}
                    </div>
                  </div>
                  {accommodation.description && (
                    <CardDescription className="text-base text-muted-foreground text-pretty leading-relaxed mt-2">
                      {accommodation.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Key Details */}
                  <div className="flex gap-6 mb-5 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{accommodation.guests} Guests</span>
                    </div>
                    {accommodation.beds && (
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        <span>
                          {accommodation.beds} {accommodation.beds === 1 ? "Bed" : "Beds"}
                        </span>
                      </div>
                    )}
                    {accommodation.size && (
                      <div className="flex items-center gap-2">
                        <Maximize className="h-4 w-4" />
                        <span>{accommodation.size}</span>
                      </div>
                    )}
                  </div>

                  {/* Features Tags */}
                  {accommodation.features && accommodation.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {accommodation.features.map((feature, idx) => (
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
                    onClick={() => router.push("/register")}
                  >
                    Reserve Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
