'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/context/store-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Download,
  Printer,
  Clock,
  X,
  Trophy,
  TrendingDown,
  Layers,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatCategory } from '@/lib/utils'
import { shortOrderNumber } from '@/lib/orders'
import type { InventoryLog } from '@/lib/types'

// Categorical slots 1-5 of the dataviz reference palette, in fixed order
// (validated for color-vision deficiency on a white surface). Everything past
// the top five folds into a neutral "Other".
const SERIES_COLORS = ['#257de0', '#f47230', '#00b894', '#f2a600', '#ee7fac']
const OTHER_COLOR = '#b4b4b4'
const TOP_SERIES = SERIES_COLORS.length
const LOW_STOCK = 10

// create_order() notes each sale "Order #<order id>".
const orderIdFromNote = (note?: string) => note?.match(/^Order #([0-9a-f-]{36})$/i)?.[1]

// Bucket labels use a newline between weekday and date.
const oneLine = (label: string) => label.replace(/\n/g, ' ')

type FilterPeriod = 'daily' | 'weekly' | 'monthly'

const HISTORY_PAGE_SIZE = 100

// yyyy-mm-dd in local time, for <input type="date">.
const toDateInputValue = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const formatShortDate = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' })

// Sunday 00:00 of the week containing d, matching the Sun–Sat chart.
const startOfWeek = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())

