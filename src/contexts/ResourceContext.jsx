import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export const ResourceContext = createContext();

export const ResourceProvider = ({ children }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <ResourceContext.Provider value={{ resources, setResources, loading }}>
      {children}
    </ResourceContext.Provider>
  );
};

export const useResources = () => useContext(ResourceContext);