import { ethers } from 'ethers';

export class TransactionService {
  static async sendTransaction(transaction: any, signer: ethers.Signer) {
    try {
      const tx = await signer.sendTransaction(transaction);
      return tx.wait();
    } catch (error) {
      console.error('Transaction failed:', (error as Error).message);
      throw error;
    }
  }

  static async getTransactionStatus(provider: ethers.Provider, txHash: string) {
    return provider.getTransactionReceipt(txHash);
  }
}
