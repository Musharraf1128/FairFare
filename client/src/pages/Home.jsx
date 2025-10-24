import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to TripSplit! 
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Split expenses with friends easily
        </p>

        {user ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-green-800 text-lg">
              You're logged in as <strong>{user.name}</strong>
            </p>
            <p className="text-gray-600 mt-2">
              Trip management coming in Part 2!
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-blue-800 text-lg">
              Please login or register to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
