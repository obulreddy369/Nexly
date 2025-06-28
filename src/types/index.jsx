// index.jsx

// Sample User structure
export const sampleUser = {
  id: '',
  email: '',
  name: '',
  avatar: '',
  createdAt: '',
};

// Sample Resource structure
export const sampleResource = {
  id: '',
  title: '',
  url: '',
  description: '',
  tags: [],
  category: '',
  dateAdded: '',
  lastAccessed: '',
  isBookmarked: false,
  metadata: {
    domain: '',
    favicon: '',
    preview: '',
  },
};

// Sample Chat Message structure
export const sampleChatMessage = {
  id: '',
  content: '',
  role: 'user', // or 'assistant'
  timestamp: '',
};

// Sample User Preferences structure
export const sampleUserPreferences = {
  theme: 'light', // 'dark' or 'system'
  compactView: false,
  sidebarCollapsed: false,
  notifications: false,
  serviceNowConnected: false,
};

// Sample Dashboard Stats structure
export const sampleDashboardStats = {
  totalResources: 0,
  recentlyAdded: 0,
  totalCategories: 0,
  bookmarked: 0,
};
