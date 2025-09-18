'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Home, CreditCard, TrendingUp, ArrowLeftRight, Receipt, BarChart3, Zap, Wallet, DollarSign, Building2, Shield, ChevronDown, ChevronRight, Settings, LogOut, UserCircle, Bell, Star, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ThemeGenerator } from '@/components/ThemeGenerator'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { ProfileAccountModal } from '@/components/user/ProfileAccountModal'
import { LogoutConfirmationDialog } from '@/components/auth/LogoutConfirmationDialog'
import { SessionStatusIndicator } from '@/components/auth/SessionStatusIndicator'
import { DemoControlPanel } from '@/components/demo/DemoControlPanel'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    name: 'Accounts',
    icon: Wallet,
    subItems: [
      { name: 'Wallet', href: '/accounts/wallet', icon: Wallet },
      { name: 'Bridge', href: '/accounts/bridge', icon: Zap },
      { name: 'Send Money', href: '/accounts/send', icon: ArrowLeftRight }
    ]
  },
  {
    name: 'Cards',
    icon: CreditCard,
    subItems: [
      { name: 'Overview', href: '/cards', icon: CreditCard },
      { name: 'Physical Card', href: '/cards/physical', icon: CreditCard },
      { name: 'Virtual Cards', href: '/cards/virtual', icon: CreditCard },
      { name: 'Rewards', href: '/cards/rewards', icon: TrendingUp },
      { name: 'Spending Controls', href: '/cards/controls', icon: Shield }
    ]
  },
  {
    name: 'Exchange',
    icon: ArrowLeftRight,
    subItems: [
      { name: 'Swap', href: '/swap', icon: ArrowLeftRight },
      { name: 'Earn Interest', href: '/exchange/earn', icon: TrendingUp },
      { name: 'Fiat Gateway', href: '/exchange/fiat', icon: DollarSign },
      { name: 'Rates & Market', href: '/exchange', icon: BarChart3 }
    ]
  },
  {
    name: 'Invest',
    icon: TrendingUp,
    subItems: [
      { name: 'Portfolio Overview', href: '/invest', icon: TrendingUp },
      { name: 'Tokenized Assets', href: '/invest/assets', icon: BarChart3 },
      { name: 'Auto-Invest', href: '/invest/auto', icon: Zap },
      { name: 'Staking', href: '/invest/staking', icon: Zap },
      { name: 'DeFi Yield Farming', href: '/invest/defi', icon: TrendingUp },
      { name: 'Portfolio Analytics', href: '/invest/analytics', icon: BarChart3 }
    ]
  },
  {
    name: 'Loans',
    href: '/loans',
    icon: DollarSign
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Receipt
  },
  {
    name: 'Business',
    href: '/business',
    icon: Building2
  },
  {
    name: 'Insurance',
    href: '/insurance',
    icon: Shield
  }
]

