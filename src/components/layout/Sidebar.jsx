import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  MessageCircle,
  Settings,
  ChevronLeft,
  Zap
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Resources', href: '/resources', icon: BookOpen },
  { name: 'AI Copilot', href: '/chat', icon: MessageCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const { preferences, updatePreferences } = useTheme();
  const location = useLocation();

  const toggleCollapse = () => {
    updatePreferences({ sidebarCollapsed: !preferences.sidebarCollapsed });
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: preferences.sidebarCollapsed ? 64 : 256
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col"
    >
      <div className="flex items-center justify-between p-4">
        <motion.div
          initial={false}
          animate={{
            opacity: preferences.sidebarCollapsed ? 0 : 1,
            scale: preferences.sidebarCollapsed ? 0.8 : 1
          }}
          transition={{ duration: 0.2 }}
          className="flex items-center space-x-2"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!preferences.sidebarCollapsed && (
            <span className="text-xl font-bold text-gray-900 dark:text-white">NEXLY</span>
          )}
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <motion.div
            animate={{ rotate: preferences.sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </motion.div>
        </motion.button>
      </div>

      <nav className="flex-1 px-4 pb-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                initial={false}
                animate={{
                  opacity: preferences.sidebarCollapsed ? 0 : 1,
                  width: preferences.sidebarCollapsed ? 0 : 'auto'
                }}
                transition={{ duration: 0.2 }}
                className="ml-3 overflow-hidden whitespace-nowrap"
              >
                {item.name}
              </motion.span>
            </NavLink>
          );
        })}
      </nav>
    </motion.div>
  );
};
