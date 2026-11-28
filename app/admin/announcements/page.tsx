'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/auth-context'
import { useStore } from '@/context/store-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, X, Save, Megaphone, Loader2, ImagePlus, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import type { Announcement } from '@/lib/types'
import { announcementStatus, type AnnouncementStatus } from '@/lib/announcements'
import { cn } from '@/lib/utils'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

// Quick picks that set the end date relative to the start date.
const DURATIONS = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
]

// <input type="date"> works in local yyyy-mm-dd strings.
function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(dateInput: string, days: number) {
  const d = new Date(`${dateInput}T00:00:00`)
  d.setDate(d.getDate() + days - 1)
  return toDateInput(d)
}

const startOfDay = (dateInput: string) => new Date(`${dateInput}T00:00:00`)
const endOfDay = (dateInput: string) => new Date(`${dateInput}T23:59:59.999`)

const STATUS_STYLES: Record<AnnouncementStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
}

function formatWindow(a: Announcement) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return a.endsAt ? `${fmt(a.startsAt)} – ${fmt(a.endsAt)}` : `From ${fmt(a.startsAt)}, no end date`
}

const emptyForm = () => ({
  title: '',
  message: '',
  startDate: toDateInput(new Date()),
  endDate: addDays(toDateInput(new Date()), 7),
  noEndDate: false,
})

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const { refreshAnnouncements } = useStore()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/login')
    }
  }, [user, router])

  // The store only holds what customers can see right now; admins also
  // need scheduled and expired announcements.
  useEffect(() => {
    if (user?.role !== 'admin') return
    const loadAnnouncements = async () => {
      try {
        const res = await fetch('/api/admin/announcements')
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error)
        setAnnouncements(data.announcements || [])
      } catch (error) {
        console.error('[announcements] Failed to load:', error)
        toast.error("Couldn't load announcements.")
      } finally {
        setIsLoading(false)
      }
    }
    loadAnnouncements()
  }, [user?.role])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      e.target.value = ''
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be smaller than 5MB')
      e.target.value = ''
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForm = () => {
    setFormData(emptyForm())
    clearImage()
    setShowForm(false)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error || 'Image upload failed')
      return null
    }
    return data.url
  }

  const handleAddAnnouncement = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required')
      return
    }
    if (!formData.startDate) {
      toast.error('Please choose a start date')
      return
    }
    if (!formData.noEndDate && !formData.endDate) {
      toast.error('Please choose an end date, or tick "No end date"')
      return
    }
    if (!formData.noEndDate && formData.endDate < formData.startDate) {
      toast.error('The end date must be on or after the start date')
      return
    }

    setIsSaving(true)
    try {
      let image: string | undefined
      if (imageFile) {
        const url = await uploadImage(imageFile)
        if (!url) return
        image = url
      }

      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          image,
          startsAt: startOfDay(formData.startDate).toISOString(),
          endsAt: formData.noEndDate ? undefined : endOfDay(formData.endDate).toISOString(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Failed to post announcement. Please try again.')
        return
      }

      setAnnouncements(prev => [data.announcement, ...prev])
      void refreshAnnouncements()
      toast.success(
        announcementStatus(data.announcement) === 'scheduled'
          ? 'Announcement scheduled!'
          : 'Announcement posted!'
      )
      resetForm()
    } catch (error) {
      console.error('[announcements] Failed to post:', error)
      toast.error('Failed to post announcement. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return

    const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' }).catch(() => null)
    if (!res?.ok) {
      toast.error('Failed to delete announcement. Please try again.')
      return
    }
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    void refreshAnnouncements()
    toast.success('Announcement deleted')
  }

  const counts = announcements.reduce(
    (acc, a) => ({ ...acc, [announcementStatus(a)]: acc[announcementStatus(a)] + 1 }),
    { active: 0, scheduled: 0, expired: 0 } as Record<AnnouncementStatus, number>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">Announcements</h1>
        <p className="text-muted-foreground mt-1">Post announcements to customers and choose when they show</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Active Now</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{counts.active}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Scheduled</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{counts.scheduled}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Expired</p>
          <p className="text-3xl font-bold text-muted-foreground mt-2">{counts.expired}</p>
        </div>
      </div>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Post New Announcement
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Post New Announcement</h2>
            <button
              aria-label="Close form"
              onClick={resetForm}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement title"
                maxLength={200}
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
                maxLength={5000}
                className="w-full px-3 py-2 border border-border rounded-lg bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none mt-2"
                rows={5}
              />
            </div>

            {/* Photo */}
            <div>
              <Label htmlFor="announcement-image">Photo (optional)</Label>
              <div className="flex items-start gap-4 mt-2">
                <div className="w-32 h-20 rounded-lg border border-border bg-secondary overflow-hidden shrink-0">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    id="announcement-image"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="bg-secondary"
                  />
                  <p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 5MB.</p>
                  {imagePreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearImage} className="text-muted-foreground">
                      <X className="h-3 w-3 mr-1" />
                      Remove photo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Active window */}
            <fieldset className="rounded-lg border border-border p-4 space-y-3">
              <legend className="px-1 text-sm font-medium flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                When is it active?
              </legend>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="start-date">Start date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-2 bg-secondary"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.noEndDate ? '' : formData.endDate}
                    min={formData.startDate}
                    disabled={formData.noEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-2 bg-secondary"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Quick duration">
                {DURATIONS.map(d => {
                  const end = formData.startDate ? addDays(formData.startDate, d.days) : ''
                  const selected = !formData.noEndDate && end === formData.endDate
                  return (
                    <button
                      key={d.days}
                      type="button"
                      disabled={!formData.startDate}
                      onClick={() => setFormData(prev => ({ ...prev, endDate: end, noEndDate: false }))}
                      className={cn(
                        'px-3 py-1 rounded-full border text-xs font-medium transition-colors',
                        selected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      )}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={formData.noEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, noEndDate: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                No end date (show until I delete it)
              </label>
            </fieldset>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleAddAnnouncement} disabled={isSaving} className="bg-primary hover:bg-primary/90 flex-1">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isSaving && imageFile ? 'Uploading...' : 'Post Announcement'}
              </Button>
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No announcements posted yet</p>
          </div>
        ) : (
          announcements.map((announcement) => {
            const status = STATUS_STYLES[announcementStatus(announcement)]
            return (
              <div
                key={announcement.id}
                className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={cn('px-3 py-1 rounded-full text-xs font-medium', status.className)}>
                        {status.label}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatWindow(announcement)}
                      </span>
                    </div>
                    {announcement.image && (
                      // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image of unknown size
                      <img
                        src={announcement.image}
                        alt=""
                        className="w-full max-w-md h-40 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-foreground text-lg mb-2">{announcement.title}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap mb-3">{announcement.message}</p>
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
            )
          })
        )}
      </div>
    </div>
  )
}