const NavLink = React.memo(({ 
  item, 
  mobile = false, 
  pathname, 
  expandedItems, 
  toggleExpanded, 
  isTransitioning 
}: { 
  item: any
  mobile?: boolean
  pathname: string
  expandedItems: string[]
  toggleExpanded: (itemName: string, hasSubItems: boolean) => void
  isTransitioning: boolean
}) => {
  const hasSubItems = item.subItems && item.subItems.length > 0
  const isExpanded = expandedItems.includes(item.name)
  const isActive = pathname === item.href || (hasSubItems && item.subItems.some((sub: any) => pathname === sub.href))
  const Icon = item.icon

  if (hasSubItems) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => toggleExpanded(item.name, hasSubItems)}
          className={cn(
            "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
            isActive 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            mobile && "text-base",
            isTransitioning && "pointer-events-none"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            <span className="flex items-center gap-2">
              {item.name}
              {item.comingSoon && (
                <Badge className="h-4 px-1.5 text-[10px] font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200/50 hover:bg-gradient-to-r hover:from-amber-200 hover:to-yellow-200">
                  SOON
                </Badge>
              )}
            </span>
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {isExpanded && (
          <div className="ml-6 space-y-1">
            {item.subItems.map((subItem: any) => {
              const isSubActive = pathname === subItem.href
              const SubIcon = subItem.icon
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
                    isSubActive 
                      ? "bg-emerald-100 text-emerald-700 border-l-2 border-emerald-500" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    mobile && "text-base"
                  )}
                >
                  <SubIcon className="h-4 w-4" />
                  {subItem.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        mobile && "text-base"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex items-center gap-2">
        {item.name}
        {item.comingSoon && (
          <Badge className="h-4 px-1.5 text-[10px] font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200/50 hover:bg-gradient-to-r hover:from-amber-200 hover:to-yellow-200">
            SOON
          </Badge>
        )}
      </span>
    </Link>
  )
})

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useEnhancedAuth()
  // Initialize expanded items from localStorage with current page context
  const [expandedItems, setExpandedItems] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nav-expanded-items')
        return saved ? JSON.parse(saved) : []
      } catch {
        return []
      }
    }
    return []
  })
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = React.useState(false)
  const [isDemoControlPanelOpen, setIsDemoControlPanelOpen] = React.useState(false)
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  const isTransitioningRef = React.useRef(false)

  // Auto-expand menu if current page is in a submenu
  React.useEffect(() => {
    let hasChanges = false
    const newExpandedItems = [...expandedItems]
    
    navigationItems.forEach(item => {
      if (item.subItems && item.subItems.some((sub: any) => pathname === sub.href)) {
        if (!newExpandedItems.includes(item.name)) {
          newExpandedItems.push(item.name)
          hasChanges = true
        }
      }
    })
    
    if (hasChanges) {
      setExpandedItems(newExpandedItems)
    }
  }, [pathname, expandedItems])

  // Persist expanded items to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nav-expanded-items', JSON.stringify(expandedItems))
    }
  }, [expandedItems])
  
  // Memoize full user data to prevent infinite re-renders
  const fullUserData = React.useMemo(() => {
    return user ? findUserByEmail(user.email) : null
  }, [user?.email])

  // Memoize formatted values to prevent re-renders
  const userDisplayValues = React.useMemo(() => {
    if (!fullUserData) return null
    
    return {
      formattedBalance: `$${fullUserData.balance.toLocaleString()}`,
      formattedGain: `+${fullUserData.portfolio.monthlyGain}%`
    }
  }, [fullUserData?.balance, fullUserData?.portfolio.monthlyGain])
  
  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true)
  }

  const handleConfirmLogout = async () => {
    try {
      await signOut()
      // Redirect to landing page for consistent logout experience
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
      // Dialog will handle the error state
    }
  }

  const toggleExpanded = React.useCallback((itemName: string, hasSubItems: boolean) => {
    if (isTransitioningRef.current) return // Prevent rapid state changes
    
    isTransitioningRef.current = true
    setIsTransitioning(true)
    
    if (!hasSubItems) {
      // For items without sub-items, close all sections
      setExpandedItems([])
    } else {
      // For items with sub-items, toggle just this section
      setExpandedItems(prev => 
        prev.includes(itemName)
          ? prev.filter(name => name !== itemName) // Close this section if open
          : [...prev, itemName] // Add this section to open sections
      )
    }
    
    // Reset transitioning state after a short delay
    setTimeout(() => {
      setIsTransitioning(false)
      isTransitioningRef.current = false
    }, 150)
  }, [])


  return (
    <div className="min-h-screen bg-background pt-8">
      <div className="grid min-h-screen md:grid-cols-[280px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full flex-col">
            {/* Fixed height header */}
            <div className="h-14 flex-shrink-0 border-b flex items-center px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">UF</span>
                </div>
                <span className="text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">USD Financial</span>
              </Link>
            </div>
            
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <nav className="grid gap-2 px-2 py-4">
                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <NavLink 
                      key={item.href || item.name} 
                      item={item} 
                      pathname={pathname}
                      expandedItems={expandedItems}
                      toggleExpanded={toggleExpanded}
                      isTransitioning={isTransitioning}
                    />
                  ))}
                </div>
              </nav>
            </div>
          </div>
        </aside>

        <div className="flex flex-col">
          {/* Mobile Header */}
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <div className="flex items-center gap-2 font-semibold mb-6">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">UF</span>
                  </div>
                  <span className="text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">USD Financial</span>
                </div>
                <nav className="grid gap-2 text-lg font-medium">
                  {navigationItems.map((item) => (
                    <NavLink 
                      key={item.href || item.name} 
                      item={item} 
                      mobile 
                      pathname={pathname}
                      expandedItems={expandedItems}
                      toggleExpanded={toggleExpanded}
                      isTransitioning={isTransitioning}
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <div className="h-6 w-6 rounded bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">UF</span>
                </div>
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">USD Financial</span>
              </Link>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDemoControlPanelOpen(true)}
              className="hidden sm:flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <Play className="h-4 w-4" />
              Demo
            </Button>
            <SessionStatusIndicator className="hidden sm:flex" showExtendButton={false} />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-200">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-semibold">
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {fullUserData?.accountType === 'premium' && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Star className="h-2.5 w-2.5 text-white fill-current" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  {/* User Profile Header */}
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-semibold text-lg">
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                        {fullUserData?.accountType === 'premium' && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs border-0">
                            Premium
                          </Badge>
                        )}
                        {fullUserData?.accountType === 'business' && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs border-0">
                            Business
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate">{user.email}</p>
                      {userDisplayValues && (
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-xs">
                            <span className="text-slate-500">Balance:</span>
                            <span className="font-semibold text-emerald-600 ml-1">
                              {userDisplayValues?.formattedBalance}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-slate-500">Gain:</span>
                            <span className="font-semibold text-green-600 ml-1">
                              {userDisplayValues?.formattedGain}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push('/profile')}
                    >
                      <UserCircle className="mr-3 h-4 w-4 text-slate-500" />
                      <span className="font-medium">Profile & Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push('/settings')}
                    >
                      <Settings className="mr-3 h-4 w-4 text-slate-500" />
                      <span className="font-medium">Settings & Preferences</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push('/kyc')}
                    >
                      <Shield className="mr-3 h-4 w-4 text-slate-500" />
                      <span className="font-medium">Identity Verification</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push('/notifications')}
                    >
                      <Bell className="mr-3 h-4 w-4 text-slate-500" />
                      <span className="font-medium">Notifications</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                      onClick={handleLogoutClick}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="font-medium">Sign Out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          {/* Desktop Header with User Menu */}
          <header className="hidden md:flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <div className="w-full flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDemoControlPanelOpen(true)}
              className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <Play className="h-4 w-4" />
              Demo Controls
            </Button>
            <SessionStatusIndicator />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-auto rounded-full border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-200 px-3 gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-semibold">
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                        {user.name}
                      </span>
                      {userDisplayValues && (
                        <span className="text-xs text-emerald-600 font-semibold">
                          ${fullUserData.balance.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {fullUserData?.accountType === 'premium' && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Star className="h-2.5 w-2.5 text-white fill-current" />
                      </div>
                    )}
                    {fullUserData?.accountType === 'business' && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <Building2 className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  {/* User Profile Header */}
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-semibold text-lg">
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                        {fullUserData?.accountType === 'premium' && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs border-0">
                            Premium
                          </Badge>
                        )}
                        {fullUserData?.accountType === 'business' && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs border-0">
                            Business
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate">{user.email}</p>
                      {userDisplayValues && (
                        <div className="flex items-center gap-4 mt-2">
                          <div className="text-xs">
                            <span className="text-slate-500">Balance:</span>
                            <span className="font-semibold text-emerald-600 ml-1">
                              {userDisplayValues?.formattedBalance}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-slate-500">Monthly Gain:</span>
                            <span className="font-semibold text-green-600 ml-1">
                              {userDisplayValues?.formattedGain}
                            </span>
                          </div>
                        </div>
                      )}
                      {userDisplayValues && (
                        <div className="flex items-center gap-4 mt-1">
                          <div className="text-xs">
                            <span className="text-slate-500">Risk Score:</span>
                            <span className="font-semibold text-blue-600 ml-1">
                              {fullUserData.portfolio.riskScore}/100
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-slate-500">Currency:</span>
                            <span className="font-semibold text-slate-700 ml-1">
                              {fullUserData.preferences.currency}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push('/profile')}
                    >
                      <UserCircle className="mr-3 h-4 w-4 text-slate-500" />
                      <span className="font-medium">Profile & Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push('/settings')}
                    >
                      <Settings className="mr-3 h-4 w-4 text-slate-500" />
                      <span className="font-medium">Settings & Preferences</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push('/kyc')}
                    >
                      <Shield className="mr-3 h-4 w-4 text-slate-500" />
                      <span className="font-medium">Identity Verification</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => router.push('/notifications')}
                    >
                      <Bell className="mr-3 h-4 w-4 text-slate-500" />
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">Notifications</span>
                        {fullUserData?.preferences.notifications && (
                          <Badge variant="secondary" className="text-xs">On</Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                    {fullUserData?.accountType === 'business' && (
                      <DropdownMenuItem className="px-4 py-3 cursor-pointer hover:bg-slate-50">
                        <Building2 className="mr-3 h-4 w-4 text-slate-500" />
                        <span className="font-medium">Business Platform</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="px-4 py-3 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                      onClick={handleLogoutClick}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="font-medium">Sign Out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          {/* Main Content */}
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
            {children}
          </main>
        </div>
      </div>

      {/* Profile & Account Modal */}
      <ProfileAccountModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />


      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        isOpen={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        onConfirmLogout={handleConfirmLogout}
        userEmail={user?.email}
        userName={fullUserData?.name}
      />

      {/* Demo Control Panel */}
      <DemoControlPanel
        isOpen={isDemoControlPanelOpen}
        onClose={() => setIsDemoControlPanelOpen(false)}
      />
    </div>
  )
}