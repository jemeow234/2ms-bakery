'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useStore } from '@/context/store-context'
import { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Plus,
  Pencil,
  Package,
  AlertTriangle,
  ArrowUpDown,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function InventoryPage() {
  const { products, updateProduct, addProduct, updateStock, inventoryLogs } = useStore()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name')
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'bread' as Product['category'],
    stock: '',
    featured: false,
  })

  const [stockUpdate, setStockUpdate] = useState({
    type: 'add' as 'add' | 'remove' | 'adjustment',
    quantity: '',
    note: '',
  })

  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }))
  }

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
      const matchesStock =
        filterStock === 'all' ||
        (filterStock === 'low' && product.stock > 0 && product.stock <= 5) ||
        (filterStock === 'out' && product.stock === 0)
      return matchesSearch && matchesStock
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'stock':
          return a.stock - b.stock
        case 'price':
          return a.price - b.price
        default:
          return 0
      }
    })

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      toast.error('Please fill all required fields')
      return
    }

    const success = await addProduct({
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      stock: parseInt(newProduct.stock),
      featured: newProduct.featured,
      image: '/images/placeholder.jpg',
    })

    if (!success) {
      toast.error('Failed to add product. Please try again.')
      return
    }

    setNewProduct({
      name: '',
      description: '',
      price: '',
      category: 'bread',
      stock: '',
      featured: false,
    })
    setIsAddDialogOpen(false)
    toast.success('Product added successfully')
  }

  const handleEditProduct = async () => {
    if (!selectedProduct) return
    const success = await updateProduct(selectedProduct)
    if (!success) {
      toast.error('Failed to update product. Please try again.')
      return
    }
    setIsEditDialogOpen(false)
    toast.success('Product updated successfully')
  }

  const handleStockUpdate = async () => {
    if (!selectedProduct || !stockUpdate.quantity) {
      toast.error('Please enter a quantity')
      return
    }

    const success = await updateStock(
      selectedProduct.id,
      parseInt(stockUpdate.quantity),
      stockUpdate.type,
      stockUpdate.note
    )

    if (!success) {
      toast.error('Failed to update stock. Please try again.')
      return
    }

    setStockUpdate({ type: 'add', quantity: '', note: '' })
    setIsStockDialogOpen(false)
    toast.success('Stock updated successfully')
  }

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Manage your products and stock levels</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={newProduct.name}
                  onChange={e => setNewProduct(s => ({ ...s, name: e.target.value }))}
                  className="mt-2 bg-secondary"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={e => setNewProduct(s => ({ ...s, description: e.target.value }))}
                  className="mt-2 bg-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={e => setNewProduct(s => ({ ...s, price: e.target.value }))}
                    className="mt-2 bg-secondary"
                  />
                </div>
                <div>
                  <Label>Stock *</Label>
                  <Input
                    type="number"
                    value={newProduct.stock}
                    onChange={e => setNewProduct(s => ({ ...s, stock: e.target.value }))}
                    className="mt-2 bg-secondary"
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value: Product['category']) =>
                    setNewProduct(s => ({ ...s, category: value }))
                  }
                >
                  <SelectTrigger className="mt-2 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bread">Bread</SelectItem>
                    <SelectItem value="pastry">Pastry</SelectItem>
                    <SelectItem value="cake">Cake</SelectItem>
                    <SelectItem value="cookie">Cookie</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={newProduct.featured}
                  onChange={e => setNewProduct(s => ({ ...s, featured: e.target.checked }))}
                  className="rounded border-border"
                />
                <Label htmlFor="featured">Featured Product</Label>
              </div>
              <Button onClick={handleAddProduct} className="w-full bg-primary text-primary-foreground">
                Add Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{products.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={filterStock} onValueChange={(value: 'all' | 'low' | 'out') => setFilterStock(value)}>
          <SelectTrigger className="w-[150px] bg-card border-border">
            <SelectValue placeholder="Filter by stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: 'name' | 'stock' | 'price') => setSortBy(value)}>
          <SelectTrigger className="w-[150px] bg-card border-border">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="stock">Stock Level</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Stock</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary relative flex-shrink-0">
                        {imageErrors[product.id] ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            onError={() => handleImageError(product.id)}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        {product.featured && (
                          <span className="text-xs text-primary">Featured</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="capitalize text-muted-foreground">{product.category}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-foreground">₱{product.price.toFixed(2)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-foreground">{product.stock}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        product.stock === 0
                          ? 'bg-destructive/10 text-destructive'
                          : product.stock <= 5
                          ? 'bg-orange-500/10 text-orange-600'
                          : 'bg-green-500/10 text-green-600'
                      )}
                    >
                      {product.stock === 0 ? 'Out of Stock' : product.stock <= 5 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product)
                          setIsStockDialogOpen(true)
                        }}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Stock
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Stock Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryLogs.length === 0 ? (
            <p className="text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {inventoryLogs.slice(0, 5).map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{log.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.type === 'add' && `Added ${log.quantity} units`}
                      {log.type === 'remove' && `Removed ${log.quantity} units`}
                      {log.type === 'sale' && `Sold ${log.quantity} units`}
                      {log.type === 'adjustment' && `Adjusted to ${log.newStock} units`}
                      {log.note && ` - ${log.note}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {log.previousStock} → {log.newStock}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={selectedProduct.name}
                  onChange={e =>
                    setSelectedProduct({ ...selectedProduct, name: e.target.value })
                  }
                  className="mt-2 bg-secondary"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={selectedProduct.description}
                  onChange={e =>
                    setSelectedProduct({ ...selectedProduct, description: e.target.value })
                  }
                  className="mt-2 bg-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedProduct.price}
                    onChange={e =>
                      setSelectedProduct({
                        ...selectedProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-2 bg-secondary"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={selectedProduct.category}
                    onValueChange={(value: Product['category']) =>
                      setSelectedProduct({ ...selectedProduct, category: value })
                    }
                  >
                    <SelectTrigger className="mt-2 bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bread">Bread</SelectItem>
                      <SelectItem value="pastry">Pastry</SelectItem>
                      <SelectItem value="cake">Cake</SelectItem>
                      <SelectItem value="cookie">Cookie</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-featured"
                  checked={selectedProduct.featured}
                  onChange={e =>
                    setSelectedProduct({ ...selectedProduct, featured: e.target.checked })
                  }
                  className="rounded border-border"
                />
                <Label htmlFor="edit-featured">Featured Product</Label>
              </div>
              <Button onClick={handleEditProduct} className="w-full bg-primary text-primary-foreground">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Update Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Update Stock - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold text-foreground">{selectedProduct?.stock} units</p>
            </div>
            <div>
              <Label>Update Type</Label>
              <Select
                value={stockUpdate.type}
                onValueChange={(value: 'add' | 'remove' | 'adjustment') =>
                  setStockUpdate(s => ({ ...s, type: value }))
                }
              >
                <SelectTrigger className="mt-2 bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="remove">Remove Stock</SelectItem>
                  <SelectItem value="adjustment">Set Exact Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {stockUpdate.type === 'adjustment' ? 'New Stock Amount' : 'Quantity'}
              </Label>
              <Input
                type="number"
                value={stockUpdate.quantity}
                onChange={e => setStockUpdate(s => ({ ...s, quantity: e.target.value }))}
                placeholder="Enter quantity"
                className="mt-2 bg-secondary"
              />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input
                value={stockUpdate.note}
                onChange={e => setStockUpdate(s => ({ ...s, note: e.target.value }))}
                placeholder="e.g., New shipment arrived"
                className="mt-2 bg-secondary"
              />
            </div>
            <Button onClick={handleStockUpdate} className="w-full bg-primary text-primary-foreground">
              Update Stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
