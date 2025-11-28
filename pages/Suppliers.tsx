import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Supplier } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { EditIcon, Trash2Icon, PlusCircleIcon, SaveIcon, XIcon } from '../constants';

const Suppliers: React.FC = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | Omit<Supplier, 'id'> | null>(null);

    const openModal = (supplier?: Supplier) => {
        setEditingSupplier(supplier || { name: '', contact: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingSupplier(null);
        setIsModalOpen(false);
    };

    const handleSave = () => {
        if (!editingSupplier || !editingSupplier.name) return;
        if ('id' in editingSupplier) {
            updateSupplier(editingSupplier as Supplier);
        } else {
            addSupplier(editingSupplier as Omit<Supplier, 'id'>);
        }
        closeModal();
    };

    const handleDelete = (supplierId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
            deleteSupplier(supplierId);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingSupplier) return;
        const { name, value } = e.target;
        setEditingSupplier({ ...editingSupplier, [name]: value });
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => openModal()} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>Thêm Nhà cung cấp</Button>
            </div>
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="py-3 px-6">Tên nhà cung cấp</th>
                            <th scope="col" className="py-3 px-6">Liên hệ</th>
                            <th scope="col" className="py-3 px-6">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(s => (
                            <tr key={s.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{s.name}</td>
                                <td className="py-4 px-6">{s.contact}</td>
                                <td className="py-4 px-6 flex items-center space-x-3">
                                    <button onClick={() => openModal(s)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600" title="Sửa">
                                        <EditIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600" title="Xóa">
                                        <Trash2Icon className="w-5 h-5"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingSupplier && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={'id' in editingSupplier ? 'Chỉnh sửa Nhà cung cấp' : 'Thêm Nhà cung cấp mới'}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên Nhà cung cấp</label>
                            <input type="text" name="name" value={editingSupplier.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thông tin liên hệ</label>
                            <input type="text" name="contact" value={editingSupplier.contact} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
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
export default Suppliers;
