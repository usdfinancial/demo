'use client'

import { useState } from 'react'
import { Copy, QrCode, AlertCircle, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Network {
  id: string
  name: string
  displayName: string
  address: string
  minimumDeposit: number
  estimatedTime: string
  fee: string
  icon: string
}

interface DepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  networks: Network[]
  selectedAsset?: {
    name: string
    symbol: string
    icon: string
  }
}

export function DepositModal({ open, onOpenChange, networks, selectedAsset }: DepositModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]?.id || '')
  const [showQR, setShowQR] = useState(false)

  const currentNetwork = networks.find(n => n.id === selectedNetwork)

  const copyAddress = () => {
    if (currentNetwork) {
      navigator.clipboard.writeText(currentNetwork.address)
    }
  }

  const generateQRCode = (address: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {selectedAsset?.icon ? (
              <span className="text-3xl">{selectedAsset.icon}</span>
            ) : (
              <span className="text-3xl">💰</span>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Add {selectedAsset?.symbol || 'Money'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">Send {selectedAsset?.symbol || 'funds'} to your wallet address</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={selectedNetwork} onValueChange={setSelectedNetwork}>
            <TabsList className="grid w-full grid-cols-2">
              {networks.slice(0, 2).map((network) => (
                <TabsTrigger key={network.id} value={network.id}>
                  <span className="mr-2">{network.icon}</span>
                  {network.displayName}
                </TabsTrigger>
              ))}
            </TabsList>

            {networks.map((network) => (
              <TabsContent key={network.id} value={network.id} className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Important:</strong> Only send {selectedAsset?.symbol || 'supported assets'} on {network.name} network. 
                    Minimum amount: ${network.minimumDeposit}
                  </AlertDescription>
                </Alert>

                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">Your Wallet Address</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm">{network.icon}</span>
                          <p className="text-sm font-medium text-gray-600">{network.name}</p>
                        </div>
                      </div>
                      <Button
                        variant={showQR ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowQR(!showQR)}
                        className="rounded-xl"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {showQR ? 'Hide QR' : 'Show QR'}
                      </Button>
                    </div>

                    {showQR && (
                      <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border">
                          <img
                            src={generateQRCode(network.address)}
                            alt="QR Code"
                            className="w-44 h-44 rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 mb-6">
                      <p className="font-mono text-sm text-gray-800 break-all text-center leading-relaxed">{network.address}</p>
                    </div>

                    <Button
                      onClick={copyAddress}
                      className="w-full mb-6 h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                    >
                      <Copy className="h-5 w-5 mr-2" />
                      Copy Address
                    </Button>

                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <p className="font-semibold text-emerald-800">Transaction Info</p>
                      </div>
                      <p className="text-sm text-emerald-700">⏱️ Estimated arrival: {network.estimatedTime}</p>
                      <p className="text-sm text-emerald-700">🔒 Secure blockchain transaction</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-center gap-3 mt-6">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}