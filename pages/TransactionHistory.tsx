
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Trash2Icon, SearchIcon } from '../constants';

const TransactionHistory: React.FC = () => {
    const { transactions, products, warehouses, deleteTransaction } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTransactions = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return [...transactions].reverse().filter(t => {
            const product = products.find(p => p.id === t.productId);
            const warehouse = warehouses.find(w => w.id === t.warehouseId);
            
            const productName = product?.name.toLowerCase() || '';
            const relatedParty = (t.relatedPartyName || '').toLowerCase();
            const documentId = (t.documentId || '').toLowerCase();
            const typeText = t.type === 'INBOUND' ? 'nhập' : 'xuất';

            return productName.includes(term) || relatedParty.includes(term) || documentId.includes(term) || typeText.includes(term);
        });
    }, [transactions, products, warehouses, searchTerm]);

    const handleDelete = (transactionId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này? Hành động này sẽ không cập nhật lại tồn kho và chỉ nên dùng để xóa các bản ghi lỗi.')) {
            deleteTransaction(transactionId);
        }
    }

    return (
        <>
             <div className="mb-6">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo Mã phiếu, Sản phẩm, Đối tác..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="py-3 px-6">Ngày</th>
                            <th scope="col" className="py-3 px-6">Loại</th>
                            <th scope="col" className="py-3 px-6">Sản phẩm</th>
                            <th scope="col" className="py-3 px-6">Kho</th>
                            <th scope="col" className="py-3 px-6 text-right">Số lượng</th>
                            <th scope="col" className="py-3 px-6">Đối tác</th>
                            <th scope="col" className="py-3 px-6">Mã phiếu</th>
                            <th scope="col" className="py-3 px-6 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map(t => {
                                const product = products.find(p => p.id === t.productId);
                                const warehouse = warehouses.find(w => w.id === t.warehouseId);
                                return (
                                    <tr key={t.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                        <td className="py-4 px-6">{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                t.type === 'INBOUND' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                            }`}>
                                                {t.type === 'INBOUND' ? 'Nhập' : 'Xuất'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{product?.name || 'N/A'}</td>
                                        <td className="py-4 px-6">{warehouse?.name || 'N/A'}</td>
                                        <td className="py-4 px-6 text-right font-mono">{t.quantity.toLocaleString()}</td>
                                        <td className="py-4 px-6">{t.relatedPartyName || 'N/A'}</td>
                                        <td className="py-4 px-6 text-xs font-mono text-gray-500">{t.documentId || 'N/A'}</td>
                                        <td className="py-4 px-6 text-center">
                                             <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600 transition-colors" title="Xóa">
                                                <Trash2Icon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-400">
                                    Không có giao dịch nào phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default TransactionHistory;
