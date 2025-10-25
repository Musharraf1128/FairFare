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
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No data available yet</p>
          <Link to="/trips/create" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
            Create your first trip
          </Link>
        </div>
      </div>
    );
  }

  // Prepare chart data with theme-aware colors
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
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
        'rgba(249, 115, 22, 0.8)', // Orange for food
        'rgba(59, 130, 246, 0.8)',  // Blue for transport
        'rgba(34, 197, 94, 0.8)',   // Green for accommodation
        'rgba(168, 85, 247, 0.8)',  // Purple for entertainment
        'rgba(236, 72, 153, 0.8)',  // Pink for shopping
        'rgba(107, 114, 128, 0.8)'  // Gray for other
      ],
      borderColor: [
        'rgba(249, 115, 22, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(107, 114, 128, 1)'
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
      food: (
        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      transport: (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      accommodation: (
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      entertainment: (
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
        </svg>
      ),
      shopping: (
        <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      other: (
        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    };
    return icons[category] || icons.other;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of your expenses and trips</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100">Total Trips</p>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold">{stats.totalTrips}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100">Total Spent</p>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className="text-4xl font-bold">₹{stats.totalExpenses.toFixed(2)}</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100">You're Owed</p>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-4xl font-bold">₹{stats.totalAmountOwed.toFixed(2)}</p>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-100">You Owe</p>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <p className="text-4xl font-bold">₹{stats.totalAmountPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Breakdown */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Spending by Category
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
                      position: 'bottom',
                      labels: {
                        color: isDark ? '#d1d5db' : '#374151',
                        font: {
                          family: 'Inter, sans-serif'
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No expense data available</p>
            )}
          </div>
        </div>

        {/* Trip Expenses Bar Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Expenses by Trip
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
                    x: {
                      ticks: {
                        color: isDark ? '#d1d5db' : '#374151',
                        font: {
                          family: 'Inter, sans-serif'
                        }
                      },
                      grid: {
                        color: isDark ? '#374151' : '#e5e7eb'
                      }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        color: isDark ? '#d1d5db' : '#374151',
                        font: {
                          family: 'Inter, sans-serif'
                        },
                        callback: function(value) {
                          return '₹' + value;
                        }
                      },
                      grid: {
                        color: isDark ? '#374151' : '#e5e7eb'
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                No trips available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Expenses
        </h2>
        {stats.recentExpenses.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No recent expenses</p>
        ) : (
          <div className="space-y-3">
            {stats.recentExpenses.map((expense) => (
              <Link
                key={expense._id}
                to={`/trips/${expense.tripId}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(expense.category)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{expense.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {expense.tripName} • Paid by {expense.paidBy.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{expense.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/trips/create"
            className="btn-secondary p-4 rounded-lg text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="font-semibold">Create New Trip</p>
          </Link>
          <Link
            to="/"
            className="btn-secondary p-4 rounded-lg text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-semibold">View All Trips</p>
          </Link>
          <button
            onClick={fetchDashboardData}
            className="btn-secondary p-4 rounded-lg text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="font-semibold">Refresh Data</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
