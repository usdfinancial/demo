import { ethers } from 'ethers';
import CCTPAdapter, { CCTPNetwork, CCTPTransferParams, CCTPTransferResult, CCTP_TESTNET_CONTRACTS } from '@/lib/blockchain/stablecoin/cctpAdapter';

export interface CCTPServiceConfig {
  rpcUrls: Record<CCTPNetwork, string>;
  explorerUrls: Record<CCTPNetwork, string>;
}

export interface TransferStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  estimatedTime?: string;
}

export class CCTPService {
  private adapters: Map<CCTPNetwork, CCTPAdapter>;
  private config: CCTPServiceConfig;

  constructor(config: CCTPServiceConfig) {
    this.config = config;
    this.adapters = new Map();
    
    // Initialize adapters for each network
    Object.keys(config.rpcUrls).forEach(network => {
      const networkKey = network as CCTPNetwork;
      this.adapters.set(
        networkKey, 
        new CCTPAdapter(config.rpcUrls[networkKey], networkKey)
      );
    });
  }

  public async initializeTransfer(
    params: CCTPTransferParams,
    signer: ethers.Signer
  ): Promise<{
    transferId: string;
    steps: TransferStep[];
    result: Partial<CCTPTransferResult>;
  }> {
    const transferId = this.generateTransferId();
    
    const steps: TransferStep[] = [
      {
        id: 'approve',
        title: 'Approve USDC',
        description: 'Approve USDC spending for the bridge contract',
        status: 'pending',
        estimatedTime: '1-2 minutes'
      },
      {
        id: 'burn',
        title: 'Burn USDC',
        description: `Burn USDC on ${CCTP_TESTNET_CONTRACTS[params.fromNetwork].name}`,
        status: 'pending',
        estimatedTime: '2-5 minutes'
      },
      {
        id: 'attestation',
        title: 'Wait for Attestation',
        description: 'Circle will attest to the burn transaction',
        status: 'pending',
        estimatedTime: '10-15 minutes'
      },
      {
        id: 'mint',
        title: 'Mint USDC',
        description: `Mint USDC on ${CCTP_TESTNET_CONTRACTS[params.toNetwork].name}`,
        status: 'pending',
        estimatedTime: '2-5 minutes'
      }
    ];

    try {
      const adapter = this.adapters.get(params.fromNetwork);
      if (!adapter) {
        throw new Error(`Adapter not found for network: ${params.fromNetwork}`);
      }

      await adapter.connect(signer);
      
      // Start the burn process
      steps[0].status = 'processing';
      const result = await adapter.initiateBurn(params);
      
      steps[0].status = 'completed';
      steps[1].status = 'completed';
      steps[2].status = 'processing';

      return {
        transferId,
        steps,
        result
      };
    } catch (error) {
      steps[0].status = 'failed';
      throw error;
    }
  }

  public async checkTransferStatus(
    messageHash: string,
    steps: TransferStep[]
  ): Promise<{
    attestationSignature?: string;
    updatedSteps: TransferStep[];
    isReadyForMint: boolean;
  }> {
    try {
      const adapter = Array.from(this.adapters.values())[0]; // Use any adapter for status check
      const status = await adapter.transferStatus(messageHash);
      
      const updatedSteps = [...steps];
      
      if (status === 'attested') {
        // Mark attestation as completed
        const attestationStep = updatedSteps.find(step => step.id === 'attestation');
        if (attestationStep) {
          attestationStep.status = 'completed';
        }
        
        // Get attestation signature
        const attestationSignature = await adapter.fetchAttestation(messageHash);
        
        return {
          attestationSignature,
          updatedSteps,
          isReadyForMint: true
        };
      }
      
      return {
        updatedSteps,
        isReadyForMint: false
      };
    } catch (error) {
      console.error('Failed to check transfer status:', error);
      return {
        updatedSteps: steps,
        isReadyForMint: false
      };
    }
  }

