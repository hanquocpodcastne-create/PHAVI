import React from 'react';
import { useData } from '../contexts/DataContext';
import { Trash2Icon } from '../constants';

const TransactionHistory: React.FC = () => {
    const { transactions, products, warehouses, deleteTransaction } = useData();

    const handleDelete = (transactionId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này? Hành động này sẽ không cập nhật lại tồn kho và chỉ nên dùng để xóa các bản ghi lỗi.')) {
            deleteTransaction(transactionId);
        }
    }

    return (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="py-3 px-6">Ngày</th>
                        <th scope="col" className="py-3 px-6">Loại</th>
                        <th scope="col" className="py-3 px-6">Sản phẩm</th>
                        <th scope="col" className="py-3 px-6">Kho</th>
                        <th scope="col" className="py-3 px-6">Số lượng</th>
                        <th scope="col" className="py-3 px-6">Đối tác</th>
                        <th scope="col" className="py-3 px-6">Mã phiếu</th>
                        <th scope="col" className="py-3 px-6">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {[...transactions].reverse().map(t => {
                        const product = products.find(p => p.id === t.productId);
                        const warehouse = warehouses.find(w => w.id === t.warehouseId);
                        return (
                            <tr key={t.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="py-4 px-6">{new Date(t.date).toLocaleString()}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        t.type === 'INBOUND' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                        {t.type === 'INBOUND' ? 'Nhập' : 'Xuất'}
                                    </span>
                                </td>
                                <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{product?.name || 'N/A'}</td>
                                <td className="py-4 px-6">{warehouse?.name || 'N/A'}</td>
                                <td className="py-4 px-6">{t.quantity}</td>
                                <td className="py-4 px-6">{t.relatedPartyName || 'N/A'}</td>
                                <td className="py-4 px-6">{t.documentId || 'N/A'}</td>
                                <td className="py-4 px-6">
                                     <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600" title="Xóa">
                                        <Trash2Icon className="w-5 h-5"/>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionHistory;
