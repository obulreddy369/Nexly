import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const EditResource = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resourceToEdit = location.state?.resource;

  const [formData, setFormData] = useState({
    id: '',
    category: '',
    title: '',
    description: '',
    tags: [],
    date: '',
  });

  useEffect(() => {
    if (resourceToEdit) {
      setFormData({
        id: resourceToEdit.id,
        category: resourceToEdit.category || '',
        title: resourceToEdit.title || '',
        description: resourceToEdit.description || '',
        tags: resourceToEdit.tags || [],
        date: resourceToEdit.dateAdded || '',
      });
    }
  }, [resourceToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagsChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      tags: e.target.value.split(',').map((tag) => tag.trim()),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://tjn5komlkl.execute-api.us-east-1.amazonaws.com/prod', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resourceToEdit.email,
          resourceId: formData.id,
          title: formData.title,
          category: formData.category,
          description: formData.description,
          tags: formData.tags,
          date: formData.date,
        }),
      });

      const result = await response.json();
      const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;

      if (response.ok) {
        navigate('/resources', {
          state: {
            updatedResource: {
              id: formData.id,
              title: formData.title,
              description: formData.description,
              tags: formData.tags,
              category: formData.category,
              dateAdded: formData.date,
              isBookmarked: resourceToEdit.isBookmarked || false,
            },
          },
        });
      } else {
        alert(parsed.message || 'Failed to update resource.');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1e2e] shadow-2xl rounded-2xl p-8 text-black dark:text-white transition-all duration-300">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-700 dark:text-blue-400">
          Edit Resource
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Category</option>
              <option value="Documentation">Documentation</option>
              <option value="Video">Video</option>
              <option value="Article">Article</option>
              <option value="Other">Others</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter resource title"
              required
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Short Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Limit to 70–80 words"
              required
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="e.g., react, backend, node.js"
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2 rounded-md hover:from-blue-700 hover:to-indigo-700 transition duration-300"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
