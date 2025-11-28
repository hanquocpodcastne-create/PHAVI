
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, Warehouse, Supplier, InventoryLot, Transaction, ExtractedTransactionData } from '../types';

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}


interface DataContextType {
    products: Product[];
    warehouses: Warehouse[];
    suppliers: Supplier[];
    inventoryLots: InventoryLot[];
    transactions: Transaction[];
    
    // Bộ nhớ phụ cho dữ liệu nháp
    draftTransaction: { data: ExtractedTransactionData, fileName: string } | null;
    setDraftTransaction: (data: { data: ExtractedTransactionData, fileName: string } | null) => void;

    addProduct: (product: Omit<Product, 'id'>) => Product;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;
    addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => Warehouse;
    updateWarehouse: (warehouse: Warehouse) => void;
    deleteWarehouse: (warehouseId: string) => void;
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (supplierId: string) => void;
    updateInventoryLot: (lot: InventoryLot) => void;
    deleteInventoryLot: (lotId: string) => void;
    deleteTransaction: (transactionId: string) => void;
    processValidatedTransaction: (data: ExtractedTransactionData) => void;
    resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useLocalStorage<Product[]>('products', []);
    const [warehouses, setWarehouses] = useLocalStorage<Warehouse[]>('warehouses', []);
    const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
    const [inventoryLots, setInventoryLots] = useLocalStorage<InventoryLot[]>('inventoryLots', []);
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
    
    // Bộ nhớ phụ lưu dữ liệu đang làm dở
    const [draftTransaction, setDraftTransaction] = useLocalStorage<{ data: ExtractedTransactionData, fileName: string } | null>('draftTransaction', null);

    const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const addProduct = (productData: Omit<Product, 'id'>): Product => {
        const newProduct: Product = { ...productData, id: generateId('prod') };
        setProducts(prev => [...prev, newProduct]);
        return newProduct;
    };

    const updateProduct = (updatedProduct: Product) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

