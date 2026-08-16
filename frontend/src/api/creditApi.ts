import { isMockMode, delay, apiClient } from './apiClient';
import { mockLimitHistory, mockCreditLines } from './mockData';
import { CreditLine, LimitHistoryRecord } from '../types';

export const creditApi = {
  getCreditStatus: async (userId: string): Promise<CreditLine> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (mockCreditLines.length > 0) {
          resolve(mockCreditLines[0]);
        } else {
          reject(new Error('No credit line provisioned yet.'));
        }
      }, 600);
    });
  },

  getAllCreditLines: async (userId: string): Promise<CreditLine[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockCreditLines);
      }, 600);
    });
  },

  getLimitHistory: async (userId: string): Promise<LimitHistoryRecord[]> => {
    if (isMockMode()) {
      await delay(500);
      return mockLimitHistory;
    }
    const response = await apiClient.get(`/credit/${userId}/limit-history`);
    return response.data;
  },

  requestEmergencyLimit: async (userId: string, additionalAmount: number): Promise<{ success: boolean; newLimit: number; newInterestRate: number }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (mockCreditLines.length > 0) {
          const primaryLine = mockCreditLines[0];
          primaryLine.totalLimit += additionalAmount;
          primaryLine.availableLimit += additionalAmount;
          primaryLine.interestRate += 5; // e.g., penalty of +5% interest rate for emergency
          
          mockLimitHistory.push({
            id: `LH-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            previousLimit: primaryLine.totalLimit - additionalAmount,
            newLimit: primaryLine.totalLimit,
            reason: 'Emergency Package (Higher Interest)'
          });
          
          resolve({ 
            success: true, 
            newLimit: primaryLine.totalLimit, 
            newInterestRate: primaryLine.interestRate 
          });
        } else {
          reject(new Error('No credit line found.'));
        }
      }, 800);
    });
  }
};
