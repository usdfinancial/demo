'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  Zap,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { multiChainBalanceService } from '@/lib/services/balanceService'
import { networkErrorHandler } from '@/lib/services/errorHandling'

interface NetworkHealthData {
  [network: string]: {
    successRate: string
    totalRequests: number
    failedRequests: number
    lastSuccessTime: number
    timeSinceLastSuccess: number | null
    circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    recentErrors: number
    isHealthy: boolean
  }
}

interface NetworkHealthMonitorProps {
  refreshInterval?: number
  showDetailedStats?: boolean
}

export function NetworkHealthMonitor({ 
  refreshInterval = 30000, 
  showDetailedStats = false 
}: NetworkHealthMonitorProps) {
  const [healthData, setHealthData] = useState<NetworkHealthData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealthData = async () => {
    setIsLoading(true)
    try {
      const health = multiChainBalanceService.getNetworkHealth()
      setHealthData(health)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch network health:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
  }, [])

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchHealthData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getHealthIcon = (isHealthy: boolean, circuitBreakerState: string) => {
    if (circuitBreakerState === 'OPEN') {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
    if (circuitBreakerState === 'HALF_OPEN') {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
    return isHealthy ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <AlertTriangle className="w-4 h-4 text-yellow-500" />
  }

  const getHealthBadge = (isHealthy: boolean, circuitBreakerState: string) => {
    if (circuitBreakerState === 'OPEN') {
      return <Badge className="bg-red-100 text-red-800">Circuit Open</Badge>
    }
    if (circuitBreakerState === 'HALF_OPEN') {
      return <Badge className="bg-yellow-100 text-yellow-800">Testing</Badge>
    }
    return isHealthy ? 
      <Badge className="bg-green-100 text-green-800">Healthy</Badge> : 
      <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>
  }

  const formatTimeSince = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  const resetCircuitBreaker = async (network: string) => {
    try {
      multiChainBalanceService.resetCircuitBreaker(network as any)
      await fetchHealthData()
    } catch (error) {
      console.error('Failed to reset circuit breaker:', error)
    }
  }

  const resetStats = async (network?: string) => {
    try {
      multiChainBalanceService.resetNetworkStats(network as any)
      await fetchHealthData()
    } catch (error) {
      console.error('Failed to reset stats:', error)
    }
  }

  const healthyCount = Object.values(healthData).filter(h => h.isHealthy).length
  const totalCount = Object.keys(healthData).length
  const overallHealth = totalCount > 0 ? (healthyCount / totalCount * 100).toFixed(1) : '100'

  return (
    <div className="space-y-6">
      {/* Overall Health Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Network Health Overview</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealthData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-700">{overallHealth}%</span>
              </div>
              <p className="text-sm text-blue-600">Overall Health</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-700">{healthyCount}</span>
              </div>
              <p className="text-sm text-green-600">Healthy Networks</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="flex items-center justify-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-700">{totalCount - healthyCount}</span>
              </div>
              <p className="text-sm text-red-600">Unhealthy Networks</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                </span>
              </div>
              <p className="text-xs text-gray-600">Last Updated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Network Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(healthData).map(([network, data]) => (
          <Card key={network} className={`border-l-4 ${
            data.circuitBreakerState === 'OPEN' ? 'border-l-red-500' :
            data.circuitBreakerState === 'HALF_OPEN' ? 'border-l-yellow-500' :
            data.isHealthy ? 'border-l-green-500' : 'border-l-yellow-500'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getHealthIcon(data.isHealthy, data.circuitBreakerState)}
                  <h3 className="font-semibold">{network}</h3>
                </div>
                {getHealthBadge(data.isHealthy, data.circuitBreakerState)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Success Rate */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <div className="flex items-center space-x-2">
                    {parseFloat(data.successRate) >= 95 ? 
                      <TrendingUp className="w-4 h-4 text-green-500" /> :
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    }
                    <span className="font-medium">{data.successRate}</span>
                  </div>
                </div>

                {/* Request Stats */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="font-medium">{data.totalRequests}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Failed Requests</span>
                  <span className={`font-medium ${data.failedRequests > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {data.failedRequests}
                  </span>
                </div>

                {/* Last Success */}
                {data.lastSuccessTime > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Success</span>
                    <span className="text-sm font-medium">
                      {formatTimeSince(data.lastSuccessTime)} ago
                    </span>
                  </div>
                )}

                {/* Recent Errors */}
                {data.recentErrors > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Recent Errors</span>
                    <Badge className="bg-red-100 text-red-800">{data.recentErrors}</Badge>
                  </div>
                )}

                {/* Actions */}
                {(data.circuitBreakerState !== 'CLOSED' || data.failedRequests > 0) && (
                  <div className="flex space-x-2 pt-2 border-t">
                    {data.circuitBreakerState !== 'CLOSED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetCircuitBreaker(network)}
                        className="text-xs"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Reset Circuit Breaker
                      </Button>
                    )}
                    {data.failedRequests > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetStats(network)}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Reset Stats
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Global Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetStats()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset All Stats
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                Object.keys(healthData).forEach(network => {
                  if (healthData[network].circuitBreakerState !== 'CLOSED') {
                    resetCircuitBreaker(network)
                  }
                })
              }}
            >
              <Zap className="w-4 h-4 mr-2" />
              Reset All Circuit Breakers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NetworkHealthMonitor