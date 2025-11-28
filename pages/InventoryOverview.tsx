
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { InventoryLot } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { EditIcon, Trash2Icon, SaveIcon, XIcon, SearchIcon } from '../constants';

const InventoryOverview: React.FC = () => {
    const { inventoryLots, products, warehouses, updateInventoryLot, deleteInventoryLot } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLot, setEditingLot] = useState<InventoryLot | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLots = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return inventoryLots.filter(lot => {
            const product = products.find(p => p.id === lot.productId);
            const warehouse = warehouses.find(w => w.id === lot.warehouseId);
            
            const productName = product?.name.toLowerCase() || '';
            const productCode = product?.code.toLowerCase() || '';
            const warehouseName = warehouse?.name.toLowerCase() || '';
            const lotNumber = (lot.lotNumber || '').toLowerCase();

            return productName.includes(term) || productCode.includes(term) || warehouseName.includes(term) || lotNumber.includes(term);
        });
    }, [inventoryLots, products, warehouses, searchTerm]);

    const openModal = (lot: InventoryLot) => {
        setEditingLot(lot);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingLot(null);
        setIsModalOpen(false);
    };

    const handleSave = () => {
        if (editingLot) {
            updateInventoryLot(editingLot);
        }
        closeModal();
    };
    
    const handleDelete = (lotId: string) => {
        if(window.confirm('Bạn có chắc chắn muốn xóa lô hàng này? Hành động này không thể hoàn tác.')) {
            deleteInventoryLot(lotId);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingLot) return;
        const { name, value } = e.target;
        setEditingLot({ ...editingLot, [name]: name === 'quantity' ? parseInt(value, 10) : value });
    };

    return (
        <>
            <div className="mb-6">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo Sản phẩm, Số lô, Kho..."
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
                            <th scope="col" className="py-3 px-6">Sản phẩm</th>
                            <th scope="col" className="py-3 px-6">Kho</th>
                            <th scope="col" className="py-3 px-6 text-right">Số lượng</th>
                            <th scope="col" className="py-3 px-6">Số lô</th>
                            <th scope="col" className="py-3 px-6">Hạn sử dụng</th>
                            <th scope="col" className="py-3 px-6 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLots.length > 0 ? (
                            filteredLots.map(lot => {
                                const product = products.find(p => p.id === lot.productId);
                                const warehouse = warehouses.find(w => w.id === lot.warehouseId);
                                return (
                                    <tr key={lot.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                        <th scope="row" className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            {product?.name || 'Không xác định'}
                                            <div className="text-xs font-normal text-gray-500">{product?.code}</div>
                                        </th>
                                        <td className="py-4 px-6">{warehouse?.name || 'Không xác định'}</td>
                                        <td className="py-4 px-6 text-right font-bold text-gray-700 dark:text-gray-300">{lot.quantity.toLocaleString()}</td>
                                        <td className="py-4 px-6 font-mono text-xs">{lot.lotNumber || 'N/A'}</td>
                                        <td className="py-4 px-6">{lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center space-x-3">
                                                <button onClick={() => openModal(lot)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600 transition-colors" title="Sửa">
                                                    <EditIcon className="w-5 h-5"/>
                                                </button>
                                                <button onClick={() => handleDelete(lot.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600 transition-colors" title="Xóa">
                                                    <Trash2Icon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-400">
                                    Không có dữ liệu tồn kho phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {editingLot && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title="Chỉnh sửa Tồn kho Lô hàng">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số lượng</label>
                            <input type="number" name="quantity" value={editingLot.quantity} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số lô</label>
                            <input type="text" name="lotNumber" value={editingLot.lotNumber || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hạn sử dụng</label>
                            <input type="date" name="expiryDate" value={editingLot.expiryDate ? new Date(editingLot.expiryDate).toISOString().split('T')[0] : ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button onClick={closeModal} variant="secondary" leftIcon={<XIcon className="w-4 h-4"/>}>Hủy</Button>
                        <Button onClick={handleSave} leftIcon={<SaveIcon className="w-4 h-4"/>}>Lưu thay đổi</Button>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default InventoryOverview;
