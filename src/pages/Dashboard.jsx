import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  MessageCircle,
  Settings,
  Facebook,
  Instagram,
  Mail,
} from 'lucide-react';
import { useResources } from '../contexts/ResourceContext';

const quickLinks = [
  {
    title: 'Add Resource',
    description: 'Save a new resource to your collection',
    icon: Plus,
    href: '/resources/new',
    color: 'bg-green-500',
    shadowColor: 'rgba(16, 185, 129, 0.4)',
  },
  {
    title: 'View Resources',
    description: 'Browse your saved resources',
    icon: BookOpen,
    href: '/resources',
    color: 'bg-blue-500',
    shadowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    title: 'AI Copilot',
    description: 'Get help from your AI assistant',
    icon: MessageCircle,
    href: '/chat',
    color: 'bg-purple-500',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    title: 'Settings',
    description: 'Manage your preferences',
    icon: Settings,
    href: '/settings',
    color: 'bg-gray-500',
    shadowColor: 'rgba(107, 114, 128, 0.4)',
  },
];

const pieColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

const Dashboard = () => {
  const { resources } = useResources();
  const [activeIndex, setActiveIndex] = useState(null);

  const pieStats = useMemo(() => {
    return resources.reduce((acc, resource) => {
      const category = resource.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }, [resources]);

  const pieData = Object.entries(pieStats).map(([name, value]) => ({ name, value }));
  const totalResources = pieData.reduce((sum, entry) => sum + entry.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-gray-300 dark:border-gray-700 relative">
          <p className="text-gray-800 dark:text-gray-200 font-semibold">{payload[0].name}</p>
          <p className="text-gray-500 dark:text-gray-400">{payload[0].value} Resources</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        className="min-h-screen p-4 sm:p-8"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Welcome back! Here's your resource overview.</p>
        </div>

        <motion.div
          className="rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-md shadow-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center sm:text-left">Resource Type Distribution</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center -mt-4">
            <div className="w-full sm:w-1/2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                        style={{
                          transition: 'all 0.3s ease',
                          transform: index === activeIndex ? 'scale(1.08)' : 'scale(1)',
                          transformOrigin: 'center center',
                          filter: `drop-shadow(0 0 8px ${pieColors[index % pieColors.length]})`,
                          stroke: 'white',
                          strokeWidth: index === activeIndex ? 2 : 0,
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="text-sm font-medium fill-gray-500 dark:fill-gray-400">
                    {activeIndex !== null ? pieData[activeIndex].name : 'Total Resources'}
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="central" className="text-4xl font-bold fill-gray-800 dark:fill-gray-100">
                    {activeIndex !== null ? pieData[activeIndex].value : totalResources}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-3 pl-0 sm:pl-8">
              {pieData.map((entry, index) => (
                <div
                  key={`legend-${index}`}
                  className="flex items-center cursor-pointer"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    animate={{ scale: activeIndex === index ? 1.2 : 1 }}
                  />
                  <span className={`font-medium ${activeIndex === index ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {entry.name}
                  </span>
                  <span className="ml-auto text-gray-500 dark:text-gray-400 font-mono">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.title}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } },
                }}
                whileHover={{ y: -8, scale: 1.05, boxShadow: `0px 15px 25px -5px ${link.shadowColor}` }}
                whileTap={{ scale: 0.95 }}
                className="rounded-2xl p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg cursor-pointer"
              >
                <Link to={link.href} className="flex flex-col h-full">
                  <motion.div
                    className={`w-14 h-14 ${link.color} rounded-xl flex items-center justify-center shadow-lg mb-4`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="text-white w-7 h-7" />
                  </motion.div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{link.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{link.description}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
  className="mt-16"
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.3 }}
>
  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Explore Nexly</h2>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[
      { icon: '📦', title: 'Unified Library', desc: 'All your links, files, and notes in one place.' },
      { icon: '🏷️', title: 'AI Tagging', desc: 'Smart categorization for easy discovery.' },
      { icon: '📊', title: 'Visual Insights', desc: 'Understand trends via interactive analytics.' },
      { icon: '💬', title: 'AI Copilot Chat', desc: 'Get instant help with resource queries.' },
      { icon: '🔖', title: 'Save Content', desc: 'Capture resources with one click from anywhere.' },
      { icon: '⚡', title: 'Powered by AI', desc: 'Built with OpenAI, hosted on AWS.' },
    ].map((feature, index) => (
      <motion.div
        key={index}
        whileHover={{ y: -5, scale: 1.03 }}
        className="bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-md flex flex-col items-start"
      >
        <span className="text-3xl mb-2">{feature.icon}</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
      </motion.div>
    ))}
  </div>
</motion.div>


        <footer className="mt-16 text-center border-t border-gray-300 dark:border-gray-700 pt-6">
          <p className="text-gray-500 dark:text-gray-400 mb-2">© {new Date().getFullYear()} Nexly. All rights reserved.</p>
          <div className="flex justify-center gap-6">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="mailto:contact@nexly.com" className="hover:text-red-500 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </footer>
      </motion.div>
    </>
  );
};

export default Dashboard;
