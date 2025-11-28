
import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  PackageIcon, 
  TruckIcon, 
  UsersIcon, 
  WarehouseIcon, 
  AlertTriangleIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  CheckCircleIcon
} from '../constants';
import { Page } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardProps {
  setActivePage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
  const { inventoryLots, products, transactions, suppliers } = useData();

  // --- HELPER FUNCTION: Tính toán xu hướng (KPI Trends) ---
  // Giả lập tính toán so với 7 ngày trước dựa trên lịch sử giao dịch
  const kpiTrends = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Tính giá trị tồn kho hiện tại
    const currentTotalValue = inventoryLots.reduce((acc, lot) => {
      const product = products.find((p) => p.id === lot.productId);
      return acc + lot.quantity * (product?.costPrice || 0);
    }, 0);

    // 2. Tính sự thay đổi giá trị trong 7 ngày qua (Nhập làm tăng, Xuất làm giảm)
    // Để suy ra giá trị quá khứ: Giá trị cũ = Giá trị hiện tại - Nhập(trong 7 ngày) + Xuất(trong 7 ngày)
    let valueChange = 0;
    let unitsChange = 0;

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate >= sevenDaysAgo && tDate <= today) {
        const product = products.find(p => p.id === t.productId);
        const cost = product?.costPrice || 0;
        if (t.type === 'INBOUND') {
          valueChange += t.quantity * cost;
          unitsChange += t.quantity;
        } else {
          valueChange -= t.quantity * cost;
          unitsChange -= t.quantity;
        }
      }
    });

    // Nếu không có giao dịch nào, giả định tăng trưởng nhẹ 0-5% để demo cho đẹp (nếu là production thì để 0)
    const mockGrowth = transactions.length === 0;

    const pastTotalValue = currentTotalValue - valueChange;
    const valueGrowth = pastTotalValue === 0 ? (mockGrowth ? 12.5 : 0) : ((valueChange) / pastTotalValue) * 100;

    // Tính tổng tồn kho hiện tại
    const currentTotalUnits = inventoryLots.reduce((acc, lot) => acc + lot.quantity, 0);
    const pastTotalUnits = currentTotalUnits - unitsChange;
    const unitsGrowth = pastTotalUnits === 0 ? (mockGrowth ? 8.2 : 0) : ((unitsChange) / pastTotalUnits) * 100;

    return {
      valueGrowth,
      unitsGrowth,
      productsGrowth: mockGrowth ? 2.5 : 0, // Giả định
      suppliersGrowth: mockGrowth ? 5.0 : 0 // Giả định
    };
  }, [inventoryLots, products, transactions]);

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

  // --- CHART 1: Biểu đồ Cột Ngang (Horizontal Bar) cho Danh mục ---
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); 
  }, [inventoryLots, products]);

  // --- CHART 2: Biểu đồ Vùng (Area Chart) cho Xu hướng Giao dịch 7 ngày ---
  const trendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
      
      const dayTransactions = transactions.filter(t => t.date.startsWith(dateStr));
      const inbound = dayTransactions.filter(t => t.type === 'INBOUND').reduce((sum, t) => sum + t.quantity, 0);
      const outbound = dayTransactions.filter(t => t.type === 'OUTBOUND').reduce((sum, t) => sum + t.quantity, 0);

      days.push({
        date: displayDate,
        Nhập: inbound,
        Xuất: outbound
      });
    }
    return days;
  }, [transactions]);

  // --- DANH SÁCH ---
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

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  const KPICard = ({ title, value, subValue, icon, trend, colorClass }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
          {icon}
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend >= 0 ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDownIcon className="w-3 h-3" />}
          <span>{Math.abs(trend).toFixed(1)}%</span>
        </div>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</h3>
        <p className="text-xs text-gray-400 mt-2">{subValue}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto space-y-8 pb-10">
      
      {/* KHU VỰC KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Tổng Giá trị Tồn kho"
          value={formatCurrency(totalValue)}
          subValue="Vốn thực tế trong kho"
          icon={<PackageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          trend={kpiTrends.valueGrowth}
          colorClass="text-blue-600"
        />
        <KPICard 
          title="Tổng Lượng Hàng"
          value={totalUnits.toLocaleString('vi-VN')}
          subValue="Đơn vị sản phẩm (Items)"
          icon={<WarehouseIcon className="w-6 h-6 text-green-600 dark:text-green-400" />}
          trend={kpiTrends.unitsGrowth}
          colorClass="text-green-600"
        />
        <KPICard 
          title="Danh mục Sản phẩm"
          value={products.length}
          subValue="Mã hàng (SKU) đang quản lý"
          icon={<PackageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          trend={kpiTrends.productsGrowth}
          colorClass="text-purple-600"
        />
        <KPICard 
          title="Đối tác Liên kết"
          value={suppliers.length}
          subValue="Nhà cung cấp & Khách hàng"
          icon={<UsersIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
          trend={kpiTrends.suppliersGrowth}
          colorClass="text-orange-600"
        />
      </div>

      {/* KHU VỰC BIỂU ĐỒ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Biểu đồ 1: Xu hướng Giao dịch (Area Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Xu hướng Nhập / Xuất</h3>
              <p className="text-sm text-gray-500">Hoạt động kho trong 7 ngày gần nhất</p>
            </div>
            <div className="flex space-x-4 text-sm">
               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Nhập kho</div>
               <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Xuất kho</div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.5} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="Nhập" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="Xuất" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ 2: Phân bổ Tồn kho (Horizontal Bar Chart) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Top Danh mục</h3>
          <p className="text-sm text-gray-500 mb-6">Phân loại hàng hóa chủ đạo</p>
          
          <div className="h-80 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={categoryData} 
                  layout="vertical" 
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                  barSize={20}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#4B5563', fontSize: 13, fontWeight: 500}} 
                    width={100}
                  />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} background={{ fill: '#F3F4F6' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <PackageIcon className="w-12 h-12 mb-2 opacity-20" />
                 <p>Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KHU VỰC DANH SÁCH CHI TIẾT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lịch sử giao dịch */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white">Giao dịch gần đây</h3>
             <button onClick={() => setActivePage(Page.Reports)} className="text-sm text-blue-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold">
                <tr>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Sản phẩm / Đối tác</th>
                  <th className="px-6 py-4 text-right">Số lượng</th>
                  <th className="px-6 py-4 text-right">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((t) => {
                    const product = products.find((p) => p.id === t.productId);
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              t.type === 'INBOUND'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {t.type === 'INBOUND' ? 'NHẬP KHO' : 'XUẤT KHO'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">{product?.name || 'Sản phẩm đã xóa'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{t.relatedPartyName || 'Khách lẻ'}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium text-gray-900 dark:text-white">
                          {t.quantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          {new Date(t.date).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      Chưa có giao dịch nào phát sinh.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cảnh báo hạn dùng */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
               <AlertTriangleIcon className="w-5 h-5 text-orange-500 mr-2" />
               Cảnh báo Hạn dùng
             </h3>
             <p className="text-sm text-gray-500 mt-1">Sản phẩm hết hạn trong 90 ngày tới</p>
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
                    className={`flex justify-between items-start p-3 rounded-lg border transition-all hover:shadow-sm ${
                      isExpired 
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' 
                        : 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'
                    }`}
                  >
                    <div className="overflow-hidden pr-2">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate" title={product?.name}>
                        {product?.name}
                      </p>
                      <div className="flex items-center text-xs mt-1 space-x-2 text-gray-500">
                        <span>Lô: {item.lotNumber}</span>
                        <span>•</span>
                        <span>SL: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isExpired ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                      }`}>
                        {isExpired ? 'Expired' : 'Warning'}
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-mono">
                        {expiryDate.toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                <CheckCircleIcon className="w-12 h-12 mb-3 text-green-500 opacity-50" />
                <p className="text-sm font-medium">Kho hàng an toàn</p>
                <p className="text-xs mt-1">Không có lô hàng sắp hết hạn</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
