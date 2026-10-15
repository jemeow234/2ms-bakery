import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ProductCategory } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash / InstaPay',
  card: 'Card',
}

export function formatPaymentMethod(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method
}

export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'without_palaman', label: 'Without Palaman' },
  { id: 'with_palaman', label: 'With Palaman' },
]

export function formatCategory(category: string): string {
  return PRODUCT_CATEGORIES.find(c => c.id === category)?.label ?? category
}
