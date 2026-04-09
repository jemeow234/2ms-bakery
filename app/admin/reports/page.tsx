'use client'

import { useMemo } from 'react'
import { useStore } from '@/context/store-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
} from 'lucide-react'

export default function ReportsPage() {
  const { orders, products, inventoryLogs } = useStore()

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0)

    const totalOrders = orders.length
    const completedOrders = orders.filter(o => o.status === 'completed').length
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

    // Best selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
    orders
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
    const categoryRevenue: Record<string, number> = {}
    orders
      .filter(o => o.status === 'completed')
      .forEach(order => {
        order.items.forEach(item => {
          const cat = item.product.category
          categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.product.price * item.quantity
        })
      })

    // Daily sales for last 7 days
    const dailySales: Record<string, number> = {}
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toDateString()
    }).reverse()

    last7Days.forEach(date => {
      dailySales[date] = 0
    })

    orders
      .filter(o => o.status === 'completed')
      .forEach(order => {
        const orderDate = new Date(order.createdAt).toDateString()
        if (dailySales[orderDate] !== undefined) {
          dailySales[orderDate] += order.total
        }
      })

    // Inventory value
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
      dailySales,
      inventoryValue,
    }
  }, [orders, products])

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights into your bakery performance</p>
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
                          <span className="text-muted-foreground">
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

      {/* Daily Sales Chart */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Daily Sales (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {Object.entries(stats.dailySales).map(([date, amount]) => {
              const maxSale = Math.max(...Object.values(stats.dailySales), 1)
              const height = (amount / maxSale) * 100
              const day = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-48">
                    <span className="text-xs text-muted-foreground mb-1">
                      {formatCurrency(amount)}
                    </span>
                    <div
                      className="w-full bg-primary rounded-t-lg transition-all duration-500 hover:bg-primary/80"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Change
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Date
                    </th>
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
  )
}
