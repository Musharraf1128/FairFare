import { Link } from 'react-router-dom';

const EmptyState = ({ icon, title, message, actionText, actionLink }) => {
  return (
    <div className="text-center py-12 card">
      <div className="mb-4 flex justify-center">
        {typeof icon === 'string' ? (
          <div className="text-6xl">{icon}</div>
        ) : (
          icon
        )}
      </div>
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="btn-primary inline-block px-6 py-2 rounded-lg"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
