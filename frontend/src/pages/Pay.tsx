import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { creditApi } from '../api/creditApi';
import { paymentApi } from '../api/paymentApi';
import { useAuth } from '../context/AuthContext';
import { CreditLine, PaymentMode } from '../types';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Pay = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creditLines, setCreditLines] = useState<CreditLine[]>([]);
  const [selectedCreditLineId, setSelectedCreditLineId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [mode, setMode] = useState<PaymentMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      creditApi.getAllCreditLines(user.id).then((lines) => {
        setCreditLines(lines);
        if (lines.length > 0) {
          setSelectedCreditLineId(lines[0].id);
        }
      });
    }
  }, [user]);

  const selectedCreditLine = creditLines.find(c => c.id === selectedCreditLineId);

  const numAmount = parseFloat(amount) || 0;

  const handlePay = async () => {
    if (!mode || !amount || !merchant) return;
    setLoading(true);
    setError('');

    try {
      const res = await paymentApi.pay(numAmount, merchant, mode, selectedCreditLineId);
      if (res.success) {
        navigate(`/transactions/${res.transaction.id}`);
      } else {
        setError(res.reason || 'Payment declined');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-fintech-primary">New Payment</h1>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fintech-secondary mb-1">Merchant UPI / Name</label>
            <input 
              type="text" 
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Swiggy, Amazon"
              className="w-full p-3 border border-fintech-border rounded-xl focus:ring-2 focus:ring-fintech-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fintech-secondary mb-1">Amount (₹)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 border border-fintech-border rounded-xl text-2xl font-bold focus:ring-2 focus:ring-fintech-primary focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {numAmount > 0 && merchant && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="font-semibold text-fintech-primary">How would you like to pay?</h3>
          
          <div 
            className={`card cursor-pointer border-2 transition ${mode === 'OWN_MONEY' ? 'border-fintech-primary bg-blue-50' : 'border-transparent hover:border-gray-300'}`}
            onClick={() => setMode('OWN_MONEY')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-fintech-primary">Own Money</p>
                <p className="text-sm text-fintech-secondary">Pay directly from linked bank account</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === 'OWN_MONEY' ? 'border-fintech-primary' : 'border-gray-300'}`}>
                {mode === 'OWN_MONEY' && <div className="w-2.5 h-2.5 bg-fintech-primary rounded-full" />}
              </div>
            </div>
          </div>

          <div 
            className={`card cursor-pointer border-2 transition ${mode === 'CREDIT_LINE' ? 'border-fintech-primary bg-blue-50' : 'border-transparent hover:border-gray-300'}`}
            onClick={() => setMode('CREDIT_LINE')}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-fintech-primary flex items-center gap-1">
                  Credit Line <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">RECOMMENDED</span>
                </p>
                <p className="text-sm text-fintech-secondary">Use your pre-approved limit</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === 'CREDIT_LINE' ? 'border-fintech-primary' : 'border-gray-300'}`}>
                {mode === 'CREDIT_LINE' && <div className="w-2.5 h-2.5 bg-fintech-primary rounded-full" />}
              </div>
            </div>

            {mode === 'CREDIT_LINE' && creditLines.length > 0 && (
              <div className="mt-4 pt-4 border-t border-fintech-border/60">
                <p className="text-sm font-bold text-slate-800 mb-3">Select your Credit Line:</p>
                <div className="space-y-3 mb-4">
                  {creditLines.map(line => (
                    <div 
                      key={line.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCreditLineId(line.id);
                      }}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                        selectedCreditLineId === line.id ? 'border-fintech-primary bg-white shadow-sm' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-900">{line.lenderName}</p>
                        <p className="text-xs text-fintech-secondary">Avail: ₹{line.availableLimit.toLocaleString()}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedCreditLineId === line.id ? 'border-fintech-primary' : 'border-gray-300'}`}>
                        {selectedCreditLineId === line.id && <div className="w-2 h-2 bg-fintech-primary rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCreditLine && (
                  <>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-fintech-secondary">Available Credit:</span>
                      <span className="font-medium">₹{selectedCreditLine.availableLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-fintech-primary font-bold">
                      <span>After payment:</span>
                      <span>₹{(selectedCreditLine.availableLimit - numAmount).toLocaleString()}</span>
                    </div>
                    {numAmount > selectedCreditLine.availableLimit && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><ShieldAlert size={14}/> Insufficient limit</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      {mode && (
        <button 
          onClick={handlePay}
          disabled={loading || Boolean(mode === 'CREDIT_LINE' && selectedCreditLine && numAmount > selectedCreditLine.availableLimit)}
          className="btn-primary mt-8 flex justify-center items-center gap-2"
        >
          {loading ? 'Processing...' : (
            <>
              <CheckCircle2 size={20} />
              Confirm {mode === 'CREDIT_LINE' ? 'Credit' : ''} Payment of ₹{numAmount.toLocaleString()}
            </>
          )}
        </button>
      )}
    </div>
  );
};
