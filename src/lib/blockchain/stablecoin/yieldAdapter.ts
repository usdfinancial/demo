import { ethers } from 'ethers';
import { StablecoinSymbol, ChainId, ProtocolInfo } from '@/lib/data';

// DeFi Protocol Addresses by Chain
export const PROTOCOL_ADDRESSES: Record<ChainId, Record<string, string>> = {
  1: { // Ethereum
    AAVE_LENDING_POOL: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
    COMPOUND_CUSDC: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    COMPOUND_CDAI: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
    YEARN_USDC_VAULT: '0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE',
    YEARN_DAI_VAULT: '0xdA816459F1AB5631232FE5e97a05BBBb94970c95',
    CURVE_3POOL: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'
  },
  137: { // Polygon
    AAVE_LENDING_POOL: '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf',
    COMPOUND_CUSDC: '0xF25212E676D1F7F89Cd72fFEe66158f541246445',
    CURVE_AAVE: '0x445FE580eF8d70FF569aB36e80c647af338db351'
  },
  42161: { // Arbitrum
    AAVE_LENDING_POOL: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    CURVE_2POOL: '0x7f90122BF0700F9E7e1F688fe926940E8839F353'
  },
  10: { // Optimism
    AAVE_LENDING_POOL: '0x794a61358D6845594F94dc1DB02A252b5b4814aD'
  },
  56: { // BSC
    // BSC protocols would be added here
  }
};

// Aave Lending Pool ABI (simplified)
const AAVE_LENDING_POOL_ABI = [
  'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
  'function withdraw(address asset, uint256 amount, address to) returns (uint256)',
  'function getUserAccountData(address user) view returns (uint256, uint256, uint256, uint256, uint256, uint256)'
];

// Compound cToken ABI (simplified)
const COMPOUND_CTOKEN_ABI = [
  'function mint(uint256 mintAmount) returns (uint256)',
  'function redeem(uint256 redeemTokens) returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function exchangeRateStored() view returns (uint256)',
  'function supplyRatePerBlock() view returns (uint256)'
];

// Yearn Vault ABI (simplified)
const YEARN_VAULT_ABI = [
  'function deposit(uint256 amount) returns (uint256)',
  'function withdraw(uint256 maxShares) returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function pricePerShare() view returns (uint256)',
  'function totalAssets() view returns (uint256)'
];

export interface YieldOpportunity {
  protocol: string;
  stablecoin: StablecoinSymbol;
  apy: number;
  tvl: number;
  risk: 'Low' | 'Medium' | 'High';
  minDeposit: string;
  contractAddress: string;
  chainId: ChainId;
}

export interface YieldTransaction {
  protocol: string;
  action: 'deposit' | 'withdraw';
  stablecoin: StablecoinSymbol;
  amount: string;
  expectedShares?: string;
  txHash?: string;
}

export class YieldAdapter {
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

  public async getYieldOpportunities(stablecoin: StablecoinSymbol): Promise<YieldOpportunity[]> {
    const opportunities: YieldOpportunity[] = [];

    // Mock yield opportunities - in production, fetch real APYs from protocols
    const protocolData = {
      'Aave': { apy: 4.2, tvl: 8500000000, risk: 'Low' as const },
      'Compound': { apy: 3.8, tvl: 2800000000, risk: 'Low' as const },
      'Yearn': { apy: 5.1, tvl: 1200000000, risk: 'Medium' as const },
      'Curve': { apy: 4.5, tvl: 4100000000, risk: 'Low' as const }
    };

    for (const [protocol, data] of Object.entries(protocolData)) {
      opportunities.push({
        protocol,
        stablecoin,
        apy: data.apy + (Math.random() * 0.5 - 0.25), // Add some variance
        tvl: data.tvl,
        risk: data.risk,
        minDeposit: '1.0',
        contractAddress: this.getProtocolAddress(protocol, stablecoin),
        chainId: this.chainId
      });
    }

    return opportunities.sort((a, b) => b.apy - a.apy);
  }

  public async depositToAave(
    stablecoin: StablecoinSymbol,
    amount: string,
    stablecoinAddress: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const lendingPoolAddress = PROTOCOL_ADDRESSES[this.chainId]?.AAVE_LENDING_POOL;
    if (!lendingPoolAddress) {
      throw new Error('Aave not supported on this chain');
    }

    const lendingPool = new ethers.Contract(lendingPoolAddress, AAVE_LENDING_POOL_ABI, this.signer);
    const userAddress = await this.signer.getAddress();

    return lendingPool.deposit(stablecoinAddress, amount, userAddress, 0);
  }

  public async withdrawFromAave(
    stablecoin: StablecoinSymbol,
    amount: string,
    stablecoinAddress: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const lendingPoolAddress = PROTOCOL_ADDRESSES[this.chainId]?.AAVE_LENDING_POOL;
    if (!lendingPoolAddress) {
      throw new Error('Aave not supported on this chain');
    }

    const lendingPool = new ethers.Contract(lendingPoolAddress, AAVE_LENDING_POOL_ABI, this.signer);
    const userAddress = await this.signer.getAddress();

    return lendingPool.withdraw(stablecoinAddress, amount, userAddress);
  }

  public async depositToCompound(
    stablecoin: StablecoinSymbol,
    amount: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const cTokenAddress = this.getCompoundTokenAddress(stablecoin);
    if (!cTokenAddress) {
      throw new Error(`Compound ${stablecoin} not supported on this chain`);
    }

    const cToken = new ethers.Contract(cTokenAddress, COMPOUND_CTOKEN_ABI, this.signer);
    return cToken.mint(amount);
  }

