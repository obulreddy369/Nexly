import React from 'react';
import { motion } from 'framer-motion';

export const Input = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">
              {icon}
            </div>
          </div>
        )}
        <motion.input
          className={`
            block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500
            focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
            dark:focus:border-indigo-400 dark:focus:ring-indigo-400
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
