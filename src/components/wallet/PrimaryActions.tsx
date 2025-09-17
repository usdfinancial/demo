'use client'

import { Plus, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PrimaryActionsProps {
  onDeposit?: () => void
  onWithdraw?: () => void
}

export function PrimaryActions({ onDeposit, onWithdraw }: PrimaryActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button 
        onClick={onDeposit}
        className="h-16 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
      >
        <Plus className="h-6 w-6 mr-3" />
        Add Money
      </Button>
      
      <Button 
        onClick={onWithdraw}
        variant="outline"
        className="h-16 text-lg font-semibold border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
      >
        <ArrowUpRight className="h-6 w-6 mr-3" />
        Send Money
      </Button>
    </div>
  )
}