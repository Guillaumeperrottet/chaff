"use client";

import { useState } from "react";
import { Navigation } from "@/app/components/navigation";
import { Footer } from "@/app/components/footer";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi");
      }

      toast.success("Message envoyé avec succès !", {
        description: "Nous vous répondrons dans les plus brefs délais.",
      });

      // Réinitialiser le formulaire
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch {
      toast.error("Erreur lors de l'envoi du message", {
        description: "Veuillez réessayer plus tard.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900">
              Contactez-nous
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Une question ? Besoin d&apos;informations ? Nous sommes à votre
              écoute.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Email */}
            <div className="bg-slate-50 rounded-2xl p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Email</h3>
                <a
                  href="mailto:gp@webbing.ch"
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  gp@webbing.ch
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-slate-50 rounded-2xl p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Téléphone</h3>
                <a
                  href="tel:+41793414074"
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  +41 79 341 40 74
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="bg-slate-50 rounded-2xl p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Localisation</h3>
                <p className="text-slate-600">Rue de Battentin 1, 1630 Bulle</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Form Header */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Ou écrivez-nous
              </h2>
              <p className="text-slate-600 text-lg">
                Décrivez votre projet, nous vous répondrons rapidement
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">
                Formulaire de contact
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First Name & Last Name */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-slate-900 mb-2"
                    >
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-slate-900 mb-2"
                    >
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-900 mb-2"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-900 mb-2"
                  >
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-slate-900 mb-2"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-8 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-blue-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
