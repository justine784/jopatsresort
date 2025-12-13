import { Waves, Utensils, Wifi, Sparkles } from "lucide-react"

const features = [
  {
    icon: Waves,
    title: "Beachfront Access",
    description: "Direct access to pristine white sand beaches and crystal-clear waters",
  },
  {
    icon: Utensils,
    title: "Fine Dining",
    description: "Award-winning restaurants serving local and international cuisine",
  },
  {
    icon: Wifi,
    title: "Modern Amenities",
    description: "High-speed WiFi, air conditioning, and premium entertainment",
  },
  {
    icon: Sparkles,
    title: "Spa Services",
    description: "Rejuvenate with our world-class spa and wellness treatments",
  },
]

export function Features() {
  return (
    <section id="amenities" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 text-balance">
            Resort Amenities
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Everything you need for the perfect vacation experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-pretty leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
