'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { useStore } from '@/context/store-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Edit2, Trash2, Plus, X, Save, MessageSquare, Megaphone } from 'lucide-react'
import { toast } from 'sonner'
import { Announcement } from '@/lib/types'

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const { announcements, addAnnouncement, deleteAnnouncement } = useStore()
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement' as 'announcement' | 'advertisement',
  })

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/admin-login')
    }
  }, [user, router])

  const handleAddAnnouncement = () => {
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required')
      return
    }

    addAnnouncement({
      title: formData.title,
      message: formData.message,
      type: formData.type,
      createdBy: user?.name || 'Admin',
    })

    toast.success(`${formData.type === 'announcement' ? 'Announcement' : 'Advertisement'} posted successfully!`)
    setFormData({ title: '', message: '', type: 'announcement' })
    setShowForm(false)
  }

  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncement(id)
      toast.success('Announcement deleted successfully')
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="font-serif text-2xl font-bold text-foreground">Announcements & Ads</h1>
            <p className="text-sm text-muted-foreground mt-1">Post announcements and advertisements to users</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Post New Button */}
          <div className="mb-6">
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post New Announcement
              </Button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Post New Announcement
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {(['announcement', 'advertisement'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                        className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-medium ${
                          formData.type === t
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {t === 'announcement' ? (
                          <>
                            <MessageSquare className="h-4 w-4" />
                            Announcement
                          </>
                        ) : (
                          <>
                            <Megaphone className="h-4 w-4" />
                            Advertisement
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Write your announcement message here..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none mt-2"
                    rows={5}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAddAnnouncement}
                    className="bg-primary hover:bg-primary/90 flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Post Announcement
                  </Button>
                  <Button
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Announcements List */}
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No announcements posted yet</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          announcement.type === 'announcement'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {announcement.type === 'announcement' ? '📢 Announcement' : '🎉 Advertisement'}
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground text-lg mb-2">
                        {announcement.title}
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap mb-3">
                        {announcement.message}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-muted-foreground">
                        <span>Posted by {announcement.createdBy}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(announcement.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Posted</p>
              <p className="text-3xl font-bold text-primary mt-2">{announcements.length}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Announcements</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {announcements.filter(a => a.type === 'announcement').length}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Advertisements</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {announcements.filter(a => a.type === 'advertisement').length}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
