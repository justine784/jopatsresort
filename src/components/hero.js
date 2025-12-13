import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export function Hero() {
  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 z-0">
        <img src="/jopats.jpg" alt="Jopats Resort" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 text-balance">
          Jopats Resort
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto text-pretty leading-relaxed">
          Experience luxury and tranquility at Jopats Resort. Discover our exquisite rooms and private cottages nestled
          in tropical paradise.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
            <Calendar className="mr-2 h-5 w-5" />
            Book Your Stay
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-white/10 backdrop-blur text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6"
          >
            Explore Accommodations
          </Button>
        </div>
      </div>
    </section>
  )
}
