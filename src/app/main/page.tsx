'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Line, Pie } from 'react-chartjs-2'
import { ChartData, ChartOptions, Chart as ChartJS } from 'chart.js'
import { ExternalLink } from 'lucide-react'
import 'chart.js/auto'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '/Users/prakhartripathi/portfolio-tracker/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  User,
  LogOut,
  BarChart2,
  PieChart,
  Edit2,
  Activity,
  RefreshCw,
  Camera,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import DynamicSVG from '/Users/prakhartripathi/portfolio-tracker/src/components/dynamic-svg'

interface UserProfile {
  username: string
  profilePicture: string | null
}

interface CalendarProps {
  transactions: Transaction[]
  onDateClick?: (date: string) => void
}

interface FinancialMetrics {
  investedAmount: number
  currentTotalReturns: number
  oneDayReturns: number
  totalPnL: number
  oneDayPnL: number
}

interface ChartToggleProps {
  activeChart: string
  setActiveChart: (chart: string) => void
}

interface SidebarItemProps {
  icon: React.ElementType
  label: string
  isActive: boolean
  onClick: () => void
}

interface MetricCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: string
}

interface ApiDataItem {
  label: string
  value: number
  sensex: string
  nifty50: string
}

interface Holding {
  name: string
  avg: string
  no_shares: string
  ticker: string | null
}

interface Transaction {
  id: number
  total_return_text: string
  one_day_return_text: string
  nifty50: string
  sensex: string
  date: string
  oldDate: string
}

const tradingHolidays = [
  '2024-01-22',
  '2024-01-26',
  '2024-03-08',
  '2024-03-25',
  '2024-03-29',
  '2024-04-11',
  '2024-04-17',
  '2024-05-01',
  '2024-05-20',
  '2024-06-17',
  '2024-07-17',
  '2024-08-15',
  '2024-10-02',
  '2024-11-01',
  '2024-11-15',
  '2024-12-25',
]

