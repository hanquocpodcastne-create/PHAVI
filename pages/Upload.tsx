
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { extractDataFromImage, UploadMode } from '../services/geminiService';
import { useData } from '../contexts/DataContext';
import { UploadIcon, FileTextIcon, XIcon, CheckCircleIcon, AlertTriangleIcon, FileUpIcon, LogOutIcon, ListIcon } from '../constants';
import Button from '../components/ui/Button';

interface UploadPageProps {
  onSuccess: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

const UploadPage: React.FC<UploadPageProps> = ({ onSuccess }) => {
  const { setDraftTransaction, draftTransaction } = useData();
  
  // Tự động chuyển trang nếu có draft
  useEffect(() => {
    if (draftTransaction) {
        onSuccess();
    }
  }, [draftTransaction, onSuccess]);

  // Component con cho từng thẻ Upload
  const UploadCard = ({ mode, title, description, icon, colorClass }: { mode: UploadMode, title: string, description: string, icon: React.ReactNode, colorClass: string }) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setStatus('idle');
        setError(null);
      }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: { 'image/jpeg': [], 'image/png': [], 'application/pdf': [] },
      maxFiles: 1,
      multiple: false,
    });

    const handleProcess = async () => {
      if (!file) return;
      setStatus('uploading');
      setError(null);
      try {
        setStatus('processing');
        // Gửi mode tương ứng vào service
        const extractedData = await extractDataFromImage(file, mode);
        
        setDraftTransaction({
          data: extractedData,
          fileName: file.name
        });
        
        setStatus('success');
        setTimeout(() => onSuccess(), 500);
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Lỗi không xác định.');
      }
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setStatus('idle');
        setError(null);
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-t-4 ${colorClass} p-6 flex flex-col h-full transition-transform hover:-translate-y-1`}>
            <div className="flex items-center mb-4">
                <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('border-', 'bg-').replace('text-', 'text-')} mr-4`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>

            <div className="flex-1">
                {!file ? (
                    <div 
                        {...getRootProps()} 
                        className={`h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
                            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
                    >
                        <input {...getInputProps()} />
                        <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 text-center px-4">Kéo thả hoặc nhấn để chọn</p>
                    </div>
                ) : (
                    <div className="h-40 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 relative flex flex-col items-center justify-center">
                        <button onClick={removeFile} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                            <XIcon className="w-5 h-5" />
                        </button>
                        
                        {status === 'idle' && <FileTextIcon className="w-10 h-10 text-blue-500 mb-2" />}
                        {status === 'uploading' && <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>}
                        {status === 'processing' && <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>}
                        {status === 'success' && <CheckCircleIcon className="w-10 h-10 text-green-500 mb-2" />}
                        {status === 'error' && <AlertTriangleIcon className="w-10 h-10 text-red-500 mb-2" />}

                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-full px-2">{file.name}</p>
                        
                        {status === 'error' && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
                        {status === 'processing' && <p className="text-xs text-purple-500 mt-1 animate-pulse">AI đang phân tích...</p>}
                    </div>
                )}
            </div>

            <div className="mt-4">
                <Button 
                    onClick={handleProcess} 
                    disabled={!file || status === 'uploading' || status === 'processing'}
                    className={`w-full ${status === 'success' ? 'bg-green-600' : ''}`}
                    size="sm"
                >
                    {status === 'idle' ? 'Bắt đầu xử lý' : status === 'success' ? 'Hoàn tất' : 'Đang xử lý...'}
                </Button>
            </div>
        </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Trung tâm Xử lý Chứng từ</h1>
            <p className="text-gray-500 dark:text-gray-400">Chọn loại phiếu bạn muốn xử lý để AI hoạt động chính xác nhất</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <UploadCard 
                mode="inbound"
                title="Phiếu Nhập Kho" 
                description="AI chuyên biệt cho dữ liệu nhập hàng"
                icon={<FileUpIcon className="w-8 h-8 text-green-600"/>}
                colorClass="border-green-500"
            />
            
            <UploadCard 
                mode="outbound"
                title="Phiếu Xuất Kho" 
                description="AI chuyên biệt cho dữ liệu xuất kho"
                icon={<LogOutIcon className="w-8 h-8 text-red-600"/>}
                colorClass="border-red-500"
            />
            
            <UploadCard 
                mode="general"
                title="File Tổng Hợp" 
                description="Phân tích toàn diện & Chọn lọc dữ liệu"
                icon={<ListIcon className="w-8 h-8 text-blue-600"/>}
                colorClass="border-blue-500"
            />
        </div>
    </div>
  );
};

export default UploadPage;
