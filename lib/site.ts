// The public address of the site, used for absolute links in metadata, the
// sitemap and robots.txt. Set NEXT_PUBLIC_SITE_URL per deployment.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const SITE_NAME = "2M's Bakery"

export const SITE_DESCRIPTION =
  'Freshly baked Filipino breads from Lipa City, Batangas — pandesal, ensaymada, Spanish bread, ube treats and more, for delivery or pick-up.'