  public async withdrawFromCompound(
    stablecoin: StablecoinSymbol,
    cTokenAmount: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const cTokenAddress = this.getCompoundTokenAddress(stablecoin);
    if (!cTokenAddress) {
      throw new Error(`Compound ${stablecoin} not supported on this chain`);
    }

    const cToken = new ethers.Contract(cTokenAddress, COMPOUND_CTOKEN_ABI, this.signer);
    return cToken.redeem(cTokenAmount);
  }

  public async depositToYearn(
    stablecoin: StablecoinSymbol,
    amount: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const vaultAddress = this.getYearnVaultAddress(stablecoin);
    if (!vaultAddress) {
      throw new Error(`Yearn ${stablecoin} vault not supported on this chain`);
    }

    const vault = new ethers.Contract(vaultAddress, YEARN_VAULT_ABI, this.signer);
    return vault.deposit(amount);
  }

  public async withdrawFromYearn(
    stablecoin: StablecoinSymbol,
    shares: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not connected');
    }

    const vaultAddress = this.getYearnVaultAddress(stablecoin);
    if (!vaultAddress) {
      throw new Error(`Yearn ${stablecoin} vault not supported on this chain`);
    }

    const vault = new ethers.Contract(vaultAddress, YEARN_VAULT_ABI, this.signer);
    return vault.withdraw(shares);
  }

  public async getProtocolBalance(
    protocol: string,
    stablecoin: StablecoinSymbol,
    userAddress: string
  ): Promise<{ balance: string; value: string }> {
    switch (protocol.toLowerCase()) {
      case 'compound':
        return this.getCompoundBalance(stablecoin, userAddress);
      case 'yearn':
        return this.getYearnBalance(stablecoin, userAddress);
      default:
        return { balance: '0', value: '0' };
    }
  }

  private async getCompoundBalance(
    stablecoin: StablecoinSymbol,
    userAddress: string
  ): Promise<{ balance: string; value: string }> {
    const cTokenAddress = this.getCompoundTokenAddress(stablecoin);
    if (!cTokenAddress) {
      return { balance: '0', value: '0' };
    }

    const cToken = new ethers.Contract(cTokenAddress, COMPOUND_CTOKEN_ABI, this.provider);
    const [balance, exchangeRate] = await Promise.all([
      cToken.balanceOf(userAddress),
      cToken.exchangeRateStored()
    ]);

    const value = (BigInt(balance) * BigInt(exchangeRate) / BigInt(10 ** 18)).toString();
    return { balance: balance.toString(), value };
  }

  private async getYearnBalance(
    stablecoin: StablecoinSymbol,
    userAddress: string
  ): Promise<{ balance: string; value: string }> {
    const vaultAddress = this.getYearnVaultAddress(stablecoin);
    if (!vaultAddress) {
      return { balance: '0', value: '0' };
    }

    const vault = new ethers.Contract(vaultAddress, YEARN_VAULT_ABI, this.provider);
    const [balance, pricePerShare] = await Promise.all([
      vault.balanceOf(userAddress),
      vault.pricePerShare()
    ]);

    const value = (BigInt(balance) * BigInt(pricePerShare) / BigInt(10 ** 18)).toString();
    return { balance: balance.toString(), value };
  }

  private getProtocolAddress(protocol: string, stablecoin: StablecoinSymbol): string {
    const addresses = PROTOCOL_ADDRESSES[this.chainId];
    if (!addresses) return '';

    switch (protocol.toLowerCase()) {
      case 'aave':
        return addresses.AAVE_LENDING_POOL || '';
      case 'compound':
        return this.getCompoundTokenAddress(stablecoin) || '';
      case 'yearn':
        return this.getYearnVaultAddress(stablecoin) || '';
      case 'curve':
        return addresses.CURVE_3POOL || addresses.CURVE_AAVE || '';
      default:
        return '';
    }
  }

  private getCompoundTokenAddress(stablecoin: StablecoinSymbol): string | null {
    const addresses = PROTOCOL_ADDRESSES[this.chainId];
    if (!addresses) return null;

    switch (stablecoin) {
      case 'USDC':
        return addresses.COMPOUND_CUSDC || null;
      case 'DAI':
        return addresses.COMPOUND_CDAI || null;
      default:
        return null;
    }
  }

  private getYearnVaultAddress(stablecoin: StablecoinSymbol): string | null {
    const addresses = PROTOCOL_ADDRESSES[this.chainId];
    if (!addresses) return null;

    switch (stablecoin) {
      case 'USDC':
        return addresses.YEARN_USDC_VAULT || null;
      case 'DAI':
        return addresses.YEARN_DAI_VAULT || null;
      default:
        return null;
    }
  }

  public async optimizeYield(
    stablecoin: StablecoinSymbol,
    amount: string,
    currentProtocol?: string
  ): Promise<YieldOpportunity> {
    const opportunities = await this.getYieldOpportunities(stablecoin);
    
    // Filter out current protocol if provided
    const availableOpportunities = currentProtocol 
      ? opportunities.filter(op => op.protocol.toLowerCase() !== currentProtocol.toLowerCase())
      : opportunities;

    if (availableOpportunities.length === 0) {
      throw new Error('No yield opportunities available');
    }

    // Return the highest APY opportunity
    return availableOpportunities[0];
  }
}