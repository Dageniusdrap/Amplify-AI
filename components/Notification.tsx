import React, { useState, useEffect } from 'react';
import type { Notification } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { InfoIcon } from './icons/InfoIcon';
import { XIcon } from './icons/XIcon';

const ICONS = {
  success: <CheckIcon className="h-6 w-6 text-green-500" />,
  error: <XCircleIcon className="h-6 w-6 text-red-500" />,
  info: <InfoIcon className="h-6 w-6 text-blue-500" />,
};

const BG_COLORS = {
  success: 'bg-green-50 dark:bg-green-900/50 border-green-400',
  error: 'bg-red-50 dark:bg-red-900/50 border-red-400',
  info: 'bg-blue-50 dark:bg-blue-900/50 border-blue-400',
};

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: number) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300); // Wait for fade out
  };

  return (
    <div
      className={`relative w-full max-w-sm p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ${BG_COLORS[notification.type]} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{ICONS[notification.type]}</div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {notification.message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="sr-only">Close</span>
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface NotificationContainerProps {
    notifications: Notification[];
    onDismiss: (id: number) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed inset-0 flex items-end justify-end px-4 py-6 pointer-events-none sm:p-6 z-[200]">
      <div className="w-full max-w-sm space-y-4">
        {notifications.map((notification) => (
          <NotificationToast key={notification.id} notification={notification} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};