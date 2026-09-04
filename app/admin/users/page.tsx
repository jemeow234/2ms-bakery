'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Edit2, Trash2, Plus, X, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { RegisteredUser } from '@/lib/types'

export default function UserManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/admin-login')
      return
    }

    // Load registered users. localStorage isn't available during SSR, so this
    // must happen in an effect rather than during render.
    const registeredUsers = localStorage.getItem('bakery-registered-users')
    if (registeredUsers) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers(JSON.parse(registeredUsers))
    }
  }, [user, router])

  const handleEditUser = (userData: RegisteredUser) => {
    setEditingUser(userData)
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      address: userData.address || '',
      password: userData.password || '',
    })
    setShowAddForm(false)
  }

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updated = users.filter(u => u.id !== userId)
      setUsers(updated)
      localStorage.setItem('bakery-registered-users', JSON.stringify(updated))
      toast.success('User deleted successfully')
    }
  }

  const handleSaveUser = () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required')
      return
    }

    if (editingUser) {
      const updated = users.map(u =>
        u.id === editingUser.id
          ? { ...u, ...formData }
          : u
      )
      setUsers(updated)
      localStorage.setItem('bakery-registered-users', JSON.stringify(updated))
      toast.success('User updated successfully')
    } else {
      if (!formData.password) {
        toast.error('Password is required for new users')
        return
      }
      const newUser: RegisteredUser = {
        id: Date.now().toString(),
        ...formData,
        role: 'user',
      }
      const updated = [...users, newUser]
      setUsers(updated)
      localStorage.setItem('bakery-registered-users', JSON.stringify(updated))
      toast.success('User added successfully')
    }

    setEditingUser(null)
    setShowAddForm(false)
    setFormData({ name: '', email: '', phone: '', address: '', password: '' })
  }

  const handleCancel = () => {
    setEditingUser(null)
    setShowAddForm(false)
    setFormData({ name: '', email: '', phone: '', address: '', password: '' })
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="font-serif text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and edit user profiles</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Add User Button */}
          <div className="mb-6">
            {!editingUser && !showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            )}
          </div>

          {/* Add/Edit Form */}
          {(editingUser || showAddForm) && (
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold text-foreground">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main St, City, State"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password {editingUser && '(leave blank to keep current)'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveUser}
                    className="bg-primary hover:bg-primary/90 flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save User
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Email</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Phone</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Address</th>
                    <th className="px-6 py-3 text-left font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((userData) => (
                      <tr key={userData.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{userData.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{userData.email}</td>
                        <td className="px-6 py-4 text-muted-foreground">{userData.phone || '-'}</td>
                        <td className="px-6 py-4 text-muted-foreground text-sm truncate max-w-xs">{userData.address || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditUser(userData)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteUser(userData.id)}
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold text-primary mt-2">{users.length}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
