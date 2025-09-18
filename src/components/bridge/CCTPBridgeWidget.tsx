'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, ArrowDown, Clock, Shield, ExternalLink, CheckCircle, AlertTriangle, RefreshCw, Copy, Wallet, Info, DollarSign, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { NotificationModal } from '@/components/ui/NotificationModal';
import useCCTP from '@/hooks/useCCTP';
// import { useAlchemyCCTP } from '@/lib/blockchain/cctpAlchemyIntegration';
import { CCTPNetwork, CCTP_TESTNET_CONTRACTS } from '@/lib/blockchain/stablecoin/cctpAdapter';
import { getCircleApiStatus, formatCircleApiStatusForUI } from '@/lib/utils/circleApiStatus';

const cctpNetworks = [
  { 
    id: 'sepolia' as CCTPNetwork, 
    name: 'Sepolia', 
    icon: '🔧', 
    chainId: 11155111,
    explorer: 'https://sepolia.etherscan.io',
    estimatedTime: '12-15 min',
    gasPrice: 'Low'
  },
  { 
    id: 'fuji' as CCTPNetwork, 
    name: 'Avalanche Fuji', 
    icon: '🏔️', 
    chainId: 43113,
    explorer: 'https://testnet.snowtrace.io',
    estimatedTime: '8-12 min',
    gasPrice: 'Very Low'
  },
  { 
    id: 'arbitrumSepolia' as CCTPNetwork, 
    name: 'Arbitrum Sepolia', 
    icon: '🔵', 
    chainId: 421614,
    explorer: 'https://sepolia.arbiscan.io',
    estimatedTime: '10-15 min',
    gasPrice: 'Low'
  },
  { 
    id: 'optimismSepolia' as CCTPNetwork, 
    name: 'OP Sepolia', 
    icon: '🔴', 
    chainId: 11155420,
    explorer: 'https://sepolia-optimism.etherscan.io',
    estimatedTime: '8-12 min',
    gasPrice: 'Low'
  },
  { 
    id: 'baseSepolia' as CCTPNetwork, 
    name: 'Base Sepolia', 
    icon: '🔷', 
    chainId: 84532,
    explorer: 'https://sepolia.basescan.org',
    estimatedTime: '6-10 min',
    gasPrice: 'Very Low'
  }
];

interface CCTPBridgeWidgetProps {
  className?: string;
  onTransferComplete?: (txHash: string) => void;
}

