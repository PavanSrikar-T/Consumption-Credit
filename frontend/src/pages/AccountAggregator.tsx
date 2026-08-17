import React, { useState, useEffect } from 'react';
import { ShieldCheck, Database, Link as LinkIcon, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aaApi, ConsentRecord, FinancialData } from '../api/aaApi';

export const AccountAggregator = () => {
    const { user } = useAuth();
    const [consents, setConsents] = useState<ConsentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const [fetchingData, setFetchingData] = useState(false);
    const [dataError, setDataError] = useState('');

    useEffect(() => {
        if (user) {
            aaApi.getUserConsents(user.id)
                .then(setConsents)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [user]);

    const handleViewDetails = async (consent: ConsentRecord) => {
        setSelectedConsent(consent);
        setFinancialData(null);
        setDataError('');
        
        if (consent.status === 'GRANTED') {
            setFetchingData(true);
            try {
                const data = await aaApi.getFinancialData(consent.consentId);
                setFinancialData(data);
            } catch (err: any) {
                setDataError(err.message || 'Failed to fetch financial data');
            } finally {
                setFetchingData(false);
            }
        }
    };

    const handleRevoke = async (consentId: string) => {
        try {
            const revoked = await aaApi.revokeConsent(consentId);
            setConsents(prev => prev.map(c => c.consentId === consentId ? revoked : c));
            if (selectedConsent?.consentId === consentId) {
                setSelectedConsent(revoked);
                setFinancialData(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleApprove = async (consentId: string) => {
        try {
            const approved = await aaApi.approveConsent(consentId);
            setConsents(prev => prev.map(c => c.consentId === consentId ? approved : c));
            handleViewDetails(approved);
        } catch (e) {
            console.error(e);
        }
    };

    const hasGranted = consents.some(c => c.status === 'GRANTED');

    return (
        <div className="max-w-4xl mx-auto p-4 animate-fade-in">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Database className="text-blue-600" />
                Financial Information
            </h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Account Aggregator</h2>
                        <p className="text-sm text-gray-500">Manage your connected financial accounts</p>
                    </div>
                    {hasGranted ? (
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                            <ShieldCheck size={14} />
                            Consent Granted
                        </div>
                    ) : (
                        <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1">
                            <AlertCircle size={14} />
                            No Active Consents
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Connected Accounts</h3>
                    
                    {hasGranted ? (
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
                                    <LinkIcon size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Demo Bank</p>
                                    <p className="text-sm text-gray-500">Savings Account ••••1234</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Status</p>
                                <p className="text-sm font-medium text-green-600">Active</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No accounts connected. Provide consent to link accounts.</p>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-4">Consent History</h3>
                    
                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : consents.length === 0 ? (
                        <p className="text-sm text-gray-500">No consent history found.</p>
                    ) : (
                        <div className="space-y-3">
                            {consents.map(consent => (
                                <div key={consent.consentId} className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{consent.purpose.replace('_', ' ')}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs font-medium ${consent.status === 'GRANTED' ? 'text-green-600' : consent.status === 'REVOKED' ? 'text-orange-600' : consent.status === 'PENDING' ? 'text-blue-600' : 'text-gray-500'}`}>
                                                {consent.status}
                                            </span>
                                            <span className="text-xs text-gray-400">• {new Date(consent.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleViewDetails(consent)} className="text-xs text-blue-600 font-medium hover:underline px-2 py-1">View Details</button>
                                        {consent.status === 'GRANTED' && (
                                            <button onClick={() => handleRevoke(consent.consentId)} className="text-xs text-red-600 font-medium hover:underline px-2 py-1">Revoke</button>
                                        )}
                                        {consent.status === 'PENDING' && (
                                            <button onClick={() => handleApprove(consent.consentId)} className="text-xs text-blue-600 font-medium hover:underline px-2 py-1">Give Consent</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Consent Details Modal */}
            {selectedConsent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setSelectedConsent(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Consent Details</h2>
                        
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Purpose</p>
                                <p className="font-bold text-gray-900">{selectedConsent.purpose.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Status</p>
                                <p className={`font-bold ${selectedConsent.status === 'GRANTED' ? 'text-green-600' : selectedConsent.status === 'PENDING' ? 'text-blue-600' : 'text-gray-900'}`}>{selectedConsent.status}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Data requested</p>
                                <ul className="text-gray-900 font-medium">
                                    {selectedConsent.dataTypes.map(d => (
                                        <li key={d} className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> {d}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Used by</p>
                                <p className="font-bold text-gray-900">ConsumptionCredit Risk Engine</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Granted at</p>
                                <p className="font-bold text-gray-900">{selectedConsent.grantedAt ? new Date(selectedConsent.grantedAt).toLocaleString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Expires</p>
                                <p className="font-bold text-gray-900">{new Date(selectedConsent.expiresAt).toLocaleString()}</p>
                            </div>
                        </div>

                        {selectedConsent.status === 'GRANTED' && (
                            <div className="mt-8 border-t pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Database size={18} className="text-blue-600" /> 
                                    Fetched Financial Data
                                </h3>

                                {fetchingData ? (
                                    <div className="flex items-center gap-3 text-blue-600 py-4">
                                        <Loader2 size={18} className="animate-spin" /> Fetching latest data from AA...
                                    </div>
                                ) : dataError ? (
                                    <p className="text-red-500 text-sm py-2 bg-red-50 px-3 rounded-md">{dataError}</p>
                                ) : financialData ? (
                                    <div className="space-y-6">
                                        <div>
                                            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">Accounts</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {financialData.accounts.map(acc => (
                                                    <div key={acc.accountId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                                        <p className="text-sm font-bold text-gray-900">{acc.institutionName}</p>
                                                        <p className="text-xs text-gray-500">{acc.accountType} • {acc.maskedAccountNumber}</p>
                                                        <p className="text-sm font-bold text-blue-600 mt-2">₹{acc.balance.toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-2">Recent Transactions</p>
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-slate-50 text-xs text-gray-500 uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 font-medium">Date</th>
                                                            <th className="px-4 py-2 font-medium">Category</th>
                                                            <th className="px-4 py-2 font-medium text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {financialData.transactions.map(txn => (
                                                            <tr key={txn.transactionId} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2 text-gray-500">{new Date(txn.date).toLocaleDateString()}</td>
                                                                <td className="px-4 py-2 font-medium text-gray-700">{txn.category}</td>
                                                                <td className={`px-4 py-2 text-right font-bold ${txn.type === 'CREDIT' ? 'text-green-600' : 'text-gray-900'}`}>
                                                                    {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                            <button onClick={() => setSelectedConsent(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                                Close
                            </button>
                            {selectedConsent.status === 'PENDING' && (
                                <button onClick={() => handleApprove(selectedConsent.consentId)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                                    Give Consent
                                </button>
                            )}
                            {selectedConsent.status === 'GRANTED' && (
                                <button onClick={() => { handleRevoke(selectedConsent.consentId); setSelectedConsent(null); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100">
                                    Revoke Consent
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
