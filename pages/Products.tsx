import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Product } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { EditIcon, Trash2Icon, PlusCircleIcon, SaveIcon, XIcon } from '../constants';

const Products: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | Omit<Product, 'id'> | null>(null);

    const openModal = (product?: Product) => {
        setEditingProduct(product || { name: '', code: '', category: '', unit: '', costPrice: 0 });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingProduct(null);
        setIsModalOpen(false);
    };

    const handleSave = () => {
        if (!editingProduct || !editingProduct.name) return;
        if ('id' in editingProduct) {
            updateProduct(editingProduct as Product);
        } else {
            addProduct(editingProduct as Omit<Product, 'id'>);
        }
        closeModal();
    };

    const handleDelete = (productId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này sẽ xóa tất cả lô hàng và giao dịch liên quan.')) {
            deleteProduct(productId);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingProduct) return;
        const { name, value } = e.target;
        const parsedValue = name === 'costPrice' ? parseFloat(value) || 0 : value;
        setEditingProduct({ ...editingProduct, [name]: parsedValue });
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => openModal()} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>Thêm Sản phẩm</Button>
            </div>
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="py-3 px-6">Mã SP</th>
                            <th scope="col" className="py-3 px-6">Tên sản phẩm</th>
                            <th scope="col" className="py-3 px-6">Phân loại</th>
                            <th scope="col" className="py-3 px-6">Đơn vị</th>
                            <th scope="col" className="py-3 px-6">Giá vốn</th>
                            <th scope="col" className="py-3 px-6">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="py-4 px-6">{p.code}</td>
                                <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{p.name}</td>
                                <td className="py-4 px-6">{p.category}</td>
                                <td className="py-4 px-6">{p.unit}</td>
                                <td className="py-4 px-6">{p.costPrice.toLocaleString('vi-VN')} ₫</td>
                                <td className="py-4 px-6 flex items-center space-x-3">
                                    <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600" title="Sửa">
                                        <EditIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600" title="Xóa">
                                        <Trash2Icon className="w-5 h-5"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingProduct && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={'id' in editingProduct ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên Sản phẩm</label>
                            <input type="text" name="name" value={editingProduct.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mã sản phẩm</label>
                                <input type="text" name="code" value={editingProduct.code} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại</label>
                                <input type="text" name="category" value={editingProduct.category} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Đơn vị tính</label>
                                <input type="text" name="unit" value={editingProduct.unit} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Giá vốn</label>
                                <input type="number" name="costPrice" value={editingProduct.costPrice} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
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
export default Products;
