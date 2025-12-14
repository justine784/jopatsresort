import { MapPin, Phone, Mail, Clock, Navigation, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function Location() {
  return (
    <section id="location" className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-foreground">Find Us</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Located in a tropical paradise, Jopats Resort is your perfect getaway destination
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Map */}
          <Card className="relative h-[350px] sm:h-[400px] md:h-[450px] lg:h-[600px] rounded-xl lg:rounded-2xl overflow-hidden bg-muted p-0 shadow-xl lg:shadow-2xl border border-border lg:border-2">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3891.665875271641!2d121.49992367511874!3d12.735206887558864!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bb51d7f9c6dbad%3A0x8b7294ec52f63e66!2sJopat&#39;s%20Hotel%20%26%20Resort!5e0!3m2!1sfil!2sph!4v1765646028099!5m2!1sfil!2sph"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            />
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
              <a
                href="https://www.google.com/maps/place/Jopat's+Hotel+%26+Resort/@12.7352069,121.4999237,17z/data=!3m1!4b1!4m6!3m5!1s0x33bb51d7f9c6dbad:0x8b7294ec52f63e66!8m2!3d12.7352069!4d121.5024986!16s%2Fg%2F11c5q8vq1j?entry=ttu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open map in Google Maps"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-background/95 backdrop-blur-sm text-foreground rounded-lg border border-border hover:shadow-lg transition-all active:scale-95 text-sm sm:text-base font-medium"
              >
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Open in Maps</span>
                <span className="xs:hidden">Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg lg:shadow-xl border border-border lg:border-2">
            <CardHeader className="pb-4 sm:pb-6">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">Contact & Location</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Visit us or get in touch for bookings and inquiries</p>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-foreground">Address</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    123 Beach Paradise Road
                    <br />
                    Tropical Island, 12345
                    <br />
                    Philippines
                  </p>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-foreground">Phone</h3>
                  <a href="tel:+631234567890" className="block text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors break-all">
                    +63 123 456 7890
                  </a>
                  <a href="tel:+639876543210" className="block text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors break-all">
                    +63 987 654 3210
                  </a>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-foreground">Email</h3>
                  <a href="mailto:info@jopatsresort.com" className="block text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors break-all">
                    info@jopatsresort.com
                  </a>
                  <a href="mailto:reservations@jopatsresort.com" className="block text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors break-all">
                    reservations@jopatsresort.com
                  </a>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-foreground">Operating Hours</h3>
                  <div className="space-y-1 text-sm sm:text-base text-muted-foreground">
                    <p className="font-medium text-foreground">Front Desk: <span className="text-green-600">24/7</span></p>
                    <p>Check-in: <span className="font-medium text-foreground">2:00 PM</span></p>
                    <p>Check-out: <span className="font-medium text-foreground">12:00 PM</span></p>
                  </div>
                </div>
              </div>

              <div className="pt-2 sm:pt-4 space-y-2 sm:space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <a
                    href="tel:+631234567890"
                    aria-label="Call Jopats Resort"
                    className="inline-flex items-center justify-center gap-2 w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 active:scale-95 transition-all text-sm sm:text-base"
                  >
                    <Phone className="w-4 h-4" />
                    Call Us
                  </a>
                  <a
                    href="mailto:info@jopatsresort.com"
                    aria-label="Email Jopats Resort"
                    className="inline-flex items-center justify-center gap-2 w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-border rounded-lg text-foreground bg-background hover:bg-muted active:scale-95 transition-all text-sm sm:text-base"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                </div>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Jopat's+Hotel+%26+Resort"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get directions"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 sm:px-6 sm:py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 active:scale-95 transition-all text-sm sm:text-base"
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}