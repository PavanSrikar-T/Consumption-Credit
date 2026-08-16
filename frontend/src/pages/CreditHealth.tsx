import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { creditApi } from '../api/creditApi';
import { useAuth } from '../context/AuthContext';
import { CreditLine } from '../types';
import { ShieldCheck, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CreditHealth = () => {
  const { user } = useAuth();
  const [credit, setCredit] = useState<CreditLine | null>(null);

  useEffect(() => {
    if (user) {
      creditApi.getCreditStatus(user.id).then(setCredit);
    }
  }, [user]);

  if (!credit) return <div className="text-center p-8 text-fintech-secondary">Loading health data...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-fintech-primary">Credit Health</h1>

      <Card className="text-center p-8 bg-gradient-to-b from-green-50 to-white">
        <div className="inline-flex justify-center items-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-4">
          <ShieldCheck size={40} />
        </div>
        <p className="text-fintech-secondary font-medium mb-1">Credit Line Score</p>
        <h2 className="text-5xl font-black text-fintech-primary mb-2">{credit.health.behaviorScore} <span className="text-2xl text-gray-400 font-medium">/ 100</span></h2>
        <div className="inline-block px-4 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold tracking-wide">
          {credit.health.riskLevel} RISK
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-fintech-primary mb-2 border-b pb-2">Why this score?</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Your Credit Line Score dynamically increases or decreases based on your daily transactions. Maintaining a good repayment history and responsible utilization directly boosts your score over time.
        </p>
        <div className="space-y-3">
          {credit.health.factors.map((factor, idx) => (
            <div key={idx} className="flex gap-3 text-sm text-fintech-primary">
              <Check size={18} className="text-green-500 shrink-0" />
              <span>{factor}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="font-bold text-fintech-primary">Credit Limit Analysis</h3>
          <Link to="/credit-health/history" className="text-sm text-blue-600 hover:underline">View History</Link>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-fintech-secondary">Current Limit</p>
            <p className="font-bold text-lg">₹{credit.health.currentLimit.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-fintech-secondary">Recommended Limit</p>
            <p className="font-bold text-lg text-green-600">₹{credit.health.recommendedLimit.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg">
          Maintain this behavior for 3 more months to unlock the recommended limit!
        </div>
      </Card>

      {credit.interestRate && (
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <span className="font-bold text-lg">%</span>
          </div>
          <div>
            <p className="text-sm text-fintech-secondary">Current Interest Rate</p>
            <p className="font-bold text-fintech-primary text-xl">{credit.interestRate}% p.a.</p>
            <p className="text-xs text-gray-500 mt-1">Maintained by {credit.lenderName || 'your lender'}</p>
          </div>
        </Card>
      )}
    </div>
  );
};
