'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit2, Trash2, X, Save, Loader2, Users as UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    role: 'user' as User['role'],
  })

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || [])
        } else {
          toast.error('Failed to load users')
        }
      } catch (error) {
        console.error('Failed to load users:', error)
        toast.error('Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }
    loadUsers()
  }, [])

  const handleEditUser = (userData: User) => {
    setEditingUser(userData)
    setFormData({
      name: userData.name,
      phone: userData.phone || '',
      address: userData.address || '',
      role: userData.role,
    })
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? Their account can still sign back in — this only removes their profile record.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        toast.success('User deleted successfully')
      } else {
        toast.error('Failed to delete user. Please try again.')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('Failed to delete user. Please try again.')
    }
  }

  const handleSaveUser = async () => {
    if (!editingUser || !formData.name) {
      toast.error('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          role: formData.role,
        }),
      })

      if (!res.ok) {
        toast.error('Failed to update user. Please try again.')
        return
      }

      const data = await res.json()
      setUsers(prev => prev.map(u => u.id === editingUser.id ? data.user : u))
      toast.success('User updated successfully')
      setEditingUser(null)
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error('Failed to update user. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingUser(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">View and manage registered users</p>
      </div>

      {/* Edit Form */}
      {editingUser && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              Edit User
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
                  value={editingUser.email}
                  disabled
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
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: User['role']) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveUser}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 flex-1"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
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
                <th className="px-6 py-3 text-left font-semibold text-foreground">Role</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((userData) => (
                  <tr key={userData.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{userData.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{userData.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">{userData.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={
                        userData.role === 'admin'
                          ? 'px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary'
                          : 'px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground'
                      }>
                        {userData.role}
                      </span>
                    </td>
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
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-3xl font-bold text-primary mt-2">{users.length}</p>
        </div>
      </div>
    </div>
  )
}
