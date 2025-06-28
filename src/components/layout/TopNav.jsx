import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  LogOut,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const TopNav = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-50 relative">
      <div className="flex items-center justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-gray-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-500" />
          )}
        </motion.button>

        <div className="relative ml-4" ref={menuRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.name}
            </span>
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 z-50 pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
              >
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
