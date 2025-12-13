"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Phone, Mail } from "lucide-react"

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState("")

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/^\\S+@\\S+\\.\\S+$/.test(formData.email)) newErrors.email = "Please enter a valid email"
    if (!formData.message.trim() || formData.message.length < 10)
      newErrors.message = "Please provide a message (10+ characters)"
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("")
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      // TODO: call the API endpoint to send the message
      await new Promise((r) => setTimeout(r, 600))
      setStatus("success")
      setFormData({ name: "", email: "", phone: "", message: "" })
      setErrors({})
    } catch (err) {
      setStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <section id="contact" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-balance mb-4">Get in Touch</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have questions or special requests? We&apos;re here to help make your stay at Jopats Resort unforgettable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-serif text-2xl font-bold mb-2">Contact Information</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <span className="w-6 h-6 text-primary">📍</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Address</h4>
                      <p className="text-muted-foreground">
                        123 Paradise Beach Road
                        <br />
                        Tropical Island, 12345
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Phone</h4>
                      <p className="text-muted-foreground">
                        <a href="tel:+15551234567" className="hover:text-primary">+1 (555) 123-4567</a>
                        <br />
                        <a href="tel:+15559876543" className="hover:text-primary">+1 (555) 987-6543</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Email</h4>
                      <p className="text-muted-foreground">
                        <a href="mailto:info@jopatsresort.com" className="hover:text-primary">info@jopatsresort.com</a>
                        <br />
                        <a href="mailto:reservations@jopatsresort.com" className="hover:text-primary">reservations@jopatsresort.com</a>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 border-primary/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Business Hours</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Front Desk: 24/7</p>
                      <p>Restaurant: 7:00 AM - 10:00 PM</p>
                      <p>Pool & Beach: 6:00 AM - 8:00 PM</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a href="tel:+15551234567" className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-foreground hover:bg-muted">
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                    <a href="mailto:info@jopatsresort.com" className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-foreground hover:bg-muted">
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="p-8 rounded-lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                {status === "success" && (
                  <div className="p-3 bg-primary/10 text-primary-foreground rounded-md">Thank you! Your message has been sent.</div>
                )}

                {status === "error" && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md">Something went wrong. Please try again later.</div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone Number</label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your inquiry or special requests..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
