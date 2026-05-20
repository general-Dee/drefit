"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { ChevronRight, Dumbbell, Apple, Users, TrendingUp } from "lucide-react"

export default function Home() {
  const features = [
    { icon: Dumbbell, title: "Personalized Coaching", description: "Expert trainers design workouts tailored to your goals" },
    { icon: Apple, title: "AI Diet Plans", description: "Nigerian food-focused meal plans with local recipes" },
    { icon: Users, title: "Vibrant Community", description: "Connect with like-minded fitness enthusiasts across Nigeria" },
    { icon: TrendingUp, title: "Progress Tracking", description: "Visual analytics to keep you motivated" },
  ]
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center section-padding text-center">
        <div className="absolute inset-0 bg-mesh-gradient opacity-20" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
            Train Like a Champion.<br /><span className="text-drefit-lime">Eat Like One Too.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-gray-300 mb-8">
            Personalized coaching, AI-powered diet plans, and a community that pushes you to greatness.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-4 justify-center">
            <Link href="/register" className="lime-gradient text-drefit-dark font-bold py-4 px-8 rounded-full hover:scale-105 transition inline-flex items-center gap-2">
              Start Your Journey <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="#pricing" className="border-2 border-drefit-lime text-drefit-lime font-bold py-4 px-8 rounded-full hover:bg-drefit-lime hover:text-drefit-dark transition">
              View Pricing
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-drefit-dark-secondary/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl mb-4">Everything You Need to Succeed</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-6 hover:scale-105 transition">
                <f.icon className="w-12 h-12 text-drefit-lime mb-4 mx-auto" />
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl mb-4">Simple, Transparent Pricing</h2>
          <div className="glass-card p-8 max-w-md mx-auto">
            <div className="text-4xl font-bold mb-2">₦5,000</div>
            <div className="text-gray-400 mb-6">per month</div>
            <ul className="text-left space-y-2 mb-6">
              <li>✓ Personalized workout plans</li>
              <li>✓ AI diet plans with Nigerian recipes</li>
              <li>✓ 1-on-1 coaching chat</li>
              <li>✓ Progress tracking & analytics</li>
              <li>✓ Community access & challenges</li>
            </ul>
            <Link href="/register" className="lime-gradient text-drefit-dark font-bold py-3 px-8 rounded-full inline-block hover:scale-105 transition">
              Start 7-Day Free Trial
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
