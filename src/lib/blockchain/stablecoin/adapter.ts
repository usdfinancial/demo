import { ethers } from 'ethers';
import { StablecoinSymbol, ChainId } from '@/lib/data';

// Stablecoin contract addresses by chain
export const STABLECOIN_ADDRESSES: Record<ChainId, Record<StablecoinSymbol, string>> = {
  1: { // Ethereum Mainnet
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    FRAX: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    TUSD: '0x0000000000085d4780B73119b644AE5ecd22b376',
    BUSD: '0x4Fabb145d64652a948d72533023f6E7A623C7C53'
  },
  11155111: { // Sepolia Testnet
    USDC: '0xf08a50178dfcde18524640ea6618a1f965821715',
    USDT: '0x95eB8C08F1DA462c80AA9D2C26C514465E1BD66E', // Using ZeroAddress for unsupported tokens
    DAI: '0x0000000000000000000000000000000000000000',
    FRAX: '0x0000000000000000000000000000000000000000',
    TUSD: '0x0000000000000000000000000000000000000000',
    BUSD: '0x0000000000000000000000000000000000000000'
  },
  137: { // Polygon
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    FRAX: '0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89',
    TUSD: '0x2e1AD108fF1D8C782fcBbB89AAd783aC49586756',
    BUSD: '0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39'
  },
  42161: { // Arbitrum
    USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    FRAX: '0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F',
    TUSD: '0x4D15a3A2286D883AF0AA1B3f21367843FAc63E07',
    BUSD: '0x31190254504622cEBd24C065f066b534421b3e7D'
  },
  10: { // Optimism
    USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    FRAX: '0x2E3D870790dC77A83DD1d18184Acc7439A53f475',
    TUSD: '0x7113370218f31764C1B6353BDF6004d86fF6B9CC',
    BUSD: '0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39'
  },
  56: { // BSC
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    DAI: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    FRAX: '0x90C97F71E18723b0Cf0dfa30ee176Ab653E89F40',
    TUSD: '0x14016E85a25aeb13065688cAFB43044C2ef86784',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
  }
};

// Standard ERC20 ABI for stablecoins
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address, uint256) returns (bool)',
  'function transferFrom(address, address, uint256) returns (bool)',
  'function approve(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)'
];

export interface StablecoinInfo {
  symbol: StablecoinSymbol;
  address: string;
  decimals: number;
  balance: string;
  name: string;
}

export interface DepegAlert {
  stablecoin: StablecoinSymbol;
  currentPrice: number;
  depegPercentage: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export class StablecoinAdapter {
  private provider: ethers.JsonRpcProvider;
  private chainId: ChainId;
  private signer?: ethers.Signer;

  constructor(rpcUrl: string, chainId: ChainId) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.chainId = chainId;
  }

  public async connect(): Promise<{ address: string; chainId: bigint }> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    this.signer = await provider.getSigner();

    const address = await this.signer.getAddress();
    const network = await provider.getNetwork();

    return { address, chainId: network.chainId };
  }

  public async getStablecoinInfo(symbol: StablecoinSymbol, userAddress?: string): Promise<StablecoinInfo> {
    const address = STABLECOIN_ADDRESSES[this.chainId][symbol];
    if (!address) {
      throw new Error(`${symbol} not supported on chain ${this.chainId}`);
    }

    const contract = new ethers.Contract(address, ERC20_ABI, this.provider);
    
    const [name, decimals, balance] = await Promise.all([
      contract.name(),
      contract.decimals(),
      userAddress ? contract.balanceOf(userAddress) : '0'
    ]);

    return {
      symbol,
      address,
      decimals: Number(decimals),
      balance: balance.toString(),
      name: name as string
    };
  }

  public async getAllStablecoinBalances(userAddress: string): Promise<StablecoinInfo[]> {
    const supportedStablecoins = Object.keys(STABLECOIN_ADDRESSES[this.chainId]) as StablecoinSymbol[];
    
    const balances = await Promise.all(
      supportedStablecoins.map(symbol => 
        this.getStablecoinInfo(symbol, userAddress)
      )
    );

    return balances.filter(balance => BigInt(balance.balance) > 0n);
  }

  public async transferStablecoin(
    symbol: StablecoinSymbol,
    to: string,
    amount: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const address = STABLECOIN_ADDRESSES[this.chainId][symbol];
    const contract = new ethers.Contract(address, ERC20_ABI, this.signer);
    
    return contract.transfer(to, amount);
  }

  public async approveStablecoin(
    symbol: StablecoinSymbol,
    spender: string,
    amount: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const address = STABLECOIN_ADDRESSES[this.chainId][symbol];
    const contract = new ethers.Contract(address, ERC20_ABI, this.signer);
    
    return contract.approve(spender, amount);
  }

  public async getAllowance(
    symbol: StablecoinSymbol,
    owner: string,
    spender: string
  ): Promise<string> {
    const address = STABLECOIN_ADDRESSES[this.chainId][symbol];
    const contract = new ethers.Contract(address, ERC20_ABI, this.provider);
    
    const allowance = await contract.allowance(owner, spender);
    return allowance.toString();
  }

  public async checkDepegStatus(symbols: StablecoinSymbol[]): Promise<DepegAlert[]> {
    // Mock implementation - in production, would fetch from price oracles
    const alerts: DepegAlert[] = [];
    
    for (const symbol of symbols) {
      // Simulate price check (normally from Chainlink, CoinGecko, etc.)
      const mockPrice = 0.9995 + (Math.random() * 0.001); // 0.9995 - 1.0005
      const depegPercentage = Math.abs((1 - mockPrice) * 100);
      
      if (depegPercentage > 0.1) { // Alert if more than 0.1% depeg
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (depegPercentage > 0.5) severity = 'medium';
        if (depegPercentage > 1.0) severity = 'high';
        
        alerts.push({
          stablecoin: symbol,
          currentPrice: mockPrice,
          depegPercentage,
          severity,
          timestamp: new Date()
        });
      }
    }
    
    return alerts;
  }

  public formatStablecoinAmount(amount: string, decimals: number): string {
    return ethers.formatUnits(amount, decimals);
  }

  public parseStablecoinAmount(amount: string, decimals: number): string {
    return ethers.parseUnits(amount, decimals).toString();
  }

  public getStablecoinAddress(symbol: StablecoinSymbol): string {
    return STABLECOIN_ADDRESSES[this.chainId][symbol];
  }

  public getSupportedStablecoins(): StablecoinSymbol[] {
    return Object.keys(STABLECOIN_ADDRESSES[this.chainId]) as StablecoinSymbol[];
  }
}