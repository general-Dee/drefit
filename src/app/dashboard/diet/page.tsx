"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Coffee, Sun, Moon, Apple, ShoppingCart } from "lucide-react"

const weeklyMeals = {
  Monday: { breakfast: "Oatmeal with Banana", lunch: "Grilled Chicken & Jollof Rice", dinner: "Suya Wrap", snack: "Mixed Nuts" },
  Tuesday: { breakfast: "Smoothie Bowl", lunch: "Moi Moi with Fish Stew", dinner: "Vegetable Stir-fry", snack: "Greek Yogurt" },
}
export default function DietPage() {
  const [day, setDay] = useState("Monday")
  const meals = weeklyMeals[day as keyof typeof weeklyMeals]
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl">Diet Plans</h1>
      <div className="flex gap-2">{Object.keys(weeklyMeals).map(d => <button key={d} onClick={()=>setDay(d)} className={`px-4 py-2 rounded-lg ${day===d ? "bg-drefit-lime text-drefit-dark" : "bg-white/5"}`}>{d}</button>)}</div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-4"><div className="flex items-center gap-2 mb-2"><Coffee className="text-drefit-lime"/>Breakfast</div><p>{meals.breakfast}</p></div>
        <div className="glass-card p-4"><div className="flex items-center gap-2 mb-2"><Sun className="text-drefit-lime"/>Lunch</div><p>{meals.lunch}</p></div>
        <div className="glass-card p-4"><div className="flex items-center gap-2 mb-2"><Moon className="text-drefit-lime"/>Dinner</div><p>{meals.dinner}</p></div>
        <div className="glass-card p-4"><div className="flex items-center gap-2 mb-2"><Apple className="text-drefit-lime"/>Snack</div><p>{meals.snack}</p></div>
      </div>
      <button className="w-full glass-card p-4 flex items-center justify-center gap-2"><ShoppingCart className="w-5 h-5"/> Generate Shopping List</button>
    </div>
  )
}
