'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import { NotificationModal } from '@/components/ui/NotificationModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Token {
  symbol: string;
  name: string;
  decimals: number;
}

// Sample stablecoin token list - USD Financial supports USDC and USDT only
const DEFAULT_TOKENS: Token[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
];

export function SwapWidget() {
  const [fromToken, setFromToken] = useState<Token>(DEFAULT_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(DEFAULT_TOKENS[1]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Mock exchange rate calculation
  const exchangeRate = fromToken.symbol === 'USDC' && toToken.symbol === 'USDT' ? 0.9998 : 1.0002;
  const toAmount = amount ? (parseFloat(amount) * exchangeRate).toFixed(4) : '0';

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const handleSwap = async () => {
    setLoading(true);
    // Simulate swap transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    // Show success modal instead of alert
    setShowSuccessModal(true);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Stablecoin Swap</CardTitle>
        <CardDescription>
          Exchange between USDC and USDT with minimal fees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          <div className="flex space-x-2">
            <Select value={fromToken.symbol} onValueChange={(value) => {
              const token = DEFAULT_TOKENS.find(t => t.symbol === value);
              if (token) setFromToken(token);
            }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_TOKENS.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleSwapTokens}
            className="rounded-full"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          <div className="flex space-x-2">
            <Select value={toToken.symbol} onValueChange={(value) => {
              const token = DEFAULT_TOKENS.find(t => t.symbol === value);
              if (token) setToToken(token);
            }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_TOKENS.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0.00"
              value={toAmount}
              readOnly
              className="flex-1 bg-muted"
            />
          </div>
        </div>

        {/* Exchange Rate */}
        {amount && parseFloat(amount) > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}
          </div>
        )}

        {/* Swap Button */}
        <Button 
          onClick={handleSwap} 
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full"
        >
          {loading ? 'Swapping...' : 'Swap'}
        </Button>
      </CardContent>

      <NotificationModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        type="swap"
        title="Swap Completed Successfully!"
        message={`Successfully swapped ${amount} ${fromToken.symbol} to ${toAmount} ${toToken.symbol}`}
        amount={toAmount}
        currency={toToken.symbol}
        details={[
          `From: ${amount} ${fromToken.symbol}`,
          `To: ${toAmount} ${toToken.symbol}`,
          `Exchange Rate: 1 ${fromToken.symbol} = ${exchangeRate} ${toToken.symbol}`,
          `Transaction Fee: 0.1% (included in rate)`,
          `Network: Ethereum Sepolia Testnet`
        ]}
        showCopy={true}
        copyText={`Swap: ${amount} ${fromToken.symbol} → ${toAmount} ${toToken.symbol} | Rate: ${exchangeRate} | Demo Transaction`}
      />
    </Card>
  );
}