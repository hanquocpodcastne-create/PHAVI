
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Product } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { EditIcon, Trash2Icon, PlusCircleIcon, SaveIcon, XIcon, SearchIcon } from '../constants';

const Products: React.FC = () => {
    const { products, inventoryLots, addProduct, updateProduct, deleteProduct } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | Omit<Product, 'id'> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- LOGIC TÍNH TOÁN & LỌC ---
    const filteredProducts = useMemo(() => {
        return products.map(product => {
            // Tính tổng tồn kho cho sản phẩm này
            const totalStock = inventoryLots
                .filter(lot => lot.productId === product.id)
                .reduce((sum, lot) => sum + lot.quantity, 0);
            return { ...product, totalStock };
        }).filter(product => {
            const term = searchTerm.toLowerCase();
            return (
                product.name.toLowerCase().includes(term) ||
                product.code.toLowerCase().includes(term) ||
                product.category.toLowerCase().includes(term)
            );
        });
    }, [products, inventoryLots, searchTerm]);

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

    // Helper render trạng thái tồn kho
    const renderStockStatus = (quantity: number) => {
        if (quantity === 0) {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Hết hàng</span>;
        }
        if (quantity <= 10) { // Ngưỡng cảnh báo, có thể cấu hình sau này
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Sắp hết</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">An toàn</span>;
    };

    return (
        <>
            {/* TOOLBAR: SEARCH & ADD */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo Tên, Mã, Phân loại..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => openModal()} leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>Thêm Sản phẩm</Button>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="py-3 px-6">Mã SP</th>
                            <th scope="col" className="py-3 px-6">Tên sản phẩm</th>
                            <th scope="col" className="py-3 px-6">Phân loại</th>
                            <th scope="col" className="py-3 px-6 text-center">Trạng thái</th>
                            <th scope="col" className="py-3 px-6 text-right">Tồn kho</th>
                            <th scope="col" className="py-3 px-6 text-right">Giá vốn</th>
                            <th scope="col" className="py-3 px-6 text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(p => (
                                <tr key={p.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                    <td className="py-4 px-6 font-mono text-xs">{p.code}</td>
                                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{p.name}</td>
                                    <td className="py-4 px-6">
                                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                                            {p.category}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        {renderStockStatus(p.totalStock)}
                                    </td>
                                    <td className="py-4 px-6 text-right font-bold text-gray-700 dark:text-gray-200">
                                        {p.totalStock.toLocaleString('vi-VN')} <span className="text-xs font-normal text-gray-500">{p.unit}</span>
                                    </td>
                                    <td className="py-4 px-6 text-right">{p.costPrice.toLocaleString('vi-VN')} ₫</td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center space-x-3">
                                            <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-600 transition-colors" title="Sửa">
                                                <EditIcon className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600 transition-colors" title="Xóa">
                                                <Trash2Icon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-400">
                                    Không tìm thấy sản phẩm nào phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {editingProduct && (
                <Modal isOpen={isModalOpen} onClose={closeModal} title={'id' in editingProduct ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên Sản phẩm <span className="text-red-500">*</span></label>
                            <input type="text" name="name" value={editingProduct.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" placeholder="Nhập tên sản phẩm..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mã sản phẩm</label>
                                <input type="text" name="code" value={editingProduct.code} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" placeholder="SP001..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phân loại</label>
                                <input type="text" name="category" value={editingProduct.category} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" placeholder="Điện tử, Gia dụng..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Đơn vị tính</label>
                                <input type="text" name="unit" value={editingProduct.unit} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" placeholder="Cái, Hộp..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Giá vốn (VNĐ)</label>
                                <input type="number" name="costPrice" value={editingProduct.costPrice} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" />
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
