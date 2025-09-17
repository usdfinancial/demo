import { ethers } from 'ethers';

// CCTP Testnet Contract Addresses
export const CCTP_TESTNET_CONTRACTS = {
  // Sepolia (Ethereum Testnet)
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    domain: 0
  },
  // Avalanche Fuji Testnet
  fuji: {
    chainId: 43113,
    name: 'Avalanche Fuji',
    tokenMessenger: '0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79',
    messageTransmitter: '0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79',
    usdc: '0x5425890298aed601595a70AB815c96711a31Bc65',
    domain: 1
  },
  // Arbitrum Sepolia
  arbitrumSepolia: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872',
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    domain: 3
  },
  // OP Sepolia
  optimismSepolia: {
    chainId: 11155420,
    name: 'OP Sepolia',
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    usdc: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    domain: 2
  },
  // Base Sepolia
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    tokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    domain: 6
  }
} as const;

// CCTP Contract ABIs
const TOKEN_MESSENGER_ABI = [
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)',
  'function localMinter() view returns (address)',
  'function remoteTokenMessengers(uint32) view returns (bytes32)'
];

const MESSAGE_TRANSMITTER_ABI = [
  'function receiveMessage(bytes message, bytes attestation) returns (bool)',
  'function usedNonces(bytes32) view returns (bool)',
  'function localDomain() view returns (uint32)',
  'function nextAvailableNonce() view returns (uint64)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

export type CCTPNetwork = keyof typeof CCTP_TESTNET_CONTRACTS;

export interface CCTPTransferParams {
  amount: string;
  fromNetwork: CCTPNetwork;
  toNetwork: CCTPNetwork;
  recipient: string;
}

export interface CCTPTransferResult {
  sourceTxHash: string;
  messageHash: string;
  messageBytes: string;
  attestationSignature?: string;
  destinationTxHash?: string;
  status: 'pending' | 'attested' | 'completed' | 'failed';
}

export interface CCTPQuote {
  fromNetwork: CCTPNetwork;
  toNetwork: CCTPNetwork;
  inputAmount: string;
  outputAmount: string;
  estimatedTime: string;
  fees: string;
  bridgeFee: string;
}

export class CCTPAdapter {
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Signer;
  private network: CCTPNetwork;

  constructor(rpcUrl: string, network: CCTPNetwork) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.network = network;
  }

  public async connect(signer: ethers.Signer): Promise<void> {
    // Ensure the signer is connected to our provider
    this.signer = signer.connect ? signer.connect(this.provider) : signer;
  }

  public async getQuote(
    amount: string,
    fromNetwork: CCTPNetwork,
    toNetwork: CCTPNetwork
  ): Promise<CCTPQuote> {
    const fromConfig = CCTP_TESTNET_CONTRACTS[fromNetwork];
    const toConfig = CCTP_TESTNET_CONTRACTS[toNetwork];

    if (!fromConfig || !toConfig) {
      throw new Error('Unsupported network for CCTP');
    }

    // CCTP has minimal fees (just gas costs)
    // The output amount equals input amount (1:1 burn/mint)
    const bridgeFee = '0';
    const gasFee = '0.005'; // Estimated gas cost in USD

    return {
      fromNetwork,
      toNetwork,
      inputAmount: amount,
      outputAmount: amount, // 1:1 ratio for CCTP
      estimatedTime: '15-20 minutes',
      fees: gasFee,
      bridgeFee
    };
  }

  public async initiateBurn(params: CCTPTransferParams): Promise<Partial<CCTPTransferResult>> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const fromConfig = CCTP_TESTNET_CONTRACTS[params.fromNetwork];
    const toConfig = CCTP_TESTNET_CONTRACTS[params.toNetwork];

    if (!fromConfig || !toConfig) {
      throw new Error('Unsupported network configuration');
    }

    // Convert recipient address to bytes32
    const mintRecipient = ethers.zeroPadValue(params.recipient, 32);

    // Get user address
    const userAddress = await this.signer.getAddress();
    console.log('User address for CCTP transfer:', userAddress);
    console.log('USDC contract address:', fromConfig.usdc);
    console.log('Token messenger address:', fromConfig.tokenMessenger);
    
    // Setup contracts with provider for read operations and signer for write operations
    const usdcContractRead = new ethers.Contract(fromConfig.usdc, ERC20_ABI, this.provider);
    const usdcContract = new ethers.Contract(fromConfig.usdc, ERC20_ABI, this.signer);
    const tokenMessenger = new ethers.Contract(fromConfig.tokenMessenger, TOKEN_MESSENGER_ABI, this.signer);

    try {
      console.log('Checking USDC allowance...');
      // Check and approve USDC allowance (use read contract for allowance check)
      const allowance = await usdcContractRead.allowance(userAddress, fromConfig.tokenMessenger);
      const amountBigInt = ethers.parseUnits(params.amount, 6); // USDC has 6 decimals
      
      console.log('Current allowance:', ethers.formatUnits(allowance, 6), 'USDC');
      console.log('Required amount:', ethers.formatUnits(amountBigInt, 6), 'USDC');
      
      if (allowance < amountBigInt) {
        console.log('Approving USDC spending...');
        const approveTx = await usdcContract.approve(fromConfig.tokenMessenger, amountBigInt);
        console.log('Approval transaction sent, waiting for confirmation...');
        const approvalReceipt = await approveTx.wait();
        console.log('USDC spending approved', { txHash: approveTx.hash, status: approvalReceipt?.status });
      } else {
        console.log('USDC allowance is sufficient, no approval needed');
      }
    } catch (error) {
      console.error('Error during USDC approval:', error);
      throw new Error(`Failed to approve USDC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Add a small delay to ensure approval is processed
    console.log('Approval complete, proceeding to burn...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check USDC balance before burning
    try {
      const balance = await usdcContractRead.balanceOf(userAddress);
      console.log('Current USDC balance:', ethers.formatUnits(balance, 6), 'USDC');
      
      if (balance < amountBigInt) {
        throw new Error(`Insufficient USDC balance. Required: ${ethers.formatUnits(amountBigInt, 6)} USDC, Available: ${ethers.formatUnits(balance, 6)} USDC`);
      }
    } catch (balanceError) {
      console.error('Error checking USDC balance:', balanceError);
      throw balanceError;
    }

    // Execute burn with properly formatted amount
    let burnTx;
    try {
      console.log('Initiating USDC burn...', {
        amount: ethers.formatUnits(amountBigInt, 6),
        destinationDomain: toConfig.domain,
        recipient: mintRecipient,
        burnToken: fromConfig.usdc
      });
      
      burnTx = await tokenMessenger.depositForBurn(
        amountBigInt,
        toConfig.domain,
        mintRecipient,
        fromConfig.usdc
      );
      console.log('Burn transaction sent:', burnTx.hash);
      console.log('Waiting for burn confirmation...');
    } catch (error) {
      console.error('Error during USDC burn:', error);
      console.error('Burn parameters:', {
        tokenMessenger: fromConfig.tokenMessenger,
        amount: ethers.formatUnits(amountBigInt, 6),
        destinationDomain: toConfig.domain,
        mintRecipient,
        burnToken: fromConfig.usdc
      });
      throw new Error(`Failed to burn USDC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const receipt = await burnTx.wait();

    // Extract message details from logs
    const messageLog = receipt.logs.find((log: any) => 
      log.topics[0] === ethers.id('MessageSent(bytes)')
    );

    if (!messageLog) {
      throw new Error('Message log not found in transaction receipt');
    }

    const messageBytes = ethers.AbiCoder.defaultAbiCoder().decode(['bytes'], messageLog.data)[0];
    const messageHash = ethers.keccak256(messageBytes);

    return {
      sourceTxHash: burnTx.hash,
      messageHash,
      messageBytes,
      status: 'pending' as const
    };
  }

  public async fetchAttestation(messageHash: string): Promise<string> {
    const maxRetries = 20;
    const retryDelay = 30000; // 30 seconds
    
    // Use Circle API key if available
    const circleApiKey = process.env.NEXT_PUBLIC_CIRCLE_API_KEY || process.env.CIRCLE_API_KEY;
    const headers: Record<string, string> = {};
    
    if (circleApiKey) {
      headers['Authorization'] = `Bearer ${circleApiKey}`;
    }

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(
          `https://iris-api-sandbox.circle.com/attestations/${messageHash}`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          return data.attestation;
        }

        if (response.status === 404) {
          // Attestation not ready yet, wait and retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Failed to fetch attestation after ${maxRetries} attempts: ${error}`);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error('Attestation timeout');
  }

  public async completeMint(
    messageBytes: string,
    attestationSignature: string,
    toNetwork: CCTPNetwork,
    toSigner: ethers.Signer
  ): Promise<string> {
    const toConfig = CCTP_TESTNET_CONTRACTS[toNetwork];
    if (!toConfig) {
      throw new Error('Unsupported destination network');
    }

    const messageTransmitter = new ethers.Contract(
      toConfig.messageTransmitter,
      MESSAGE_TRANSMITTER_ABI,
      toSigner
    );

    // Execute mint
    const mintTx = await messageTransmitter.receiveMessage(messageBytes, attestationSignature);
    const receipt = await mintTx.wait();

    return mintTx.hash;
  }

  public async getUSDCBalance(address: string, network: CCTPNetwork): Promise<string> {
    try {
      const config = CCTP_TESTNET_CONTRACTS[network];
      if (!config) {
        console.error(`Unsupported network: ${network}`);
        return '0.00';
      }

      // Validate the USDC contract address exists
      if (!config.usdc || config.usdc === '0x0000000000000000000000000000000000000000') {
        console.error(`Invalid USDC contract address for ${network}: ${config.usdc}`);
        return '0.00';
      }

      const usdcContract = new ethers.Contract(config.usdc, ERC20_ABI, this.provider);
      
      // Add timeout and retry logic
      const balance = await Promise.race([
        usdcContract.balanceOf(address),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Balance fetch timeout')), 10000)
        )
      ]) as bigint;
      
      // Use 6 decimals for USDC by default if decimals call fails
      let decimals: number;
      try {
        decimals = await usdcContract.decimals();
      } catch (decimalsError) {
        console.warn(`Failed to get decimals for ${network} USDC, using default 6:`, decimalsError);
        decimals = 6; // USDC typically has 6 decimals
      }
      
      return ethers.formatUnits(balance, decimals);
    } catch (error: any) {
      console.error(`Failed to fetch USDC balance for ${network}:`, error);
      
      // Check for specific error types
      if (error.code === 'CALL_EXCEPTION') {
        console.error(`Contract call failed - possibly invalid contract address for ${network}: ${CCTP_TESTNET_CONTRACTS[network]?.usdc}`);
      } else if (error.code === 'NETWORK_ERROR') {
        console.error(`Network error when fetching balance for ${network}`);
      } else if (error.message?.includes('429') || error.code === 'UNKNOWN_ERROR') {
        console.error(`Rate limited when fetching balance for ${network}`);
      }
      
      return '0.00';
    }
  }

  public async transferStatus(messageHash: string): Promise<string> {
    try {
      const circleApiKey = process.env.NEXT_PUBLIC_CIRCLE_API_KEY || process.env.CIRCLE_API_KEY;
      const headers: Record<string, string> = {};
      
      if (circleApiKey) {
        headers['Authorization'] = `Bearer ${circleApiKey}`;
      }

      const response = await fetch(
        `https://iris-api-sandbox.circle.com/attestations/${messageHash}`,
        { headers }
      );

      if (response.ok) {
        return 'attested';
      } else if (response.status === 404) {
        return 'pending';
      } else {
        return 'failed';
      }
    } catch {
      return 'pending';
    }
  }

  public getSupportedNetworks(): CCTPNetwork[] {
    return Object.keys(CCTP_TESTNET_CONTRACTS) as CCTPNetwork[];
  }

  public getNetworkConfig(network: CCTPNetwork) {
    return CCTP_TESTNET_CONTRACTS[network];
  }

  public static isUSDCAddress(address: string, network: CCTPNetwork): boolean {
    const config = CCTP_TESTNET_CONTRACTS[network];
    return config ? config.usdc.toLowerCase() === address.toLowerCase() : false;
  }

  public static formatAmount(amount: string, decimals: number = 6): string {
    return ethers.formatUnits(amount, decimals);
  }

  public static parseAmount(amount: string, decimals: number = 6): string {
    return ethers.parseUnits(amount, decimals).toString();
  }
}

export default CCTPAdapter;