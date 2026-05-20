export interface User {
  id: string
  email: string
  name: string
  image?: string
  fitnessGoal?: string
  fitnessLevel?: string
  dietaryPreference?: string
  subscriptionStatus: string
}
export interface Workout {
  id: string
  name: string
  description: string
  muscleGroup: string
  difficulty: string
  exercises: Exercise[]
  duration: number
  calories: number
}
export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  restSeconds: number
  instructions: string
}
export interface Meal {
  id: string
  name: string
  type: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: string[]
  isNigerian: boolean
}
