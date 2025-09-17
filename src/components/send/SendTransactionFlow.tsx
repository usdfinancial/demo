'use client'

import React, { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle, AlertCircle, Loader2, Send, Zap, Shield, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'

export interface SendTransactionData {
  recipient: string
  amount: string
  stablecoin: StablecoinSymbol
  message?: string
  recipientName?: string
  useGasless: boolean
  selectedNetwork?: string
}

interface SendTransactionFlowProps {
  transactionData: SendTransactionData
  onConfirm: () => void
  onCancel: () => void
  isOpen: boolean
}

type TransactionStep = 'confirm' | 'processing' | 'success' | 'error'

export function SendTransactionFlow({ 
  transactionData, 
  onConfirm, 
  onCancel, 
  isOpen 
}: SendTransactionFlowProps) {
  const { user, sendGaslessTransaction, sendUSDC, smartAccountAddress } = useEnhancedAuth()
  const [currentStep, setCurrentStep] = useState<TransactionStep>('confirm')
  const [progress, setProgress] = useState(0)
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [estimatedTime, setEstimatedTime] = useState('10-15 seconds')

  const networkFee = transactionData.useGasless ? 0 : 0.50
  const totalAmount = parseFloat(transactionData.amount) + networkFee

  // Reset modal state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Resetting transaction flow state for new transaction')
      setCurrentStep('confirm')
      setProgress(0)
      setTransactionHash('')
      setError('')
      setEstimatedTime('10-15 seconds')
    }
  }, [isOpen])

  useEffect(() => {
    if (currentStep === 'processing') {
      // Simulate transaction progress
      const intervals = [
        { time: 500, progress: 20, message: 'Validating transaction...' },
        { time: 1500, progress: 40, message: 'Preparing smart wallet...' },
        { time: 3000, progress: 60, message: 'Broadcasting to network...' },
        { time: 5000, progress: 80, message: 'Confirming on blockchain...' },
        { time: 8000, progress: 100, message: 'Transaction complete!' },
      ]

      const timeoutIds: NodeJS.Timeout[] = []

      intervals.forEach(({ time, progress: prog }) => {
        const timeoutId = setTimeout(() => setProgress(prog), time)
        timeoutIds.push(timeoutId)
      })

      // Complete transaction
      const transactionTimeoutId = setTimeout(() => {
        handleTransaction()
      }, 8500)
      timeoutIds.push(transactionTimeoutId)

      // Cleanup function to clear all timeouts
      return () => {
        timeoutIds.forEach(id => clearTimeout(id))
      }
    }
  }, [currentStep])

  const handleTransaction = async () => {
    try {
      if (transactionData.useGasless && transactionData.stablecoin === 'USDC' && sendUSDC) {
        console.log('💰 Attempting USDC gasless transaction via Alchemy Account Kit...')
        
        // Use specialized USDC transfer method
        const result = await sendUSDC(
          transactionData.recipient,
          transactionData.amount,
          transactionData.selectedNetwork
        )
        
        // Extract real transaction hash from result - try multiple possible field names
        const realTxHash = result?.hash || result?.transactionHash || result?.txHash || 
                          result?.receipt?.transactionHash || result?.wait?.hash
        
        console.log('🔍 Transaction result from Alchemy:', {
          result,
          extractedHash: realTxHash,
          resultKeys: Object.keys(result || {})
        })
        
        // Validate transaction hash format (0x followed by 64 hex characters)
        const isValidTxHash = realTxHash && 
                             typeof realTxHash === 'string' && 
                             realTxHash.startsWith('0x') && 
                             realTxHash.length === 66 &&
                             /^0x[0-9a-fA-F]{64}$/.test(realTxHash)
        
        if (isValidTxHash) {
          console.log('✅ Valid transaction hash received:', realTxHash)
          setTransactionHash(realTxHash)
          setCurrentStep('success')
        } else {
          console.warn('⚠️ Invalid or missing transaction hash from Alchemy:', {
            hash: realTxHash,
            isValid: isValidTxHash,
            result
          })
          
          // Check if transaction was actually sent but hash format is wrong
          if (result && (result.success || result.status === 'success')) {
            setTransactionHash('')
            setError('Transaction may have been sent successfully, but transaction hash could not be verified. Please check your wallet or block explorer manually.')
            setCurrentStep('success')
          } else {
            setError('Transaction failed: Unable to get valid transaction hash from network')
            setCurrentStep('error')
          }
        }
      } else if (transactionData.useGasless && sendGaslessTransaction) {
        console.log('🔄 Attempting generic gasless transaction via Alchemy Account Kit...')
        
        // Fallback to generic gasless transaction for non-USDC tokens
        const result = await sendGaslessTransaction(
          transactionData.recipient,
          transactionData.amount
        )
        
        // Extract real transaction hash from result - try multiple possible field names
        const realTxHash = result?.hash || result?.transactionHash || result?.txHash || 
                          result?.receipt?.transactionHash || result?.wait?.hash
        
        console.log('🔍 Transaction result from Alchemy:', {
          result,
          extractedHash: realTxHash,
          resultKeys: Object.keys(result || {})
        })
        
        // Validate transaction hash format (0x followed by 64 hex characters)
        const isValidTxHash = realTxHash && 
                             typeof realTxHash === 'string' && 
                             realTxHash.startsWith('0x') && 
                             realTxHash.length === 66 &&
                             /^0x[0-9a-fA-F]{64}$/.test(realTxHash)
        
        if (isValidTxHash) {
          console.log('✅ Valid transaction hash received:', realTxHash)
          setTransactionHash(realTxHash)
          setCurrentStep('success')
        } else {
          console.warn('⚠️ Invalid or missing transaction hash from Alchemy:', {
            hash: realTxHash,
            isValid: isValidTxHash,
            result
          })
          
          // Check if transaction was actually sent but hash format is wrong
          if (result && (result.success || result.status === 'success')) {
            setTransactionHash('')
            setError('Transaction may have been sent successfully, but transaction hash could not be verified. Please check your wallet or block explorer manually.')
            setCurrentStep('success')
          } else {
            setError('Transaction failed: Unable to get valid transaction hash from network')
            setCurrentStep('error')
          }
        }
      } else {
        // For non-gasless transactions, we need to implement proper transaction sending
        console.warn('⚠️ Non-gasless transactions not fully implemented yet')
        setError('Regular transactions require additional setup. Please use gasless transactions for now.')
        setCurrentStep('error')
      }
    } catch (err) {
      console.error('❌ Transaction failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      
      // Check if it's a user rejection or network issue
      if (errorMessage.includes('User rejected') || errorMessage.includes('denied')) {
        setError('Transaction was cancelled by user')
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient balance to complete transaction')
      } else if (errorMessage.includes('network') || errorMessage.includes('RPC')) {
        setError('Network connection issue. Please try again.')
      } else {
        setError(errorMessage)
      }
      
      setCurrentStep('error')
    }
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getBlockExplorerUrl = (txHash: string): { url: string; name: string } => {
    const explorers = {
      'Ethereum Sepolia': { url: `https://sepolia.etherscan.io/tx/${txHash}`, name: 'Etherscan' },
      'Arbitrum Sepolia': { url: `https://sepolia.arbiscan.io/tx/${txHash}`, name: 'Arbiscan' },
      'Base Sepolia': { url: `https://sepolia.basescan.org/tx/${txHash}`, name: 'Basescan' },
      'OP Sepolia': { url: `https://sepolia-optimism.etherscan.io/tx/${txHash}`, name: 'Optimism Etherscan' },
      'Polygon Amoy Testnet': { url: `https://amoy.polygonscan.com/tx/${txHash}`, name: 'Polygonscan' },
      'Avalanche Fuji': { url: `https://testnet.snowtrace.io/tx/${txHash}`, name: 'Snowtrace' }
    }
    
    // Get network from transaction data or default to Ethereum Sepolia
    const networkName = transactionData.selectedNetwork || 'Ethereum Sepolia'
    return explorers[networkName as keyof typeof explorers] || explorers['Ethereum Sepolia']
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // TODO: Add toast notification for copy success
      console.log('Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const getStepIcon = () => {
    switch (currentStep) {
      case 'confirm':
        return <Send className="h-6 w-6 text-emerald-600" />
      case 'processing':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100">
            {getStepIcon()}
          </div>
          <CardTitle className="text-xl">
            {currentStep === 'confirm' && 'Confirm Transaction'}
            {currentStep === 'processing' && 'Processing Transaction'}
            {currentStep === 'success' && 'Transaction Sent!'}
            {currentStep === 'error' && 'Transaction Failed'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'confirm' && 'Review your transaction details before sending'}
            {currentStep === 'processing' && `Estimated completion: ${estimatedTime}`}
            {currentStep === 'success' && 'Your stablecoins have been sent successfully'}
            {currentStep === 'error' && 'Something went wrong with your transaction'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 'processing' && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-slate-600">
                {progress < 20 && 'Validating transaction...'}
                {progress >= 20 && progress < 40 && 'Preparing smart wallet...'}
                {progress >= 40 && progress < 60 && 'Broadcasting to network...'}
                {progress >= 60 && progress < 80 && 'Confirming on blockchain...'}
                {progress >= 80 && 'Almost done...'}
              </p>
            </div>
          )}

          {/* Transaction Details */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">To:</span>
              <div className="text-right">
                <div className="font-medium">
                  {transactionData.recipientName || shortenAddress(transactionData.recipient)}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {shortenAddress(transactionData.recipient)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Amount:</span>
              <div className="text-right">
                <div className="font-semibold text-lg">
                  {formatCurrency(parseFloat(transactionData.amount))}
                </div>
                <div className="text-xs text-slate-500">
                  {transactionData.amount} {transactionData.stablecoin}
                </div>
              </div>
            </div>

            {transactionData.message && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-slate-600">Message:</span>
                <div className="text-right max-w-48">
                  <div className="text-sm italic">"{transactionData.message}"</div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Network Fee:</span>
                <span className="text-sm font-medium">
                  {transactionData.useGasless ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      <Zap className="h-3 w-3 mr-1" />
                      FREE
                    </Badge>
                  ) : (
                    formatCurrency(networkFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total Cost:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          {currentStep === 'confirm' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">USD Financial Security</span>
              </div>
              <ul className="text-xs text-emerald-600 space-y-1">
                <li>• Transaction is secured by smart contract technology</li>
                <li>• Your wallet address: {shortenAddress(smartAccountAddress || '')}</li>
                {transactionData.useGasless && <li>• Zero gas fees with Account Abstraction</li>}
              </ul>
            </div>
          )}

          {/* Success Details */}
          {currentStep === 'success' && transactionHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-green-700">Transaction Confirmed!</p>
                <p className="text-sm text-green-600">
                  Your USDC has been sent successfully
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-green-700 mb-2">Transaction Hash:</p>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-xs bg-white p-3 rounded border flex-1 break-all">
                      {transactionHash}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(transactionHash)}
                      className="p-2 h-auto"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {transactionHash.startsWith('0x') && transactionHash.length === 66 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const explorer = getBlockExplorerUrl(transactionHash)
                        window.open(explorer.url, '_blank')
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View on {getBlockExplorerUrl(transactionHash).name}
                    </Button>
                  </div>
                )}
                
                {(!transactionHash.startsWith('0x') || transactionHash.length !== 66) && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    This appears to be a test transaction. Real transactions will show valid explorer links.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Details */}
          {currentStep === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
              <p className="text-red-600 text-xs mt-2">
                Please try again or contact support if the problem persists.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {currentStep === 'confirm' && (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500"
                  onClick={() => setCurrentStep('processing')}
                >
                  Confirm Send
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {currentStep === 'processing' && (
              <Button 
                variant="outline" 
                className="flex-1"
                disabled
              >
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </Button>
            )}

            {(currentStep === 'success' || currentStep === 'error') && (
              <Button 
                className="flex-1"
                onClick={onConfirm}
              >
                {currentStep === 'success' ? 'Done' : 'Try Again'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}