// Blockchain configuration

export interface BlockchainConfig {
  ethereum: {
    alchemyApiKey: string;
    alchemyPolicyId: string;
    defaultNetwork: 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy' | 'fuji';
    networks: {
      sepolia: EthereumNetwork;
      arbitrumSepolia: EthereumNetwork;
      baseSepolia: EthereumNetwork;
      optimismSepolia: EthereumNetwork;
      polygonAmoy: EthereumNetwork;
      fuji: EthereumNetwork;
    };
  };
}

export interface EthereumNetwork {
  chainId: string;
  chainIdDecimal: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  ticker: string;
  isTestnet: boolean;
  tokens: {
    USDC: TokenConfig;
  };
}

export interface TokenConfig {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
}

// Load configuration from environment variables
const getConfig = (): BlockchainConfig => {
  const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
  
  return {
    ethereum: {
      alchemyApiKey,
      alchemyPolicyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID || '',
      defaultNetwork: 'sepolia',
      networks: {
        sepolia: {
          chainId: '0xaa36a7',
          chainIdDecimal: 11155111,
          name: 'Ethereum Sepolia',
          rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
          blockExplorer: 'https://sepolia.etherscan.io',
          ticker: 'ETH',
          isTestnet: true,
          tokens: {
            USDC: {
              address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin (Sepolia)',
            },
          },
        },
        arbitrumSepolia: {
          chainId: '0x66eee',
          chainIdDecimal: 421614,
          name: 'Arbitrum Sepolia',
          rpcUrl: `https://arb-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
          blockExplorer: 'https://sepolia.arbiscan.io',
          ticker: 'ETH',
          isTestnet: true,
          tokens: {
            USDC: {
              address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin (Arbitrum Sepolia)',
            },
          },
        },
        baseSepolia: {
          chainId: '0x14a34',
          chainIdDecimal: 84532,
          name: 'Base Sepolia',
          rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
          blockExplorer: 'https://sepolia.basescan.org',
          ticker: 'ETH',
          isTestnet: true,
          tokens: {
            USDC: {
              address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin (Base Sepolia)',
            },
          },
        },
        optimismSepolia: {
          chainId: '0xaa37dc',
          chainIdDecimal: 11155420,
          name: 'OP Sepolia',
          rpcUrl: `https://opt-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
          blockExplorer: 'https://sepolia-optimism.etherscan.io',
          ticker: 'ETH',
          isTestnet: true,
          tokens: {
            USDC: {
              address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin (OP Sepolia)',
            },
          },
        },
        polygonAmoy: {
          chainId: '0x13882',
          chainIdDecimal: 80002,
          name: 'Polygon Amoy Testnet',
          rpcUrl: `https://polygon-amoy.g.alchemy.com/v2/${alchemyApiKey}`,
          blockExplorer: 'https://amoy.polygonscan.com',
          ticker: 'MATIC',
          isTestnet: true,
          tokens: {
            USDC: {
              address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin (Polygon Amoy)',
            },
          },
        },
        fuji: {
          chainId: '0xa869',
          chainIdDecimal: 43113,
          name: 'Avalanche Fuji',
          rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
          blockExplorer: 'https://testnet.snowtrace.io',
          ticker: 'AVAX',
          isTestnet: true,
          tokens: {
            USDC: {
              address: '0x5425890298aed601595a70AB815c96711a31Bc65',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin (Avalanche Fuji)',
            },
          },
        },
      },
    },
  };
};

// Export config as a constant
export const blockchainConfig: BlockchainConfig = getConfig();

// Helper functions

// Ethereum helper functions
export const getEthereumConfig = () => blockchainConfig.ethereum;

export const getEthereumNetwork = (network: 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy' | 'fuji') => 
  blockchainConfig.ethereum.networks[network];

export const getTokenConfig = (network: 'sepolia' | 'arbitrumSepolia' | 'baseSepolia' | 'optimismSepolia' | 'polygonAmoy' | 'fuji', token: 'USDC') =>
  blockchainConfig.ethereum.networks[network].tokens[token];

export const validateEthereumConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = blockchainConfig.ethereum;

  if (!config.alchemyApiKey) {
    errors.push('Missing NEXT_PUBLIC_ALCHEMY_API_KEY');
  }

  if (!config.alchemyPolicyId) {
    errors.push('Missing NEXT_PUBLIC_ALCHEMY_POLICY_ID');
  }


  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getEthereumDebugInfo = () => ({
  environment: {
    hasAlchemyKey: !!blockchainConfig.ethereum.alchemyApiKey,
    alchemyKeyPrefix: blockchainConfig.ethereum.alchemyApiKey?.slice(0, 8) + '...',
    hasPolicyId: !!blockchainConfig.ethereum.alchemyPolicyId,
    hasAlchemyAccountKit: !!blockchainConfig.ethereum.accountKitConfig?.apiKey,
  },
  networks: Object.keys(blockchainConfig.ethereum.networks),
  defaultNetwork: blockchainConfig.ethereum.defaultNetwork,
  validation: validateEthereumConfig(),
});

// Default export for backward compatibility
export default blockchainConfig;
