import { createClient } from './client'

export async function migrateLocalStorageToSupabase() {
  const supabase = createClient()
  
  try {
    console.log('[v0] Starting migration from localStorage to Supabase...')

    // Get current user to verify we're authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[v0] No authenticated user, skipping migration')
      return { success: false, message: 'No authenticated user' }
    }

    // Call migration API endpoint
    const response = await fetch('/api/admin/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    })

    if (!response.ok) {
      throw new Error('Migration API failed')
    }

    const result = await response.json()
    console.log('[v0] Migration completed:', result)
    
    // Mark migration as complete in localStorage
    localStorage.setItem('bakery-migration-complete', 'true')
    
    return { success: true, message: 'Migration completed' }
  } catch (error) {
    console.error('[v0] Migration error:', error)
    return { success: false, error: String(error) }
  }
}