export function CCTPBridgeWidget({ className = '', onTransferComplete }: CCTPBridgeWidgetProps) {
  const [cctpState, cctpActions] = useCCTP();
  // const alchemyCCTP = useAlchemyCCTP();
  
  // Mock alchemyCCTP for demo purposes
  const alchemyCCTP = {
    isConnected: true,
    account: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A',
    chainId: 11155111,
    gasBalance: '1.5',
    initiateCCTPTransfer: async (params: any) => {
      console.log('Demo CCTP Transfer:', params);
      return { transferId: 'demo-transfer-123', steps: [], result: {} };
    },
    getUSDCBalance: async (network: string) => '1250.50',
    getGasBalance: async () => '1.5',
    switchToNetwork: async (network: string) => console.log('Demo: Switching to', network)
  };
  const [fromNetwork, setFromNetwork] = useState<CCTPNetwork>('sepolia');
  const [toNetwork, setToNetwork] = useState<CCTPNetwork>('fuji');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferResult, setTransferResult] = useState<{
    success: boolean;
    txHash?: string;
    message: string;
    details: string[];
  } | null>(null);

  // Get Circle API status
  const circleApiStatus = getCircleApiStatus();
  const circleApiUI = formatCircleApiStatusForUI(circleApiStatus);

  // Helper functions
  const swapNetworks = () => {
    const temp = fromNetwork;
    setFromNetwork(toNetwork);
    setToNetwork(temp);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getNetworkDetails = (networkId: CCTPNetwork) => {
    return cctpNetworks.find(n => n.id === networkId);
  };

  const calculateTransferTime = () => {
    const fromNet = getNetworkDetails(fromNetwork);
    const toNet = getNetworkDetails(toNetwork);
    if (!fromNet || !toNet) return '15-20 min';
    
    const avgFromTime = parseInt(fromNet.estimatedTime.split('-')[0]);
    const avgToTime = parseInt(toNet.estimatedTime.split('-')[0]);
    const totalMin = avgFromTime + avgToTime + 5; // +5 for attestation
    const totalMax = totalMin + 8;
    return `${totalMin}-${totalMax} min`;
  };

  const calculateFees = () => {
    const fromNet = getNetworkDetails(fromNetwork);
    const amount_num = parseFloat(amount) || 0;
    
    if (!fromNet || amount_num === 0) return { gas: '~$0.50', bridge: '$0.00', total: '~$0.50' };
    
    let gasEstimate = 0.5;
    switch (fromNet.gasPrice) {
      case 'Very Low': gasEstimate = 0.1; break;
      case 'Low': gasEstimate = 0.3; break;
      case 'Medium': gasEstimate = 0.8; break;
      case 'High': gasEstimate = 1.5; break;
    }
    
    return {
      gas: `~$${gasEstimate.toFixed(2)}`,
      bridge: '$0.00',
      total: `~$${gasEstimate.toFixed(2)}`
    };
  };

  const handleTransfer = async () => {
    if (!amount || !recipient) return;

    try {
      // Check if Alchemy Account Kit is connected
      if (!alchemyCCTP.isConnected) {
        throw new Error('Please connect your wallet first');
      }

      // Show initial guidance
      console.log('🚀 Starting CCTP transfer...', {
        amount: `${amount} USDC`,
        from: getNetworkDetails(fromNetwork)?.name,
        to: getNetworkDetails(toNetwork)?.name,
        recipient: formatAddress(recipient)
      });

      // Use Alchemy integration for CCTP transfer
      const result = await alchemyCCTP.initiateCCTPTransfer({
        amount,
        fromNetwork,
        toNetwork,
        recipient
      });

      // Show success modal
      setTransferResult({
        success: true,
        txHash: result.transferId,
        message: `CCTP transfer initiated successfully`,
        details: [
          `Amount: ${amount} USDC`,
          `From: ${getNetworkDetails(fromNetwork)?.name}`,
          `To: ${getNetworkDetails(toNetwork)?.name}`,
          `Recipient: ${formatAddress(recipient)}`,
          `Transfer ID: ${result.transferId}`,
          `Estimated Time: ${calculateTransferTime()}`,
          `Status: Burn transaction submitted`
        ]
      });
      setShowTransferModal(true);

      console.log('🎉 CCTP transfer completed successfully!', result);
    } catch (error) {
      console.error('❌ Transfer failed:', error);
      
      // Show error modal
      let errorMessage = 'Transfer failed. Please try again.';
      let errorDetails = ['Please check your connection and try again'];
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient USDC balance')) {
          errorMessage = 'Insufficient USDC balance';
          errorDetails = [
            'Please ensure you have enough USDC in your wallet',
            `Required: ${amount} USDC`,
            `Available: ${cctpState.balances[fromNetwork] || '0'} USDC`,
            'Add more USDC to your wallet and try again'
          ];
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction cancelled by user';
          errorDetails = [
            'You cancelled the transaction in your wallet',
            'No funds were transferred',
            'You can try again when ready'
          ];
        } else if (error.message.includes('gas')) {
          errorMessage = 'Insufficient gas fees';
          errorDetails = [
            'Not enough ETH for gas fees',
            `Current gas balance: ${alchemyCCTP.gasBalance} ETH`,
            'Add testnet ETH to your wallet',
            'Visit https://sepoliafaucet.com/ for free testnet ETH'
          ];
        }
      }
      
      setTransferResult({
        success: false,
        message: errorMessage,
        details: errorDetails
      });
      setShowTransferModal(true);
    }
  };

  const handleCompleteMint = async () => {
    try {
      // In a real implementation, you would get the destination signer
      const mockToSigner = {} as any; // This would be replaced with actual wallet signer
      
      await cctpActions.completeMint(mockToSigner);
      
      if (onTransferComplete && cctpState.currentTransfer?.result.destinationTxHash) {
        onTransferComplete(cctpState.currentTransfer.result.destinationTxHash);
      }
    } catch (error) {
      console.error('Mint completion failed:', error);
    }
  };

  const handleRefreshBalance = async () => {
    if (alchemyCCTP.isConnected && alchemyCCTP.account) {
      try {
        await cctpActions.refreshBalance(alchemyCCTP.account, fromNetwork);
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }
  };

  // Auto-populate recipient with connected wallet address
  useEffect(() => {
    if (alchemyCCTP.isConnected && alchemyCCTP.account && !recipient) {
      setRecipient(alchemyCCTP.account);
    }
  }, [alchemyCCTP.isConnected, alchemyCCTP.account, recipient]);

  // Load all balances when wallet connects (initial load)
  useEffect(() => {
    let isCancelled = false;
    
    const loadAllBalances = async () => {
      if (alchemyCCTP.isConnected && alchemyCCTP.account && !isCancelled) {
        try {
          console.log('🔄 Loading balances for all CCTP networks...');
          await cctpActions.refreshAllBalances(alchemyCCTP.account);
          if (!isCancelled) {
            console.log('✅ All CCTP network balances loaded');
          }
        } catch (error) {
          if (!isCancelled) {
            console.error('Failed to load all balances:', error);
          }
        }
      }
    };

    loadAllBalances();
    
    return () => {
      isCancelled = true;
    };
  }, [alchemyCCTP.isConnected, alchemyCCTP.account]);

  // Load balances for specific networks when they change
  useEffect(() => {
    let isCancelled = false;
    
    const loadSpecificBalances = async () => {
      if (alchemyCCTP.isConnected && alchemyCCTP.account && !isCancelled) {
        try {
          // Only load if we don't already have the balance
          const promises = [];
          if (!cctpState.balances[fromNetwork]) {
            promises.push(cctpActions.refreshBalance(alchemyCCTP.account, fromNetwork));
          }
          if (!cctpState.balances[toNetwork] && fromNetwork !== toNetwork) {
            promises.push(cctpActions.refreshBalance(alchemyCCTP.account, toNetwork));
          }
          
          if (promises.length > 0) {
            await Promise.all(promises);
          }
        } catch (error) {
          if (!isCancelled) {
            console.error('Failed to load specific network balances:', error);
          }
        }
      }
    };

    loadSpecificBalances();
    
    return () => {
      isCancelled = true;
    };
  }, [fromNetwork, toNetwork, alchemyCCTP.isConnected, alchemyCCTP.account]);

  // Validate transfer parameters with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;
    
    if (amount && recipient && parseFloat(amount) > 0) {
      timeoutId = setTimeout(() => {
        if (isCancelled) return;
        
        const validateAsync = async () => {
          try {
            const userAddress = alchemyCCTP.account || '0x0000000000000000000000000000000000000000';
            const result = await cctpActions.validateTransfer({
              amount,
              fromNetwork,
              toNetwork,
              recipient
            }, userAddress);
            
            if (!isCancelled) {
              setValidation(result);
            }
          } catch (error) {
            if (!isCancelled) {
              console.error('Validation failed:', error);
              setValidation({
                isValid: false,
                errors: ['Validation failed'],
                warnings: []
              });
            }
          }
        };
        
        validateAsync();
      }, 500); // Debounce for 500ms
    } else {
      setValidation(null);
    }
    
    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [amount, recipient, fromNetwork, toNetwork, alchemyCCTP.account]);

  const getStepProgress = () => {
    if (!cctpState.currentTransfer) return 0;
    
    const completedSteps = cctpState.currentTransfer.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / cctpState.currentTransfer.steps.length) * 100;
  };

  const getCurrentStep = () => {
    if (!cctpState.currentTransfer) return null;
    
    return cctpState.currentTransfer.steps.find(step => 
      step.status === 'processing' || (step.status === 'pending' && 
      cctpState.currentTransfer!.steps.every(s => s.id !== step.id || s.status !== 'processing'))
    );
  };

  const isReadyForMint = () => {
    return cctpState.currentTransfer?.attestationSignature && 
           cctpState.currentTransfer.steps.find(step => step.id === 'attestation')?.status === 'completed';
  };

  const getExplorerUrl = (txHash: string, network: CCTPNetwork) => {
    const networkDetails = getNetworkDetails(network);
    return `${networkDetails?.explorer}/tx/${txHash}`;
  };

  const getCurrentStepGuidance = () => {
    const currentStep = getCurrentStep();
    if (!currentStep) return null;

    const guidanceMap: Record<string, string> = {
      'approval': 'Please approve the transaction in your wallet to allow USDC spending.',
      'burn': 'Your USDC is being burned on the source network. This may take a few minutes.',
      'attestation': 'Circle is validating your burn transaction. This typically takes 10-15 minutes.',
      'mint': 'Ready to mint! Click "Complete Transfer" to receive your USDC on the destination network.'
    };

    return guidanceMap[currentStep.id] || currentStep.description;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Transfer Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔵</span>
            <span>Circle CCTP Bridge</span>
            <Badge className="bg-blue-100 text-blue-800">
              <Shield className="h-3 w-3 mr-1" />
              Native USDC
            </Badge>
          </CardTitle>
          <CardDescription>
            Transfer USDC securely across blockchains using Circle's Cross-Chain Transfer Protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Connection Status */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${alchemyCCTP.isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">
                      {alchemyCCTP.isConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
                    </span>
                  </div>
                  {alchemyCCTP.isConnected && alchemyCCTP.account && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-600">
                        {formatAddress(alchemyCCTP.account)}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(alchemyCCTP.account || '')}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <Copy className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  )}
                  {alchemyCCTP.isConnected && (
                    <div className="flex items-center space-x-2 mt-1">
                      <Zap className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-600">
                        Gas: {alchemyCCTP.gasBalance ? `${parseFloat(alchemyCCTP.gasBalance).toFixed(6)} ETH` : 'Loading...'}
                      </span>
                      <button 
                        onClick={alchemyCCTP.getGasBalance}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <RefreshCw className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {alchemyCCTP.isConnected && (
                <Badge className={
                  parseFloat(alchemyCCTP.gasBalance || '0') === 0 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }>
                  {parseFloat(alchemyCCTP.gasBalance || '0') === 0 ? (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      No Gas
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready
                    </>
                  )}
                </Badge>
              )}
            </div>
            
            {/* Gas Balance Warning */}
            {alchemyCCTP.isConnected && parseFloat(alchemyCCTP.gasBalance || '0') === 0 && (
              <Alert className="border-yellow-200 bg-yellow-50 mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  <strong>No ETH for gas fees.</strong> Send testnet ETH to your smart account{' '}
                  <code className="bg-yellow-100 px-1 rounded text-xs">{formatAddress(alchemyCCTP.account || '')}</code>{' '}
                  from <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Sepolia Faucet</a>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Network Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <ArrowLeftRight className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Select Networks</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Network</label>
                <Select value={fromNetwork} onValueChange={(value) => {
                  const newFromNetwork = value as CCTPNetwork;
                  setFromNetwork(newFromNetwork);
                  // If the new fromNetwork is the same as toNetwork, find a different toNetwork
                  if (newFromNetwork === toNetwork) {
                    const availableToNetworks = cctpNetworks.filter(n => n.id !== newFromNetwork);
                    if (availableToNetworks.length > 0) {
                      setToNetwork(availableToNetworks[0].id);
                    }
                  }
                }}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cctpNetworks.map((network) => (
                      <SelectItem key={network.id} value={network.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{network.icon}</span>
                            <div>
                              <div className="font-medium">{network.name}</div>
                              <div className="text-xs text-gray-500">Chain ID: {network.chainId}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">{network.gasPrice} fees</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Network Details */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chain ID:</span>
                    <span className="font-medium">{getNetworkDetails(fromNetwork)?.chainId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="font-medium">{getNetworkDetails(fromNetwork)?.estimatedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gas Price:</span>
                    <span className="font-medium">{getNetworkDetails(fromNetwork)?.gasPrice}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center mt-6">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={swapNetworks}
                  className="h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 hover:text-blue-700 transition-all shadow-sm"
                  title="Swap networks"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Network</label>
                <Select value={toNetwork} onValueChange={(value) => {
                  const newToNetwork = value as CCTPNetwork;
                  setToNetwork(newToNetwork);
                  // If the new toNetwork is the same as fromNetwork, find a different fromNetwork
                  if (newToNetwork === fromNetwork) {
                    const availableFromNetworks = cctpNetworks.filter(n => n.id !== newToNetwork);
                    if (availableFromNetworks.length > 0) {
                      setFromNetwork(availableFromNetworks[0].id);
                    }
                  }
                }}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cctpNetworks.filter(n => n.id !== fromNetwork).map((network) => (
                      <SelectItem key={network.id} value={network.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{network.icon}</span>
                            <div>
                              <div className="font-medium">{network.name}</div>
                              <div className="text-xs text-gray-500">Chain ID: {network.chainId}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">{network.gasPrice} fees</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Network Details */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chain ID:</span>
                    <span className="font-medium">{getNetworkDetails(toNetwork)?.chainId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="font-medium">{getNetworkDetails(toNetwork)?.estimatedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gas Price:</span>
                    <span className="font-medium">{getNetworkDetails(toNetwork)?.gasPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Input Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Transfer Amount</span>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg h-12 pl-20 pr-16 border-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 pointer-events-none bg-white">
                  <span className="text-lg">💠</span>
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">USDC</span>
                </div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <button 
                    onClick={() => setAmount(cctpState.balances[fromNetwork] || '0')}
                    disabled={!cctpState.balances[fromNetwork] || parseFloat(cctpState.balances[fromNetwork]) === 0}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-blue-50 transition-colors bg-white border border-gray-200"
                  >
                    MAX
                  </button>
                </div>
              </div>
              
              {/* Balance and Value Display */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Available Balance:</span>
                  <div className="flex items-center space-x-2">
                    {cctpState.isLoading.balance ? (
                      <div className="flex items-center space-x-1">
                        <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
                        <span className="text-sm text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{cctpState.balances[fromNetwork] || '0.00'} USDC</span>
                        <button 
                          onClick={handleRefreshBalance}
                          disabled={!alchemyCCTP.isConnected}
                          className="p-1 hover:bg-white rounded transition-colors disabled:opacity-50"
                          title="Refresh balance"
                        >
                          <RefreshCw className="h-3 w-3 text-gray-500" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transfer Value:</span>
                    <span className="font-medium">${parseFloat(amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transfer Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Transfer Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Estimated Time:</span>
                  <span className="font-medium text-blue-900">{calculateTransferTime()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Network Fees:</span>
                  <span className="font-medium text-blue-900">{calculateFees().gas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Bridge Fee:</span>
                  <span className="font-medium text-blue-900">{calculateFees().bridge}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between">
                  <span className="text-blue-700 font-medium">Total Cost:</span>
                  <span className="font-bold text-blue-900">{calculateFees().total}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between">
                  <span className="text-blue-700 font-medium">You will receive:</span>
                  <span className="font-bold text-green-700">{amount} USDC</span>
                </div>
              </div>
            </div>
          )}

          {/* Recipient Address Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Recipient Information</span>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Enter recipient wallet address (0x...)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="h-12 pl-4 pr-12"
                />
                {recipient && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button 
                      onClick={() => copyToClipboard(recipient)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Copy className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Recipient Validation */}
              {recipient && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    {recipient.length === 42 && recipient.startsWith('0x') ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {recipient.length === 42 && recipient.startsWith('0x') ? 'Valid Address' : 'Invalid Address Format'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {recipient.length === 42 && recipient.startsWith('0x') 
                          ? `Recipient: ${formatAddress(recipient)}` 
                          : 'Please enter a valid Ethereum address (42 characters, starting with 0x)'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Self-transfer warning */}
              {recipient && alchemyCCTP.account && recipient.toLowerCase() === alchemyCCTP.account.toLowerCase() && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-800">
                    You are sending to your own address. The funds will arrive in the same wallet on the destination network.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Validation Messages */}
          {validation && validation.errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="text-red-800">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validation && validation.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-800">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Transfer Button */}
          <div className="pt-2">
            <Button
              className="w-full h-12 text-base font-semibold"
              disabled={
                !alchemyCCTP.isConnected ||
                !validation?.isValid || 
                cctpState.isLoading.transfer ||
                cctpState.currentTransfer !== null ||
                !amount ||
                !recipient ||
                parseFloat(amount) <= 0 ||
                parseFloat(alchemyCCTP.gasBalance || '0') === 0
              }
              onClick={handleTransfer}
            >
              {!alchemyCCTP.isConnected ? (
                <>
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Wallet to Transfer
                </>
              ) : parseFloat(alchemyCCTP.gasBalance || '0') === 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Need ETH for Gas Fees
                </>
              ) : cctpState.isLoading.transfer ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Starting Transfer...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Start CCTP Transfer
                </>
              )}
            </Button>
            
            {/* Additional transfer info */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                {!alchemyCCTP.isConnected 
                  ? 'Connect your wallet to begin the transfer process'
                  : parseFloat(alchemyCCTP.gasBalance || '0') === 0
                  ? 'Add testnet ETH to your smart account to pay for gas fees'
                  : !validation?.isValid && amount && recipient
                  ? 'Please fix the validation errors above'
                  : 'Your transfer will be processed securely via Circle CCTP'
                }
              </p>
              
              {/* Pre-transfer guidance */}
              {alchemyCCTP.isConnected && parseFloat(alchemyCCTP.gasBalance || '0') > 0 && amount && recipient && validation?.isValid && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-800 space-y-1">
                    <div className="font-medium">What happens next:</div>
                    <div>1. 🔥 Your USDC will be burned on {getNetworkDetails(fromNetwork)?.name}</div>
                    <div>2. ⏳ Circle will verify the burn (~10-15 minutes)</div>
                    <div>3. ✨ You'll complete the mint to receive USDC on {getNetworkDetails(toNetwork)?.name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Bridge Route Visualization */}
      {amount && parseFloat(amount) > 0 && recipient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <ArrowLeftRight className="h-5 w-5" />
              <span>Transfer Route</span>
            </CardTitle>
            <CardDescription>
              Your USDC transfer route via Circle CCTP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {/* From Network */}
              <div className="flex-1 text-center">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="text-2xl mb-2">{getNetworkDetails(fromNetwork)?.icon}</div>
                  <div className="font-semibold text-sm">{getNetworkDetails(fromNetwork)?.name}</div>
                  <div className="text-xs text-gray-600 mt-1">Source Network</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {alchemyCCTP.account ? formatAddress(alchemyCCTP.account) : 'Your Address'}
                  </div>
                </div>
              </div>
              
              {/* Arrow */}
              <div className="px-4">
                <div className="flex flex-col items-center">
                  <ArrowLeftRight className="h-6 w-6 text-blue-600 mb-1" />
                  <div className="text-xs text-gray-500 text-center">
                    Circle CCTP<br />Burn & Mint
                  </div>
                </div>
              </div>
              
              {/* To Network */}
              <div className="flex-1 text-center">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-2xl mb-2">{getNetworkDetails(toNetwork)?.icon}</div>
                  <div className="font-semibold text-sm">{getNetworkDetails(toNetwork)?.name}</div>
                  <div className="text-xs text-gray-600 mt-1">Destination Network</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {formatAddress(recipient)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Transfer Details */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-blue-600">{amount}</div>
                <div className="text-xs text-gray-600">USDC Amount</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-green-600">{calculateTransferTime()}</div>
                <div className="text-xs text-gray-600">Est. Time</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-purple-600">{calculateFees().total}</div>
                <div className="text-xs text-gray-600">Total Fees</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Progress */}
      {cctpState.currentTransfer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transfer Progress</span>
              <Badge className={
                cctpState.currentTransfer.result.status === 'completed' ? 'bg-green-100 text-green-800' :
                cctpState.error ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }>
                {cctpState.currentTransfer.result.status === 'completed' ? 'Completed' : 
                 cctpState.error ? 'Failed' : 'In Progress'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Transferring {amount} USDC from {getNetworkDetails(fromNetwork)?.name} to {getNetworkDetails(toNetwork)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(getStepProgress())}%</span>
              </div>
              <Progress value={getStepProgress()} className="w-full" />
            </div>

            {/* Current Step Guidance */}
            {getCurrentStep() && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="font-medium">{getCurrentStep()!.title}</span>
                    </div>
                    <p className="text-sm">{getCurrentStepGuidance()}</p>
                    {getCurrentStep()!.estimatedTime && (
                      <p className="text-xs text-muted-foreground">
                        ⏱️ Estimated time: {getCurrentStep()!.estimatedTime}
                      </p>
                    )}
                    
                    {/* Helpful tips based on current step */}
                    {getCurrentStep()!.id === 'approval' && (
                      <div className="bg-blue-100 rounded p-2 text-xs text-blue-800">
                        💡 <strong>Tip:</strong> This allows the bridge contract to spend your USDC. You only need to do this once.
                      </div>
                    )}
                    
                    {getCurrentStep()!.id === 'burn' && (
                      <div className="bg-blue-100 rounded p-2 text-xs text-blue-800">
                        💡 <strong>What's happening:</strong> Your USDC is being permanently removed from {getNetworkDetails(fromNetwork)?.name}. Don't worry - equivalent USDC will be created on {getNetworkDetails(toNetwork)?.name}!
                      </div>
                    )}
                    
                    {getCurrentStep()!.id === 'attestation' && (
                      <div className="bg-blue-100 rounded p-2 text-xs text-blue-800">
                        ☕ <strong>Perfect time for a coffee break!</strong> Circle is verifying your transaction. This is the longest step but ensures your USDC arrives safely.
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Step Details with Transaction Links */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-900">Transaction Details</div>
              {cctpState.currentTransfer.steps.map((step, index) => (
                <div key={step.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                        step.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        step.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {step.status === 'completed' ? '✓' : 
                         step.status === 'processing' ? <RefreshCw className="h-4 w-4 animate-spin" /> :
                         step.status === 'failed' ? '✗' :
                         index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className="text-xs text-gray-600">{step.description}</div>
                        {step.estimatedTime && step.status === 'processing' && (
                          <div className="text-xs text-blue-600 mt-1">
                            ⏱️ {step.estimatedTime}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {step.txHash && (
                      <div className="flex flex-col items-end space-y-1">
                        <Button variant="outline" size="sm" asChild className="h-8">
                          <a 
                            href={getExplorerUrl(step.txHash, step.id === 'burn' ? fromNetwork : toNetwork)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="text-xs">View Tx</span>
                          </a>
                        </Button>
                        <div className="text-xs text-gray-500 font-mono">
                          {step.txHash.slice(0, 8)}...{step.txHash.slice(-6)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Source Transaction Link */}
            {cctpState.currentTransfer.result.sourceTxHash && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-blue-900">Source Transaction</div>
                    <div className="text-xs text-blue-700 mt-1">
                      USDC burned on {getNetworkDetails(fromNetwork)?.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild className="bg-white">
                      <a 
                        href={getExplorerUrl(cctpState.currentTransfer.result.sourceTxHash, fromNetwork)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View on {getNetworkDetails(fromNetwork)?.name}</span>
                      </a>
                    </Button>
                    <button 
                      onClick={() => copyToClipboard(cctpState.currentTransfer!.result.sourceTxHash!)}
                      className="p-2 hover:bg-blue-100 rounded transition-colors"
                      title="Copy transaction hash"
                    >
                      <Copy className="h-4 w-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Destination Transaction Link */}
            {cctpState.currentTransfer.result.destinationTxHash && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-green-900">Destination Transaction</div>
                    <div className="text-xs text-green-700 mt-1">
                      USDC minted on {getNetworkDetails(toNetwork)?.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild className="bg-white">
                      <a 
                        href={getExplorerUrl(cctpState.currentTransfer.result.destinationTxHash, toNetwork)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View on {getNetworkDetails(toNetwork)?.name}</span>
                      </a>
                    </Button>
                    <button 
                      onClick={() => copyToClipboard(cctpState.currentTransfer!.result.destinationTxHash!)}
                      className="p-2 hover:bg-green-100 rounded transition-colors"
                      title="Copy transaction hash"
                    >
                      <Copy className="h-4 w-4 text-green-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Mint Button with Guidance */}
            {isReadyForMint() && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-green-900">Ready to Complete Transfer!</div>
                      <div className="text-sm text-green-800 mt-1">
                        Your USDC has been burned and verified. Click below to mint your USDC on {getNetworkDetails(toNetwork)?.name}.
                      </div>
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleCompleteMint}
                      disabled={cctpState.isLoading.mint}
                    >
                      {cctpState.isLoading.mint ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Completing Transfer...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Transfer & Mint USDC
                        </>
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {cctpState.currentTransfer.result.status === 'completed' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium text-green-900">Transfer Completed Successfully! 🎉</div>
                    <div className="text-sm text-green-800">
                      Your {amount} USDC has been successfully transferred from {getNetworkDetails(fromNetwork)?.name} to {getNetworkDetails(toNetwork)?.name}.
                    </div>
                    <div className="text-xs text-green-700 mt-2">
                      💡 Pro tip: You can now use your USDC on {getNetworkDetails(toNetwork)?.name} for DeFi, payments, or other applications.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Clear Transfer Button */}
            {(cctpState.currentTransfer.result.status === 'completed' || cctpState.error) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={cctpActions.clearTransfer}
              >
                Start New Transfer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {cctpState.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium text-red-900">Transfer Error</div>
              <div className="text-sm text-red-800">{cctpState.error}</div>
              
              {/* Specific error guidance */}
              {cctpState.error.includes('Insufficient ETH for gas fees') && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                  <div className="text-xs text-yellow-800">
                    <div className="font-medium">💡 Quick Fix:</div>
                    <div>1. Get testnet ETH from <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="underline">Sepolia Faucet</a></div>
                    <div>2. Send ~0.01 ETH to: <code className="bg-yellow-100 px-1 rounded">{formatAddress(alchemyCCTP.account || '')}</code></div>
                    <div>3. Wait 1-2 minutes and try again</div>
                  </div>
                </div>
              )}
              
              {cctpState.error.includes('User rejected') && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="text-xs text-blue-800">
                    <div className="font-medium">💡 Solution:</div>
                    <div>Please approve the transaction in your wallet to proceed with the transfer.</div>
                  </div>
                </div>
              )}
              
              {cctpState.error.includes('insufficient') && !cctpState.error.includes('gas') && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="text-xs text-blue-800">
                    <div className="font-medium">💡 Check Balance:</div>
                    <div>Make sure you have enough USDC in your wallet on {getNetworkDetails(fromNetwork)?.name}.</div>
                  </div>
                </div>
              )}
              
              <div className="mt-3 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cctpActions.clearTransfer}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
                {alchemyCCTP.account && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(alchemyCCTP.account || '')}
                    className="text-gray-700"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Address
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Circle API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Circle API Status</span>
            <Badge className={circleApiStatus.hasApiKey ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
              {circleApiUI.status === 'connected' ? '🔑 Connected' : '🌐 Public'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="space-y-1">
            <p className="font-medium">{circleApiUI.title}</p>
            <p className="text-muted-foreground text-xs">{circleApiUI.description}</p>
            <p className="text-muted-foreground text-xs">
              <Clock className="h-3 w-3 inline mr-1" />
              Expected attestation time: {circleApiUI.subtitle}
            </p>
          </div>
          
          <div className="space-y-1">
            {circleApiUI.recommendations.map((rec, index) => (
              <p key={index} className="text-xs text-muted-foreground">{rec}</p>
            ))}
          </div>
          
          {!circleApiStatus.hasApiKey && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Optional:</strong> Add a Circle API key to your environment variables for faster attestations and better rate limits.
                <br />
                <span className="text-muted-foreground">Required for mainnet deployment.</span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How CCTP Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. <strong>Burn:</strong> USDC is burned on the source blockchain</p>
          <p>2. <strong>Attest:</strong> Circle validates the burn and provides an attestation</p>
          <p>3. <strong>Mint:</strong> Equivalent USDC is minted on the destination blockchain</p>
          <p className="text-xs pt-2 border-t">
            ✅ 1:1 transfer ratio • ⏱️ ~{circleApiUI.subtitle} total time • 🔒 Circle security
          </p>
        </CardContent>
      </Card>

      {/* Transfer Result Modal */}
      <NotificationModal
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        type={transferResult?.success ? "success" : "error"}
        title={transferResult?.success ? "CCTP Transfer Initiated" : "Transfer Failed"}
        message={transferResult?.message || ""}
        amount={transferResult?.success ? `${amount} USDC` : ""}
        currency="USDC"
        details={transferResult?.details || []}
        showCopy={true}
        copyText={transferResult?.success 
          ? `CCTP Transfer: ${amount} USDC from ${getNetworkDetails(fromNetwork)?.name} to ${getNetworkDetails(toNetwork)?.name} | TX: ${transferResult?.txHash}`
          : `CCTP Transfer Failed: ${transferResult?.message}`
        }
      />
    </div>
  );
}

export default CCTPBridgeWidget;