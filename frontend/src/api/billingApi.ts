import { isMockMode, delay, apiClient } from './apiClient';
import { mockStatement, mockTransactions, mockCreditLines, mockLimitHistory } from './mockData';
import { Statement, StatementItem } from '../types';

export const billingApi = {
  getStatement: async (userId: string): Promise<Statement> => {
    if (isMockMode()) {
      await delay(800);
      return mockStatement;
    }
    const response = await apiClient.get(`/billing/${userId}/statement`);
    return response.data;
  },

  payBill: async (amount: number): Promise<{ success: boolean; newBalance: number }> => {
    if (isMockMode()) {
      await delay(1000);
      
      const primaryLine = mockCreditLines[0];

      mockStatement.totalAmountDue = Math.max(0, mockStatement.totalAmountDue - amount);
      mockStatement.amountPaid = (mockStatement.amountPaid || 0) + amount;
      
      if (primaryLine) {
        primaryLine.availableLimit += amount;
        primaryLine.utilizedLimit -= amount;
        
        // Auto-increase health score if they pay bill early/on-time
        if (primaryLine.health.behaviorScore < 100) {
          primaryLine.health.behaviorScore = Math.min(100, primaryLine.health.behaviorScore + 5);
          if (primaryLine.health.behaviorScore >= 90) {
            primaryLine.health.riskLevel = 'LOW';
          }
        }
      }

      mockStatement.items.push({
        id: `P-${Math.floor(Math.random() * 1000)}`,
        type: 'Bill Payment',
        amount: -amount
      });

      // Synthetic simulation: trigger limit increase if bill is paid and we're mock testing it
      if (primaryLine && primaryLine.totalLimit === 5000) {
        primaryLine.totalLimit = 6000;
        primaryLine.availableLimit += 1000; // Give them the extra 1000 available
        
        mockLimitHistory.push({
          id: `LH-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          previousLimit: 5000,
          newLimit: 6000,
          reason: 'Consistent Repayment Behavior'
        });
      }

      return { success: true, newBalance: mockStatement.totalAmountDue };
    }
    
    const response = await apiClient.post(`/billing/pay`, { amount });
    return response.data;
  }
};
