
import React, { useState } from 'react';
import Button from '../components/ui/Button';

interface SheetSelectionProps {
  sheetNames: string[];
  fileName: string;
  onSelect: (sheetName: string) => void;
  onCancel: () => void;
}

const SheetSelection: React.FC<SheetSelectionProps> = ({ sheetNames, fileName, onSelect, onCancel }) => {
  const [selectedSheet, setSelectedSheet] = useState<string>(sheetNames[0]);

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Chọn trang tính</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tệp <span className="font-semibold text-blue-600">{fileName}</span> của bạn có nhiều trang tính. Vui lòng chọn một trang để nhập dữ liệu.
        </p>
        
        <div className="space-y-2">
          {sheetNames.map((name) => (
            <label
              key={name}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                selectedSheet === name ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-500' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <input
                type="radio"
                name="sheet"
                value={name}
                checked={selectedSheet === name}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-3 font-medium text-gray-800 dark:text-gray-200">{name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <Button variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={() => onSelect(selectedSheet)}>
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SheetSelection;
