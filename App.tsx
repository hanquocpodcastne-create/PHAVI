
import React, { useState, createContext } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Validation from './pages/Validation';
import MasterData from './pages/MasterData';
import Reports from './pages/Reports';
import { Page, User, AuthContextType } from './types';
import { DataProvider, useData } from './contexts/DataContext';

const mockUser: User = {
  name: 'Admin User',
  role: 'admin',
  avatarUrl: `https://i.pravatar.cc/150?u=admin`,
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

// Component con để sử dụng hook useData (vì AppProvider bao bọc ở ngoài)
const MainContent = () => {
  const [user, setUser] = useState<User | null>(mockUser);
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const { draftTransaction, setDraftTransaction } = useData();

  const handleLogout = () => {
    setUser(null);
    alert("Bạn đã đăng xuất.");
  };

  const handleValidationSuccess = () => {
    // Logic xử lý và xóa draft đã được chuyển vào DataContext
    setActivePage(Page.MasterData); 
    alert("Dữ liệu đã được xử lý và lưu thành công!");
  };

  const handleValidationCancel = () => {
    setDraftTransaction(null);
    setActivePage(Page.Upload);
  };

  const renderContent = () => {
    switch (activePage) {
      case Page.Dashboard:
        return <Dashboard setActivePage={setActivePage} />;
      case Page.Upload:
        return <Upload onSuccess={() => setActivePage(Page.Validation)} />;
      case Page.Validation:
        if (draftTransaction) {
          return <Validation 
            onSuccess={handleValidationSuccess}
            onCancel={handleValidationCancel}
          />;
        }
        // Nếu không có dữ liệu nháp mà vào trang này, quay về Upload
        return <Upload onSuccess={() => setActivePage(Page.Validation)} />;
      case Page.MasterData:
        return <MasterData />;
      case Page.Reports:
        return <Reports />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login: setUser, logout: handleLogout }}>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
          {user && <Sidebar activePage={activePage} setActivePage={setActivePage} />}
          <div className="flex-1 flex flex-col overflow-hidden">
            {user && <Header onLogout={handleLogout} />}
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
              {user ? renderContent() : <div className="text-center p-8">Vui lòng đăng nhập</div>}
            </main>
          </div>
        </div>
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <DataProvider>
      <MainContent />
    </DataProvider>
  );
}

export default App;
