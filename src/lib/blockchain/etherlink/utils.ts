import { ethers, formatUnits, parseUnits, toBigInt, getAddress } from 'ethers';

// Format token amount with decimals
export const formatTokenAmount = (
  amount: string | bigint, 
  decimals: number = 18
): string => {
  if (!amount) return '0';
  
  const amountBigInt = typeof amount === 'string' ? toBigInt(amount) : amount;
  return formatUnits(amountBigInt, decimals);
};

// Parse token amount to smallest unit
export const parseTokenAmount = (
  amount: string, 
  decimals: number = 18
): string => {
  return parseUnits(amount, decimals).toString();
};

// Shorten address for display
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
};

// Check if address is valid
export const isValidAddress = (address: string): boolean => {
  try {
    getAddress(address);
    return true;
  } catch (e) {
    return false;
  }
};

// Convert to checksum address
export const toChecksumAddress = (address: string): string => {
  return getAddress(address);
};

// Calculate price impact
export const calculatePriceImpact = (
  amountIn: string,
  amountOut: string,
  rate: string
): string => {
  if (!amountIn || !amountOut || !rate) return '0';
  
  const inputValue = toBigInt(amountIn) * toBigInt(rate) / toBigInt(10 ** 18);
  const outputValue = toBigInt(amountOut);
  
  if (inputValue === 0n) return '0';
  
  const impact = (inputValue - outputValue) * 10000n / inputValue;
  return (Number(impact) / 100).toString();
};

// Calculate minimum amount out with slippage
export const calculateMinAmountOut = (
  amountOut: string, 
  slippage: number
): string => {
  if (!amountOut) return '0';
  
  const amountOutBigInt = toBigInt(amountOut);
  const slippageBps = BigInt(Math.floor(slippage * 100));
  const minAmountOut = amountOutBigInt * (10000n - slippageBps) / 10000n;
  
  return minAmountOut.toString();
};

// Format gas price for display
export const formatGasPrice = (gasPrice: string): string => {
  if (!gasPrice) return '0';
  return formatUnits(toBigInt(gasPrice), 'gwei');
};

// Format transaction value
export const formatTransactionValue = (
  value: string, 
  decimals: number = 18
): string => {
  if (!value) return '0';
  return formatUnits(toBigInt(value), decimals);
};

// Format token amount with symbol
export const formatTokenAmountWithSymbol = (
  amount: string | bigint,
  decimals: number,
  symbol: string,
  displayDecimals: number = 4
): string => {
  if (!amount) return `0 ${symbol}`;
  
  const amountBigInt = typeof amount === 'string' ? toBigInt(amount) : amount;
  const formatted = formatUnits(amountBigInt, decimals);
  const [whole, decimal] = formatted.split('.');
  
  if (!decimal || displayDecimals <= 0) return `${whole} ${symbol}`;
  
  const truncatedDecimal = decimal.length > displayDecimals 
    ? decimal.substring(0, displayDecimals) 
    : decimal;
    
  return `${whole}.${truncatedDecimal} ${symbol}`;
};
