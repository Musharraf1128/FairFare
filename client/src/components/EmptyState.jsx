import { Link } from 'react-router-dom';

const EmptyState = ({ icon, title, message, actionText, actionLink }) => {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
