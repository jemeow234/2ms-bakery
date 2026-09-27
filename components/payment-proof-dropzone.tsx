'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ImageUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PAYMENT_PROOF_MAX_BYTES } from '@/lib/payment'

interface PaymentProofDropzoneProps {
  file: File | null
  onChange: (file: File | null) => void
}

export function PaymentProofDropzone({ file, onChange }: PaymentProofDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) return
    if (!candidate.type.startsWith('image/')) {
      toast.error('Please upload an image of your payment screenshot.')
      return
    }
    if (candidate.size > PAYMENT_PROOF_MAX_BYTES) {
      toast.error('Screenshot must be smaller than 5MB.')
      return
    }
    onChange(candidate)
  }

  const clear = () => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (file && previewUrl) {
    return (
      <div className="relative rounded-xl border-2 border-primary bg-primary/5 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
        <img
          src={previewUrl}
          alt="Your payment screenshot"
          className="mx-auto max-h-64 rounded-lg object-contain"
        />
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          <span className="truncate text-foreground">{file.name}</span>
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={e => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setIsDragging(false)
        acceptFile(e.dataTransfer.files[0])
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-all',
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
      )}
    >
      <ImageUp className="h-8 w-8 text-primary" />
      <p className="font-medium text-foreground">Drop your payment screenshot here</p>
      <p className="text-sm text-muted-foreground">or tap to choose a photo (max 5MB)</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => acceptFile(e.target.files?.[0])}
      />
    </div>
  )
}
