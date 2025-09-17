import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import CCTPService, { defaultCCTPConfig, TransferStep } from '@/lib/services/cctpService';
import { CCTPNetwork, CCTPTransferParams, CCTPTransferResult } from '@/lib/blockchain/stablecoin/cctpAdapter';

export interface CCTPHookState {
  service: CCTPService | null;
  isInitialized: boolean;
  currentTransfer: {
    id: string;
    params: CCTPTransferParams;
    result: Partial<CCTPTransferResult>;
    steps: TransferStep[];
    attestationSignature?: string;
  } | null;
  balances: Record<CCTPNetwork, string>;
  isLoading: {
    transfer: boolean;
    attestation: boolean;
    mint: boolean;
    balance: boolean;
  };
  error: string | null;
}

export interface CCTPHookActions {
  initializeTransfer: (params: CCTPTransferParams, signer: ethers.Signer) => Promise<void>;
  checkAttestationStatus: () => Promise<void>;
  completeMint: (toSigner: ethers.Signer) => Promise<void>;
  refreshBalance: (address: string, network: CCTPNetwork) => Promise<void>;
  refreshAllBalances: (address: string) => Promise<void>;
  clearTransfer: () => void;
  validateTransfer: (params: CCTPTransferParams, userAddress: string) => Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

export function useCCTP(): [CCTPHookState, CCTPHookActions] {
  const [state, setState] = useState<CCTPHookState>({
    service: null,
    isInitialized: false,
    currentTransfer: null,
    balances: {} as Record<CCTPNetwork, string>,
    isLoading: {
      transfer: false,
      attestation: false,
      mint: false,
      balance: false
    },
    error: null
  });

  // Initialize service
  useEffect(() => {
    const service = new CCTPService(defaultCCTPConfig);
    setState(prev => ({
      ...prev,
      service,
      isInitialized: true
    }));
  }, []);

  const setLoading = useCallback((key: keyof CCTPHookState['isLoading'], value: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: {
        ...prev.isLoading,
        [key]: value
      }
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error
    }));
  }, []);

  const initializeTransfer = useCallback(async (
    params: CCTPTransferParams,
    signer: ethers.Signer
  ) => {
    if (!state.service) {
      throw new Error('CCTP service not initialized');
    }

    setLoading('transfer', true);
    setError(null);

    try {
      const { transferId, steps, result } = await state.service.initializeTransfer(params, signer);
      
      setState(prev => ({
        ...prev,
        currentTransfer: {
          id: transferId,
          params,
          result,
          steps
        }
      }));

      // Start polling for attestation
      if (result.messageHash) {
        setTimeout(() => checkAttestationStatus(), 5000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Transfer initialization failed');
      throw error;
    } finally {
      setLoading('transfer', false);
    }
  }, [state.service]);

  const checkAttestationStatus = useCallback(async () => {
    if (!state.service || !state.currentTransfer?.result.messageHash) {
      return;
    }

    setLoading('attestation', true);

    try {
      const { attestationSignature, updatedSteps, isReadyForMint } = 
        await state.service.checkTransferStatus(
          state.currentTransfer.result.messageHash,
          state.currentTransfer.steps
        );

      setState(prev => ({
        ...prev,
        currentTransfer: prev.currentTransfer ? {
          ...prev.currentTransfer,
          steps: updatedSteps,
          attestationSignature
        } : null
      }));

      if (!isReadyForMint && state.currentTransfer.steps.some(step => 
        step.id === 'attestation' && step.status === 'processing'
      )) {
        // Continue polling every 30 seconds if still waiting for attestation
        setTimeout(() => checkAttestationStatus(), 30000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check attestation status');
    } finally {
      setLoading('attestation', false);
    }
  }, [state.service, state.currentTransfer]);

  const completeMint = useCallback(async (toSigner: ethers.Signer) => {
    if (!state.service || !state.currentTransfer?.result.messageBytes || 
        !state.currentTransfer.attestationSignature) {
      throw new Error('Transfer not ready for minting');
    }

    setLoading('mint', true);
    setError(null);

    try {
      const { destinationTxHash, updatedSteps } = await state.service.completeMint(
        state.currentTransfer.result.messageBytes,
        state.currentTransfer.attestationSignature,
        state.currentTransfer.params.toNetwork,
        toSigner,
        state.currentTransfer.steps
      );

      setState(prev => ({
        ...prev,
        currentTransfer: prev.currentTransfer ? {
          ...prev.currentTransfer,
          result: {
            ...prev.currentTransfer.result,
            destinationTxHash,
            status: 'completed' as const
          },
          steps: updatedSteps
        } : null
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Mint completion failed');
      throw error;
    } finally {
      setLoading('mint', false);
    }
  }, [state.service, state.currentTransfer]);

  const refreshBalance = useCallback(async (address: string, network: CCTPNetwork) => {
    if (!state.service) return;

    setLoading('balance', true);

    try {
      const balance = await state.service.getUSDCBalance(address, network);
      setState(prev => ({
        ...prev,
        balances: {
          ...prev.balances,
          [network]: balance
        }
      }));
    } catch (error) {
      console.error(`Failed to fetch balance for ${network}:`, error);
      // Set a default balance on error to prevent repeated failures
      setState(prev => ({
        ...prev,
        balances: {
          ...prev.balances,
          [network]: prev.balances[network] || '0.00'
        }
      }));
    } finally {
      setLoading('balance', false);
    }
  }, [state.service]);

  const refreshAllBalances = useCallback(async (address: string) => {
    if (!state.service) return;

    const networks = state.service.getSupportedNetworks();
    
    // Process balance fetches sequentially to avoid rate limiting
    for (const network of networks) {
      try {
        await refreshBalance(address, network);
        // Add a small delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to refresh balance for ${network}:`, error);
        // Continue with next network even if one fails
      }
    }
  }, [state.service, refreshBalance]);

  const clearTransfer = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTransfer: null,
      error: null
    }));
  }, []);

  const validateTransfer = useCallback(async (
    params: CCTPTransferParams,
    userAddress: string
  ) => {
    if (!state.service) {
      return {
        isValid: false,
        errors: ['CCTP service not initialized'],
        warnings: []
      };
    }

    return state.service.validateTransferParams(params, userAddress);
  }, [state.service]);

  // Auto-refresh balances when transfer completes
  useEffect(() => {
    if (state.currentTransfer?.result.status === 'completed') {
      // Auto-refresh balances after successful transfer
      // This would need the user's address which should come from wallet context
    }
  }, [state.currentTransfer?.result.status]);

  const actions: CCTPHookActions = {
    initializeTransfer,
    checkAttestationStatus,
    completeMint,
    refreshBalance,
    refreshAllBalances,
    clearTransfer,
    validateTransfer
  };

  return [state, actions];
}

export default useCCTP;