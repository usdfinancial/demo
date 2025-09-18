'use client'

import React, { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { insuranceProducts, userInsurancePolicies, formatCurrency, type InsuranceProduct, type UserInsurancePolicy } from '@/lib/data'
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, RefreshCw, Plus, BarChart3, Activity, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { NotificationModal } from '@/components/ui/NotificationModal'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InsuranceClaim {
  id: string
  productName: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  dateSubmitted: string
  description: string
}

interface InsuranceMetrics {
  totalCoverage: number
  activePolicies: number
  totalPremiums: number
  claimsProcessed: number
}

// Mock claims data
const mockClaims: InsuranceClaim[] = [
  {
    id: '1',
    productName: 'DeFi Protocol Protection',
    amount: 5000,
    status: 'approved',
    dateSubmitted: '2024-01-10',
    description: 'Protocol exploit on Compound'
  },
  {
    id: '2',
    productName: 'Wallet Security Insurance',
    amount: 2500,
    status: 'paid',
    dateSubmitted: '2024-01-05',
    description: 'Operational error in multi-sig'
  }
]

export default function InsurancePage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('products')
  const [isLoading, setIsLoading] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(null)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)

  // Calculate metrics from actual data
  const insuranceMetrics: InsuranceMetrics = {
    totalCoverage: userInsurancePolicies.reduce((sum, policy) => sum + policy.coverageAmount, 0),
    activePolicies: userInsurancePolicies.filter(policy => policy.status === 'active').length,
    totalPremiums: userInsurancePolicies.reduce((sum, policy) => sum + policy.premiumPaid, 0),
    claimsProcessed: mockClaims.length
  }

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'defi_protocol':
        return <TrendingUp className="h-6 w-6 text-emerald-600" />
      case 'smart_contract':
        return <Activity className="h-6 w-6 text-blue-600" />
      case 'exchange':
        return <Shield className="h-6 w-6 text-purple-600" />
      case 'wallet':
        return <BarChart3 className="h-6 w-6 text-orange-600" />
      default:
        return <Shield className="h-6 w-6 text-gray-600" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Expired</Badge>
      case 'claimed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Claimed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Paid</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>
    }
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handlePurchase = (product: InsuranceProduct) => {
    setSelectedProduct(product)
    setShowPurchaseModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to access insurance</h3>
            <p className="text-muted-foreground">Connect your account to protect your DeFi investments</p>
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
              DeFi Insurance
            </h1>
            <p className="text-muted-foreground">Protect your investments with comprehensive coverage</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              onClick={() => setIsClaimModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              File Claim
            </Button>
          </div>
        </div>

        {/* Insurance Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Total Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(insuranceMetrics.totalCoverage)}
              </div>
              <p className="text-sm text-muted-foreground">Active protection</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Active Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {insuranceMetrics.activePolicies}
              </div>
              <p className="text-sm text-muted-foreground">Current coverage</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Total Premiums
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(insuranceMetrics.totalPremiums)}
              </div>
              <p className="text-sm text-muted-foreground">Annual cost</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Claims Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {insuranceMetrics.claimsProcessed}
              </div>
              <p className="text-sm text-muted-foreground">Successfully handled</p>
            </CardContent>
          </Card>
        </div>

        {/* Insurance Management */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Insurance Management
            </CardTitle>
            <CardDescription>
              Manage your DeFi insurance policies and claims
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products">Available Products</TabsTrigger>
                <TabsTrigger value="policies">My Policies</TabsTrigger>
                <TabsTrigger value="claims">Claims History</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-6 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {insuranceProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-6 border rounded-lg transition-all cursor-pointer ${
                        selectedProduct?.id === product.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-200'
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          {getProductIcon(product.type)}
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">Available</Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Coverage:</span>
                            <div className="font-medium">{formatCurrency(product.coverage)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Premium:</span>
                            <div className="font-medium">{product.premium}% annually</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Amount:</span>
                            <div className="font-medium">{formatCurrency(product.minAmount)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Risk Level:</span>
                            <Badge className={`text-xs ${getRiskColor(product.riskLevel)}`}>
                              {product.riskLevel}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Features</h4>
                          <div className="flex flex-wrap gap-1">
                            {product.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button 
                          className="w-full bg-emerald-500 hover:bg-emerald-600"
                          onClick={() => handlePurchase(product)}
                        >
                          Purchase Policy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="policies" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {userInsurancePolicies.map((policy) => (
                    <div key={policy.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Shield className="h-6 w-6 text-emerald-600" />
                          <div>
                            <h3 className="font-semibold">{policy.productName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Coverage: {formatCurrency(policy.coverageAmount)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(policy.status)}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Premium Paid</div>
                          <div className="font-medium">{formatCurrency(policy.premiumPaid)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Start Date</div>
                          <div className="font-medium">{formatDate(policy.startDate)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End Date</div>
                          <div className="font-medium">{formatDate(policy.endDate)}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm text-muted-foreground mb-2">Protected Assets</div>
                        <div className="flex flex-wrap gap-1">
                          {policy.protectedAssets.map((asset, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {asset}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsClaimModalOpen(true)}>
                          File Claim
                        </Button>
                        <Button size="sm" variant="outline">
                          Renew Policy
                        </Button>
                      </div>
                    </div>
                  ))}

                  {userInsurancePolicies.length === 0 && (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Active Policies</h3>
                      <p className="text-muted-foreground mb-4">You don't have any active insurance policies yet</p>
                      <Button onClick={() => setSelectedTab('products')}>
                        Browse Insurance Products
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="claims" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {mockClaims.map((claim) => (
                    <div key={claim.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{claim.productName}</h3>
                          <p className="text-sm text-muted-foreground">{claim.description}</p>
                        </div>
                        {getStatusBadge(claim.status)}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Claim Amount</div>
                          <div className="font-medium">{formatCurrency(claim.amount)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Date Submitted</div>
                          <div className="font-medium">{formatDate(claim.dateSubmitted)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Claim ID</div>
                          <div className="font-medium">#{claim.id}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {mockClaims.length === 0 && (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Claims History</h3>
                      <p className="text-muted-foreground">You haven't filed any insurance claims yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Insurance Features */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-200">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Comprehensive Coverage</h3>
                <p className="text-sm text-muted-foreground">Protect against all major DeFi risks</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Fast Claims Processing</h3>
                <p className="text-sm text-muted-foreground">Quick resolution and payouts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Transparent Terms</h3>
                <p className="text-sm text-muted-foreground">Clear coverage and conditions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claim Filing Modal */}
        <Dialog open={isClaimModalOpen} onOpenChange={setIsClaimModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File Insurance Claim</DialogTitle>
              <DialogDescription>
                Submit a claim for your insurance policy
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Policy</Label>
                <select className="w-full p-2 border rounded-md">
                  {userInsurancePolicies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.productName} - {formatCurrency(policy.coverageAmount)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium">Claim Amount</Label>
                <Input placeholder="Enter claim amount" type="number" />
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <Input placeholder="Describe the incident..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsClaimModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Submit Claim
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Purchase Confirmation Modal */}
        <NotificationModal
          open={showPurchaseModal}
          onOpenChange={setShowPurchaseModal}
          type="insurance"
          title="Insurance Policy Purchase"
          message={selectedProduct ? `Successfully purchased ${selectedProduct.name}` : 'Policy purchase confirmed'}
          amount={selectedProduct ? formatCurrency(selectedProduct.premium) : ''}
          currency="USDC"
          details={selectedProduct ? [
            `Policy: ${selectedProduct.name}`,
            `Coverage: ${formatCurrency(selectedProduct.coverage)}`,
            `Premium: ${formatCurrency(selectedProduct.premium)} annually`,
            `Risk Level: ${selectedProduct.riskLevel}`,
            `Policy Status: Active immediately`,
            `Coverage Period: 12 months from purchase date`
          ] : []}
          showCopy={true}
          copyText={selectedProduct ? `Insurance Policy: ${selectedProduct.name} | Coverage: ${formatCurrency(selectedProduct.coverage)} | Premium: ${formatCurrency(selectedProduct.premium)}` : ''}
        />
      </div>
    </AuthGuard>
  )
}
