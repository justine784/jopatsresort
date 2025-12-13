import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Users, Bed, Maximize } from "lucide-react"

const accommodations = [
  {
    type: "Deluxe Room",
    image: "/room1.jpg",
    images: null, // Single image
    price: "₱150",
    guests: 2,
    beds: 1,
    size: "35 sqm",
    description: "Spacious rooms with stunning ocean views, perfect for couples seeking comfort and elegance.",
    features: ["Ocean View", "King Bed", "Private Balcony", "Mini Bar"],
  },
  {
    type: "Family Suite",
    image: "/family.jpg",
    images: ["/family.jpg", "/room1.jpg", "/room2.jpg"], // Multiple images for collage
    price: "₱250",
    guests: 4,
    beds: 2,
    size: "55 sqm",
    description: "Comfortable suites designed for families with separate living areas and modern amenities.",
    features: ["Two Bedrooms", "Living Room", "Kitchenette", "Garden View"],
  },
  {
    type: "Cottage",
    image: "/cottage.jpg",
    images: null, // Single image
    price: "₱350",
    guests: 6,
    beds: 3,
    size: "85 sqm",
    description: "Exclusive beachfront cottages offering ultimate privacy and luxury for your tropical escape.",
    features: ["Beachfront", "Private Pool", "Outdoor Deck", "Full Kitchen"],
  },
]

export function Accommodations() {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {accommodations.map((accommodation, index) => (
            <Card 
              key={index} 
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
                      />
                    </div>
                    <div className="relative">
                      <Image
                        src={accommodation.images[1] || "/placeholder.svg"}
                        alt={`${accommodation.type} - Bedroom`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="relative">
                      <Image
                        src={accommodation.images[2] || "/placeholder.svg"}
                        alt={`${accommodation.type} - Bathroom`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                ) : (
                  // Single image layout
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <Image
                      src={accommodation.image || "/placeholder.svg"}
                      alt={accommodation.type}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-3">
                  <CardTitle className="text-2xl font-serif font-bold text-foreground">
                    {accommodation.type}
                  </CardTitle>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">
                      {accommodation.price}
                    </span>
                    <span className="text-sm text-muted-foreground block">/night</span>
                  </div>
                </div>
                <CardDescription className="text-base text-muted-foreground text-pretty leading-relaxed mt-2">
                  {accommodation.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Key Details */}
                <div className="flex gap-6 mb-5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{accommodation.guests} Guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    <span>
                      {accommodation.beds} {accommodation.beds === 1 ? "Bed" : "Beds"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="h-4 w-4" />
                    <span>{accommodation.size}</span>
                  </div>
                </div>

                {/* Features Tags */}
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
              </CardContent>

              <CardFooter className="pt-0">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-6 text-base rounded-lg transition-colors">
                  Reserve Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
