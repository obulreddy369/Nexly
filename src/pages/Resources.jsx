import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Grid3X3, List, Plus, Star,
  Eye, Edit, Trash2, Calendar, BookOpen
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { CopilotPanel } from './CopilotPanel';

export const Resources = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch('https://qi3ulho30g.execute-api.us-east-1.amazonaws.com/prod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });

        const result = await res.json();
        const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;

        const resourcesArray = (parsed?.resources || []).map((item) => ({
          id: item.resourceId,
          title: item.title || 'Untitled',
          url: item.link || '#',
          description: item.description || '',
          tags: item.tags || [],
          category: item.category || 'Uncategorized',
          dateAdded: item.date || new Date().toISOString().split('T')[0],
          email: item.email,
        }));

        setResources(resourcesArray);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) fetchResources();
  }, [user?.email]);

  useEffect(() => {
    if (location.state) {
      if (location.state.newResource) {
        setResources((prev) => [location.state.newResource, ...prev]);
      } else if (location.state.updatedResource) {
        const updated = location.state.updatedResource;
        setResources((prev) =>
          prev.map((res) => (res.id === updated.id ? updated : res))
        );
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const categories = useMemo(() => {
    const all = resources.map((r) => r.category || 'Uncategorized');
    const unique = Array.from(new Set(all));
    return ['All', ...unique];
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'All' ||
        (resource.category && resource.category.toLowerCase() === selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [resources, searchQuery, selectedCategory]);

  const handleEdit = (id) => {
    const res = resources.find((r) => r.id === id);
    if (res) {
      navigate(`/resources/${id}`, { state: { resource: res } });
    }
  };

  const handleView = (resource) => {
    navigate(`/preview/${resource.id}`, { state: { resource } });
  };

  const handleDelete = async (id) => {
    const toDelete = resources.find((r) => r.id === id);
    if (!toDelete) return;

    try {
      const res = await fetch('https://tjn5komlkl.execute-api.us-east-1.amazonaws.com/prod', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: toDelete.email,
          resourceId: toDelete.id,
        }),
      });

      const result = await res.json();
      const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;

      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(parsed.message || 'Failed to delete resource.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting.');
    }
  };

  return (
    <div className="relative p-4 sm:p-6 space-y-6 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <style>
        {`
        @keyframes skeletonPulse {
          0% { background-color: rgba(0,0,0,0.08); }
          50% { background-color: rgba(0,0,0,0.15); }
          100% { background-color: rgba(0,0,0,0.08); }
        }
      `}
      </style>

      <CopilotPanel isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-6 rounded-2xl animate-[gradientFlow_10s_ease_infinite] bg-[length:200%_200%]"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight animate-pulse">Resources</h1>
          <p className="text-indigo-100 text-sm mt-1">Manage and organize your saved resources</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/resources/new')}
            className="relative bg-indigo-500 hover:bg-indigo-400 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-all"
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95, rotate: -5 }}>
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Resource
            </motion.div>
            <motion.span
              className="absolute inset-0 bg-white opacity-0 rounded-lg"
              whileTap={{ scale: 4, opacity: 0.3 }}
              transition={{ duration: 0.3 }}
            />
          </Button>
        </div>
      </motion.div>

      {/* Search & View Toggle */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        <input
          type="text"
          placeholder="Search resources..."
          className="flex-grow border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:animate-[pulseGlow_2s_ease_infinite] transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative hover:bg-indigo-100 dark:hover:bg-gray-700 transition-all"
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Filter className="w-4 h-4 mr-2 inline" />
            Filters
          </motion.div>
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          onClick={() => setViewMode('grid')}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
        >
          <List className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-wrap gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md"
          >
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 min-h-[260px] animate-[skeletonPulse_1.5s_ease_infinite]"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center py-12"
        >
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resources found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first resource'}
          </p>
        </motion.div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {filteredResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1, ease: 'easeOut' }}
              whileHover={{
                scale: 1.05,
                rotateX: 5,
                rotateY: -5,
                zIndex: 10,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 30px rgba(99, 102, 241, 0.4)',
              }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 min-h-[260px] flex flex-col justify-between transform-gpu transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-sm text-indigo-500">
                    <BookOpen className="w-5 h-5" />
                    <span>{resource.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleView(resource)}
                      className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleEdit(resource.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDelete(resource.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{resource.title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">{resource.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {resource.tags.slice(0, 10).map((tag, i) => (
                    <motion.span
                      key={i}
                      className="text-xs bg-indigo-100 dark:bg-indigo-700 dark:text-white text-indigo-700 px-2 py-1 rounded-full cursor-default"
                    >
                      #{tag}
                    </motion.span>
                  ))}
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(resource.dateAdded).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
