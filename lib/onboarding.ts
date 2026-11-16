// First-visit onboarding tour for new customers. The tour UI lives in
// components/onboarding-tour.tsx; elements it points at carry a
// `data-tour="<target>"` attribute.

export interface TourStep {
  id: string
  title: string
  body: string
  /** `data-tour` value to spotlight. Without one (or when it's hidden) the card is centered. */
  target?: string
  /** Only look for the target inside this selector, e.g. the main menu. */
  scope?: string
  /** Shown instead of `body` when signed in. */
  signedInBody?: string
  /** Only spotlight the target when signed in (the element exists only then). */
  signedInOnly?: boolean
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: "Welcome to 2M's Bakery!",
    body: "New here? This quick tour shows you how to order fresh breads in about a minute. Use Next to continue, or Skip anytime.",
  },
  {
    id: 'menu',
    title: '1. Browse the menu',
    body: 'All our breads are listed here. Use the category tabs to filter, and tap a product to see its details and ingredients.',
    target: 'menu',
  },
  {
    id: 'add-to-cart',
    title: '2. Add to cart',
    body: 'Tap this button to add a bread to your cart. Products with sizes or flavors open a "Choose Option" window first.',
    target: 'add-to-cart',
    scope: '#products',
  },
  {
    id: 'cart',
    title: '3. Your cart',
    body: 'The bag shows how many items you have. Tap it when you are ready to check out.',
    target: 'cart',
  },
  {
    id: 'account',
    title: '4. Create your account',
    body: 'You need an account to order. Tap here, choose "Create Account", and fill in your details. When you sign in, we email you a 6-digit code (check your Spam folder too).',
    signedInBody: 'You are signed in. Open your profile to save your phone number and delivery address so checkout fills them in for you.',
    target: 'account',
  },
  {
    id: 'checkout',
    title: '5. Check out',
    body: 'At checkout, choose Pick-up (no minimum) or Delivery (at least 2 items and ₱100, within 1 km, in one-hour time slots). Pay with Cash, or with GCash/InstaPay by scanning our QR and uploading a screenshot of your payment (up to 5 MB).',
  },
  {
    id: 'orders',
    title: '6. Track your orders',
    body: 'After you sign in, the My Orders icon appears here. Use it to follow your order status, cancel an order while it is still Pending, and leave feedback.',
    signedInBody: 'Open My Orders to follow your order status, cancel an order while it is still Pending, and leave feedback.',
    target: 'orders',
    signedInOnly: true,
  },
  {
    id: 'done',
    title: "You're all set!",
    body: 'Questions? Check our FAQs or send us a message in the Contact section. You can replay this tour from the "Take the tour" link at the bottom of the page.',
  },
]

const STORAGE_KEY = '2ms-onboarding-done-v1'
export const START_TOUR_EVENT = '2ms:start-tour'
export const TOUR_QUERY_PARAM = 'tour'

export function hasSeenTour(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Storage blocked (private mode, etc.): don't pester on every visit.
    return true
  }
}

export function markTourSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Nothing to do; the tour simply may show again.
  }
}

export function startTour(): void {
  window.dispatchEvent(new CustomEvent(START_TOUR_EVENT))
}
