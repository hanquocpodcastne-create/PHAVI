
import React, { useState, useEffect } from 'react';
import { ExtractedTransactionData, ExtractedItem, Product } from '../types';
import { useData } from '../contexts/DataContext';
import Button from '../components/ui/Button';
import { SaveIcon, XIcon, PlusCircleIcon, Trash2Icon, FileTextIcon, CheckCircleIcon } from '../constants';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

interface ValidationPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Mở rộng kiểu dữ liệu nội bộ để có thêm trường isSelected
interface ValidatingItem extends ExtractedItem {
    isSelected: boolean;
}

const ValidationPage: React.FC<ValidationPageProps> = ({ onSuccess, onCancel }) => {
  const { warehouses, suppliers, products, processValidatedTransaction, addWarehouse, draftTransaction, setDraftTransaction } = useData();
  
  // State chứa dữ liệu đang validate, item có thêm isSelected
  const [data, setData] = useState<Omit<ExtractedTransactionData, 'items'> & { items: ValidatingItem[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for Quick Add Warehouse Modal
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [newWarehouseData, setNewWarehouseData] = useState({ name: '', location: '' });

  // Hàm tìm kiếm sản phẩm tương tự (Ưu tiên Code, sau đó đến Tên)
  const findBestMatchProduct = (rawItem: ExtractedItem): Product | undefined => {
      // 1. Tìm chính xác code 
      if (rawItem.productCode) {
          const codeMatch = products.find(p => p.code.toLowerCase() === rawItem.productCode!.toLowerCase());
          if (codeMatch) return codeMatch;
      }

      // 2. Tìm chính xác tên
      if (rawItem.productName) {
          const nameMatch = products.find(p => p.name.toLowerCase() === rawItem.productName.toLowerCase());
          if (nameMatch) return nameMatch;
      }
      
      // 3. Tìm tương đối theo tên
      if (rawItem.productName) {
          const normalizedRaw = rawItem.productName.toLowerCase();
          return products.find(p => {
              const pName = p.name.toLowerCase();
              return pName.includes(normalizedRaw) || normalizedRaw.includes(pName);
          });
      }
      
      return undefined;
  };

  // Sync with context & Auto-map products
  useEffect(() => {
    if (draftTransaction) {
        // Tự động chuẩn hóa dữ liệu khi load
        const itemsWithSelection = draftTransaction.data.items.map(item => {
            let matchedName = item.productName;
            let matchedCode = item.productCode;
            let matchedUnit = item.unit;
            let matchedPrice = item.costPrice;

            // Thử tìm sản phẩm đã tồn tại trong hệ thống
            const existingProduct = findBestMatchProduct(item);
            
            if (existingProduct) {
                matchedName = existingProduct.name; // Dùng tên chuẩn trong hệ thống
                matchedCode = existingProduct.code; // Tự điền mã
                matchedUnit = existingProduct.unit; // Tự điền đơn vị
                if (existingProduct.costPrice > 0) matchedPrice = existingProduct.costPrice;
            }

            return {
                ...item,
                productName: matchedName,
                productCode: matchedCode || item.productCode,
                unit: matchedUnit,
                costPrice: matchedPrice,
                isSelected: true
            };
        });
        
        setData({ ...draftTransaction.data, items: itemsWithSelection });
    }
  }, [draftTransaction, products]);

  // Handle data updates
  const updateData = (newData: any) => {
      setData(newData);
  };

  if (!data) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  // Xử lý list kho/nhà cung cấp tạm thời cho dropdown
  const allWarehouses = [...warehouses];
  if (data.warehouseName && !warehouses.some(w => w.name === data.warehouseName)) {
    allWarehouses.push({ id: `new-${data.warehouseName}`, name: data.warehouseName, location: '(Mới)' });
  }
  const allSuppliers = [...suppliers];
  if (data.supplierName && !suppliers.some(s => s.name === data.supplierName)) {
    allSuppliers.push({ id: `new-${data.supplierName}`, name: data.supplierName, contact: '(Mới)' });
  }

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateData({ ...data, [e.target.name]: e.target.value });
  };
  
  const handleItemChange = (index: number, field: keyof ValidatingItem, value: any) => {
    const newItems = [...data.items];
    const item: any = { ...newItems[index] };
    item[field] = value; 
    
    // LOGIC AUTO-FILL HAI CHIỀU:
    
    // 1. Nếu sửa Tên -> Tìm mã và điền các thông tin khác
    if (field === 'productName') {
        const exactProd = products.find(p => p.name === value); // Match chính xác trong datalist
        if (exactProd) {
            item.productCode = exactProd.code;
            item.unit = exactProd.unit;
            if (exactProd.costPrice > 0) item.costPrice = exactProd.costPrice;
        }
    }

    // 2. Nếu sửa Mã -> Tìm tên và điền các thông tin khác
    if (field === 'productCode') {
        const exactProdByCode = products.find(p => p.code.toLowerCase() === value.toLowerCase());
        if (exactProdByCode) {
            item.productName = exactProdByCode.name;
            item.unit = exactProdByCode.unit;
             if (exactProdByCode.costPrice > 0) item.costPrice = exactProdByCode.costPrice;
        }
    }

    newItems[index] = item;
    updateData({ ...data, items: newItems });
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      const newItems = data.items.map(item => ({ ...item, isSelected: checked }));
      updateData({ ...data, items: newItems });
  }

  const addItem = () => {
    const newItem: ValidatingItem = {
      productCode: '',
      productName: '',
      quantity: 0,
      unit: '',
      costPrice: 0,
      lotNumber: '',
      expiryDate: '',
      isSelected: true
    };
    updateData({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index);
    updateData({ ...data, items: newItems });
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    
    // Chỉ lấy những dòng được chọn
    const selectedItems = data.items.filter(i => i.isSelected);

    if (selectedItems.length === 0) {
        alert("Vui lòng chọn ít nhất một sản phẩm để lưu.");
        setIsProcessing(false);
        return;
    }

    const cleanData: ExtractedTransactionData = {
        ...data,
        items: selectedItems.map(({ isSelected, ...rest }) => ({
            ...rest,
            quantity: Number(rest.quantity) || 0,
            costPrice: Number(rest.costPrice) || 0
        }))
    };

    if (!cleanData.warehouseName) {
        alert("Vui lòng chọn kho hàng.");
        setIsProcessing(false);
        return;
    }
    if (cleanData.items.some(item => !item.productName || item.quantity <= 0)) {
        alert("Vui lòng kiểm tra lại danh sách sản phẩm. Tên sản phẩm và số lượng > 0 là bắt buộc.");
        setIsProcessing(false);
        return;
    }

    try {
        processValidatedTransaction(cleanData);
        onSuccess();
    } catch (error: any) {
        alert(`${error.message}`);
        setIsProcessing(false);
    }
  };

  // Logic Quick Add Warehouse
  const handleQuickAddWarehouse = () => {
    if (!newWarehouseData.name) {
      alert("Vui lòng nhập tên kho.");
      return;
    }
    addWarehouse(newWarehouseData);
    updateData({ ...data, warehouseName: newWarehouseData.name });
    setIsWarehouseModalOpen(false);
    setNewWarehouseData({ name: '', location: '' });
  };
  
  const inputClass = "w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm text-sm dark:text-gray-200 border-b border-transparent hover:border-gray-300";

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Kiểm tra & Xác nhận Dữ liệu</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Hệ thống sẽ tự động tìm kiếm sản phẩm theo Mã hoặc Tên. Mã sản phẩm là thông tin định danh ưu tiên.
        </p>
      </div>

      <div className="space-y-6">
        <Card title="Thông tin chung" icon={<FileTextIcon className="w-6 h-6"/>}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại giao dịch</label>
              <select name="type" value={data.type} onChange={handleHeaderChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="INBOUND">Nhập kho</option>
                <option value="OUTBOUND">Xuất kho</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mã phiếu</label>
              <input type="text" name="documentId" value={data.documentId || ''} onChange={handleHeaderChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày</label>
              <input type="date" name="date" value={data.date || ''} onChange={handleHeaderChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kho hàng</label>
              <div className="flex mt-1 space-x-2">
                <select 
                  name="warehouseName" 
                  value={data.warehouseName || ''} 
                  onChange={handleHeaderChange} 
                  className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">-- Chọn kho --</option>
                  {allWarehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
                <button 
                  onClick={() => setIsWarehouseModalOpen(true)}
                  className="flex-shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300 p-2 rounded-md transition-colors"
                  title="Tạo kho mới"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Đối tác (NCC/Khách hàng)</label>
               <select name="supplierName" value={data.supplierName || ''} onChange={handleHeaderChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                 <option value="">-- Chọn đối tác --</option>
                {allSuppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Datalist cho gợi ý sản phẩm và mã */}
        <datalist id="products-name-list">
            {products.map(p => (
                <option key={p.id} value={p.name}>{p.code ? `(${p.code})` : ''}</option>
            ))}
        </datalist>
        <datalist id="products-code-list">
            {products.map(p => (
                <option key={p.id} value={p.code}>{p.name}</option>
            ))}
        </datalist>

        <Card title="Chi tiết Sản phẩm" icon={<CheckCircleIcon className="w-6 h-6"/>}>
          <div className="overflow-x-auto -mx-6">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-center w-12">
                      <input 
                        type="checkbox" 
                        onChange={toggleSelectAll}
                        checked={data.items.every(i => i.isSelected) && data.items.length > 0}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">Mã SP</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">Tên sản phẩm</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">Số lượng</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">Đơn vị</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">Giá vốn</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">Số lô</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-36">Hạn SD</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.items.map((item, index) => (
                  <tr key={index} className={item.isSelected ? 'bg-blue-50/20 dark:bg-blue-900/10' : 'opacity-50'}>
                    <td className="px-4 py-1 text-center">
                        <input 
                            type="checkbox" 
                            checked={item.isSelected} 
                            onChange={(e) => handleItemChange(index, 'isSelected', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                    </td>
                    <td className="px-4 py-1">
                        <input 
                            type="text" 
                            list="products-code-list"
                            value={item.productCode || ''} 
                            onChange={e => handleItemChange(index, 'productCode', e.target.value)} 
                            className={`${inputClass} font-mono font-medium text-blue-600 dark:text-blue-400`}
                            disabled={!item.isSelected} 
                            placeholder="Mã SP" 
                        />
                    </td>
                    <td className="px-4 py-1">
                        <input 
                            type="text" 
                            list="products-name-list" 
                            value={item.productName || ''} 
                            onChange={e => handleItemChange(index, 'productName', e.target.value)} 
                            className={`${inputClass} font-medium`} 
                            disabled={!item.isSelected} 
                            placeholder="Nhập tên..." 
                        />
                    </td>
                    <td className="px-4 py-1">
                        <input type="number" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className={inputClass} disabled={!item.isSelected} />
                    </td>
                    <td className="px-4 py-1">
                        <input type="text" value={item.unit || ''} onChange={e => handleItemChange(index, 'unit', e.target.value)} className={inputClass} disabled={!item.isSelected} />
                    </td>
                    <td className="px-4 py-1">
                        <input type="number" value={item.costPrice || ''} onChange={e => handleItemChange(index, 'costPrice', e.target.value)} className={inputClass} disabled={!item.isSelected} />
                    </td>
                    <td className="px-4 py-1">
                        <input type="text" value={item.lotNumber || ''} onChange={e => handleItemChange(index, 'lotNumber', e.target.value)} className={inputClass} disabled={!item.isSelected} placeholder={data.type === 'OUTBOUND' ? 'Tự động (FEFO)' : 'Nhập số lô'} />
                    </td>
                    <td className="px-4 py-1">
                        <input type="date" value={item.expiryDate || ''} onChange={e => handleItemChange(index, 'expiryDate', e.target.value)} className={inputClass} disabled={!item.isSelected} />
                    </td>
                    <td className="px-4 py-1 text-right">
                      <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button onClick={addItem} variant="secondary" size="sm" leftIcon={<PlusCircleIcon className="w-4 h-4" />}>
              Thêm dòng
            </Button>
          </div>
        </Card>

        <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
          <Button onClick={onCancel} variant="secondary" disabled={isProcessing} leftIcon={<XIcon className="w-5 h-5"/>}>
            Hủy & Xóa
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing} leftIcon={<SaveIcon className="w-5 h-5"/>}>
            {isProcessing ? 'Đang xử lý...' : `Lưu (${data.items.filter(i => i.isSelected).length} mục)`}
          </Button>
        </div>
      </div>

      {/* Modal tạo kho nhanh */}
      <Modal 
        isOpen={isWarehouseModalOpen} 
        onClose={() => setIsWarehouseModalOpen(false)} 
        title="Thêm nhanh Kho hàng"
      >
        <div className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên Kho hàng <span className="text-red-500">*</span></label>
             <input 
               type="text" 
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
               placeholder="Ví dụ: Kho Tổng, Kho Lạnh..."
               value={newWarehouseData.name}
               onChange={(e) => setNewWarehouseData({...newWarehouseData, name: e.target.value})}
               autoFocus
             />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Địa điểm</label>
             <input 
               type="text" 
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
               placeholder="Ví dụ: Hà Nội, TP.HCM..."
               value={newWarehouseData.location}
               onChange={(e) => setNewWarehouseData({...newWarehouseData, location: e.target.value})}
             />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
            <Button onClick={() => setIsWarehouseModalOpen(false)} variant="secondary" leftIcon={<XIcon className="w-4 h-4"/>}>Hủy</Button>
            <Button onClick={handleQuickAddWarehouse} leftIcon={<SaveIcon className="w-4 h-4"/>}>Tạo & Chọn</Button>
        </div>
      </Modal>

    </div>
  );
};

export default ValidationPage;
