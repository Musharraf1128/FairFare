import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: trips } = await API.get('/trips');
      
      // Calculate statistics
      const totalTrips = trips.length;
      let totalExpenses = 0;
      let totalAmountPaid = 0;
      let totalAmountOwed = 0;
      const categoryData = {
        food: 0,
        transport: 0,
        accommodation: 0,
        entertainment: 0,
        shopping: 0,
        other: 0
      };
      const recentExpenses = [];

      // Fetch expenses for all trips
      for (const trip of trips) {
        totalExpenses += trip.totalExpenses;

        try {
          const { data: expenses } = await API.get(`/expenses/${trip._id}/expenses`);
          
          // Categorize expenses
          expenses.forEach(expense => {
            if (categoryData[expense.category] !== undefined) {
              categoryData[expense.category] += expense.amount;
            }

            // Add to recent expenses
            recentExpenses.push({
              ...expense,
              tripName: trip.name,
              tripId: trip._id
            });
          });

          // Get settlement to calculate owed/paid
          const { data: settlement } = await API.get(`/trips/${trip._id}/settlement`);
          const userBalance = settlement.balances.find(b => b.userId === user._id);
          
          if (userBalance) {
            if (userBalance.balance > 0) {
              totalAmountOwed += userBalance.balance;
            } else if (userBalance.balance < 0) {
              totalAmountPaid += Math.abs(userBalance.balance);
            }
          }
        } catch (err) {
          console.error(`Error fetching data for trip ${trip._id}:`, err);
        }
      }

      // Sort recent expenses by date
      recentExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

      setStats({
        totalTrips,
        totalExpenses,
        totalAmountOwed,
        totalAmountPaid,
        categoryData,
        recentExpenses: recentExpenses.slice(0, 5), // Top 5 recent
        trips
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center text-gray-500">
          <p className="text-4xl mb-4">📊</p>
          <p>No data available yet</p>
          <Link to="/trips/create" className="text-blue-600 hover:underline mt-2 inline-block">
            Create your first trip
          </Link>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const categoryChartData = {
    labels: ['Food', 'Transport', 'Accommodation', 'Entertainment', 'Shopping', 'Other'],
    datasets: [{
      label: 'Spending by Category',
      data: [
        stats.categoryData.food,
        stats.categoryData.transport,
        stats.categoryData.accommodation,
        stats.categoryData.entertainment,
        stats.categoryData.shopping,
        stats.categoryData.other
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(201, 203, 207, 0.8)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(201, 203, 207, 1)'
      ],
      borderWidth: 2
    }]
  };

  const tripExpensesData = {
    labels: stats.trips.map(trip => trip.name.length > 15 ? trip.name.substring(0, 15) + '...' : trip.name),
    datasets: [{
      label: 'Total Expenses (₹)',
      data: stats.trips.map(trip => trip.totalExpenses),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2
    }]
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food: '🍔',
      transport: '🚗',
      accommodation: '🏨',
      entertainment: '🎉',
      shopping: '🛍️',
      other: '📝'
    };
    return icons[category] || '📝';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your expenses and trips</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100">Total Trips</p>
            <span className="text-3xl">🌍</span>
          </div>
          <p className="text-4xl font-bold">{stats.totalTrips}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100">Total Spent</p>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-4xl font-bold">₹{stats.totalExpenses.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100">You're Owed</p>
            <span className="text-3xl">📈</span>
          </div>
          <p className="text-4xl font-bold">₹{stats.totalAmountOwed.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-100">You Owe</p>
            <span className="text-3xl">📉</span>
          </div>
          <p className="text-4xl font-bold">₹{stats.totalAmountPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📊 Spending by Category
          </h2>
          <div className="h-80 flex items-center justify-center">
            {Object.values(stats.categoryData).some(val => val > 0) ? (
              <Pie 
                data={categoryChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            ) : (
              <p className="text-gray-500">No expense data available</p>
            )}
          </div>
        </div>

        {/* Trip Expenses Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🏖️ Expenses by Trip
          </h2>
          <div className="h-80">
            {stats.trips.length > 0 ? (
              <Bar 
                data={tripExpensesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + value;
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No trips available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🕒 Recent Expenses
        </h2>
        {stats.recentExpenses.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No recent expenses</p>
        ) : (
          <div className="space-y-3">
            {stats.recentExpenses.map((expense) => (
              <Link
                key={expense._id}
                to={`/trips/${expense.tripId}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
                    <div>
                      <p className="font-medium text-gray-800">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {expense.tripName} • Paid by {expense.paidBy.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">
                      ₹{expense.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{(expense.amount / expense.splitAmong.length).toFixed(2)} per person
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/trips/create"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center"
          >
            <span className="text-4xl mb-2 block">➕</span>
            <p className="font-semibold text-gray-800">Create New Trip</p>
          </Link>
          <Link
            to="/"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center"
          >
            <span className="text-4xl mb-2 block">📋</span>
            <p className="font-semibold text-gray-800">View All Trips</p>
          </Link>
          <button
            onClick={fetchDashboardData}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition text-center"
          >
            <span className="text-4xl mb-2 block">🔄</span>
            <p className="font-semibold text-gray-800">Refresh Data</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
