import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Product } from '../types';

const Reports: React.FC = () => {
  const { inventoryLots, products } = useData();
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');

  const getProductDetails = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };
  
  // Create a summary report by aggregating lots
  const summaryReport = products.map(product => {
    const totalQuantity = inventoryLots
      .filter(lot => lot.productId === product.id)
      .reduce((sum, lot) => sum + lot.quantity, 0);

    return {
      ...product,
      totalQuantity,
    };
  }).filter(item => item.totalQuantity > 0); // Only show products with stock

  const TabButton: React.FC<{ type: 'summary' | 'detailed'; label: string }> = ({ type, label }) => (
    <button
      onClick={() => setReportType(type)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        reportType === type
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Báo cáo Tồn kho</h1>
      <div className="flex space-x-2 border-b dark:border-gray-700 mb-6 pb-2">
        <TabButton type="summary" label="Báo cáo Tổng hợp" />
        <TabButton type="detailed" label="Báo cáo Chi tiết theo Lô/Date" />
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        {reportType === 'summary' ? (
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="py-3 px-6">Mã SP</th>
                <th scope="col" className="py-3 px-6">Tên sản phẩm</th>
                <th scope="col" className="py-3 px-6">Tồn cuối kỳ</th>
                <th scope="col" className="py-3 px-6">Đơn vị</th>
              </tr>
            </thead>
            <tbody>
              {summaryReport.map(item => (
                <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="py-4 px-6">{item.code}</td>
                  <th scope="row" className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {item.name}
                  </th>
                  <td className="py-4 px-6 font-bold">{item.totalQuantity.toLocaleString()}</td>
                  <td className="py-4 px-6">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="py-3 px-6">Mã SP</th>
                <th scope="col" className="py-3 px-6">Tên sản phẩm</th>
                <th scope="col" className="py-3 px-6">Số Lô</th>
                <th scope="col" className="py-3 px-6">Hạn sử dụng</th>
                <th scope="col" className="py-3 px-6">Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {inventoryLots.map(lot => {
                const product = getProductDetails(lot.productId);
                return (
                  <tr key={lot.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="py-4 px-6">{product?.code || 'N/A'}</td>
                    <th scope="row" className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {product?.name || 'Không xác định'}
                    </th>
                    <td className="py-4 px-6">{lot.lotNumber || 'N/A'}</td>
                    <td className="py-4 px-6">{lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-4 px-6 font-bold">{lot.quantity.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;
