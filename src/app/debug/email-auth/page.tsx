'use client'

import { EmailAuthMonitor } from '@/components/auth/EmailAuthMonitor'

export default function EmailAuthDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Authentication Debugging
          </h1>
          <p className="text-gray-600">
            Monitor and debug email authentication issues for Alchemy Account Kit integration
          </p>
        </div>

        <EmailAuthMonitor />
      </div>
    </div>
  )
}