import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
  isWideMode: boolean;
  setIsWideMode: (wide: boolean) => void;
}> = ({ isSidebarOpen, setSidebarOpen, pageTitle, setPageTitle, isWideMode, setIsWideMode }) => {
  const location = useLocation();

  // Update HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = 'zh'; // 默认语言
    
    // 监听i18next语言变化（如果需要动态更新）
    // 这里简化处理，实际可能需要从i18n实例获取当前语言
    return () => {
      document.documentElement.lang = 'zh';
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 bg-theme-dark-900 transition-colors duration-200">
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
          isWideMode={isWideMode}
          onToggleWideMode={() => setIsWideMode(!isWideMode)}
        />

        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-4 md:p-8">
              <Routes>
                <Route path="/" element={<Dashboard isWideMode={isWideMode} />} />
                <Route
                  path="/tools/:categoryId/:toolId"
                  element={<ToolContainer setTitle={setPageTitle} key={location.pathname} isWideMode={isWideMode} />}
                />
                <Route path="*" element={<Dashboard isWideMode={isWideMode} />} />
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
  const [isWideMode, setIsWideMode] = useState(() => {
    const saved = localStorage.getItem('app_wide_mode');
    return saved ? JSON.parse(saved) : false;
  });

  const handleSetWideMode = (wide: boolean) => {
    setIsWideMode(wide);
    localStorage.setItem('app_wide_mode', JSON.stringify(wide));
  };

  return (
    <Router>
      <AppContent
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        pageTitle={pageTitle}
        setPageTitle={setPageTitle}
        isWideMode={isWideMode}
        setIsWideMode={handleSetWideMode}
      />
    </Router>
  );
};

export default App;