    const deleteProduct = (productId: string) => {
        const hasInventory = inventoryLots.some(lot => lot.productId === productId);
        if (hasInventory) {
            alert("Không thể xóa sản phẩm vì vẫn còn tồn kho. Vui lòng xử lý hết tồn kho trước khi xóa.");
            return;
        }
        if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này?')) {
            setProducts(prev => prev.filter(p => p.id !== productId));
        }
    };

    const addWarehouse = (warehouseData: Omit<Warehouse, 'id'>): Warehouse => {
        const newWarehouse: Warehouse = { ...warehouseData, id: generateId('wh') };
        setWarehouses(prev => [...prev, newWarehouse]);
        return newWarehouse;
    };

    const updateWarehouse = (updatedWarehouse: Warehouse) => {
        setWarehouses(prev => prev.map(w => w.id === updatedWarehouse.id ? updatedWarehouse : w));
    };

    const deleteWarehouse = (warehouseId: string) => {
        setWarehouses(prev => prev.filter(w => w.id !== warehouseId));
    };
    
    const addSupplier = (supplierData: Omit<Supplier, 'id'>): Supplier => {
        const newSupplier: Supplier = { ...supplierData, id: generateId('sup') };
        setSuppliers(prev => [...prev, newSupplier]);
        return newSupplier;
    };

    const updateSupplier = (updatedSupplier: Supplier) => {
        setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    };

    const deleteSupplier = (supplierId: string) => {
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    };

    const updateInventoryLot = (updatedLot: InventoryLot) => {
        setInventoryLots(prev => prev.map(lot => lot.id === updatedLot.id ? updatedLot : lot));
    };

    const deleteInventoryLot = (lotId: string) => {
        setInventoryLots(prev => prev.filter(lot => lot.id !== lotId));
    };

    const deleteTransaction = (transactionId: string) => {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
    };

    const resetData = () => {
        setProducts([]);
        setWarehouses([]);
        setSuppliers([]);
        setInventoryLots([]);
        setTransactions([]);
        setDraftTransaction(null);
        window.localStorage.clear(); // Xóa sạch để đảm bảo
    };
    
    const processValidatedTransaction = (data: ExtractedTransactionData) => {
        // 1. Kiểm tra Dữ liệu chung
        let warehouse = warehouses.find(w => w.name.toLowerCase() === data.warehouseName?.toLowerCase());
        if (!warehouse && data.warehouseName) {
            warehouse = addWarehouse({ name: data.warehouseName, location: 'Chưa xác định' });
        }
        if(!warehouse) {
             throw new Error("Vui lòng chọn kho hàng.");
        }

        if (data.type === 'INBOUND' && data.supplierName) {
            let supplier = suppliers.find(s => s.name.toLowerCase() === data.supplierName?.toLowerCase());
            if (!supplier) {
                addSupplier({ name: data.supplierName, contact: 'Chưa xác định' });
            }
        }
        
        // 2. Pre-validation (Kiểm tra tồn kho trước khi xử lý)
        if (data.type === 'OUTBOUND') {
             const insufficientItems: string[] = [];
             
             data.items.forEach(item => {
                 // Tìm sản phẩm tương ứng: ƯU TIÊN THEO CODE
                 let product: Product | undefined;

                 if (item.productCode) {
                     product = products.find(p => p.code.toLowerCase() === item.productCode!.toLowerCase());
                 }
                 if (!product) {
                     product = products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
                 }
                 
                 if (!product) {
                     insufficientItems.push(`- ${item.productName}: Sản phẩm chưa tồn tại trong hệ thống.`);
                     return;
                 }
                 
                 // Lấy tồn kho hiện tại của sản phẩm ở kho này
                 let availableStock = 0;

                 if (item.lotNumber && item.lotNumber.trim() !== '') {
                    availableStock = inventoryLots
                        .filter(lot => lot.productId === product!.id && lot.warehouseId === warehouse!.id && lot.lotNumber === item.lotNumber)
                        .reduce((sum, lot) => sum + lot.quantity, 0);
                    
                    if (availableStock < item.quantity) {
                         insufficientItems.push(`- ${product.name} (Lô ${item.lotNumber}): Cần ${item.quantity}, chỉ còn ${availableStock} trong lô này.`);
                    }
                 } else {
                    availableStock = inventoryLots
                        .filter(lot => lot.productId === product!.id && lot.warehouseId === warehouse!.id)
                        .reduce((sum, lot) => sum + lot.quantity, 0);
                    
                    if (availableStock < item.quantity) {
                        insufficientItems.push(`- ${product.name}: Cần ${item.quantity}, tổng tồn kho chỉ còn ${availableStock}.`);
                    }
                 }
             });

             if (insufficientItems.length > 0) {
                 throw new Error("Lỗi Tồn kho:\n" + insufficientItems.join("\n"));
             }
        }


        // 3. Xử lý chính thức
        const newTransactions: Transaction[] = [];
        let updatedLots: InventoryLot[] = JSON.parse(JSON.stringify(inventoryLots));
        let currentProducts = [...products];
        let productsChanged = false;
        
        // Map tạm để theo dõi các sản phẩm mới được tạo ngay trong lô này (tránh tạo trùng khi upload 1 file có nhiều dòng cùng 1 mã mới)
        const batchProductMap = new Map<string, Product>();

        for (const item of data.items) {
            // Tìm sản phẩm: Ưu tiên CODE
            let product: Product | undefined;

            // B1: Tìm trong DB hiện tại
            if (item.productCode) {
                product = currentProducts.find(p => p.code && p.code.toLowerCase() === item.productCode!.toLowerCase());
            }
            if (!product) {
                product = currentProducts.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
            }

            // B2: Tìm trong batch đang xử lý (nếu vừa tạo mới ở dòng trên)
            if (!product && item.productCode && batchProductMap.has(item.productCode)) {
                product = batchProductMap.get(item.productCode);
            }

            // Nếu vẫn chưa có thì tạo mới
            if (!product) {
                const newProdId = generateId('prod');
                product = {
                    id: newProdId,
                    name: item.productName || 'Sản phẩm không tên',
                    code: item.productCode || `SP-${Date.now()}-${Math.floor(Math.random()*100)}`, // Đảm bảo code unique
                    category: 'Chưa phân loại',
                    unit: item.unit || 'cái',
                    costPrice: item.costPrice || 0
                };
                currentProducts.push(product);
                if (item.productCode) {
                    batchProductMap.set(item.productCode, product);
                }
                productsChanged = true;
            }
            
            if (data.type === 'INBOUND') {
                 const newLot: InventoryLot = {
                    id: generateId('lot'),
                    productId: product.id,
                    warehouseId: warehouse!.id,
                    quantity: item.quantity,
                    lotNumber: item.lotNumber,
                    expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : undefined
                };
                updatedLots.push(newLot);
            } else { // OUTBOUND
                let remainingQtyToDecrement = item.quantity;
                
                let productLotsInWarehouse = updatedLots
                    .filter(lot => lot.productId === product!.id && lot.warehouseId === warehouse!.id && lot.quantity > 0);
                
                if (item.lotNumber && item.lotNumber.trim() !== '') {
                    const specificLots = productLotsInWarehouse.filter(l => l.lotNumber === item.lotNumber);
                    if (specificLots.length > 0) {
                        productLotsInWarehouse = specificLots;
                    } 
                }

                productLotsInWarehouse.sort((a,b) => new Date(a.expiryDate || '9999-12-31').getTime() - new Date(b.expiryDate || '9999-12-31').getTime()); 
                
                for(const lot of productLotsInWarehouse) {
                    if (remainingQtyToDecrement <= 0) break;
                    const qtyToTake = Math.min(lot.quantity, remainingQtyToDecrement);
                    
                    lot.quantity -= qtyToTake;
                    remainingQtyToDecrement -= qtyToTake;
                }
            }

            const newTransaction: Transaction = {
                id: generateId('trans'),
                type: data.type,
                productId: product.id,
                warehouseId: warehouse!.id,
                quantity: item.quantity,
                date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
                documentId: data.documentId,
                relatedPartyName: data.supplierName
            };
            newTransactions.push(newTransaction);
        }

        if (productsChanged) {
            setProducts(currentProducts);
        }
        setTransactions(prev => [...prev, ...newTransactions]);
        setInventoryLots(updatedLots.filter(lot => lot.quantity > 0));
        setDraftTransaction(null);
    };

    const value = {
        products,
        warehouses,
        suppliers,
        inventoryLots,
        transactions,
        draftTransaction,
        setDraftTransaction,
        addProduct,
        updateProduct,
        deleteProduct,
        addWarehouse,
        updateWarehouse,
        deleteWarehouse,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        updateInventoryLot,
        deleteInventoryLot,
        deleteTransaction,
        processValidatedTransaction,
        resetData
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
