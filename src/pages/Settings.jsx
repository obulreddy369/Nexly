import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  Palette,
  Monitor,
  Sun,
  Moon,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const tabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'preferences', name: 'Preferences', icon: Palette },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'integrations', name: 'Integrations', icon: Shield },
];

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const { preferences, updatePreferences } = useTheme();

  const TabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <img
                src={user?.avatar || 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg'}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user?.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" defaultValue={user?.name} placeholder="Enter your full name" />
              <Input label="Email Address" type="email" defaultValue={user?.email} placeholder="Enter your email" />
              <Input label="Job Title" placeholder="Enter your job title" />
              <Input label="Company" placeholder="Enter your company" />
            </div>

            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'light', label: 'Light', icon: Sun },
                      { key: 'dark', label: 'Dark', icon: Moon },
                      { key: 'system', label: 'System', icon: Monitor },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => updatePreferences({ theme: key })}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                          preferences.theme === key
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Compact View
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Show more content in less space</p>
                  </div>
                  <button
                    onClick={() => updatePreferences({ compactView: !preferences.compactView })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.compactView ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.compactView ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: 'Email Notifications',
                    description: 'Receive email updates about your resources',
                    enabled: preferences.notifications,
                  },
                  {
                    title: 'Push Notifications',
                    description: 'Get notified about important updates',
                    enabled: true,
                  },
                  {
                    title: 'Resource Updates',
                    description: 'Notifications when resources are updated',
                    enabled: false,
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.title}
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                    </div>
                    <button
                      onClick={() =>
                        index === 0 && updatePreferences({ notifications: !preferences.notifications })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          item.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">ServiceNow Integration</h3>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">ServiceNow</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Connect to sync your resources</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {preferences.serviceNowConnected ? (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Disconnected</span>
                      </div>
                    )}
                  </div>
                </div>

                {preferences.serviceNowConnected ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        Instance: <span className="font-medium">company.service-now.com</span>
                      </p>
                      <p>
                        Last sync: <span className="font-medium">2 hours ago</span>
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => updatePreferences({ serviceNowConnected: false })}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect your ServiceNow instance to automatically sync resources and enable advanced features.
                    </p>
                    <Button onClick={() => updatePreferences({ serviceNowConnected: true })}>
                      Connect ServiceNow
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <TabContent />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
