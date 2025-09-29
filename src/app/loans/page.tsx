'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { loanProducts, userLoans, formatCurrency, type LoanProduct, type UserLoan } from '@/lib/data'
import { DollarSign, TrendingUp, Shield, AlertTriangle, Calculator, Clock, Target, Plus, RefreshCw, CheckCircle, XCircle, FileText, CreditCard, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { NotificationModal } from '@/components/ui/NotificationModal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface LoanApplication {
  loanAmount: string
  collateralAmount: string
  selectedProduct: string
  purpose: string
  terms: boolean
}

export default function LoansPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('apply')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [loanAmount, setLoanAmount] = useState('')
  const [collateralAmount, setCollateralAmount] = useState('')
  const [collateralType, setCollateralType] = useState('USDC')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const calculateLTV = () => {
    const loan = parseFloat(loanAmount) || 0
    const collateral = parseFloat(collateralAmount) || 0
    return collateral > 0 ? (loan / collateral) * 100 : 0
  }

  const getRiskLevel = (ltv: number) => {
    if (ltv < 30) return { level: 'Low', color: 'bg-green-100 text-green-800 border-green-200' }
    if (ltv < 50) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    return { level: 'High', color: 'bg-red-100 text-red-800 border-red-200' }
  }

  const handleSubmitApplication = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setShowSuccessModal(true)
    }, 2000)
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to access loans</h3>
            <p className="text-muted-foreground">Connect your account to apply for crypto-collateralized loans</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const currentLTV = calculateLTV()
  const risk = getRiskLevel(currentLTV)
  const selectedProductData = loanProducts.find(p => p.id === selectedProduct)

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Crypto Loans
            </h1>
            <p className="text-muted-foreground">Access liquidity with crypto-collateralized loans</p>
          </div>
          <Button 
            variant="outline" 
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Loan Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Total Borrowed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(userLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0))}
              </div>
              <p className="text-sm text-muted-foreground">Across {userLoans.length} loans</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                Loan Management
              </CardTitle>
              <CardDescription>
                Apply for loans, manage applications, and track your borrowing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="apply">Apply for Loan</TabsTrigger>
                  <TabsTrigger value="calculator">Loan Calculator</TabsTrigger>
                  <TabsTrigger value="manage">Manage Loans</TabsTrigger>
                </TabsList>

                <TabsContent value="apply" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Loan Product</label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a loan product" />
                        </SelectTrigger>
                        <SelectContent>
                          {loanProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.interestRate}% APR
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedProductData && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h4 className="font-medium text-emerald-800 mb-2">{selectedProductData.name}</h4>
                        <p className="text-sm text-emerald-600 mb-3">{selectedProductData.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-emerald-600">Max LTV:</span>
                            <span className="font-medium ml-2">{selectedProductData.maxLTV}%</span>
                          </div>
                          <div>
                            <span className="text-emerald-600">Interest Rate:</span>
                            <span className="font-medium ml-2">{selectedProductData.interestRate}% APR</span>
                          </div>
                          <div>
                            <span className="text-emerald-600">Min Amount:</span>
                            <span className="font-medium ml-2">{formatCurrency(selectedProductData.minAmount)}</span>
                          </div>
                          <div>
                            <span className="text-emerald-600">Max Amount:</span>
                            <span className="font-medium ml-2">{formatCurrency(selectedProductData.maxAmount)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Loan Amount</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Collateral Type</label>
                        <Select value={collateralType} onValueChange={setCollateralType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USDC">USDC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Collateral Amount</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                      />
                    </div>

                    {loanAmount && collateralAmount && (
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium mb-3">Loan Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Loan Amount:</span>
                            <span className="font-medium">{formatCurrency(parseFloat(loanAmount))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Collateral Value:</span>
                            <span className="font-medium">{formatCurrency(parseFloat(collateralAmount))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Loan-to-Value (LTV):</span>
                            <span className="font-medium">{currentLTV.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Risk Level:</span>
                            <Badge className={`text-xs ${risk.color}`}>
                              {risk.level}
                            </Badge>
                          </div>
                          {selectedProductData && (
                            <div className="flex justify-between">
                              <span>Estimated Monthly Payment:</span>
                              <span className="font-medium">
                                {formatCurrency((parseFloat(loanAmount) * selectedProductData.interestRate / 100) / 12)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      onClick={handleSubmitApplication}
                      disabled={!selectedProduct || !loanAmount || !collateralAmount || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing Application...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Submit Loan Application
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="calculator" className="space-y-6 mt-6">
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-emerald-700 mb-4">Loan Calculator</h3>
                    <p className="text-emerald-600 text-sm mb-4">
                      Calculate your potential loan terms and monthly payments
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm text-emerald-600">Available Loan Products</div>
                        <div className="space-y-2 mt-2">
                          {loanProducts.map((product) => (
                            <div key={product.id} className="p-3 bg-white border border-emerald-200 rounded-lg">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.interestRate}% APR • Max {product.maxLTV}% LTV
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-emerald-600">Collateral Requirements</div>
                        <div className="mt-2 p-3 bg-white border border-emerald-200 rounded-lg">
                          <div className="text-sm space-y-1">
                            <div>• Minimum collateral ratio: 150%</div>
                            <div>• Supported assets: USDC</div>
                            <div>• Automatic liquidation protection</div>
                            <div>• Real-time collateral monitoring</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="manage" className="space-y-6 mt-6">
                  {userLoans.length > 0 ? (
                    <div className="space-y-4">
                      {userLoans.map((loan) => (
                        <div key={loan.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{loan.productName}</h3>
                              <p className="text-sm text-muted-foreground">
                                Loan ID: {loan.id}
                              </p>
                            </div>
                            <Badge className={`${getRiskLevel(loan.ltv).color}`}>
                              {getRiskLevel(loan.ltv).level} Risk
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Outstanding Balance</div>
                              <div className="font-medium">{formatCurrency(loan.outstandingBalance)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Monthly Payment</div>
                              <div className="font-medium">{formatCurrency(loan.monthlyPayment)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Current LTV</div>
                              <div className="font-medium">{loan.ltv.toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Next Payment</div>
                              <div className="font-medium">{loan.nextPayment}</div>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="outline">
                              Make Payment
                            </Button>
                            <Button size="sm" variant="outline">
                              Add Collateral
                            </Button>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Active Loans</h3>
                      <p className="text-muted-foreground mb-4">You don't have any active loans yet</p>
                      <Button onClick={() => setSelectedTab('apply')}>
                        Apply for Your First Loan
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Loan Features */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-200">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Secure Collateral</h3>
                <p className="text-sm text-muted-foreground">Multi-signature wallet protection</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Instant Approval</h3>
                <p className="text-sm text-muted-foreground">Get funds in minutes, not days</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Flexible Terms</h3>
                <p className="text-sm text-muted-foreground">Customize your loan duration</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <NotificationModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        type="loan"
        title="Loan Application Submitted!"
        message="Your loan application has been successfully submitted for review"
        amount={formatCurrency(parseFloat(loanAmount) || 0)}
        currency="USDC"
        details={[
          `Loan Amount: ${formatCurrency(parseFloat(loanAmount) || 0)} USDC`,
          `Collateral: ${formatCurrency(parseFloat(collateralAmount) || 0)} ${collateralType}`,
          `LTV Ratio: ${calculateLTV().toFixed(1)}%`,
          `Application Status: Under Review`,
          `Expected Review Time: 24-48 hours`
        ]}
        showCopy={true}
        copyText={`Loan Application: ${formatCurrency(parseFloat(loanAmount) || 0)} USDC | Collateral: ${formatCurrency(parseFloat(collateralAmount) || 0)} ${collateralType} | LTV: ${calculateLTV().toFixed(1)}%`}
      />
    </AuthGuard>
  )
}
