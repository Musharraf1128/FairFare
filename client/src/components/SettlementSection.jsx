import { useState, useEffect } from 'react';
import API from '../utils/api';

const SettlementSection = ({ tripId, currentUserId, tripName }) => {
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettlement();
  }, [tripId]);

  const fetchSettlement = async () => {
    try {
      const { data } = await API.get(`/trips/${tripId}/settlement`);
      setSettlement(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate settlement');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!settlement) return;

    let exportText = `=== ${tripName || 'Trip'} - Settlement Report ===\n\n`;
    exportText += `Total Expenses: ₹${settlement.totalExpenses.toFixed(2)}\n\n`;
    
    exportText += `--- Member Balances ---\n`;
    settlement.balances.forEach(member => {
      exportText += `${member.name}:\n`;
      exportText += `  Paid: ₹${member.paid.toFixed(2)}\n`;
      exportText += `  Share: ₹${member.share.toFixed(2)}\n`;
      exportText += `  Balance: ₹${member.balance.toFixed(2)}\n\n`;
    });

    if (settlement.transactions.length > 0) {
      exportText += `--- Settlement Plan ---\n`;
      settlement.transactions.forEach((transaction, index) => {
        exportText += `${index + 1}. ${transaction.from.name} → ${transaction.to.name}: ₹${transaction.amount.toFixed(2)}\n`;
      });
    } else {
      exportText += `--- All Settled Up! ---\n`;
    }

    exportText += `\n\nGenerated on ${new Date().toLocaleString()}`;

    // Create and download file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tripName || 'trip'}-settlement.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center text-gray-600 dark:text-gray-400">Calculating settlement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!settlement || settlement.balances.length === 0) {
    return (
      <div className="card">
        <div className="text-center text-gray-500 dark:text-gray-400">No settlement data available</div>
      </div>
    );
  }

  const currentUserBalance = settlement.balances.find(
    b => b.userId === currentUserId
  );

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="btn-secondary px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Report</span>
        </button>
      </div>

      {/* Current User's Balance Card */}
      {currentUserBalance && (
        <div className={`card ${
          currentUserBalance.balance > 0 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : currentUserBalance.balance < 0 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Balance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">You paid:</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{currentUserBalance.paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Your share:</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{currentUserBalance.share.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Balance:</span>
                {currentUserBalance.balance > 0 ? (
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +₹{currentUserBalance.balance.toFixed(2)}
                  </span>
                ) : currentUserBalance.balance < 0 ? (
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    -₹{Math.abs(currentUserBalance.balance).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">₹0.00</span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {currentUserBalance.balance > 0 
                  ? 'You are owed money' 
                  : currentUserBalance.balance < 0 
                  ? 'You owe money' 
                  : 'You are settled up'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Members Balances */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          Member Balances
        </h3>
        <div className="space-y-3">
          {settlement.balances.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Paid: ₹{member.paid.toFixed(2)} | Share: ₹{member.share.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {member.balance > 0 ? (
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    +₹{member.balance.toFixed(2)}
                  </span>
                ) : member.balance < 0 ? (
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    -₹{Math.abs(member.balance).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-gray-500 dark:text-gray-400">Settled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Transactions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Settlement Plan
        </h3>
        {settlement.transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">All settled up!</p>
            <p className="text-sm mt-1">No pending payments</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              To settle all debts, follow these transactions:
            </p>
            {settlement.transactions.map((transaction, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  transaction.from.userId === currentUserId
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : transaction.to.userId === currentUserId
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        <span className={transaction.from.userId === currentUserId ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                          {transaction.from.name}
                        </span>
                        {' → '}
                        <span className={transaction.to.userId === currentUserId ? 'text-green-600 dark:text-green-400 font-bold' : ''}>
                          {transaction.to.name}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.from.userId === currentUserId && 'You need to pay'}
                        {transaction.to.userId === currentUserId && 'You will receive'}
                        {transaction.from.userId !== currentUserId && transaction.to.userId !== currentUserId && 'Settlement between others'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{transaction.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Trip Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ₹{settlement.totalExpenses.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Settlements Needed</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {settlement.transactions.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementSection;
