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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-600">Calculating settlement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!settlement || settlement.balances.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">No settlement data available</div>
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
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
        >
          <span>📥</span>
          <span>Export Report</span>
        </button>
      </div>

      {/* Current User's Balance Card */}
      {currentUserBalance && (
        <div className={`rounded-lg shadow-md p-6 ${
          currentUserBalance.balance > 0 
            ? 'bg-green-50 border-2 border-green-200' 
            : currentUserBalance.balance < 0 
            ? 'bg-red-50 border-2 border-red-200' 
            : 'bg-gray-50 border-2 border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Balance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">You paid:</span>
              <span className="font-semibold text-gray-800">₹{currentUserBalance.paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Your share:</span>
              <span className="font-semibold text-gray-800">₹{currentUserBalance.share.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Balance:</span>
                {currentUserBalance.balance > 0 ? (
                  <span className="text-2xl font-bold text-green-600">
                    +₹{currentUserBalance.balance.toFixed(2)}
                  </span>
                ) : currentUserBalance.balance < 0 ? (
                  <span className="text-2xl font-bold text-red-600">
                    -₹{Math.abs(currentUserBalance.balance).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-gray-600">₹0.00</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {currentUserBalance.balance > 0 
                  ? '🎉 You are owed money' 
                  : currentUserBalance.balance < 0 
                  ? '⚠️ You owe money' 
                  : '✅ You are settled up'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Members Balances */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">💰 Member Balances</h3>
        <div className="space-y-3">
          {settlement.balances.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{member.name}</p>
                  <p className="text-sm text-gray-500">
                    Paid: ₹{member.paid.toFixed(2)} | Share: ₹{member.share.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {member.balance > 0 ? (
                  <span className="text-lg font-bold text-green-600">
                    +₹{member.balance.toFixed(2)}
                  </span>
                ) : member.balance < 0 ? (
                  <span className="text-lg font-bold text-red-600">
                    -₹{Math.abs(member.balance).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-gray-500">Settled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          📊 Settlement Plan
        </h3>
        {settlement.transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">✅</p>
            <p className="font-medium">All settled up!</p>
            <p className="text-sm mt-1">No pending payments</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              To settle all debts, follow these transactions:
            </p>
            {settlement.transactions.map((transaction, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  transaction.from.userId === currentUserId
                    ? 'bg-red-50 border-red-200'
                    : transaction.to.userId === currentUserId
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💸</span>
                    <div>
                      <p className="font-medium text-gray-800">
                        <span className={transaction.from.userId === currentUserId ? 'text-red-600 font-bold' : ''}>
                          {transaction.from.name}
                        </span>
                        {' → '}
                        <span className={transaction.to.userId === currentUserId ? 'text-green-600 font-bold' : ''}>
                          {transaction.to.name}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.from.userId === currentUserId && '⚠️ You need to pay'}
                        {transaction.to.userId === currentUserId && '🎉 You will receive'}
                        {transaction.from.userId !== currentUserId && transaction.to.userId !== currentUserId && 'Settlement between others'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">📈 Trip Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{settlement.totalExpenses.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Settlements Needed</p>
            <p className="text-2xl font-bold text-indigo-600">
              {settlement.transactions.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementSection;
