'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Shield, Zap, TrendingUp, Sparkles, Star, CheckCircle, DollarSign, BarChart3, LogOut, ChevronDown, CreditCard, Send, Repeat, ShieldCheck, Globe, KeyRound, Lock, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WaitlistModal } from '@/components/WaitlistModal'
// import { AlchemyAuthButton } from '@/components/auth/AlchemyAuthButton' // Disabled for demo mode
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'

export default function LandingPage() {
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const {
    user,
    isLoading,
    signOut,
    isAuthenticated
  } = useEnhancedAuth()
  

  const handleJoinWaitlist = () => {
    setIsWaitlistModalOpen(true)
  }

  const handleCloseWaitlistModal = () => {
    setIsWaitlistModalOpen(false)
  }

  const handleLogout = async () => {
    await signOut()
    setIsUserMenuOpen(false)
  }


  // Account Kit provides the current user
  const currentUser = user
  const isUserAuthenticated = isAuthenticated

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden">
      {/* Navigation Header */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">UF</span>
              </div>
              <span className="text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">USD Financial</span>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isUserAuthenticated ? (
                <div className="relative">
                  {/* User Menu Button */}
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-600 font-semibold text-sm">
                        {currentUser?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-slate-600 font-medium hidden sm:block">
                      {currentUser?.email || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  {/* Fixed Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900 break-all leading-relaxed" title={currentUser?.email}>
                          {currentUser?.email || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{currentUser?.address ? `${currentUser.address.slice(0, 6)}...${currentUser.address.slice(-4)}` : 'No address'}</p>
                        {currentUser && (
                          <p className="text-xs text-emerald-600 font-medium mt-1">Alchemy Account Kit</p>
                        )}
                      </div>
                      <Link 
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <DollarSign className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}

                  {/* Backdrop to close menu */}
                  {isUserMenuOpen && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                  )}
                </div>
              ) : (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium px-4 sm:px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0 text-sm sm:text-base">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Hero Section */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98130_1px,transparent_1px),linear-gradient(to_bottom,#10b98130_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-xl border border-emerald-200/50 shadow-lg mb-8">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">The Future of Stablecoin Financial Services</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 mb-6">
              <span className="block">Stablecoin</span>
              <span className="block bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                is all you need
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Your complete financial solution, reimagined. Deposit stablecoins and unlock a suite of powerful financial services. 
              <br />
              <span className="font-semibold text-emerald-700">Stablecoin IN, stablecoin OUT.</span> Simple, stable, secure.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  Discover Our Services
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleJoinWaitlist}
                className="text-lg px-8 py-6 rounded-full border-2 border-emerald-200 bg-white/60 backdrop-blur-xl hover:bg-white/80 text-emerald-700 transition-all duration-300 group"
              >
                <Sparkles className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Join Waitlist
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">$230B+</div>
                <div className="text-sm text-slate-600">Global Stablecoin Market Cap</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">$1.48T+</div>
                <div className="text-sm text-slate-600">Worldwide Trading Volume</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">180+</div>
                <div className="text-sm text-slate-600">Countries with Access</div>
              </div>
            </div>
          </div>

          {/* Stablecoin Showcase */}
          <div className="relative max-w-md mx-auto mb-20">
            <div className="relative">
              {/* Floating Card with Stablecoin Theme */}
              <div className="relative transform -rotate-6 hover:rotate-0 transition-transform duration-700 ease-out">
                <Card className="overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
                  <CardContent className="p-8 text-white relative">
                    {/* Card Background Pattern */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.2),transparent_70%)]" />
                    
                    {/* Card Content */}
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className="h-8 w-8 rounded bg-gradient-to-r from-emerald-400 to-green-500">UF</div>
                        <div className="text-sm font-medium opacity-80">USD Financial</div>
                      </div>
                      
                      <div className="space-y-4 mb-8">
                        <div className="h-2 w-16 bg-white/20 rounded" />
                        <div className="text-2xl font-mono tracking-widest">USDC •••• 1234</div>
                        <div className="text-sm opacity-75">Multi-Stablecoin Balance</div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xs opacity-60 mb-1">BALANCE</div>
                          <div className="font-medium">$10000.00</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60 mb-1">EARNING</div>
                          <div className="font-medium text-emerald-300">4.8% APY</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-green-400/20 rounded-full blur-xl animate-pulse delay-1000" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Why Stablecoin is All You Need
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Experience the power of stablecoin, designed for comprehensive financial solutions and peace of mind.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - Stability */}
            <Card className="group hover:shadow-xl transition-all duration-500 bg-white/60 backdrop-blur-xl border-emerald-200/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900">Rock-Solid Stability</h3>
                <p className="text-slate-600 leading-relaxed">
                  Stablecoins offer remarkable price stability, providing a reliable base for your digital assets. Your funds remain robust, allowing you to focus on your financial goals within our secure ecosystem.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 - Yield */}
            <Card className="group hover:shadow-xl transition-all duration-500 bg-white/60 backdrop-blur-xl border-emerald-200/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900">Unlock Diverse Financial Services</h3>
                <p className="text-slate-600 leading-relaxed">
                  Beyond simple holding, your stablecoins open doors to a full suite of financial tools. Access seamless transactions, lending, and other comprehensive services, all built on the efficiency and transparency of blockchain. Your assets are active, enabling a wide range of possibilities.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 - Cross-Chain */}
            <Card className="group hover:shadow-xl transition-all duration-500 bg-white/60 backdrop-blur-xl border-emerald-200/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900">Unrestricted Flow & Efficiency</h3>
                <p className="text-slate-600 leading-relaxed">
                  Move your stablecoins effortlessly across major blockchains like Ethereum, Polygon, Arbitrum, and more. Benefit from the inherent speed and low fees of the stablecoin ecosystem, giving you unparalleled control and flexibility over your funds.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative py-24 bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#10b98110_1px,transparent_1px),linear-gradient(-45deg,#10b98110_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-200/50 shadow-lg mb-8">
              <Repeat className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Simple Process</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Stablecoin IN</span>
              <span className="text-slate-900">, </span>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Stablecoin OUT</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Three elegant steps to unlock your stablecoin's full financial potential
            </p>
          </div>

          <div className="relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <svg className="w-full h-24" viewBox="0 0 800 100" fill="none">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#059669" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <path 
                  d="M 100 50 Q 400 20 700 50" 
                  stroke="url(#lineGradient)" 
                  strokeWidth="2" 
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              </svg>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Step 1 */}
              <div className="relative group">
                <Card className="h-full bg-white/70 backdrop-blur-xl border-2 border-emerald-100/50 hover:border-emerald-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                        1
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full opacity-20 animate-ping" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">Deposit Stablecoins</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Start with widely recognized stablecoins like USDC or USDT. Connect your wallet and deposit efficiently, usually within minutes, ready for activation.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <Card className="h-full bg-white/70 backdrop-blur-xl border-2 border-green-100/50 hover:border-green-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                        2
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full opacity-20 animate-ping delay-300" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">Access Financial Services</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Our platform provides access to a range of comprehensive financial services, designed to put your stablecoins to work. We aim to connect you with opportunities that enhance your digital assets within our secure ecosystem.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <Card className="h-full bg-white/70 backdrop-blur-xl border-2 border-teal-100/50 hover:border-teal-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                        3
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-400 rounded-full opacity-20 animate-ping delay-700" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900">Spend or Transfer</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Utilize our stablecoin debit card for everyday purchases, or transfer your funds to various supported blockchains with minimal fees. Experience flexibility and control over your digital finances.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Our Services Section */}
      <div className="relative py-24 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-200/50 shadow-lg mb-8">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Complete Ecosystem</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              A Universe of 
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> Financial Services</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Go beyond traditional financial services with a comprehensive suite of tools designed for the digital economy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Spend & Use Card */}
            <div className="group">
              <Card className="h-full relative overflow-hidden bg-white/80 backdrop-blur-xl border-2 border-emerald-100/50 hover:border-emerald-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-8 text-center">
                  <div className="relative mb-6">
                    <div className="w-18 h-18 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full opacity-20 animate-ping group-hover:opacity-60" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Spend & Use</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Use your stablecoins for daily purchases with the USD Financial Card. Accepted globally, online and in-store.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Transfer & Remit Card */}
            <div className="group">
              <Card className="h-full relative overflow-hidden bg-white/80 backdrop-blur-xl border-2 border-green-100/50 hover:border-green-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-8 text-center">
                  <div className="relative mb-6">
                    <div className="w-18 h-18 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Send className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full opacity-20 animate-ping delay-200 group-hover:opacity-60" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Transfer & Remit</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Move funds across the globe in minutes, not days. Low fees and near-instant settlement.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Swap & Bridge Card */}
            <div className="group">
              <Card className="h-full relative overflow-hidden bg-white/80 backdrop-blur-xl border-2 border-teal-100/50 hover:border-teal-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-8 text-center">
                  <div className="relative mb-6">
                    <div className="w-18 h-18 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Repeat className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full opacity-20 animate-ping delay-500 group-hover:opacity-60" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Swap & Bridge</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Seamlessly exchange digital assets and move them across different blockchain networks with ease.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Access DeFi Card */}
            <div className="group">
              <Card className="h-full relative overflow-hidden bg-white/80 backdrop-blur-xl border-2 border-emerald-100/50 hover:border-emerald-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-8 text-center">
                  <div className="relative mb-6">
                    <div className="w-18 h-18 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-400 rounded-full opacity-20 animate-ping delay-700 group-hover:opacity-60" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Access DeFi</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Explore opportunities in the decentralized finance ecosystem. Put your stablecoins to work in a secure environment.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* The Stablecoin Advantage Section */}
      <div className="relative py-24 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_70%)]" />
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-200/50 shadow-lg mb-8">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Future of Finance</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Why 
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Stablecoins</span>?
              <br />
              <span className="text-4xl md:text-5xl">The Future of Money is Here</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Discover the power of digital dollars and how they create a more accessible and efficient financial world.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Stability Card */}
            <div className="group">
              <Card className="h-full bg-white/70 backdrop-blur-xl border-2 border-emerald-100/50 hover:border-emerald-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <ShieldCheck className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full opacity-30 animate-pulse" />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-300 rounded-full opacity-40 animate-ping delay-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">Stability in a Digital World</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Enjoy the benefits of digital assets without the volatility. Our platform is built on fully-backed stablecoins, pegged 1:1 to the US Dollar.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Global Access Card */}
            <div className="group">
              <Card className="h-full bg-white/70 backdrop-blur-xl border-2 border-green-100/50 hover:border-green-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Globe className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full opacity-30 animate-pulse delay-300" />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-300 rounded-full opacity-40 animate-ping delay-800" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">Global, Borderless Access</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Financial services for everyone, everywhere. No bank account needed. Your digital wallet is your passport to the global economy.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Efficiency Card */}
            <div className="group">
              <Card className="h-full bg-white/70 backdrop-blur-xl border-2 border-teal-100/50 hover:border-teal-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-400 rounded-full opacity-30 animate-pulse delay-700" />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-teal-300 rounded-full opacity-40 animate-ping delay-1000" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">Unmatched Efficiency</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Experience transactions that are faster, cheaper, and more transparent than traditional financial systems. Welcome to the new speed of money.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Security You Can Trust Section */} 
      <div className="relative py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-hidden">
        {/* Background Pattern */} 
        <div className="absolute inset-0 bg-[linear-gradient(30deg,#10b98108_1px,transparent_1px),linear-gradient(150deg,#10b98108_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-teal-500/10 to-emerald-500/10 backdrop-blur-xl border border-teal-200/50 shadow-lg mb-8">
              <Shield className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-semibold text-teal-700">Security-Focused Design</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Your 
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Security</span>
              <br />
              <span className="text-4xl md:text-5xl">is Our Priority</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We are committed to high standards of security to protect your assets and your data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* You're in Control */} 
            <div className="group">
              <Card className="h-full bg-white/80 backdrop-blur-xl border-2 border-teal-100/50 hover:border-teal-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <KeyRound className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-400 rounded-full opacity-30 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">You're in Control</h3>
                  <p className="text-slate-600 leading-relaxed">
                    With our non-custodial architecture, you always have control over your funds. Not your keys, not your crypto? We agree.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Robust Security Measures */} 
            <div className="group">
              <Card className="h-full bg-white/80 backdrop-blur-xl border-2 border-emerald-100/50 hover:border-emerald-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Lock className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full opacity-30 animate-pulse delay-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">Robust Security Measures</h3>
                  <p className="text-slate-600 leading-relaxed">
                    We employ multi-layered security measures, including encryption and secure protocols, to safeguard your account.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Audited & Verified */} 
            <div className="group">
              <Card className="h-full bg-white/80 backdrop-blur-xl border-2 border-green-100/50 hover:border-green-300/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BadgeCheck className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full opacity-30 animate-pulse delay-700" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900">Audited & Verified</h3>
                  <p className="text-slate-600 leading-relaxed">
                    We build on and integrate with audited smart contracts and established protocols to support the integrity of our ecosystem.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
      

      {/* Final CTA Section */}
      <div className="relative py-24 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-200/50 shadow-lg mb-8">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Ready to experience the future of finance?</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Your 
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">stablecoin journey</span>
            <br />
            <span className="text-4xl md:text-5xl">starts here</span>
          </h2>
          
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
            Discover how stablecoins can empower your financial life.
            <span className="font-semibold text-emerald-700"> Your stablecoin. Your financial world.</span>
          </p>
          
          <Button 
            size="lg" 
            onClick={handleJoinWaitlist}
            className="text-lg px-12 py-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
          >
            Join the Waitlist Today
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-emerald-50 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} USD Financial. All rights reserved.</p>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <WaitlistModal 
        isOpen={isWaitlistModalOpen} 
        onClose={handleCloseWaitlistModal} 
      />

      {/* Account Kit handles authentication modals automatically */}
    </div>
  )
}
