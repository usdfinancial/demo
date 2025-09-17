import { ethers } from 'ethers';
import { StablecoinSymbol, ChainId, CrossChainBridge } from '@/lib/data';

// Bridge contract addresses and supported routes
export const BRIDGE_CONTRACTS: Record<ChainId, Record<string, string>> = {
  1: { // Ethereum
    ACROSS_SPOKE_POOL: '0x4D9079Bb4165aeb4084c526a32695dCfd2F77381',
    STARGATE_ROUTER: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',
    CELER_BRIDGE: '0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820'
  },
  137: { // Polygon
    ACROSS_SPOKE_POOL: '0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096',
    STARGATE_ROUTER: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd',
    CELER_BRIDGE: '0x88DCDC47D2f83a99CF0000FDF667A468bB958a78'
  },
  42161: { // Arbitrum
    ACROSS_SPOKE_POOL: '0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A',
    STARGATE_ROUTER: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',
    CELER_BRIDGE: '0x1619DE6B6B20eD217a58d00f37B9d47C7663feca'
  },
  10: { // Optimism
    ACROSS_SPOKE_POOL: '0x6f26Bf09B1C792e3228e5467807a900A503c0281',
    STARGATE_ROUTER: '0xB0D502E938ed5f4df2E681fE6E419ff29631d62b',
    CELER_BRIDGE: '0x9D39Fc627A6d9d9F8C831c16995b209548cc3401'
  },
  56: { // BSC
    STARGATE_ROUTER: '0x4a364f8c717cAAD9A442737Eb7b8A55cc6cf18D8',
    CELER_BRIDGE: '0xdd90E5E87A2081Dcf0391920868eBc2FFB81a1aF'
  }
};

// Stargate pool IDs for stablecoins on different chains
export const STARGATE_POOL_IDS: Record<ChainId, Record<StablecoinSymbol, number>> = {
  1: { USDC: 1, USDT: 2, DAI: 3, FRAX: 7, TUSD: 0, BUSD: 5 },
  137: { USDC: 1, USDT: 2, DAI: 3, FRAX: 0, TUSD: 0, BUSD: 5 },
  42161: { USDC: 1, USDT: 2, DAI: 0, FRAX: 7, TUSD: 0, BUSD: 0 },
  10: { USDC: 1, USDT: 0, DAI: 3, FRAX: 7, TUSD: 0, BUSD: 0 },
  56: { USDC: 1, USDT: 2, DAI: 0, FRAX: 0, TUSD: 0, BUSD: 5 }
};

// Chain IDs mapping for Stargate
export const STARGATE_CHAIN_IDS: Record<ChainId, number> = {
  1: 101,    // Ethereum
  137: 109,  // Polygon
  42161: 110, // Arbitrum
  10: 111,   // Optimism
  56: 102    // BSC
};

// Simplified bridge contract ABIs
const STARGATE_ROUTER_ABI = [
  'function swap(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress, uint256 _amountLD, uint256 _minAmountLD, tuple(uint256 dstGasForCall, uint256 dstNativeAmount, bytes dstNativeAddr) _lzTxParams, bytes _to, bytes _payload) payable',
  'function quoteLayerZeroFee(uint16 _dstChainId, uint8 _functionType, bytes _toAddress, bytes _transferAndCallPayload, tuple(uint256 dstGasForCall, uint256 dstNativeAmount, bytes dstNativeAddr) _lzTxParams) view returns (uint256, uint256)'
];

const ACROSS_SPOKE_POOL_ABI = [
  'function deposit(address recipient, address originToken, uint256 amount, uint256 destinationChainId, uint256 relayerFeePct, uint32 quoteTimestamp) payable',
  'function getCurrentTime() view returns (uint32)'
];

const CELER_BRIDGE_ABI = [
  'function send(address _receiver, address _token, uint256 _amount, uint64 _dstChainId, uint64 _nonce, uint32 _maxSlippage)',
  'function calcFee(uint256 _amount, uint64 _dstChainId, address _token) view returns (uint256)'
];

export interface BridgeQuote {
  protocol: string;
  fromChain: ChainId;
  toChain: ChainId;
  stablecoin: StablecoinSymbol;
  inputAmount: string;
  outputAmount: string;
  fees: string;
  estimatedTime: string;
  gasEstimate: string;
}

