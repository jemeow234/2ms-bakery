'use client'

import { useStore } from '@/context/store-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { products, orders, inventoryLogs } = useStore()

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const lowStockProducts = products.filter(p => p.stock <= 5)
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt).toDateString()
    return orderDate === new Date().toDateString()
  })

  const stats = [
    {
      title: 'Total Revenue',
      value: `₱${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500/10 text-green-600',
      change: '+12% from last month',
    },
    {
      title: 'Total Orders',
      value: orders.length.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-500/10 text-blue-600',
      change: `${todayOrders.length} today`,
    },
    {
      title: 'Products',
      value: products.length.toString(),
      icon: Package,
      color: 'bg-primary/10 text-primary',
      change: `${lowStockProducts.length} low stock`,
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.toString(),
      icon: TrendingUp,
      color: 'bg-orange-500/10 text-orange-600',
      change: 'Requires attention',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your bakery overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          <Card key={stat.title} className="border-border hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground">All products are well stocked!</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.slice(0, 5).map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product.stock === 0
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-orange-500/10 text-orange-600'
                    }`}>
                      {product.stock} left
                    </span>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <Link
                    href="/admin/inventory"
                    className="block text-center text-primary hover:underline text-sm"
                  >
                    View all {lowStockProducts.length} items
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">₱{order.total.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'completed'
                          ? 'bg-green-500/10 text-green-600'
                          : order.status === 'pending'
                          ? 'bg-orange-500/10 text-orange-600'
                          : order.status === 'processing'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length > 5 && (
                  <Link
                    href="/admin/orders"
                    className="block text-center text-primary hover:underline text-sm"
                  >
                    View all orders
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Inventory Activity */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Inventory Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryLogs.length === 0 ? (
            <p className="text-muted-foreground">No inventory changes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Stock Change</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLogs.slice(0, 10).map(log => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 text-foreground">{log.productName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.type === 'add'
                            ? 'bg-green-500/10 text-green-600'
                            : log.type === 'sale'
                            ? 'bg-blue-500/10 text-blue-600'
                            : log.type === 'remove'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-orange-500/10 text-orange-600'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground">{log.quantity}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {log.previousStock} → {log.newStock}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        {new Date(log.createdAt).toLocaleString()}
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
