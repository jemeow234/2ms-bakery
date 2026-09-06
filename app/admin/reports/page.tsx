'use client'

import { useMemo, useState } from 'react'
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
} from 'lucide-react'

type FilterPeriod = 'daily' | 'weekly' | 'monthly'

export default function ReportsPage() {
  const { adminOrders: orders, products, inventoryLogs } = useStore()
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('daily')
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())

  const stats = useMemo(() => {
    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()

    if (filterPeriod === 'daily') {
      startDate.setDate(now.getDate())
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
    } else if (filterPeriod === 'weekly') {
      startDate.setDate(now.getDate() - now.getDay())
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)
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

    // Best selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    filteredOrders
      .filter(o => o.status === 'completed')
      .forEach(order => {
        order.items.forEach(item => {
          if (!productSales[item.product.id]) {
            productSales[item.product.id] = {
              name: item.product.name,
              quantity: 0,
              revenue: 0,
            }
          }
          productSales[item.product.id].quantity += item.quantity
          productSales[item.product.id].revenue += item.product.price * item.quantity
        })
      })

    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

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
      // Daily breakdown for this week
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      weekDays.forEach(day => {
        salesData[day] = 0
      })
      filteredOrders
        .filter(o => o.status === 'completed')
        .forEach(order => {
          const date = new Date(order.createdAt)
          const dayName = weekDays[date.getDay()]
          salesData[dayName] = (salesData[dayName] || 0) + order.total
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

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      cancelledOrders,
      averageOrderValue,
      bestSellers,
      categoryRevenue,
      salesData,
      inventoryValue,
    }
  }, [orders, products, filterPeriod, selectedMonth])

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
      ['Best Sellers', ''],
      ...stats.bestSellers.map(p => [p.name, `${p.quantity} sold - ${formatCurrency(p.revenue)}`]),
    ]

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
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
                  onClick={() => setFilterPeriod(period)}
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

            {/* Month Selector for Monthly View */}
            {filterPeriod === 'monthly' && (
              <div className="flex gap-2 items-center flex-wrap">
                <p className="text-sm font-medium text-foreground">Select Month:</p>
                <input
                  type="month"
                  value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-')
                    setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1))
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
            {/* Best Sellers */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Best Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.bestSellers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No sales data yet</p>
                ) : (
                  <div className="space-y-4">
                    {stats.bestSellers.map((product, index) => (
                      <div key={product.name} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.quantity} sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {formatCurrency(product.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                              <span className="font-medium text-foreground capitalize">
                                {category}
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

          {/* Sales Chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {filterPeriod === 'daily'
                  ? 'Hourly Sales'
                  : filterPeriod === 'weekly'
                  ? 'Daily Sales (This Week)'
                  : 'Daily Sales (This Month)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="h-64 flex items-end justify-between gap-1 min-w-max p-4">
                  {Object.entries(stats.salesData).map(([label, amount]) => {
                    const maxSale = Math.max(...Object.values(stats.salesData), 1)
                    const height = (amount / maxSale) * 100
                    return (
                      <div key={label} className="flex-1 flex flex-col items-center gap-2 min-w-12">
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
                        <span className="text-xs text-muted-foreground text-center">{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
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
                            {new Date(log.createdAt).toLocaleDateString()}
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
