'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "/Users/prakhartripathi/portfolio-tracker/src/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, TrendingUp, BarChart2, PieChart } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const returnsData = [
  { month: 'Jan', portfolio: 5, nifty50: 4, sensex: 4.5 },
  { month: 'Feb', portfolio: 7, nifty50: 6, sensex: 6.5 },
  { month: 'Mar', portfolio: 6, nifty50: 5, sensex: 5.5 },
  { month: 'Apr', portfolio: 8, nifty50: 7, sensex: 7.2 },
  { month: 'May', portfolio: 9, nifty50: 8, sensex: 8.5 },
  { month: 'Jun', portfolio: 11, nifty50: 9, sensex: 9.5 },
]

export default function AppPage() {
  const [showLogin, setShowLogin] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const moreContentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scrollToMore = () => {
    setShowMore(true)
    moreContentRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowMore(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center">
          <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
          <span className="text-xl font-bold text-black">Portfolio Tracker</span>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <Button variant="ghost" className="text-sm font-medium text-black">Features</Button>
          <Button variant="ghost" className="text-sm font-medium text-black">Pricing</Button>
          <Button variant="ghost" className="text-sm font-medium text-black">About</Button>
          <Button onClick={() => router.push('/signup')} className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-6 py-2">
            Try Now
          </Button>
        </nav>
      </header>

      <main className="flex-grow">
        <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center text-blue-600 mb-6">
            Track Your Investments with Ease
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-2xl mb-8">
            Our portfolio tracker helps you monitor your investments, analyze performance, and make informed decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={scrollToMore} className="border border-gray-300 text-black rounded-md px-6 py-2">
              Learn More
            </Button>
          </div>
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronDown className="w-8 h-8 text-blue-600 cursor-pointer" onClick={scrollToMore} />
          </motion.div>
        </section>

        <AnimatePresence>
          {showMore && (
            <motion.div
              ref={moreContentRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <section className="py-20 px-4 md:px-6 bg-white">
                <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Our Features</h2>
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <BarChart2 className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-4 text-blue-600">Real-time Tracking</h3>
                    <p className="text-gray-600">Monitor your investments in real-time with live updates and alerts.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-4 text-blue-600">Performance Analytics</h3>
                    <p className="text-gray-600">Gain insights into your portfolio's performance with advanced analytics tools.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <PieChart className="h-12 w-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-4 text-blue-600">Customizable Dashboards</h3>
                    <p className="text-gray-600">Create personalized dashboards to focus on the metrics that matter most to you.</p>
                  </div>
                </div>
              </section>

              <section className="py-20 px-4 md:px-6 bg-white">
                <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Performance Comparison</h2>
                <div className="max-w-4xl mx-auto h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={returnsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="portfolio" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="nifty50" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="sensex" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center mt-6 text-gray-600">
                  Compare your portfolio's performance against India's top indices: NIFTY 50 and SENSEX
                </p>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-6 px-4 md:px-6 text-center text-sm text-gray-500 bg-white border-t">
        © 2024 Portfolio Tracker. All rights reserved.
        <nav className="mt-2 space-x-4">
          <a className="hover:underline underline-offset-4" href="#">Terms of Service</a>
          <a className="hover:underline underline-offset-4" href="#">Privacy Policy</a>
        </nav>
      </footer>
    </div>
  )
}