export interface BridgeTransaction {
  protocol: string;
  fromChain: ChainId;
  toChain: ChainId;
  stablecoin: StablecoinSymbol;
  amount: string;
  recipient: string;
  txHash?: string;
}

export class BridgeAdapter {
  private provider: ethers.JsonRpcProvider;
  private chainId: ChainId;
  private signer?: ethers.Signer;

  constructor(rpcUrl: string, chainId: ChainId) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.chainId = chainId;
  }

  public async connect(signer: ethers.Signer): Promise<void> {
    this.signer = signer;
  }

  public async getBridgeQuotes(
    stablecoin: StablecoinSymbol,
    amount: string,
    toChain: ChainId
  ): Promise<BridgeQuote[]> {
    const quotes: BridgeQuote[] = [];

    // Get quotes from different bridge protocols
    try {
      const stargateQuote = await this.getStargateQuote(stablecoin, amount, toChain);
      if (stargateQuote) quotes.push(stargateQuote);
    } catch (error) {
      console.warn('Stargate quote failed:', error);
    }

    try {
      const acrossQuote = await this.getAcrossQuote(stablecoin, amount, toChain);
      if (acrossQuote) quotes.push(acrossQuote);
    } catch (error) {
      console.warn('Across quote failed:', error);
    }

    try {
      const celerQuote = await this.getCelerQuote(stablecoin, amount, toChain);
      if (celerQuote) quotes.push(celerQuote);
    } catch (error) {
      console.warn('Celer quote failed:', error);
    }

    // Sort by output amount (highest first)
    return quotes.sort((a, b) => parseFloat(b.outputAmount) - parseFloat(a.outputAmount));
  }

  public async bridgeViaStargate(
    stablecoin: StablecoinSymbol,
    amount: string,
    toChain: ChainId,
    recipient: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const routerAddress = BRIDGE_CONTRACTS[this.chainId]?.STARGATE_ROUTER;
    if (!routerAddress) {
      throw new Error('Stargate not supported on this chain');
    }

    const srcPoolId = STARGATE_POOL_IDS[this.chainId]?.[stablecoin];
    const dstPoolId = STARGATE_POOL_IDS[toChain]?.[stablecoin];
    const dstChainId = STARGATE_CHAIN_IDS[toChain];

    if (!srcPoolId || !dstPoolId || !dstChainId) {
      throw new Error('Stablecoin not supported on one of the chains');
    }

    const router = new ethers.Contract(routerAddress, STARGATE_ROUTER_ABI, this.signer);
    const userAddress = await this.signer.getAddress();

    // Calculate minimum amount (with 0.5% slippage tolerance)
    const minAmount = (BigInt(amount) * BigInt(995) / BigInt(1000)).toString();

    // Layer Zero transaction parameters
    const lzTxParams = {
      dstGasForCall: 0,
      dstNativeAmount: 0,
      dstNativeAddr: '0x'
    };

    // Get fee quote
    const [nativeFee] = await router.quoteLayerZeroFee(
      dstChainId,
      1, // function type for swap
      ethers.AbiCoder.defaultAbiCoder().encode(['address'], [recipient]),
      '0x',
      lzTxParams
    );

    return router.swap(
      dstChainId,
      srcPoolId,
      dstPoolId,
      userAddress, // refund address
      amount,
      minAmount,
      lzTxParams,
      ethers.AbiCoder.defaultAbiCoder().encode(['address'], [recipient]),
      '0x',
      { value: nativeFee }
    );
  }

  public async bridgeViaAcross(
    stablecoin: StablecoinSymbol,
    amount: string,
    toChain: ChainId,
    recipient: string,
    stablecoinAddress: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const spokePoolAddress = BRIDGE_CONTRACTS[this.chainId]?.ACROSS_SPOKE_POOL;
    if (!spokePoolAddress) {
      throw new Error('Across not supported on this chain');
    }

    const spokePool = new ethers.Contract(spokePoolAddress, ACROSS_SPOKE_POOL_ABI, this.signer);
    
    // Get current timestamp
    const currentTime = await spokePool.getCurrentTime();
    
    // Use 0.25% relayer fee (2500 basis points = 0.25%)
    const relayerFeePct = ethers.parseEther('0.0025');

    return spokePool.deposit(
      recipient,
      stablecoinAddress,
      amount,
      toChain,
      relayerFeePct,
      currentTime
    );
  }

  public async bridgeViaCeler(
    stablecoin: StablecoinSymbol,
    amount: string,
    toChain: ChainId,
    recipient: string,
    stablecoinAddress: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const bridgeAddress = BRIDGE_CONTRACTS[this.chainId]?.CELER_BRIDGE;
    if (!bridgeAddress) {
      throw new Error('Celer Bridge not supported on this chain');
    }

    const bridge = new ethers.Contract(bridgeAddress, CELER_BRIDGE_ABI, this.signer);
    
    // 0.5% max slippage (5000 = 0.5%)
    const maxSlippage = 5000;
    const nonce = Date.now(); // Simple nonce generation

    return bridge.send(
      recipient,
      stablecoinAddress,
      amount,
      toChain,
      nonce,
      maxSlippage
    );
  }

  private async getStargateQuote(
    stablecoin: StablecoinSymbol,
    amount: string,
    toChain: ChainId
  ): Promise<BridgeQuote | null> {
    // Mock implementation - in production, would call Stargate's quote API
    const srcPoolId = STARGATE_POOL_IDS[this.chainId]?.[stablecoin];
    const dstPoolId = STARGATE_POOL_IDS[toChain]?.[stablecoin];
    
    if (!srcPoolId || !dstPoolId) return null;

    // Simulate 0.06% fee
    const fee = (BigInt(amount) * BigInt(6) / BigInt(10000)).toString();
    const outputAmount = (BigInt(amount) - BigInt(fee)).toString();

    return {
      protocol: 'Stargate',
      fromChain: this.chainId,
      toChain,
      stablecoin,
      inputAmount: amount,
      outputAmount,
      fees: fee,
      estimatedTime: '1-3 minutes',
      gasEstimate: '120000'
    };
  }

  private async getAcrossQuote(
    stablecoin: StablecoinSymbol,
    amount: string,
    toChain: ChainId
  ): Promise<BridgeQuote | null> {
    // Mock implementation - in production, would call Across API
    // Simulate 0.25% relayer fee
    const fee = (BigInt(amount) * BigInt(25) / BigInt(10000)).toString();
    const outputAmount = (BigInt(amount) - BigInt(fee)).toString();

    return {
      protocol: 'Across',
      fromChain: this.chainId,
      toChain,
      stablecoin,
      inputAmount: amount,
      outputAmount,
      fees: fee,
      estimatedTime: '2-5 minutes',
      gasEstimate: '100000'
    };
  }

  private async getCelerQuote(
    stablecoin: StablecoinSymbol,
    amount: string,
    toChain: ChainId
  ): Promise<BridgeQuote | null> {
    // Mock implementation - in production, would call Celer API
    // Simulate 0.1% fee
    const fee = (BigInt(amount) * BigInt(10) / BigInt(10000)).toString();
    const outputAmount = (BigInt(amount) - BigInt(fee)).toString();

    return {
      protocol: 'Celer',
      fromChain: this.chainId,
      toChain,
      stablecoin,
      inputAmount: amount,
      outputAmount,
      fees: fee,
      estimatedTime: '5-10 minutes',
      gasEstimate: '150000'
    };
  }

  public async getSupportedRoutes(): Promise<CrossChainBridge[]> {
    const routes: CrossChainBridge[] = [];
    const supportedChains: ChainId[] = [1, 137, 42161, 10];
    const supportedStablecoins: StablecoinSymbol[] = ['USDC', 'USDT', 'DAI'];

    for (const fromChain of supportedChains) {
      for (const toChain of supportedChains) {
        if (fromChain === toChain) continue;
        
        for (const stablecoin of supportedStablecoins) {
          routes.push({
            id: `${stablecoin}-${fromChain}-${toChain}`,
            name: `${stablecoin}: ${this.getChainName(fromChain)} → ${this.getChainName(toChain)}`,
            fromChain,
            toChain,
            stablecoin,
            estimatedTime: '2-5 minutes',
            fees: 2.5,
            isActive: true
          });
        }
      }
    }

    return routes;
  }

  private getChainName(chainId: ChainId): string {
    const names: Record<ChainId, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      56: 'BSC'
    };
    return names[chainId] || 'Unknown';
  }
}