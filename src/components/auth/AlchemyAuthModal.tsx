'use client'

import { useAuthModal, useSignerStatus, useUser } from '@account-kit/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AlchemyAuthModalProps {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string
}

export function AlchemyAuthModal({ isOpen, onClose, redirectTo = '/dashboard' }: AlchemyAuthModalProps) {
  const { openAuthModal } = useAuthModal()
  const { isConnected } = useSignerStatus()
  const user = useUser()
  const router = useRouter()

  // Open the modal when isOpen becomes true
  useEffect(() => {
    if (isOpen) {
      openAuthModal()
    }
  }, [isOpen, openAuthModal])

  // Handle successful authentication
  useEffect(() => {
    if (isConnected && user) {
      onClose()
      router.push(redirectTo)
    }
  }, [isConnected, user, onClose, router, redirectTo])

  return null // The modal is rendered by Account Kit itself
}