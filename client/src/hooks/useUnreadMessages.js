import { useState, useEffect } from 'react';
import API from '../utils/api';

export const useUnreadMessages = (tripId) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!tripId) return;

    const fetchUnreadCount = async () => {
      try {
        const { data } = await API.get(`/trips/${tripId}/messages/unread-count`);
        setUnreadCount(data.count);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [tripId]);

  return unreadCount;
};
