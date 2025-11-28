
import React, { useState } from 'react';
import Products from './Products';
import Suppliers from './Suppliers';
import Warehouses from './Warehouses';
import InventoryOverview from './InventoryOverview';
import TransactionHistory from './TransactionHistory';
import { useData } from '../contexts/DataContext';
import Button from '../components/ui/Button';
import { RotateCcwIcon } from '../constants';

type MasterDataTab = 'inventory' | 'transactions' | 'products' | 'suppliers' | 'warehouses';

const MasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MasterDataTab>('inventory');
  const { resetData } = useData();

  const handleReset = () => {
    if (window.confirm("CẢNH BÁO QUAN TRỌNG:\n\nHành động này sẽ XÓA TOÀN BỘ dữ liệu (Sản phẩm, Kho, Giao dịch, Nhà cung cấp) và đưa hệ thống về trạng thái trắng ban đầu.\n\nBạn có chắc chắn muốn tiếp tục không?")) {
        resetData();
        alert("Hệ thống đã được reset về mặc định.");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'inventory': return <InventoryOverview />;
      case 'transactions': return <TransactionHistory />;
      case 'products': return <Products />;
      case 'suppliers': return <Suppliers />;
      case 'warehouses': return <Warehouses />;
      default: return null;
    }
  };

  const TabButton: React.FC<{ tab: MasterDataTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tab
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">Dữ liệu gốc & Vận hành</h1>
        
        <Button 
            onClick={handleReset} 
            variant="danger" 
            size="sm"
            leftIcon={<RotateCcwIcon className="w-4 h-4" />}
        >
            Reset toàn bộ dữ liệu
        </Button>
      </div>
      
      <div className="flex space-x-2 border-b dark:border-gray-700 mb-6 pb-2 overflow-x-auto">
        <TabButton tab="inventory" label="Tổng quan Tồn kho" />
        <TabButton tab="transactions" label="Lịch sử Giao dịch" />
        <TabButton tab="products" label="Sản phẩm" />
        <TabButton tab="suppliers" label="Nhà cung cấp" />
        <TabButton tab="warehouses" label="Kho hàng" />
      </div>
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MasterData;
