import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AddResources() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    category: '',
    dateAdded: '',
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrorMsg('');
  setSuccessMsg('');

  if (!user?.email) {
    setErrorMsg('User not authenticated.');
    setLoading(false);
    return;
  }

  const payload = {
    email: user.email,
    title: formData.title,
    description: formData.description,
    tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    category: formData.category,
    date: formData.dateAdded,
  };

  try {
    // Step 1: Save to your backend
    const res = await fetch('https://tjn5komlkl.execute-api.us-east-1.amazonaws.com/prod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;

    if (res.ok) {
      setSuccessMsg(parsed.message || 'Resource added!');
      setFormData({
        title: '',
        description: '',
        tags: '',
        category: '',
        dateAdded: '',
      });

      // Step 2: Sync to ServiceNow
      const corsProxy = 'https://cors-anywhere.herokuapp.com/';
      const serviceNowURL = 'https://dev279096.service-now.com/api/now/table/u_project';
      const auth = btoa('admin:6mhtBB2+mX-Z');
      await fetch(corsProxy+serviceNowURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          u_email: payload.email,
          u_name: payload.title,
          u_short_description: payload.description,
          u_tags: payload.tags.join(', '),
          u_category: payload.category,
        }),
      });

      navigate('/resources');
    } else {
      setErrorMsg(parsed.message || 'Failed to add resource.');
    }
  } catch (err) {
    console.error('Add resource error:', err);
    setErrorMsg('An error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1e2e] shadow-2xl rounded-2xl p-8 text-black dark:text-white transition-all duration-300">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-700 dark:text-blue-400">
          Add New Resource
        </h1>

        {errorMsg && <p className="mb-4 text-red-600 text-center">{errorMsg}</p>}
        {successMsg && <p className="mb-4 text-green-600 text-center">{successMsg}</p>}

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
              placeholder="Enter title"
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
              placeholder="Limit to 70–80 words"
              rows="4"
              required
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., react, javascript, frontend"
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Date</label>
            <input
              type="date"
              name="dateAdded"
              value={formData.dateAdded}
              onChange={handleChange}
              required
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold w-full py-2 rounded-md hover:from-blue-700 hover:to-indigo-700 transition duration-300"
          >
            {loading ? 'Adding...' : 'Add Resource'}
          </button>
        </form>
      </div>
    </div>
  );
}