const ChartToggle: React.FC<ChartToggleProps> = ({ activeChart, setActiveChart }) => {
  return (
    <div className="flex bg-secondary rounded-full p-1 w-80 h-12">
      {['oneDayReturn', 'sensex', 'nifty50'].map((chart) => (
        <button
          key={chart}
          className={`flex-1 rounded-full text-sm font-medium transition-all duration-300 ${
            activeChart === chart
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveChart(chart)}
        >
          {chart === 'oneDayReturn' ? 'One Day Return' : chart === 'sensex' ? 'Sensex' : 'Nifty 50'}
        </button>
      ))}
    </div>
  )
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`}
    onClick={onClick}
  >
    <Icon className="h-15 w-15" />
    <span>{label}</span>
  </button>
)

interface CalendarProps {
  transactions: Transaction[]
  onDateClick?: (date: string) => void
}


const Calendar: React.FC<CalendarProps> = ({ transactions, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 8, 1)) // September 2024
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const isTransactionDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return transactions.some((t) => new Date(t.date).toDateString() === date.toDateString())
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

    if (onDateClick) {
      onDateClick(clickedDate.toLocaleDateString('en-CA')) // Adjusted date format
    }
  }

  const renderCalendarDays = () => {
    const days = []
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    // Render days of the week
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`dow-${i}`} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
          {daysOfWeek[i]}
        </div>
      )
    }

    // Render empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    // Render the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const hasTransaction = isTransactionDay(day)

      const circleColor = isWeekend ? 'bg-gray-200 dark:bg-gray-700' : hasTransaction ? 'bg-green-200 dark:bg-green-700' : 'bg-red-200 dark:bg-red-700'

      days.push(
        <div
          key={`day-${day}`}
          className="p-2 text-center text-sm relative cursor-pointer"
          onClick={() => handleDateClick(day)}
        >
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${circleColor}`}
          >
            {day}
          </span>
        </div>
      )
    }

    return days
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-1 text-gray-600 dark:text-gray-300">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={nextMonth} className="p-1 text-gray-600 dark:text-gray-300">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 border-t border-l dark:border-gray-700">{renderCalendarDays()}</div>
    </div>
  )
}

   


const TransactionsTab: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No token found. Please log in.')
      }

      const response = await fetch('http://localhost:3001/transactions', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data: Transaction[] = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError(
        `Failed to fetch transactions: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-CA') // Formats as 'YYYY-MM-DD'
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    const transactionToScroll = transactions.find((t) => formatDate(t.date) === date)
    if (transactionToScroll) {
      const transactionElement = document.getElementById(`transaction-${transactionToScroll.id}`)
      if (transactionElement) {
        transactionElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction({ ...transaction, oldDate: transaction.date });
    setIsEditDialogOpen(true);
  };
  
  
  
  const handleSave = async () => {
    if (editingTransaction) {
      if (!editingTransaction.oldDate) {
        console.error('Error: oldDate is missing in editingTransaction');
        return;
      }
  
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found. Please log in.');
        }
  
        const oldDate = editingTransaction.oldDate; // Get the old (original) date
        const newDate = editingTransaction.date; // Get the updated (new) date
  
        // Log dates for debugging purposes
        console.log('oldDate:', oldDate);
        console.log('newDate:', newDate);
  
        // Send the request to update the transaction's date
        const response = await fetch('http://localhost:3001/changedate', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldDate, // Pass the original date
            newDate, // Pass the updated date
          }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          console.log('Date updated successfully', data);
          // Handle success (e.g., update UI or show success message)
          window.location.reload();
        } else {
          console.error('Failed to update the transaction:', data.error);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };
  

  const renderReturnCell = (returnText: string) => {
    const isPositive = returnText.startsWith('+')
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    const Icon = isPositive ? ArrowUp : ArrowDown

    return (
      <TableCell className="px-4 py-4">
        <div className={`flex items-center ${color}`}>
          <Icon className="mr-1 h-3 w-3" />
          <span>{returnText}</span>
        </div>
      </TableCell>
    )
  }
  return (
    <div className="container mx-auto p-4">
      <Calendar transactions={transactions} onDateClick={handleDateClick} />
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Transaction History</h3>
            <Activity className="h-5 w-5 text-gray-400 dark:text-gray-300" />
          </div>
          <div ref={tableRef} className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead className="font-medium text-gray-500 dark:text-gray-400 px-4 py-4">Date</TableHead>
                <TableHead className="font-medium text-gray-500 dark:text-gray-400 px-4 py-4">Total Return</TableHead>
                <TableHead className="font-medium text-gray-500 dark:text-gray-400 px-4 py-4">One Day Return</TableHead>
                <TableHead className="font-medium text-gray-500 dark:text-gray-400 px-4 py-4">Nifty 50</TableHead>
                <TableHead className="font-medium text-gray-500 dark:text-gray-400 px-4 py-4">Sensex</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow
                  key={transaction.id}
                  id={`transaction-${transaction.id}`}
                  className={`${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                  } ${selectedDate === formatDate(transaction.date) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                >
                  <TableCell className="px-4 py-4 text-gray-700 dark:text-gray-300 text-center">
                    <div className="flex items-center justify-center">
                      <span>{formatDate(transaction.date)}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(transaction)}>
                        <Edit2 className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  {renderReturnCell(transaction.total_return_text)}
                  {renderReturnCell(transaction.one_day_return_text)}
                  <TableCell className="px-4 py-4 text-gray-700 dark:text-gray-300 text-center">
                    {transaction.nifty50}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-gray-700 dark:text-gray-300 text-center">
                    {transaction.sensex}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction Date</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="date" className="text-right">Date</label>
                <Input
                  id="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


export default function MainPage() {
  const [oneDayReturnData, setOneDayReturnData] = useState<ChartData<'line'> | null>(null)
  const [sensexData, setSensexData] = useState<ChartData<'line'> | null>(null)
  const [nifty50Data, setNifty50Data] = useState<ChartData<'line'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    investedAmount: 0,
    currentTotalReturns: 0,
    oneDayReturns: 0,
    totalPnL: 0,
    oneDayPnL: 0,
  })
  const [activeChart, setActiveChart] = useState('oneDayReturn')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [holdingsLoading, setHoldingsLoading] = useState(true)
  const [holdingsError, setHoldingsError] = useState<string | null>(null)
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [updatingGraph, setUpdatingGraph] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: '',
    profilePicture: null,
  })

  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const stockCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const chartRef = useRef<ChartJS<'pie'> | null>(null)

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUserProfile((prev: UserProfile) => ({ ...prev, profilePicture: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserProfile((prev: UserProfile) => ({ ...prev, username: event.target.value }))
  }
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token not found. Please log in.')
      }

      const response = await fetch('http://localhost:3001/api/data', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const jsonData: ApiDataItem[] = await response.json()

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error('Invalid data format received from API')
      }

      setOneDayReturnData(formatOneDayReturnData(jsonData))
      setSensexData(formatSensexData(jsonData))
      setNifty50Data(formatNifty50Data(jsonData))

      // For this example, we'll use placeholder data for financial metrics
      setFinancialMetrics({
        investedAmount: 100000,
        currentTotalReturns: 15000,
        oneDayReturns: 500,
        totalPnL: 15000,
        oneDayPnL: 500,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      setError(
        `Failed to fetch data: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHoldings = useCallback(async () => {
    setHoldingsLoading(true)
    setHoldingsError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token not found. Please log in.')
      }

      const response = await fetch('http://localhost:3001/api/holdings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const jsonData: Holding[] = await response.json()

      if (!Array.isArray(jsonData)) {
        throw new Error('Invalid data format received from API')
      }

      setHoldings(jsonData)
    } catch (error) {
      console.error('Error fetching holdings:', error)
      setHoldingsError(
        `Failed to fetch holdings: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setHoldingsLoading(false)
    }
  }, [])

  const updateGraphData = async () => {
    setUpdatingGraph(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token not found. Please log in.')
      }

      const response = await fetch('http://localhost:3001/run-script', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const result = await response.text()
      console.log(result)

      // After successful update, fetch the new data
      await fetchData()
    } catch (error) {
      console.error('Error updating graph data:', error)
      setError(
        `Failed to update graph data: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setUpdatingGraph(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchHoldings()
  }, [fetchData, fetchHoldings])

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
    setHoldings([])
    router.push('/login')
  }

  const formatOneDayReturnData = (jsonData: ApiDataItem[]): ChartData<'line'> => {
    return {
      labels: jsonData.map((item) => new Date(item.label).toLocaleDateString()),
      datasets: [
        {
          label: 'One Day Returns',
          data: jsonData.map((item) => item.value),
          backgroundColor: 'rgba(var(--chart-1) / 0.5)',
          borderColor: 'rgb(var(--chart-1))',
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    }
  }

  const formatSensexData = (jsonData: ApiDataItem[]): ChartData<'line'> => {
    return {
      labels: jsonData.map((item) => new Date(item.label).toLocaleDateString()),
      datasets: [
        {
          label: 'Sensex',
          data: jsonData.map((item) => parseFloat(item.sensex)),
          backgroundColor: 'rgba(var(--chart-2) / 0.5)',
          borderColor: 'rgb(var(--chart-2))',
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    }
  }

  const formatNifty50Data = (jsonData: ApiDataItem[]): ChartData<'line'> => {
    return {
      labels: jsonData.map((item) => new Date(item.label).toLocaleDateString()),
      datasets: [
        {
          label: 'Nifty 50',
          data: jsonData.map((item) => parseFloat(item.nifty50)),
          backgroundColor: 'rgba(var(--chart-3) / 0.5)',
          borderColor: 'rgb(var(--chart-3))',
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    }
  }

  const renderChart = (data: ChartData<'line'> | null, title: string) => {
    const isDarkTheme = theme === 'dark'
    const chartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' },
          ticks: { color: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' },
        },
        y: {
          grid: { color: isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' },
          ticks: { color: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' },
        },
      },
      plugins: {
        legend: { labels: { color: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' } },
      },
    }

    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {data ? (
              <Line
                data={{
                  ...data,
                  datasets: data.datasets.map((dataset) => ({
                    ...dataset,
                    borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                  })),
                }}
                options={chartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
  }

  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, ''))
  }

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color }) => (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="animate-pulse bg-muted h-8 w-24 rounded"></div>
          ) : (
            formatCurrency(value)
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderPieChart = () => {
    const totalInvested = holdings.reduce(
      (sum, stock) => sum + parseNumber(stock.avg) * parseInt(stock.no_shares),
      0
    )
    const data: ChartData<'pie'> = {
      labels: holdings.map((stock) => stock.name),
      datasets: [
        {
          data: holdings.map((stock) => parseNumber(stock.avg) * parseInt(stock.no_shares)),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(40, 159, 64, 0.8)',
            'rgba(210, 199, 199, 0.8)',
          ],
          borderColor: 'rgba(255, 255, 255, 1)',
          borderWidth: 1,
        },
      ],
    }

    const options: ChartOptions<'pie'> = {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
            font: {
              family: 'var(--font-sans)',
            },
            padding: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || ''
              const value = context.raw as number
              const percentage = ((value / totalInvested) * 100).toFixed(2)
              return `${label}: ${percentage}%`
            },
          },
        },
      },
    }

    const handleChartClick = (
      event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
      const chart = chartRef.current

      if (chart) {
        const nativeEvent = event.nativeEvent

        const elements = chart.getElementsAtEventForMode(
          nativeEvent,
          'nearest',
          { intersect: true },
          true
        )

        if (elements.length > 0) {
          const firstElement = elements[0]
          const index = firstElement.index

          const stockName = holdings[index].name
          setSelectedStock(stockName)
          const stockCard = stockCardRefs.current[stockName]
          if (stockCard) {
            stockCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[600px]">
            <Pie data={data} options={options} ref={chartRef} onClick={handleChartClick} />
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
              <MetricCard
                title="Invested Amount"
                value={financialMetrics.investedAmount}
                icon={Wallet}
                color="text-purple-400"
              />
              <MetricCard
                title="Current Total Returns"
                value={financialMetrics.currentTotalReturns}
                icon={TrendingUp}
                color="text-blue-400"
              />
              <MetricCard
                title="One Day Returns"
                value={financialMetrics.oneDayReturns}
                icon={Clock}
                color="text-green-400"
              />
              <MetricCard
                title="Total P&L"
                value={financialMetrics.totalPnL}
                icon={ArrowUpRight}
                color="text-pink-400"
              />
              <MetricCard
                title="One Day P&L"
                value={financialMetrics.oneDayPnL}
                icon={ArrowDownRight}
                color="text-yellow-400"
              />
            </div>

            <div className="flex justify-between items-center mb-8">
              <ChartToggle activeChart={activeChart} setActiveChart={setActiveChart} />
              <Button
                onClick={updateGraphData}
                disabled={updatingGraph}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${updatingGraph ? 'animate-spin' : ''}`} />
                <span>{updatingGraph ? 'Updating...' : 'Update Graph Data'}</span>
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-2 text-foreground">Loading data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                <p>{error}</p>
                <Button onClick={fetchData} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                {activeChart === 'oneDayReturn' && renderChart(oneDayReturnData, 'One Day Returns Chart')}
                {activeChart === 'sensex' && renderChart(sensexData, 'Sensex Chart')}
                {activeChart === 'nifty50' && renderChart(nifty50Data, 'Nifty 50 Chart')}
              </div>
            )}
          </>
        )
      case 'portfolio':
        if (holdingsLoading) {
          return (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-2 text-foreground">Loading holdings data...</p>
            </div>
          )
        }

        if (holdingsError) {
          return (
            <div className="text-center py-10 text-destructive">
              <p>{holdingsError}</p>
              <Button onClick={fetchHoldings} className="mt-4">
                Retry
              </Button>
            </div>
          )
        }

        const generateTradingViewLink = (ticker: string | null) => {
          if (!ticker) return '#'
          let exchange = ''
          if (ticker.endsWith('.NS')) {
            exchange = 'NSE'
          } else if (ticker.endsWith('.BO')) {
            exchange = 'BSE'
          }
          const stockSymbol = ticker.split('.')[0]
          return `https://in.tradingview.com/chart/8Wkb1EQn/?symbol=${exchange}%3A${stockSymbol}`
        }

        const totalInvested = holdings.reduce(
          (sum, stock) => sum + parseNumber(stock.avg) * parseInt(stock.no_shares),
          0
        )
        return (
          <div className="flex flex-col lg:flex-row space-y-8 lg:space-y-0 lg:space-x-8">
            <div className="w-full lg:w-1/2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Invested</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(totalInvested)}</p>
                </CardContent>
              </Card>
              {holdings.map((stock, index) => {
                const investedAmount = parseNumber(stock.avg) * parseInt(stock.no_shares)
                const percentage = ((investedAmount / totalInvested) * 100).toFixed(2)
                const tradingViewLink = generateTradingViewLink(stock.ticker)

                return (
                  <Card
                    key={index}
                    ref={(el) => {
                      stockCardRefs.current[stock.name] = el
                    }}
                    className={`transition-all duration-500 ${
                      selectedStock === stock.name
                        ? 'bg-primary/10 shadow-lg shadow-primary/50'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <a
                          href={tradingViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold transition-all duration-300 hover:text-primary group"
                        >
                          {stock.name}
                          <ExternalLink className="inline-block ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </a>
                        <span className="text-sm font-normal text-muted-foreground">
                          {percentage}%
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Invested Amount</p>
                          <p className="text-lg font-semibold">{formatCurrency(investedAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Average Price</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(parseNumber(stock.avg))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="text-lg font-semibold">{stock.no_shares}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <div className="w-full lg:w-1/2">{renderPieChart()}</div>
          </div>
        )

      case 'profile':
        return (
          <div className="max-w-md mx-auto font-sans">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    {userProfile.profilePicture ? (
                      <img
                        src={userProfile.profilePicture}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <Label
                      htmlFor="profile-picture"
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </Label>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                  </div>
                </div>
                <div className="space-y-5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={userProfile.username}
                    onChange={handleUsernameChange}
                    placeholder="Enter your username"
                  />
                </div>
                <div className="space-y-5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" disabled />
                </div>
                <Button className="w-full">Save Changes</Button>
              </CardContent>
            </Card>
          </div>
        )
      case 'transactions':
        return <TransactionsTab />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 bg-card p-6 border-r border-border">
        <nav className="space-y-2">
          <Button
            onClick={() => setActiveTab('dashboard')}
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            onClick={() => setActiveTab('portfolio')}
            variant={activeTab === 'portfolio' ? 'default' : 'ghost'}
          >
            <PieChart className="mr-2 h-4 w-4" />
            Portfolio
          </Button>
          <Button
            onClick={() => setActiveTab('transactions')}
            variant={activeTab === 'transactions' ? 'default' : 'ghost'}
          >
            <Activity className="mr-2 h-4 w-4" />
            Transactions
          </Button>
          <Button
            onClick={() => setActiveTab('profile')}
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'transactions' && 'Transaction History'}
            {activeTab === 'profile' && 'User Profile'}
          </h2>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="bg-background hover:bg-muted"
            >
              <DynamicSVG>
                {theme === 'dark' ? (
                  <circle cx="12" cy="12" r="5" />
                ) : (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                )}
              </DynamicSVG>
              <span className="sr-only">Toggle theme</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-background hover:bg-muted">
                  {userProfile.profilePicture ? (
                    <img
                      src={userProfile.profilePicture}
                      alt="Profile"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  )
}
