'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { mockStablecoinTransactions, stablecoinChartConfig } from '@/lib/data'

const COLORS = [
  'hsl(220, 70%, 50%)', // Blue for USDC
  'hsl(142, 70%, 45%)', // Green for USDT  
  'hsl(45, 85%, 55%)',  // Gold for DAI
  'hsl(270, 60%, 60%)', // Purple for FRAX
  'hsl(200, 70%, 55%)'  // Light Blue for others
]

export function SpendingChart() {
  // Create spending data from stablecoin transactions
  const spendTransactions = mockStablecoinTransactions.filter(tx => tx.type === 'spend')
  
  const spendingByStablecoin = spendTransactions.reduce((acc, tx) => {
    acc[tx.stablecoin] = (acc[tx.stablecoin] || 0) + Math.abs(tx.amount)
    return acc
  }, {} as Record<string, number>)

  const spendingData = Object.entries(spendingByStablecoin).map(([stablecoin, amount]) => ({
    category: stablecoin,
    amount
  }))

  const total = spendingData.reduce((sum, item) => sum + item.amount, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            ${data.amount} ({((data.amount / total) * 100).toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stablecoin Spending</CardTitle>
        <CardDescription>
          Your spending breakdown by stablecoin this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={spendingData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
                label={false}
              >
                {spendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Spending</span>
            <span className="font-medium">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stablecoins Used</span>
            <span className="font-medium">{spendingData.length}</span>
          </div>
          {spendingData.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No spending transactions found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}