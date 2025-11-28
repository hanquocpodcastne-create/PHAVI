
import React, { useState, useEffect, useRef } from 'react';
import { ExtractedTransactionData, ExtractedItem, Product } from '../types';
import { useData } from '../contexts/DataContext';
import Button from '../components/ui/Button';
import { SaveIcon, XIcon, PlusCircleIcon, Trash2Icon, FileTextIcon, CheckCircleIcon, AlertTriangleIcon, SearchIcon, InfoIcon } from '../constants';
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

// --- SUB-COMPONENT: SMART DROPDOWN ---
interface SmartProductInputProps {
    value: string;
    onChange: (val: string) => void;
    onSelect: (product: Product) => void;
    products: Product[];
    inventoryLots: any[];
    placeholder?: string;
    disabled?: boolean;
    type: 'name' | 'code';
}

const SmartProductInput: React.FC<SmartProductInputProps> = ({ value, onChange, onSelect, products, inventoryLots, placeholder, disabled, type }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter logic
    const filteredProducts = products.filter(p => {
        const search = value.toLowerCase();
        return p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search);
    }).slice(0, 5); // Limit 5 items

    // Handle Click Outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (product: Product) => {
        onSelect(product);
        setIsOpen(false);
    };

    const calculateStock = (productId: string) => {
        return inventoryLots
            .filter(lot => lot.productId === productId)
            .reduce((sum, lot) => sum + lot.quantity, 0);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input
                type="text"
                value={value}
                onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
                onFocus={() => setIsOpen(true)}
                className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm text-sm dark:text-gray-200 border-b border-transparent hover:border-gray-300 font-medium"
                placeholder={placeholder}
                disabled={disabled}
            />
            {isOpen && !disabled && filteredProducts.length > 0 && (
                <div className="absolute z-50 w-[300px] bg-white dark:bg-gray-800 shadow-xl rounded-md border border-gray-200 dark:border-gray-700 mt-1 max-h-60 overflow-y-auto left-0">
                    {filteredProducts.map((p, index) => {
                        const stock = calculateStock(p.id);
                        return (
                            <div
                                key={p.id}
                                onClick={() => handleSelect(p)}
                                className={`px-4 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors
                                    ${index === highlightedIndex ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">{p.code}</div>
                                        <div className="text-sm text-gray-800 dark:text-gray-200">{p.name}</div>
                                    </div>
                                    <div className="text-xs text-right text-gray-500">
                                        <div>Tồn: <span className="font-semibold text-gray-700 dark:text-gray-300">{stock}</span></div>
                                        <div>{p.unit}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


const ValidationPage: React.FC<ValidationPageProps> = ({ onSuccess, onCancel }) => {
  const { warehouses, suppliers, products, inventoryLots, processValidatedTransaction, addWarehouse, draftTransaction, setDraftTransaction } = useData();
  
  // State chứa dữ liệu đang validate, item có thêm isSelected
  const [data, setData] = useState<Omit<ExtractedTransactionData, 'items'> & { items: ValidatingItem[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for Quick Add Warehouse Modal
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [newWarehouseData, setNewWarehouseData] = useState({ name: '', location: '' });

  // Hàm tìm kiếm sản phẩm tương tự (Ưu tiên Code, sau đó đến Tên)
  const findBestMatchProduct = (rawItem: ExtractedItem): Product | undefined => {
      if (rawItem.productCode) {
          const codeMatch = products.find(p => p.code.toLowerCase() === rawItem.productCode!.toLowerCase());
          if (codeMatch) return codeMatch;
      }
      if (rawItem.productName) {
          const nameMatch = products.find(p => p.name.toLowerCase() === rawItem.productName.toLowerCase());
          if (nameMatch) return nameMatch;
      }
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
        const itemsWithSelection = draftTransaction.data.items.map(item => {
            let matchedName = item.productName;
            let matchedCode = item.productCode;
            let matchedUnit = item.unit;
            let matchedPrice = item.costPrice;

            const existingProduct = findBestMatchProduct(item);
            
            if (existingProduct) {
                matchedName = existingProduct.name;
                matchedCode = existingProduct.code;
                matchedUnit = existingProduct.unit;
                if (existingProduct.costPrice > 0 && (!item.costPrice || item.costPrice === 0)) {
                    matchedPrice = existingProduct.costPrice;
                }
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
    
    // Auto-fill logic when manually typing (basic)
    if (field === 'productCode') {
        const exactProd = products.find(p => p.code.toLowerCase() === value.toLowerCase());
        if (exactProd) {
            item.productName = exactProd.name;
            item.unit = exactProd.unit;
            // Only overwrite price if it's 0 or empty to keep extracted data
            if (!item.costPrice) item.costPrice = exactProd.costPrice;
        }
    }

    newItems[index] = item;
    updateData({ ...data, items: newItems });
  };

  const handleSmartSelect = (index: number, product: Product) => {
      const newItems = [...data.items];
      const item = { ...newItems[index] };
      
      item.productName = product.name;
      item.productCode = product.code;
      item.unit = product.unit;
      if (!item.costPrice) item.costPrice = product.costPrice;

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
  
  // --- HELPER: GET ROW STATUS & STYLES ---
  const getRowStatus = (item: ValidatingItem) => {
      if (!item.isSelected) return 'disabled';

      const existingProduct = products.find(p => p.code.toLowerCase() === (item.productCode || '').toLowerCase());
      
      // 1. Check New Product (Blue)
      if (!existingProduct) return 'new';

      // 2. Check Price Warning (Yellow) - Only for INBOUND
      if (data.type === 'INBOUND' && existingProduct.costPrice > 0 && item.costPrice > 0) {
          const diff = Math.abs((item.costPrice - existingProduct.costPrice) / existingProduct.costPrice);
          if (diff > 0.1) return 'warning'; // > 10% difference
      }

      // 3. Match (Green)
      return 'match';
  };

  const getRowClasses = (status: string) => {
      switch (status) {
          case 'new': return 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500';
          case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500';
          case 'match': return 'bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500';
          case 'disabled': return 'opacity-50 grayscale bg-gray-50 dark:bg-gray-800';
          default: return '';
      }
  };

  const inputClass = "w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm text-sm dark:text-gray-200 border-b border-transparent hover:border-gray-300";

  return (
    <div className="container mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Kiểm tra & Xác nhận Dữ liệu</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Hệ thống đã tự động phân loại. Vui lòng kiểm tra các dòng <span className="text-yellow-600 font-bold">Cảnh báo</span> trước khi lưu.
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
        
        {/* LEGEND - CHÚ THÍCH MÀU SẮC */}
        <div className="flex space-x-4 text-sm px-2">
            <div className="flex items-center"><div className="w-3 h-3 bg-green-100 border-l-2 border-green-500 mr-2"></div> Đã khớp (An toàn)</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-blue-100 border-l-2 border-blue-500 mr-2"></div> Sản phẩm mới</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-yellow-100 border-l-2 border-yellow-500 mr-2"></div> Cần kiểm tra (Lệch giá)</div>
        </div>

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
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-36">Mã SP</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">Tên sản phẩm</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">Số lượng</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">Đơn vị</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">Giá vốn</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">Số lô</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-36">Hạn SD</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.items.map((item, index) => {
                  const status = getRowStatus(item);
                  const existingProduct = products.find(p => p.code === item.productCode);
                  const hasPriceWarning = status === 'warning';
                  
                  return (
                    <tr key={index} className={`transition-colors duration-200 ${getRowClasses(status)}`}>
                      <td className="px-4 py-2 text-center">
                          <input 
                              type="checkbox" 
                              checked={item.isSelected} 
                              onChange={(e) => handleItemChange(index, 'isSelected', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                      </td>
                      <td className="px-4 py-2 relative">
                         <SmartProductInput 
                            type="code"
                            value={item.productCode || ''}
                            onChange={(val) => handleItemChange(index, 'productCode', val)}
                            onSelect={(p) => handleSmartSelect(index, p)}
                            products={products}
                            inventoryLots={inventoryLots}
                            placeholder="Mã SP"
                            disabled={!item.isSelected}
                         />
                      </td>
                      <td className="px-4 py-2 relative">
                         <SmartProductInput 
                            type="name"
                            value={item.productName || ''}
                            onChange={(val) => handleItemChange(index, 'productName', val)}
                            onSelect={(p) => handleSmartSelect(index, p)}
                            products={products}
                            inventoryLots={inventoryLots}
                            placeholder="Tên sản phẩm"
                            disabled={!item.isSelected}
                         />
                         {status === 'new' && item.isSelected && <span className="absolute right-2 top-3 text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Mới</span>}
                      </td>
                      <td className="px-4 py-2">
                          <input type="number" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className={inputClass} disabled={!item.isSelected} />
                      </td>
                      <td className="px-4 py-2">
                          <input type="text" value={item.unit || ''} onChange={e => handleItemChange(index, 'unit', e.target.value)} className={inputClass} disabled={!item.isSelected} />
                      </td>
                      <td className="px-4 py-2 relative">
                          <input type="number" value={item.costPrice || ''} onChange={e => handleItemChange(index, 'costPrice', e.target.value)} className={`${inputClass} ${hasPriceWarning ? 'text-red-600 font-bold' : ''}`} disabled={!item.isSelected} />
                          {hasPriceWarning && (
                            <div className="absolute right-0 top-3 group">
                                <AlertTriangleIcon className="w-4 h-4 text-red-500 cursor-help" />
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 text-white text-xs rounded p-2 hidden group-hover:block z-10 shadow-lg">
                                    Giá cũ: {existingProduct?.costPrice.toLocaleString()} <br/>
                                    Chênh lệch: {existingProduct ? Math.round(((item.costPrice! - existingProduct.costPrice)/existingProduct.costPrice)*100) : 0}%
                                </div>
                            </div>
                          )}
                      </td>
                      <td className="px-4 py-2">
                          <input type="text" value={item.lotNumber || ''} onChange={e => handleItemChange(index, 'lotNumber', e.target.value)} className={inputClass} disabled={!item.isSelected} placeholder={data.type === 'OUTBOUND' ? 'Tự động (FEFO)' : 'Nhập số lô'} />
                      </td>
                      <td className="px-4 py-2">
                          <input type="date" value={item.expiryDate || ''} onChange={e => handleItemChange(index, 'expiryDate', e.target.value)} className={inputClass} disabled={!item.isSelected} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
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
