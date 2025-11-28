
import React from 'react';
import { Page } from '../../types';
import { HomeIcon, FileUpIcon, ListIcon, PieChartIcon, WarehouseIcon } from '../../constants';
import { useData } from '../../contexts/DataContext';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, isActive, onClick, badge }) => {
  return (
    <li className="px-2">
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <div className="flex items-center">
          <span className="w-6 h-6">{icon}</span>
          <span className="ml-4 font-semibold">{label}</span>
        </div>
        {badge ? (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        ) : null}
      </a>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { draftTransaction } = useData();

  // Logic điều hướng thông minh
  const handleUploadClick = () => {
    if (draftTransaction) {
      setActivePage(Page.Validation);
    } else {
      setActivePage(Page.Upload);
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col">
      <div className="h-20 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <WarehouseIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold ml-2 text-gray-800 dark:text-white">Kho Hàng</h1>
      </div>
      <nav className="flex-1 py-6">
        <ul className="space-y-2">
          <NavItem 
            icon={<HomeIcon />} 
            label="Bảng điều khiển" 
            isActive={activePage === Page.Dashboard} 
            onClick={() => setActivePage(Page.Dashboard)} 
          />
          <NavItem 
            icon={<FileUpIcon />} 
            label={draftTransaction ? "Đang xử lý..." : "Tải lên phiếu"} 
            isActive={activePage === Page.Upload || activePage === Page.Validation} 
            onClick={handleUploadClick}
            badge={draftTransaction ? 1 : undefined}
          />
          <NavItem 
            icon={<ListIcon />} 
            label="Dữ liệu gốc" 
            isActive={activePage === Page.MasterData} 
            onClick={() => setActivePage(Page.MasterData)} 
          />
          <NavItem 
            icon={<PieChartIcon />} 
            label="Báo cáo" 
            isActive={activePage === Page.Reports} 
            onClick={() => setActivePage(Page.Reports)} 
          />
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Hệ thống quản lý kho v1.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