const formatWeekRange = (d: Date) => {
  const start = startOfWeek(d)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
  return `${formatShortDate(start)} – ${formatShortDate(end)}, ${end.getFullYear()}`
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

export default function ReportsPage() {
  const { adminOrders: orders, products, inventoryLogs } = useStore()
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('daily')
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [historySearch, setHistorySearch] = useState('')
  const [hourFilter, setHourFilter] = useState<number | null>(null)
  const [historyLimit, setHistoryLimit] = useState(HISTORY_PAGE_SIZE)

  const resetHistoryView = () => {
    setHourFilter(null)
    setHistoryLimit(HISTORY_PAGE_SIZE)
  }

  const stats = useMemo(() => {
    let startDate = new Date()
    let endDate = new Date()

    if (filterPeriod === 'daily') {
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0)
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999)
    } else if (filterPeriod === 'weekly') {
      startDate = startOfWeek(selectedWeek)
      endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59, 999)
    } else {
      // Monthly - use selected month
      startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1, 0, 0, 0, 0)
      endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt)
      return orderDate >= startDate && orderDate <= endDate
    })

    const totalRevenue = filteredOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0)

    const totalOrders = filteredOrders.length
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

    // Category breakdown
    // order_items only snapshot id/name/price, not category — look it up from
    // the live product list instead of trusting item.product.category.
    const categoryById = new Map(products.map(p => [p.id, p.category]))
    const categoryRevenue: Record<string, number> = {}
    filteredOrders
      .filter(o => o.status === 'completed')
      .forEach(order => {
        order.items.forEach(item => {
          const cat = categoryById.get(item.product.id) || 'other'
          categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.product.price * item.quantity
        })
      })

    // Daily/Weekly/Monthly sales
    const salesData: Record<string, number> = {}
    
    if (filterPeriod === 'daily') {
      // Hourly breakdown
      for (let i = 0; i < 24; i++) {
        const hour = `${i.toString().padStart(2, '0')}:00`
        salesData[hour] = 0
      }
      filteredOrders
        .filter(o => o.status === 'completed')
        .forEach(order => {
          const date = new Date(order.createdAt)
          const hour = `${date.getHours().toString().padStart(2, '0')}:00`
          salesData[hour] = (salesData[hour] || 0) + order.total
        })
    } else if (filterPeriod === 'weekly') {
      // Daily breakdown for the selected week, labelled with weekday and date.
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dayLabels = weekDays.map((day, i) => {
        const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
        return `${day}\n${formatShortDate(date)}`
      })
      dayLabels.forEach(label => {
        salesData[label] = 0
      })
      filteredOrders
        .filter(o => o.status === 'completed')
        .forEach(order => {
          const label = dayLabels[new Date(order.createdAt).getDay()]
          salesData[label] = (salesData[label] || 0) + order.total
        })
    } else {
      // Daily breakdown for this month
      const daysInMonth = endDate.getDate()
      for (let i = 1; i <= daysInMonth; i++) {
        const day = `Day ${i}`
        salesData[day] = 0
      }
      filteredOrders
        .filter(o => o.status === 'completed')
        .forEach(order => {
          const date = new Date(order.createdAt)
          const dayNum = date.getDate()
          const day = `Day ${dayNum}`
          salesData[day] = (salesData[day] || 0) + order.total
        })
    }

    const inventoryValue = products.reduce(
      (sum, p) => sum + p.price * p.stock,
      0
    )

    // One row per item sold, newest first.
    const salesHistory = filteredOrders
      .filter(o => o.status === 'completed')
      .flatMap(order =>
        order.items.map((item, index) => ({
          key: `${order.id}-${index}`,
          createdAt: order.createdAt,
          hour: new Date(order.createdAt).getHours(),
          orderNo: shortOrderNumber(order.id),
          customerName: order.customerName,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          lineTotal: item.product.price * item.quantity,
          paymentMethod: order.paymentMethod,
          deliveryType: order.deliveryType,
        }))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      cancelledOrders,
      averageOrderValue,
      categoryRevenue,
      salesData,
      inventoryValue,
      salesHistory,
      rangeStart: startDate.getTime(),
      rangeEnd: endDate.getTime(),
      bucketLabels: Object.keys(salesData),
    }
  }, [orders, products, filterPeriod, selectedMonth, selectedDate, selectedWeek])

  // Stock-out ("sale") records from the inventory log for the selected period,
  // tagged with their range so a slow response can't fill in a newer period.
  const { rangeStart, rangeEnd } = stats
  const rangeKey = `${rangeStart}-${rangeEnd}`
  const [saleLogs, setSaleLogs] = useState<{ key: string; logs: InventoryLog[] } | null>(null)
  const [saleLogsError, setSaleLogsError] = useState<{ key: string; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    const key = `${rangeStart}-${rangeEnd}`
    const params = new URLSearchParams({
      from: new Date(rangeStart).toISOString(),
      to: new Date(rangeEnd).toISOString(),
      type: 'sale',
    })
    const loadSaleLogs = async () => {
      try {
        const res = await fetch(`/api/admin/inventory?${params}`)
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error)
        if (!cancelled) setSaleLogs({ key, logs: data.logs || [] })
      } catch (error) {
        console.error('[reports] Failed to load stock records:', error)
        if (!cancelled) setSaleLogsError({ key, message: "Couldn't load the stock records for this period." })
      }
    }
    loadSaleLogs()
    return () => {
      cancelled = true
    }
  }, [rangeStart, rangeEnd])

  const stockError = saleLogsError?.key === rangeKey ? saleLogsError.message : null

  const productPerformance = useMemo(() => {
    if (!saleLogs || saleLogs.key !== rangeKey) return null

    // A cancelled order's stock went back on the shelf, so it didn't sell.
    const cancelledOrderIds = new Set(orders.filter(o => o.status === 'cancelled').map(o => o.id))
    const sales = saleLogs.logs.filter(log => {
      const orderId = orderIdFromNote(log.note)
      return !orderId || !cancelledOrderIds.has(orderId)
    })
    const keyOf = (log: InventoryLog) => log.productId || `name:${log.productName}`

    const byProduct = new Map<string, { id: string; name: string; quantity: number }>()
    // Every product on the menu is ranked, including ones that sold nothing.
    for (const p of products) byProduct.set(p.id, { id: p.id, name: p.name, quantity: 0 })
    for (const log of sales) {
      const id = keyOf(log)
      const entry = byProduct.get(id) ?? { id, name: log.productName, quantity: 0 }
      entry.quantity += log.quantity
      byProduct.set(id, entry)
    }

    const ranked = [...byProduct.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
    const totalSold = ranked.reduce((sum, p) => sum + p.quantity, 0)
    const stockById = new Map(products.map(p => [p.id, p.stock]))
    const onMenu = ranked.filter(p => stockById.has(p.id))

    const top = ranked.filter(p => p.quantity > 0).slice(0, TOP_SERIES)
    const least = [...onMenu].sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name)).slice(0, 5)
    const bestSeller = top[0] ?? null

    // Stacked columns: the period's top five products, the rest as "Other".
    const series = top
    const seriesIndex = new Map(series.map((p, i) => [p.id, i]))
    const buckets = stats.bucketLabels.map(label => ({
      label,
      values: new Array<number>(series.length + 1).fill(0),
      total: 0,
    }))
    for (const log of sales) {
      const date = new Date(log.createdAt)
      const index =
        filterPeriod === 'daily' ? date.getHours() : filterPeriod === 'weekly' ? date.getDay() : date.getDate() - 1
      const bucket = buckets[index]
      if (!bucket) continue
      const slot = seriesIndex.get(keyOf(log)) ?? series.length
      bucket.values[slot] += log.quantity
      bucket.total += log.quantity
    }
    const otherTotal = totalSold - series.reduce((sum, p) => sum + p.quantity, 0)

    return {
      totalSold,
      top,
      least,
      bestSeller,
      bestSellerStock: bestSeller ? stockById.get(bestSeller.id) : undefined,
      unsold: onMenu.filter(p => p.quantity === 0),
      series,
      otherTotal,
      buckets,
      maxBucket: Math.max(1, ...buckets.map(b => b.total)),
    }
  }, [saleLogs, rangeKey, orders, products, stats.bucketLabels, filterPeriod])

  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null)
  const periodPhrase =
    filterPeriod === 'daily' ? 'on this day' : filterPeriod === 'weekly' ? 'this week' : 'this month'
  const seriesColor = (slot: number) =>
    productPerformance && slot < productPerformance.series.length ? SERIES_COLORS[slot] : OTHER_COLOR
  const seriesName = (slot: number) =>
    productPerformance && slot < productPerformance.series.length ? productPerformance.series[slot].name : 'Other'


  const visibleHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase()
    return stats.salesHistory.filter(
      row =>
        (hourFilter === null || row.hour === hourFilter) &&
        (!query || row.productName.toLowerCase().includes(query))
    )
  }, [stats.salesHistory, historySearch, hourFilter])

  const visibleHistoryTotals = useMemo(
    () => ({
      quantity: visibleHistory.reduce((sum, row) => sum + row.quantity, 0),
      revenue: visibleHistory.reduce((sum, row) => sum + row.lineTotal, 0),
    }),
    [visibleHistory]
  )

  const formatCurrency = (value: number) => `₱${value.toFixed(2)}`

  const handleExport = () => {
    const csv = generateCSV()
    const element = document.createElement('a')
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`)
    element.setAttribute('download', `report-${filterPeriod}-${new Date().toISOString().split('T')[0]}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handlePrint = () => {
    window.print()
  }

  const generateCSV = () => {
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Revenue', formatCurrency(stats.totalRevenue)],
      ['Total Orders', stats.totalOrders],
      ['Completed Orders', stats.completedOrders],
      ['Cancelled Orders', stats.cancelledOrders],
      ['Average Order Value', formatCurrency(stats.averageOrderValue)],
      ['Inventory Value', formatCurrency(stats.inventoryValue)],
      [''],
      ['Best Sellers (stock records)', ''],
      ...(productPerformance?.top ?? []).map(p => [p.name, `${p.quantity} sold`]),
      [''],
      ['Least Selling (stock records)', ''],
      ...(productPerformance?.least ?? []).map(p => [p.name, `${p.quantity} sold`]),
      [''],
      ['Sales History', ''],
      ['Order #', 'Product', 'Qty', 'Unit Price', 'Total', 'Payment', 'Type', 'Customer'],
      ...stats.salesHistory.map(row => [
        row.orderNo,
        row.productName,
        row.quantity,
        formatCurrency(row.unitPrice),
        formatCurrency(row.lineTotal),
        row.paymentMethod,
        row.deliveryType,
        row.customerName,
      ]),
    ]

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border bg-card -mx-8 -mt-8 mb-2">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:flex-wrap gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Insights into your bakery performance</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Filter Period */}
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground self-center">Filter By:</p>
              {(['daily', 'weekly', 'monthly'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => {
                    setFilterPeriod(period)
                    resetHistoryView()
                  }}
                  className={`px-4 py-2 rounded-lg transition-all capitalize font-medium text-sm ${
                    filterPeriod === period
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Date Selector for Daily View */}
            {filterPeriod === 'daily' && (
              <div className="flex gap-2 items-center flex-wrap">
                <p className="text-sm font-medium text-foreground">Select Date:</p>
                <input
                  type="date"
                  value={toDateInputValue(selectedDate)}
                  max={toDateInputValue(new Date())}
                  onChange={(e) => {
                    if (!e.target.value) return
                    const [year, month, day] = e.target.value.split('-')
                    setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)))
                    resetHistoryView()
                  }}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-foreground"
                />
              </div>
            )}

            {/* Week Selector for Weekly View */}
            {filterPeriod === 'weekly' && (
              <div className="flex gap-2 items-center flex-wrap">
                <p className="text-sm font-medium text-foreground">Select Week:</p>
                <input
                  type="date"
                  value={toDateInputValue(selectedWeek)}
                  max={toDateInputValue(new Date())}
                  onChange={(e) => {
                    if (!e.target.value) return
                    const [year, month, day] = e.target.value.split('-')
                    setSelectedWeek(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)))
                    resetHistoryView()
                  }}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-foreground"
                />
                <p className="text-sm text-muted-foreground">{formatWeekRange(selectedWeek)}</p>
              </div>
            )}

            {/* Month Selector for Monthly View */}
            {filterPeriod === 'monthly' && (
              <div className="flex gap-2 items-center flex-wrap">
                <p className="text-sm font-medium text-foreground">Select Month:</p>
                <input
                  type="month"
                  value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    if (!e.target.value) return
                    const [year, month] = e.target.value.split('-')
                    setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1))
                    resetHistoryView()
                  }}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-foreground"
                />
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {stats.completedOrders} completed orders
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Average Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.averageOrderValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per completed order</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.cancelledOrders} cancelled
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  Inventory Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.inventoryValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{products.length} products</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Best & least selling, from the stock records */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Best &amp; Least Selling
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  From the stock-out records in the inventory log. Cancelled orders don&apos;t count.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {stockError ? (
                  <p className="text-destructive text-sm text-center py-8">{stockError}</p>
                ) : !productPerformance ? (
                  <p className="text-muted-foreground text-center py-8">Loading stock records...</p>
                ) : (
                  <>
                    {productPerformance.bestSeller ? (
                      <div className="rounded-lg bg-primary/10 p-4 flex gap-3" role="note">
                        <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div className="text-sm text-foreground space-y-1">
                          <p>
                            <span className="font-semibold">Best seller: {productPerformance.bestSeller.name}.</span>{' '}
                            {productPerformance.bestSeller.quantity} pcs sold {periodPhrase},{' '}
                            {Math.round((productPerformance.bestSeller.quantity / productPerformance.totalSold) * 100)}% of
                            the {productPerformance.totalSold} pcs that left the shelf.
                          </p>
                          {productPerformance.bestSellerStock !== undefined && (
                            <p className="text-muted-foreground">
                              {productPerformance.bestSellerStock <= LOW_STOCK
                                ? `Only ${productPerformance.bestSellerStock} left in stock. Consider baking more.`
                                : `${productPerformance.bestSellerStock} left in stock.`}
                            </p>
                          )}
                          {productPerformance.unsold.length > 0 && (
                            <p className="text-muted-foreground">
                              {productPerformance.unsold.length === 1
                                ? `${productPerformance.unsold[0].name} didn't sell ${periodPhrase}.`
                                : `${productPerformance.unsold.length} products didn't sell ${periodPhrase}.`}{' '}
                              Consider a promo or baking fewer.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No sales recorded {periodPhrase}</p>
                    )}

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-3">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Top sellers
                        </h3>
                        {productPerformance.top.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No sales yet</p>
                        ) : (
                          <ol className="space-y-2">
                            {productPerformance.top.map((p, index) => (
                              <li key={p.id} className="flex items-center gap-3 text-sm">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {index + 1}
                                </span>
                                <span className="flex-1 truncate text-foreground">{p.name}</span>
                                <span className="text-muted-foreground tabular-nums">{p.quantity} pcs</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-3">
                          <TrendingDown className="h-4 w-4 text-destructive" />
                          Least selling
                        </h3>
                        {productPerformance.least.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No products on the menu</p>
                        ) : (
                          <ol className="space-y-2">
                            {productPerformance.least.map(p => (
                              <li key={p.id} className="flex items-center gap-3 text-sm">
                                <span className="flex-1 truncate text-foreground">{p.name}</span>
                                {p.quantity === 0 ? (
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                                    No sales
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground tabular-nums">{p.quantity} pcs</span>
                                )}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Revenue by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.categoryRevenue).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sales data yet</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(stats.categoryRevenue)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, revenue]) => {
                        const percentage =
                          stats.totalRevenue > 0 ? (revenue / stats.totalRevenue) * 100 : 0
                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-foreground">
                                {formatCategory(category)}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                {formatCurrency(revenue)} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* What sells most: pieces per product, stacked per hour/day */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                What Sells Most
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Pieces sold per {filterPeriod === 'daily' ? 'hour' : 'day'}, split by product.
              </p>
            </CardHeader>
            <CardContent>
              {stockError ? (
                <p className="text-destructive text-sm text-center py-8">{stockError}</p>
              ) : !productPerformance ? (
                <p className="text-muted-foreground text-center py-8">Loading stock records...</p>
              ) : productPerformance.totalSold === 0 ? (
                <p className="text-muted-foreground text-center py-8">No sales recorded {periodPhrase}</p>
              ) : (
                <>
                  {/* Legend: the identity channel, with each product's total */}
                  <ul className="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-sm" aria-label="Legend">
                    {[...productPerformance.series.keys(), ...(productPerformance.otherTotal > 0 ? [productPerformance.series.length] : [])].map(slot => (
                      <li key={slot} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm shrink-0" style={{ background: seriesColor(slot) }} aria-hidden="true" />
                        <span className="text-foreground">{seriesName(slot)}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {slot < productPerformance.series.length
                            ? productPerformance.series[slot].quantity
                            : productPerformance.otherTotal}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Breakdown of the hovered/focused column; sits outside the scroll area so it never clips */}
                  <div className="min-h-[2.75rem] mb-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs" aria-live="polite">
                    {hoveredBucket !== null && productPerformance.buckets[hoveredBucket]?.total > 0 ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="font-semibold text-foreground">
                          {oneLine(productPerformance.buckets[hoveredBucket].label)} ·{' '}
                          {productPerformance.buckets[hoveredBucket].total} pcs
                        </span>
                        {productPerformance.buckets[hoveredBucket].values.map((value, slot) =>
                          value > 0 ? (
                            <span key={slot} className="flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: seriesColor(slot) }} aria-hidden="true" />
                              <span className="text-foreground">{seriesName(slot)}</span>
                              <span className="text-muted-foreground tabular-nums">{value}</span>
                            </span>
                          ) : null
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Hover over a column (or tab to it) to see what sold.</span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex items-end gap-1 min-w-max px-2 pt-2 pb-2">
                      {productPerformance.buckets.map((bucket, index) => {
                        const height = (bucket.total / productPerformance.maxBucket) * 100
                        const segments = bucket.values
                          .map((value, slot) => ({ value, slot }))
                          .filter(segment => segment.value > 0)
                        return (
                          <div
                            key={bucket.label}
                            tabIndex={bucket.total > 0 ? 0 : -1}
                            onMouseEnter={() => setHoveredBucket(index)}
                            onMouseLeave={() => setHoveredBucket(null)}
                            onFocus={() => setHoveredBucket(index)}
                            onBlur={() => setHoveredBucket(null)}
                            aria-label={`${oneLine(bucket.label)}: ${bucket.total} pcs`}
                            className="relative flex-1 min-w-12 flex flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                          >
                            <div className="h-48 w-full flex flex-col items-center justify-end border-b border-border">
                              {bucket.total > 0 && (
                                <span className="text-xs text-muted-foreground mb-1 tabular-nums">{bucket.total}</span>
                              )}
                              {/* Slot 1 sits on the baseline; 2px surface gaps between segments */}
                              <div
                                className="w-full max-w-6 flex flex-col-reverse gap-[2px] rounded-t overflow-hidden"
                                style={{ height: `${height}%` }}
                              >
                                {segments.map(segment => (
                                  <div
                                    key={segment.slot}
                                    style={{
                                      flexGrow: segment.value,
                                      flexBasis: 0,
                                      minHeight: 2,
                                      background: seriesColor(segment.slot),
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="mt-2 text-xs text-muted-foreground text-center whitespace-pre-line">
                              {bucket.label}
                            </span>

                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show as table</summary>
                    <table className="w-full mt-2">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Product</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Pieces sold</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...productPerformance.series.keys(), ...(productPerformance.otherTotal > 0 ? [productPerformance.series.length] : [])].map(slot => {
                          const quantity =
                            slot < productPerformance.series.length
                              ? productPerformance.series[slot].quantity
                              : productPerformance.otherTotal
                          return (
                            <tr key={slot} className="border-b border-border last:border-0">
                              <td className="py-2 px-3 text-foreground">{seriesName(slot)}</td>
                              <td className="py-2 px-3 text-right tabular-nums">{quantity}</td>
                              <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                                {Math.round((quantity / productPerformance.totalSold) * 100)}%
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </details>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sales Chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {filterPeriod === 'daily'
                  ? 'Hourly Sales'
                  : filterPeriod === 'weekly'
                  ? `Daily Sales (${formatWeekRange(selectedWeek)})`
                  : 'Daily Sales (This Month)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="h-64 flex items-end justify-between gap-1 min-w-max p-4">
                  {Object.entries(stats.salesData).map(([label, amount]) => {
                    const maxSale = Math.max(...Object.values(stats.salesData), 1)
                    const height = (amount / maxSale) * 100
                    // In the daily view an hour bar narrows the sales history to that hour.
                    const hour = filterPeriod === 'daily' ? parseInt(label, 10) : null
                    const clickable = hour !== null && amount > 0
                    const dimmed = hourFilter !== null && hour !== hourFilter
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={!clickable}
                        onClick={() => {
                          setHourFilter(hourFilter === hour ? null : hour)
                          setHistoryLimit(HISTORY_PAGE_SIZE)
                        }}
                        title={clickable ? `Show sales at ${label}` : undefined}
                        className={`flex-1 flex flex-col items-center gap-2 min-w-12 ${
                          clickable ? 'cursor-pointer' : 'cursor-default'
                        } ${dimmed ? 'opacity-40' : ''}`}
                      >
                        <div className="w-full flex flex-col items-center justify-end h-48">
                          {amount > 0 && (
                            <span className="text-xs text-muted-foreground mb-1">
                              {formatCurrency(amount)}
                            </span>
                          )}
                          <div
                            className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:bg-primary/80"
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground text-center whitespace-pre-line">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              {filterPeriod === 'daily' && (
                <p className="text-xs text-muted-foreground px-4">
                  Click an hour to see exactly what sold then.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sales History */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Sales History
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {hourFilter !== null && (
                    <button
                      type="button"
                      onClick={() => setHourFilter(null)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                    >
                      {`${hourFilter.toString().padStart(2, '0')}:00 – ${hourFilter.toString().padStart(2, '0')}:59`}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <Input
                    value={historySearch}
                    onChange={e => {
                      setHistorySearch(e.target.value)
                      setHistoryLimit(HISTORY_PAGE_SIZE)
                    }}
                    placeholder="Search product..."
                    className="w-full sm:w-56"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {visibleHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No sales in this period</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {filterPeriod === 'weekly' && (
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                          )}
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order #</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Qty</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Unit Price</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleHistory.slice(0, historyLimit).map(row => (
                          <tr key={row.key} className="border-b border-border last:border-0">
                            {filterPeriod === 'weekly' && (
                              <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                {formatDate(row.createdAt)}
                              </td>
                            )}
                            <td className="py-3 px-4 font-mono text-xs text-muted-foreground">#{row.orderNo}</td>
                            <td className="py-3 px-4 text-foreground font-medium">{row.productName}</td>
                            <td className="py-3 px-4 text-right text-foreground">{row.quantity}</td>
                            <td className="py-3 px-4 text-right text-muted-foreground">
                              {formatCurrency(row.unitPrice)}
                            </td>
                            <td className="py-3 px-4 text-right text-foreground font-medium">
                              {formatCurrency(row.lineTotal)}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground uppercase text-xs">{row.paymentMethod}</td>
                            <td className="py-3 px-4 text-muted-foreground">{row.customerName || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border">
                          <td colSpan={filterPeriod === 'weekly' ? 3 : 2} className="py-3 px-4 font-medium text-foreground">
                            {visibleHistory.length} line{visibleHistory.length === 1 ? '' : 's'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            {visibleHistoryTotals.quantity}
                          </td>
                          <td />
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            {formatCurrency(visibleHistoryTotals.revenue)}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {visibleHistory.length > historyLimit && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setHistoryLimit(limit => limit + HISTORY_PAGE_SIZE)}
                      >
                        Show more ({visibleHistory.length - historyLimit} left)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Inventory Activity */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Recent Inventory Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No inventory changes yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Change</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryLogs.slice(0, 10).map(log => (
                        <tr key={log.id} className="border-b border-border last:border-0">
                          <td className="py-3 px-4 text-foreground">{log.productName}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                log.type === 'add'
                                  ? 'bg-green-500/10 text-green-600'
                                  : log.type === 'sale'
                                  ? 'bg-blue-500/10 text-blue-600'
                                  : log.type === 'remove'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-orange-500/10 text-orange-600'
                              }`}
                            >
                              {log.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {log.previousStock} → {log.newStock}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-sm">
                            {formatDateTime(log.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
