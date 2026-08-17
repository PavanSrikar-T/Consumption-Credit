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
  },

  simulateLatePayment: async (userId: string): Promise<CreditLine> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (mockCreditLines.length > 0) {
          mockCreditLines.forEach(line => {
            line.health.behaviorScore = Math.max(0, line.health.behaviorScore - 20);
            
            if (line.health.behaviorScore < 60) {
              line.health.riskLevel = 'HIGH';
            } else if (line.health.behaviorScore < 80) {
              line.health.riskLevel = 'MEDIUM';
            }
            
            const limitDecrease = 2000;
            const oldLimit = line.totalLimit;
            line.totalLimit = Math.max(1000, line.totalLimit - limitDecrease);
            line.availableLimit = Math.max(0, line.availableLimit - limitDecrease);
            
            line.health.recommendedLimit = Math.max(1000, line.totalLimit - 1000);
            line.health.currentLimit = line.totalLimit;
            
            mockLimitHistory.push({
              id: `LH-PENALTY-${Date.now()}-${line.id}`,
              date: new Date().toISOString().split('T')[0],
              previousLimit: oldLimit,
              newLimit: line.totalLimit,
              reason: `Late Payment Penalty for ${line.lenderName} (Limit Decreased)`
            });
          });
          
          import('./mockData').then(({ updateMockCreditLines }) => {
            updateMockCreditLines([...mockCreditLines]);
          });
          
          resolve({...mockCreditLines[0]});
        } else {
          reject(new Error('No credit line found.'));
        }
      }, 800);
    });
  },

  simulateOnTimePayment: async (userId: string): Promise<CreditLine> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (mockCreditLines.length > 0) {
          mockCreditLines.forEach(line => {
            line.health.behaviorScore = Math.min(90, line.health.behaviorScore + 10);
            
            if (line.health.behaviorScore >= 80) {
              line.health.riskLevel = 'LOW';
            } else if (line.health.behaviorScore >= 60) {
              line.health.riskLevel = 'MEDIUM';
            }
            
            const limitIncrease = 2000;
            const oldLimit = line.totalLimit;
            line.totalLimit += limitIncrease;
            line.availableLimit += limitIncrease;
            
            line.health.recommendedLimit = line.totalLimit + 2000;
            line.health.currentLimit = line.totalLimit;
            
            mockLimitHistory.push({
              id: `LH-REWARD-${Date.now()}-${line.id}`,
              date: new Date().toISOString().split('T')[0],
              previousLimit: oldLimit,
              newLimit: line.totalLimit,
              reason: `Consistent On-Time Payments for ${line.lenderName}`
            });
          });
          
          import('./mockData').then(({ updateMockCreditLines }) => {
            updateMockCreditLines([...mockCreditLines]);
          });
          
          resolve({...mockCreditLines[0]});
        } else {
          reject(new Error('No credit line found.'));
        }
      }, 800);
    });
  }
};
