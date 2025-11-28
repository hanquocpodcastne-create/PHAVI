
import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import Card from '../components/ui/Card';
import { PackageIcon, TruckIcon, UsersIcon, WarehouseIcon, AlertTriangleIcon, PieChartIcon } from '../constants';
import { Page } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardProps {
  setActivePage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
  const { inventoryLots, products, transactions, suppliers } = useData();

  // 1. Tính toán KPIs
  const { totalValue, totalUnits } = useMemo(() => {
    return inventoryLots.reduce(
      (acc, lot) => {
        const product = products.find((p) => p.id === lot.productId);
        const quantity = lot.quantity;
        const cost = product?.costPrice || 0;
        return {
          totalValue: acc.totalValue + quantity * cost,
          totalUnits: acc.totalUnits + quantity,
        };
      },
      { totalValue: 0, totalUnits: 0 }
    );
  }, [inventoryLots, products]);

  // 2. Biểu đồ: Tồn kho theo Danh mục
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    inventoryLots.forEach((lot) => {
      const product = products.find((p) => p.id === lot.productId);
      if (product) {
        const catName = product.category || 'Khác';
        categories[catName] = (categories[catName] || 0) + lot.quantity;
      }
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // Sắp xếp giảm dần
      .slice(0, 5); // Top 5
  }, [inventoryLots, products]);

  // 3. Biểu đồ: Nhập vs Xuất
  const transactionData = useMemo(() => {
    const counts = { INBOUND: 0, OUTBOUND: 0 };
    transactions.forEach((t) => {
      if (t.type === 'INBOUND') counts.INBOUND++;
      if (t.type === 'OUTBOUND') counts.OUTBOUND++;
    });
    return [
      { name: 'Nhập kho', value: counts.INBOUND },
      { name: 'Xuất kho', value: counts.OUTBOUND },
    ];
  }, [transactions]);

  // 4. Cảnh báo hết hạn (<= 90 ngày)
  const expiringSoon = useMemo(() => {
    return inventoryLots
      .filter((i) => {
        if (!i.expiryDate) return false;
        const expiry = new Date(i.expiryDate);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 90; 
      })
      .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  }, [inventoryLots]);

  // 5. Giao dịch mới nhất
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="container mx-auto space-y-6 pb-10">
      
      {/* KHU VỰC KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Giá trị Tồn kho</p>
              <h3 className="text-2xl font-bold">{formatCurrency(totalValue)}</h3>
              <p className="text-xs text-gray-500 mt-1">Tổng vốn hiện tại</p>
            </div>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <PackageIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Tổng Tồn kho</p>
              <h3 className="text-2xl font-bold">{totalUnits.toLocaleString('vi-VN')}</h3>
              <p className="text-xs text-gray-500 mt-1">Đơn vị sản phẩm</p>
            </div>
            <div className="bg-green-500/20 p-2 rounded-lg">
              <WarehouseIcon className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Tổng số Sản phẩm</p>
              <h3 className="text-2xl font-bold">{products.length}</h3>
              <p className="text-xs text-gray-500 mt-1">Mã hàng (SKU) khác nhau</p>
            </div>
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <PackageIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-xl border border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Nhà cung cấp</p>
              <h3 className="text-2xl font-bold">{suppliers.length}</h3>
              <p className="text-xs text-gray-500 mt-1">Đối tác liên kết</p>
            </div>
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <UsersIcon className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* KHU VỰC BIỂU ĐỒ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Phân bổ Tồn kho theo Danh mục</h3>
          <div className="h-80 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                    itemStyle={{ color: '#F3F4F6' }}
                    cursor={{fill: 'transparent'}}
                  />
                  <Bar dataKey="value" name="Số lượng" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <PackageIcon className="w-12 h-12 mb-2 opacity-20" />
                 <p>Chưa có dữ liệu tồn kho</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Tỷ lệ Nhập / Xuất</h3>
          <div className="h-80 w-full">
            {transactions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell key="cell-in" fill="#10B981" />
                    <Cell key="cell-out" fill="#EF4444" />
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <PieChartIcon className="w-12 h-12 mb-2 opacity-20" />
                <p>Chưa có giao dịch</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KHU VỰC DANH SÁCH CHI TIẾT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lịch sử giao dịch */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border dark:border-gray-700">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
             <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Lịch sử giao dịch gần đây</h3>
             <TruckIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3">Loại phiếu</th>
                  <th className="px-6 py-3">Sản phẩm</th>
                  <th className="px-6 py-3 text-right">Số lượng</th>
                  <th className="px-6 py-3 text-right">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((t) => {
                    const product = products.find((p) => p.id === t.productId);
                    return (
                      <tr key={t.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              t.type === 'INBOUND'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {t.type === 'INBOUND' ? 'NHẬP' : 'XUẤT'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {product?.name || 'Sản phẩm đã xóa'}
                          <div className="text-xs text-gray-400 mt-0.5">{t.relatedPartyName}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">{t.quantity.toLocaleString('vi-VN')}</td>
                        <td className="px-6 py-4 text-right">{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Chưa có giao dịch nào được ghi nhận.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {recentTransactions.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 text-center border-t border-gray-100 dark:border-gray-700">
               <button onClick={() => setActivePage(Page.Reports)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Xem tất cả</button>
            </div>
          )}
        </div>

        {/* Cảnh báo hạn dùng */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border dark:border-gray-700 flex flex-col">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-orange-50/50 dark:bg-orange-900/10">
             <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
               <AlertTriangleIcon className="w-5 h-5 text-orange-500 mr-2" />
               Cảnh báo Hạn dùng
             </h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto max-h-[400px] space-y-3 custom-scrollbar">
            {expiringSoon.length > 0 ? (
              expiringSoon.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                const expiryDate = new Date(item.expiryDate!);
                const isExpired = expiryDate < new Date();
                
                return (
                  <div
                    key={item.id}
                    className={`flex justify-between items-center p-3 rounded-lg border shadow-sm transition-transform hover:scale-[1.02] ${
                      isExpired 
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                        : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                    }`}
                  >
                    <div className="overflow-hidden pr-2">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate" title={product?.name}>
                        {product?.name}
                      </p>
                      <div className="flex items-center text-xs mt-1 space-x-2">
                        <span className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border dark:border-gray-600 text-gray-500 dark:text-gray-400">
                          Lô: {item.lotNumber}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                        {isExpired ? 'ĐÃ HẾT HẠN' : 'SẮP HẾT'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {expiryDate.toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-3">
                    <WarehouseIcon className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Kho hàng an toàn</p>
                <p className="text-xs mt-1">Không có lô hàng nào sắp hết hạn trong 90 ngày tới.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
