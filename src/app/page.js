import { Hero } from "@/components/hero"
import { Navigation } from "@/components/navigation"
import { Accommodations } from "@/components/accommodations"
import { Features } from "@/components/features"
import { Feedback } from "@/components/feedback"
import { Location } from "@/components/location"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <Features />
      <Accommodations />
      <Feedback />
      <Location />
      <Contact />
      <Footer />
    </main>
  )
}
