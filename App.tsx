import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Dashboard } from './pages/Dashboard';
import { ToolContainer } from './pages/ToolContainer';

// AppContent needs to be inside Router to use useLocation
const AppContent: React.FC<{
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  pageTitle: string;
  setPageTitle: (title: string) => void;
}> = ({ isSidebarOpen, setSidebarOpen, pageTitle, setPageTitle }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col w-full md:w-[calc(100vw-16rem)]">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
        />

        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-4 md:p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route
                  path="/tools/:categoryId/:toolId"
                  element={<ToolContainer setTitle={setPageTitle} key={location.pathname} />}
                />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </div>

            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('');

  return (
    <HelmetProvider>
      <Router>
        <AppContent
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          pageTitle={pageTitle}
          setPageTitle={setPageTitle}
        />
      </Router>
    </HelmetProvider>
  );
};

export default App;
