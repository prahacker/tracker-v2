'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import 'chart.js/auto'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Users, DollarSign, TrendingUp, MousePointer, ShoppingCart, CheckSquare, Bell, Search, Menu, Home, BarChart, PieChart, Settings, HelpCircle } from 'lucide-react'

export function MainPageComponent() {
  const [oneDayReturnData, setOneDayReturnData] = useState(null)
  const [sensexData, setSensexData] = useState(null)
  const [nifty50Data, setNifty50Data] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New market update available", read: false },
    { id: 2, message: "Your portfolio has increased by 5%", read: false },
  ])
  const router = useRouter()

  const fetchGraphData = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error("Token not found. Please log in.")
      }

      const response = await fetch('http://localhost:3001/api/data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const jsonData = await response.json()

      setOneDayReturnData(formatOneDayReturnData(jsonData))
      setSensexData(formatSensexData(jsonData))
      setNifty50Data(formatNifty50Data(jsonData))

      setLoading(false)
    } catch (error) {
      setError(`Failed to fetch data: ${error.toString()}`)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGraphData()
  }, [fetchGraphData])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setOneDayReturnData(null)
    setSensexData(null)
    setNifty50Data(null)
    router.push('/login')
  }

  const runDriverScript = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        alert('No token found, please log in.')
        return
      }

      const response = await fetch('http://localhost:3001/run-script', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const text = await response.text()
      alert(text)
      fetchGraphData()
    } catch (error) {
      console.error('Error running the script:', error)
      alert('Error running the script: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatOneDayReturnData = (jsonData) => {
    return {
      labels: jsonData.map(item => new Date(item.label).toLocaleDateString()),
      datasets: [{
        label: 'One Day Returns',
        data: jsonData.map(item => item.value),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }]
    }
  }

  const formatSensexData = (jsonData) => {
    return {
      labels: jsonData.map(item => new Date(item.label).toLocaleDateString()),
      datasets: [{
        label: 'Sensex',
        data: jsonData.map(item => parseFloat(item.sensex)),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }]
    }
  }

  const formatNifty50Data = (jsonData) => {
    return {
      labels: jsonData.map(item => new Date(item.label).toLocaleDateString()),
      datasets: [{
        label: 'Nifty 50',
        data: jsonData.map(item => parseFloat(item.nifty50)),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    }
  }

  const handleChartClick = (chartType) => {
    router.push(`/full-graph/${chartType}`)
  }

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ))
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (error) return <div className="flex items-center justify-center h-screen">Error: {error}</div>

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-white w-64 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static absolute z-30`}>
        <div className="flex items-center justify-center h-20 shadow-md">
          <Image src="/placeholder.svg" alt="Logo" width={40} height={40} />
          <h1 className="ml-2 text-2xl font-bold text-gray-800">FinDash</h1>
        </div>
        <ScrollArea className="flex-1">
          <nav className="mt-5">
            <a className="flex items-center mt-5 py-2 px-8 text-gray-600 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 transform" href="#">
              <Home className="w-5 h-5" />
              <span className="mx-4 font-medium">Home</span>
            </a>
            <a className="flex items-center mt-5 py-2 px-8 bg-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 transform" href="#">
              <BarChart className="w-5 h-5" />
              <span className="mx-4 font-medium">Dashboard</span>
            </a>
            <a className="flex items-center mt-5 py-2 px-8 text-gray-600 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 transform" href="#">
              <PieChart className="w-5 h-5" />
              <span className="mx-4 font-medium">Analytics</span>
            </a>
            <a className="flex items-center mt-5 py-2 px-8 text-gray-600 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 transform" href="#">
              <Settings className="w-5 h-5" />
              <span className="mx-4 font-medium">Settings</span>
            </a>
            <a className="flex items-center mt-5 py-2 px-8 text-gray-600 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 transform" href="#">
              <HelpCircle className="w-5 h-5" />
              <span className="mx-4 font-medium">Help</span>
            </a>
          </nav>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 ml-2">Financial Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  className="pl-8 pr-4 py-2 rounded-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {notifications.some(n => !n.read) && (
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="w-64">
                      <h3 className="font-semibold mb-2">Notifications</h3>
                      {notifications.map(notif => (
                        <div key={notif.id} className={`text-sm ${notif.read ? 'text-gray-500' : 'text-black font-semibold'}`}>
                          {notif.message}
                          {!notif.read && (
                            <Button variant="link" size="sm" onClick={() => markNotificationAsRead(notif.id)}>
                              Mark as read
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => router.push('/profile')}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">281</div>
                  <Progress value={33} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,300</div>
                  <Progress value={75} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">+10.1% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <Car

dContent>
                  <div className="text-2xl font-bold">$34,000</div>
                  <Progress value={80} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">+15.3% from last quarter</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Followers</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+91</div>
                  <Progress value={40} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">+2.5% from last week</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {oneDayReturnData && <Line data={oneDayReturnData} options={{ responsive: true, maintainAspectRatio: false }} />}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Doughnut data={{
                      labels: ['Stocks', 'Bonds', 'Real Estate', 'Commodities'],
                      datasets: [{
                        data: [40, 30, 20, 10],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
                        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                      }]
                    }} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>INV001</TableCell>
                      <TableCell>2023-06-01</TableCell>
                      <TableCell>$250.00</TableCell>
                      <TableCell><Badge>Completed</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>INV002</TableCell>
                      <TableCell>2023-06-02</TableCell>
                      <TableCell>$150.00</TableCell>
                      <TableCell><Badge variant="outline">Pending</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>INV003</TableCell>
                      <TableCell>2023-06-03</TableCell>
                      <TableCell>$350.00</TableCell>
                      <TableCell><Badge>Completed</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button onClick={runDriverScript} disabled={loading}>
                {loading ? 'Running...' : 'Run Driver Script'}
              </Button>
              <Button onClick={fetchGraphData}>Reload Graph Data</Button>
              <Button onClick={() => router.push('/percentage-graph')}>
                Go to Percentage Graph
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}