"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (!res?.error) {
      router.push("/admin")
    } else {
      setError("Invalid credentials!")
    }
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="px-5 py-7 h-4/5 w-2/5 rounded-4xl bg-gradient-to-r from-amber-100 to-orange-100 shadow-xl">
        <form
          onSubmit={handleSubmit}
          className="text-amber-900 flex flex-col justify-around h-full gap-5 text-xl font-medium w-full"
        >
          <h1 className="text-amber-900 text-5xl font-semibold">Admin Login</h1>
          <div className="flex flex-col gap-2">
            <label htmlFor="admin_username">Login ID</label>
            <input
              className="bg-gradient-to-r from-amber-200 to-orange-200 outline-none px-4 py-2 rounded-xl shadow-md"
              type="email"
              placeholder="Admin Email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col justify-around gap-2">
            <label htmlFor="admin_password">Password</label>
            <input
              className="bg-gradient-to-r from-amber-200 to-orange-200 outline-none px-4 py-2 rounded-xl shadow-md"
              type="password"
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <input
            type="submit"
            className="bg-gradient-to-r from-amber-200 to-orange-200 hover:from-amber-300 hover:to-orange-300 py-2 rounded-xl shadow-md cursor-pointer transition-colors duration-300"
            value="Login"
          />
          {error && <p className="text-red-500 text-center">{error}</p>}
        </form>
      </div>
    </div>
  )
}