  public async completeMint(
    messageBytes: string,
    attestationSignature: string,
    toNetwork: CCTPNetwork,
    toSigner: ethers.Signer,
    steps: TransferStep[]
  ): Promise<{
    destinationTxHash: string;
    updatedSteps: TransferStep[];
  }> {
    const adapter = this.adapters.get(toNetwork);
    if (!adapter) {
      throw new Error(`Adapter not found for destination network: ${toNetwork}`);
    }

    const updatedSteps = [...steps];
    const mintStep = updatedSteps.find(step => step.id === 'mint');
    
    try {
      if (mintStep) {
        mintStep.status = 'processing';
      }

      const destinationTxHash = await adapter.completeMint(
        messageBytes,
        attestationSignature,
        toNetwork,
        toSigner
      );

      if (mintStep) {
        mintStep.status = 'completed';
        mintStep.txHash = destinationTxHash;
      }

      return {
        destinationTxHash,
        updatedSteps
      };
    } catch (error) {
      if (mintStep) {
        mintStep.status = 'failed';
      }
      throw error;
    }
  }

  public async getUSDCBalance(
    address: string,
    network: CCTPNetwork
  ): Promise<string> {
    const adapter = this.adapters.get(network);
    if (!adapter) {
      throw new Error(`Adapter not found for network: ${network}`);
    }

    return adapter.getUSDCBalance(address, network);
  }

  public async estimateGas(
    params: CCTPTransferParams
  ): Promise<{
    sourceGasEstimate: string;
    destinationGasEstimate: string;
    totalEstimateUSD: string;
  }> {
    // Mock gas estimation - in production, this would query actual gas prices
    return {
      sourceGasEstimate: '0.002 ETH',
      destinationGasEstimate: '0.001 ETH',
      totalEstimateUSD: '$5.50'
    };
  }

  public getExplorerUrl(txHash: string, network: CCTPNetwork): string {
    return `${this.config.explorerUrls[network]}/tx/${txHash}`;
  }

  public getSupportedNetworks(): CCTPNetwork[] {
    return Array.from(this.adapters.keys());
  }

  public getNetworkInfo(network: CCTPNetwork) {
    return CCTP_TESTNET_CONTRACTS[network];
  }

  private generateTransferId(): string {
    return `cctp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async validateTransferParams(
    params: CCTPTransferParams,
    userAddress: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate networks
    if (!this.adapters.has(params.fromNetwork)) {
      errors.push(`Unsupported source network: ${params.fromNetwork}`);
    }
    
    if (!this.adapters.has(params.toNetwork)) {
      errors.push(`Unsupported destination network: ${params.toNetwork}`);
    }

    if (params.fromNetwork === params.toNetwork) {
      errors.push('Source and destination networks cannot be the same');
    }

    // Validate amount
    const amount = parseFloat(params.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Invalid transfer amount');
    } else {
      if (amount < 0.1) {
        warnings.push('Very small transfer amounts may have high relative gas costs');
      }
      if (amount > 10000) {
        warnings.push('Large transfers may take longer to process');
      }
    }

    // Validate recipient address
    try {
      ethers.getAddress(params.recipient);
    } catch {
      errors.push('Invalid recipient address');
    }

    // Check balance if possible
    try {
      const balance = await this.getUSDCBalance(userAddress, params.fromNetwork);
      if (parseFloat(balance) < amount) {
        errors.push('Insufficient USDC balance');
      }
    } catch {
      warnings.push('Could not verify USDC balance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Get Alchemy API key from environment
const getAlchemyApiKey = () => {
  return process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY || 'demo-api-key';
};

// Default configuration for testnet using existing Alchemy setup
export const defaultCCTPConfig: CCTPServiceConfig = {
  rpcUrls: {
    sepolia: `https://eth-sepolia.g.alchemy.com/v2/${getAlchemyApiKey()}`,
    fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
    arbitrumSepolia: `https://arb-sepolia.g.alchemy.com/v2/${getAlchemyApiKey()}`,
    optimismSepolia: `https://opt-sepolia.g.alchemy.com/v2/${getAlchemyApiKey()}`,
    baseSepolia: `https://base-sepolia.g.alchemy.com/v2/${getAlchemyApiKey()}`
  },
  explorerUrls: {
    sepolia: 'https://sepolia.etherscan.io',
    fuji: 'https://testnet.snowtrace.io',
    arbitrumSepolia: 'https://sepolia.arbiscan.io',
    optimismSepolia: 'https://sepolia-optimism.etherscan.io',
    baseSepolia: 'https://sepolia.basescan.org'
  }
};

export default CCTPService;