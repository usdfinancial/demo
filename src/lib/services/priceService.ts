
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ALCHEMY_PRICES_API_URL = "https://api.g.alchemy.com/prices/v1";

export interface TokenPrice {
  currency: string;
  value: string;
  lastUpdatedAt: string;
}

export interface PriceData {
  symbol: string;
  prices: TokenPrice[];
  error?: string;
}

export async function getEthPriceInUsd(): Promise<number | null> {
  if (!ALCHEMY_API_KEY) {
    console.error("Alchemy API key not found.");
    return null;
  }

  const url = `${ALCHEMY_PRICES_API_URL}/${ALCHEMY_API_KEY}/tokens/by-symbol?symbols=ETH`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    const ethData = data.data.find((d: PriceData) => d.symbol === "ETH");
    if (ethData && ethData.prices) {
      const usdPrice = ethData.prices.find((p: TokenPrice) => p.currency === "USD");
      if (usdPrice && usdPrice.value) {
        return parseFloat(usdPrice.value);
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    return null;
  }
}
