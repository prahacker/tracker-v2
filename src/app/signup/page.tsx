'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "/Users/prakhartripathi/portfolio-tracker/src/components/ui/button"
import { Input } from "/Users/prakhartripathi/portfolio-tracker/src/components/ui/input"
import { Label } from "/Users/prakhartripathi/portfolio-tracker/src/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "/Users/prakhartripathi/portfolio-tracker/src/components/ui/card"
import { Alert, AlertDescription } from "/Users/prakhartripathi/portfolio-tracker/src/components/ui/alert"
import { ExclamationTriangleIcon, EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'

export default function Signup() {
  const [formState, setFormState] = useState({ name: '', email: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prevState) => ({ ...prevState, [name]: value }))
  }

  const handleSignUp = async () => {
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          email_id: formState.email,
          username: formState.username,
          password: formState.password
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Sign-up failed')
      }

      alert('Sign-up successful. You can now log in.')
      router.push('/login')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignUp()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen animated-bg">
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-bg {
          background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }
      `}</style>
      <Card className="w-full max-w-md relative z-10 overflow-hidden bg-white/80 backdrop-blur-md border border-white/20 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-800">Create an account</CardTitle>
          <CardDescription className="text-gray-600">Enter your details to sign up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-100 text-red-800 border border-red-300">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onKeyDown={handleKeyDown} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your name"
                value={formState.name}
                onChange={handleInputChange}
                className="bg-white/50 backdrop-blur-sm border-gray-300 text-gray-800 placeholder-gray-400 w-full py-3 px-4 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formState.email}
                onChange={handleInputChange}
                className="bg-white/50 backdrop-blur-sm border-gray-300 text-gray-800 placeholder-gray-400 w-full py-3 px-4 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formState.username}
                onChange={handleInputChange}
                className="bg-white/50 backdrop-blur-sm border-gray-300 text-gray-800 placeholder-gray-400 w-full py-3 px-4 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formState.password}
                  onChange={handleInputChange}
                  className="bg-white/50 backdrop-blur-sm border-gray-300 text-gray-800 placeholder-gray-400 pr-10 w-full py-3 px-4 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeClosedIcon className="h-4 w-4" />
                  ) : (
                    <EyeOpenIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            onClick={handleSignUp} 
            disabled={isLoading}
          >
            {isLoading ? 'Signing up...' : 'Sign up'}
          </Button>
          <div className="flex justify-center items-center w-full text-sm">
            <button 
              onClick={() => router.push('/login')} 
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition duration-300"
            >
              Already have an account? Log in
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
