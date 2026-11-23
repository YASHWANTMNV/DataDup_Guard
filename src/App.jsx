import React, { useEffect } from 'react';
import { DatasetProvider, useDataset } from './context/DatasetContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AIAssistant from './components/AIAssistant';

import UploadPage from './pages/UploadPage';
import OverviewPage from './pages/OverviewPage';
import ProfilePage from './pages/ProfilePage';
import DuplicateAnalysisPage from './pages/DuplicateAnalysisPage';
import RootCausePage from './pages/RootCausePage';
import ReportsPage from './pages/ReportsPage';

function MainContent() {
  const { activeTab } = useDataset();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadPage />;
      case 'overview':
        return <OverviewPage />;
      case 'profile':
        return <ProfilePage />;
      case 'duplicates':
        return <DuplicateAnalysisPage />;
      case 'root-causes':
        return <RootCausePage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <UploadPage />;
    }
  };

  return (
    <main className="flex-1 p-4 lg:p-8 overflow-y-auto bg-slate-950 text-slate-100">
      {renderActivePage()}
    </main>
  );
}

export default function App() {
  // Prevent browser default behavior of navigating away/reloading when dropping files anywhere on window
  useEffect(() => {
    const handleGlobalDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', handleGlobalDragOver, false);
    window.addEventListener('drop', handleGlobalDrop, false);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver, false);
      window.removeEventListener('drop', handleGlobalDrop, false);
    };
  }, []);

  return (
    <DatasetProvider>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased text-slate-100 selection:bg-indigo-600 selection:text-white">
        <Header />
        <div className="flex-1 flex flex-col lg:flex-row">
          <Sidebar />
          <MainContent />
        </div>
        <AIAssistant />
      </div>
    </DatasetProvider>
  );
}
