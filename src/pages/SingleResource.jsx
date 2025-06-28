import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink } from 'lucide-react';

export const SingleResource = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('folders')) || [];
    setFolders(stored);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Your Sub Folders</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md flex flex-col justify-between space-y-3"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                📁 {folder.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {folder.description}
              </p>
            </div>

            {folder.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {folder.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-white text-xs font-medium px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {folder.link && (
              <a
                href={folder.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm mt-3 font-medium hover:underline"
              >
                Visit <ExternalLink size={14} />
              </a>
            )}
          </div>
        ))}

        <button
          onClick={() => navigate('/singleResource/new-subfolder')}
          className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-400 dark:border-indigo-600 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 rounded-xl p-6 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all shadow-sm"
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-sm font-medium">+ Add</span>
        </button>
      </div>
    </div>
  );
};
