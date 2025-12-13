import { MapPin, Phone, Mail, Clock } from "lucide-react"

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
          <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden bg-muted">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353!3d-37.8162791!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577d1b91c1b5e0!2sJopats%20Resort!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
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

            <div className="pt-4">
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}