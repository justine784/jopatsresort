"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { Logo } from "./logo"
import { useRouter } from "next/navigation"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Logo />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">
              Home
            </a>
            <a href="#accommodations" className="text-foreground hover:text-primary transition-colors">
              Accommodations
            </a>
            <a href="#amenities" className="text-foreground hover:text-primary transition-colors">
              Amenities
            </a>
            <a href="#testimonials" className="text-foreground hover:text-primary transition-colors">
              Testimonials
            </a>
            <a href="#location" className="text-foreground hover:text-primary transition-colors">
              Location
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </a>
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="ml-2"
            >
              Login
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push('/register')}>Book Now</Button>
           
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <a
              href="#home"
              className="block px-3 py-2 text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              Home
            </a>
            <a
              href="#accommodations"
              className="block px-3 py-2 text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              Accommodations
            </a>
            <a
              href="#amenities"
              className="block px-3 py-2 text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              Amenities
            </a>
            <a
              href="#testimonials"
              className="block px-3 py-2 text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#location"
              className="block px-3 py-2 text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              Location
            </a>
            <a
              href="#contact"
              className="block px-3 py-2 text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
            >
              Contact
            </a>
            <div className="px-3 py-2">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push('/register')}>Book Now</Button>
            </div>
            <div className="px-3 pb-4">
              <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>Login</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
