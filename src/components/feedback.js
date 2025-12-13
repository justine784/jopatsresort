import { Card } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Johnson",
    location: "California, USA",
    rating: 5,
    comment:
      "Jopats Resort exceeded all our expectations! The cottage was spacious, clean, and had an amazing view. The staff was incredibly friendly and attentive. We can&apos;t wait to come back!",
    date: "January 2025",
  },
  {
    name: "Michael Chen",
    location: "Singapore",
    rating: 5,
    comment:
      "Perfect getaway for our family vacation. The kids loved the pool, and we enjoyed the peaceful atmosphere. The deluxe room was comfortable and well-maintained. Highly recommend!",
    date: "December 2024",
  },
  {
    name: "Emma Rodriguez",
    location: "Manila, Philippines",
    rating: 5,
    comment:
      "Beautiful resort with excellent facilities. The booking process was smooth, and the staff went above and beyond to make our stay memorable. The food was delicious too!",
    date: "November 2024",
  },
  {
    name: "David Thompson",
    location: "Sydney, Australia",
    rating: 5,
    comment:
      "A hidden gem! The private cottage gave us the perfect blend of luxury and privacy. The location is stunning, and the amenities are top-notch. Will definitely return.",
    date: "October 2024",
  },
]

export function Feedback() {
  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">Guest Testimonials</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear what our guests have to say about their experience at Jopats Resort
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-8 bg-card border-accent/20 hover:border-accent/40 transition-colors">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              <p className="text-foreground mb-6 leading-relaxed">&ldquo;{testimonial.comment}&rdquo;</p>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
                <p className="text-sm text-muted-foreground">{testimonial.date}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-primary">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-2xl font-bold">5.0</span>
            <span className="text-muted-foreground">out of 5 based on 200+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  )
}
