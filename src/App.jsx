import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ResourceProvider } from './contexts/ResourceContext';

// Layout & Components
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageTransition } from './components/PageTransition';
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import Dashboard from './pages/Dashboard';
import { Resources } from './pages/Resources';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { EditResource } from './pages/EditResource';
import { AddResources } from './pages/AddResources';
import { SingleResource } from './pages/SingleResource';
import ResourcePreviewPage from './pages/ResourcePreviewPage'; // ✅ NEW IMPORT

function App() {
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ResourceProvider>
          <Router>
            <div className="App">
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Public Routes */}
                  <Route 
                    path="/login" 
                    element={
                      <PageTransition>
                        <Login />
                      </PageTransition>
                    } 
                  />
                  <Route 
                    path="/register" 
                    element={
                      <PageTransition>
                        <Register />
                      </PageTransition>
                    } 
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Redirect base to dashboard */}
                    <Route index element={<Navigate to="/dashboard" replace />} />

                    {/* Dashboard */}
                    <Route 
                      path="dashboard" 
                      element={
                        <PageTransition>
                          <Dashboard />
                        </PageTransition>
                      } 
                    />

                    {/* Resources */}
                    <Route 
                      path="resources" 
                      element={
                        <PageTransition>
                          <Resources />
                        </PageTransition>
                      } 
                    />
                    <Route 
                      path="resources/new"
                      element={
                        <PageTransition>
                          <AddResources />
                        </PageTransition>
                      } 
                    />
                    <Route 
                      path="resources/:id" 
                      element={
                        <PageTransition>
                          <EditResource />
                        </PageTransition>
                      } 
                    />

                    {/* Subfolder Pages */}
                    <Route 
                      path="singleResource/:id" 
                      element={
                        <PageTransition>
                          <SingleResource />
                        </PageTransition>
                      } 
                    />
                    

                    {/* ✅ Full Resource Preview Page */}
                    <Route 
                      path="preview/:id" 
                      element={
                        <PageTransition>
                          <ResourcePreviewPage />
                        </PageTransition>
                      } 
                    />

                    {/* Other */}
                    <Route 
                      path="chat" 
                      element={
                        <PageTransition>
                          <Chat />
                        </PageTransition>
                      } 
                    />
                    <Route 
                      path="settings" 
                      element={
                        <PageTransition>
                          <Settings />
                        </PageTransition>
                      } 
                    />
                  </Route>
                </Routes>
              </AnimatePresence>

              {/* Optional Chat Panel Overlay */}
              <AnimatePresence>
                {showChatPanel && (
                  <Chat
                    isPanelMode={true}
                    onClose={() => setShowChatPanel(false)}
                    onToggleSize={() => setIsChatMinimized(!isChatMinimized)}
                    isMinimized={isChatMinimized}
                  />
                )}
              </AnimatePresence>
            </div>
          </Router>
        </ResourceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
