'use client'

import React, { useState } from 'react'
import { Settings, Play, RotateCcw, Users, Info, HelpCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { UserSwitcher } from './UserSwitcher'
import { InteractiveTour, dashboardTour, exchangeTour, investmentTour } from './InteractiveTour'

interface DemoControlPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function DemoControlPanel({ isOpen, onClose }: DemoControlPanelProps) {
  const [activeTour, setActiveTour] = useState<any>(null)
  const [tourOpen, setTourOpen] = useState(false)
  const [demoSettings, setDemoSettings] = useState({
    showTooltips: true,
    autoRefresh: true,
    simulateRealTime: true,
    showDemoBadges: true
  })

  const startTour = (tour: any) => {
    setActiveTour(tour)
    setTourOpen(true)
  }

  const handleDataReset = () => {
    // In a real implementation, this would reset demo data
    localStorage.removeItem('demo-user-data')
    window.location.reload()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <Card className="fixed top-4 left-4 w-96 z-50 shadow-xl border-2 border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-600" />
            Demo Control Panel
            <Badge variant="secondary" className="text-xs">v1.0</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="tours" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tours">Tours</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tours" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Play className="h-4 w-4 text-emerald-600" />
                  Interactive Tours
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => startTour(dashboardTour)}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Dashboard Overview
                    <Badge variant="secondary" className="ml-auto text-xs">5 steps</Badge>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => startTour(exchangeTour)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Exchange & DeFi
                    <Badge variant="secondary" className="ml-auto text-xs">4 steps</Badge>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => startTour(investmentTour)}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Investment Portfolio
                    <Badge variant="secondary" className="ml-auto text-xs">4 steps</Badge>
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-700">
                  💡 <strong>Tip:</strong> Tours can be paused, restarted, or navigated manually at any time.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Demo Users
                </h3>
                <UserSwitcher />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Quick Actions</h4>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleDataReset}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Demo Data
                </Button>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  🎭 <strong>Demo Users:</strong> Each user has unique financial profiles, transaction histories, and preferences.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  Demo Settings
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Show Tooltips</div>
                      <div className="text-xs text-muted-foreground">Display helpful hints</div>
                    </div>
                    <Switch
                      checked={demoSettings.showTooltips}
                      onCheckedChange={(checked) => 
                        setDemoSettings(prev => ({ ...prev, showTooltips: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Auto Refresh</div>
                      <div className="text-xs text-muted-foreground">Update data automatically</div>
                    </div>
                    <Switch
                      checked={demoSettings.autoRefresh}
                      onCheckedChange={(checked) => 
                        setDemoSettings(prev => ({ ...prev, autoRefresh: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Real-time Simulation</div>
                      <div className="text-xs text-muted-foreground">Simulate live data updates</div>
                    </div>
                    <Switch
                      checked={demoSettings.simulateRealTime}
                      onCheckedChange={(checked) => 
                        setDemoSettings(prev => ({ ...prev, simulateRealTime: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Demo Badges</div>
                      <div className="text-xs text-muted-foreground">Show demo indicators</div>
                    </div>
                    <Switch
                      checked={demoSettings.showDemoBadges}
                      onCheckedChange={(checked) => 
                        setDemoSettings(prev => ({ ...prev, showDemoBadges: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700">
                  ⚙️ <strong>Settings:</strong> Customize the demo experience for different presentation scenarios.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Close Panel
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {activeTour && (
        <InteractiveTour
          steps={activeTour}
          isOpen={tourOpen}
          onClose={() => setTourOpen(false)}
          onComplete={() => {
            setTourOpen(false)
            setActiveTour(null)
          }}
        />
      )}
    </>
  )
}
