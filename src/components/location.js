import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function Location() {
  return (
    <section id="location" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-foreground">Find Us</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Located in a tropical paradise, Jopats Resort is your perfect getaway destination
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Map */}
          <Card className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden bg-muted p-0">
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
            <div className="absolute top-4 left-4">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open map in Google Maps"
                className="inline-flex items-center gap-2 px-3 py-2 bg-background/80 text-foreground rounded-md border border-border hover:shadow-md transition-shadow backdrop-blur"
              >
                <MapPin className="w-4 h-4" />
                Open in Maps
              </a>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="rounded-2xl p-6">
            <CardHeader>
              <h3 className="text-2xl font-serif font-bold text-foreground">Contact & Location</h3>
              <p className="text-muted-foreground mt-1">Visit us or get in touch for bookings</p>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Address</h3>
                <p className="text-muted-foreground leading-relaxed">
                  123 Beach Paradise Road
                  <br />
                  Tropical Island, 12345
                  <br />
                  Philippines
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Phone</h3>
                <p className="text-muted-foreground">+63 123 456 7890</p>
                <p className="text-muted-foreground">+63 987 654 3210</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Email</h3>
                <p className="text-muted-foreground">info@jopatsresort.com</p>
                <p className="text-muted-foreground">reservations@jopatsresort.com</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">Hours</h3>
                <p className="text-muted-foreground">
                  Front Desk: 24/7
                  <br />
                  Check-in: 2:00 PM
                  <br />
                  Check-out: 12:00 PM
                </p>
              </div>
            </div>

            <div className="pt-1 flex gap-3">
              <a
                href="tel:+631234567890"
                aria-label="Call Jopats Resort"
                className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Call Us
              </a>
              <a
                href="mailto:info@jopatsresort.com"
                aria-label="Email Jopats Resort"
                className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-3 border border-border rounded-lg text-foreground bg-background hover:shadow-sm transition-colors"
              >
                Email
              </a>
            </div>
            <div className="pt-3">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get directions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Directions
              </a>
            </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}