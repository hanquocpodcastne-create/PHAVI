
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Warehouse } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { EditIcon, Trash2Icon, PlusCircleIcon, SaveIcon, XIcon, SearchIcon } from '../constants';

const Warehouses: React.FC = () => {
    const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | Omit<Warehouse, 'id'> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredWarehouses = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return warehouses.filter(w => 
            w.name.toLowerCase().includes(term) || 
            w.location.toLowerCase().includes(term)
        );
    }, [warehouses, searchTerm]);
    
    const openModal = (warehouse?: Warehouse) => {
        setEditingWarehouse(warehouse || { name: '', location: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingWarehouse(null);
        setIsModalOpen(false);
    };

    const handleSave = () => {
        if (!editingWarehouse || !editingWarehouse.name) return;
        if ('id' in editingWarehouse) {
            updateWarehouse(editingWarehouse as Warehouse);
        } else {
            addWarehouse(editingWarehouse as Omit<Warehouse, 'id'>);
        }
        closeModal();
    };
    
    const handleDelete = (warehouseId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa kho hàng này?')) {
            deleteWarehouse(warehouseId);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingWarehouse) return;
        const { name, value } = e.target;
        setEditingWarehouse({ ...editingWarehouse, [name]: value });
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
                 <div className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo Tên kho, Địa điểm..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => openModal()} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>Thêm Kho hàng</Button>
            </div>

            <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="py-3 px-6">Tên kho</th>
                            <th scope="col" className="py-3 px-6">Địa điểm</th>
                            <th scope="col" className="py-3 px-6 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWarehouses.length > 0 ? (
                            filteredWarehouses.map(w => (
                                <tr key={w.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{w.name}</td>
                                    <td className="py-4 px-6">{w.location}</td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center space-x-3">
                                            <button onClick={() => openModal(w)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600 transition-colors" title="Sửa">
                                                <EditIcon className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => handleDelete(w.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600 transition-colors" title="Xóa">
                                                <Trash2Icon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-gray-400">
                                    Không tìm thấy dữ liệu.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {editingWarehouse && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={'id' in editingWarehouse ? 'Chỉnh sửa Kho hàng' : 'Thêm Kho hàng mới'}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên Kho hàng</label>
                            <input type="text" name="name" value={editingWarehouse.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Địa điểm</label>
                            <input type="text" name="location" value={editingWarehouse.location} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button onClick={closeModal} variant="secondary" leftIcon={<XIcon className="w-4 h-4"/>}>Hủy</Button>
                        <Button onClick={handleSave} leftIcon={<SaveIcon className="w-4 h-4"/>}>Lưu</Button>
                    </div>
                </Modal>
            )}
        </>
    );
};
export default Warehouses;
