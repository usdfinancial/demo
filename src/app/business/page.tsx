'use client'

import React, { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { businessServices, businessMetrics, teamMembers, formatCurrency, type BusinessService, type BusinessMetrics, type TeamMember } from '@/lib/data'
import { Building2, Users, CreditCard, TrendingUp, Shield, BarChart3, DollarSign, UserPlus, RefreshCw, Settings, Mail, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function BusinessPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'payments': return CreditCard
      case 'treasury': return TrendingUp
      case 'lending': return DollarSign
      case 'compliance': return Shield
      case 'analytics': return BarChart3
      default: return Building2
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'beta':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Beta</Badge>
      case 'coming-soon':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Coming Soon</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600'
      case 'manager': return 'text-blue-600'
      case 'employee': return 'text-green-600'
      case 'viewer': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const formatLastActive = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to access business features</h3>
            <p className="text-muted-foreground">Connect your account to manage your business</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Business Platform
            </h1>
            <p className="text-muted-foreground">Manage your business financial operations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInviteModalOpen(true)}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsLoading(true)}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Business Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(businessMetrics.totalRevenue)}
              </div>
              <p className="text-sm text-muted-foreground">+{businessMetrics.monthlyGrowth}% this month</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Monthly Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {businessMetrics.monthlyTransactions.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Avg: {formatCurrency(businessMetrics.averageTransactionSize)}</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {businessMetrics.activeEmployees}
              </div>
              <p className="text-sm text-muted-foreground">Active users</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {businessMetrics.complianceScore}%
              </div>
              <p className="text-sm text-muted-foreground">Excellent rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Business Management
            </CardTitle>
            <CardDescription>
              Manage services, team members, and business operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Services Overview</TabsTrigger>
                <TabsTrigger value="team">Team Management</TabsTrigger>
                <TabsTrigger value="settings">Business Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {businessServices.map((service) => {
                    const IconComponent = getServiceIcon(service.category)
                    return (
                      <Card key={service.id} className="border-emerald-200 hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <IconComponent className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{service.name}</CardTitle>
                                <CardDescription className="capitalize">{service.category}</CardDescription>
                              </div>
                            </div>
                            {getStatusBadge(service.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                          <div className="space-y-2 mb-4">
                            {service.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-emerald-600">{service.pricing}</span>
                            <Button size="sm" variant="outline">
                              {service.status === 'active' ? 'Configure' : 'Learn More'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.name}</p>
                            <Badge className={`text-xs ${getRoleColor(member.role)}`} variant="secondary">
                              {member.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatLastActive(member.lastActive)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {member.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-emerald-200">
                    <CardHeader>
                      <CardTitle className="text-base">Company Information</CardTitle>
                      <CardDescription>Basic business details and settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Company Name</Label>
                        <Input value="USD Financial Demo Corp" readOnly />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Business Type</Label>
                        <Select defaultValue="fintech">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fintech">Financial Technology</SelectItem>
                            <SelectItem value="ecommerce">E-commerce</SelectItem>
                            <SelectItem value="saas">Software as a Service</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Monthly Volume</Label>
                        <Input value={formatCurrency(businessMetrics.totalRevenue)} readOnly />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-200">
                    <CardHeader>
                      <CardTitle className="text-base">Compliance & Security</CardTitle>
                      <CardDescription>Security settings and compliance status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Two-Factor Authentication</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">KYB Verification</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">AML Screening</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Compliance Score</span>
                        <div className="flex items-center gap-2">
                          <Progress value={businessMetrics.complianceScore} className="w-16" />
                          <span className="text-sm font-medium">{businessMetrics.complianceScore}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Team Invite Modal */}
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Add a new team member to your business account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Email Address</Label>
                <Input placeholder="colleague@company.com" />
              </div>
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <Select defaultValue="employee">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
