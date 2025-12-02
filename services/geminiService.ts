import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedTransactionData } from '../types';

// Chuyển đổi file ảnh sang base64 để gửi cho AI
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const schema: any = {
    type: Type.OBJECT,
    properties: {
        type: { 
            type: Type.STRING, 
            description: "Loại giao dịch, 'INBOUND' (Nhập) hoặc 'OUTBOUND' (Xuất)."
        },
        documentId: { 
            type: Type.STRING, 
            description: 'Mã số phiếu.' 
        },
        date: { 
            type: Type.STRING, 
            description: 'Ngày chứng từ, định dạng YYYY-MM-DD.' 
        },
        warehouseName: { 
            type: Type.STRING, 
            description: 'Tên kho hàng.' 
        },
        supplierName: { 
            type: Type.STRING, 
            description: 'Tên đối tác (Nhà cung cấp hoặc Khách hàng).' 
        },
        items: {
            type: Type.ARRAY,
            description: 'Chi tiết sản phẩm.',
            items: {
                type: Type.OBJECT,
                properties: {
                    productCode: { type: Type.STRING, description: 'Mã hàng.' },
                    productName: { type: Type.STRING, description: 'Tên hàng hóa.' },
                    quantity: { type: Type.NUMBER, description: 'Số lượng thực tế.' },
                    unit: { type: Type.STRING, description: 'Đơn vị tính.' },
                    costPrice: { type: Type.NUMBER, description: 'Đơn giá (chỉ lấy số, không lấy dấu phẩy).' },
                    lotNumber: { type: Type.STRING, description: 'Số lô (nếu có).' },
                    expiryDate: { type: Type.STRING, description: 'Hạn dùng, định dạng YYYY-MM-DD.' },
                },
                required: ['productName', 'quantity']
            }
        }
    },
    required: ['type', 'items']
};

export type UploadMode = 'inbound' | 'outbound' | 'general';

export const extractDataFromImage = async (file: File, mode: UploadMode = 'general'): Promise<ExtractedTransactionData> => {
    // Initialization: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    // Assume process.env.API_KEY is pre-configured and valid.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = await fileToGenerativePart(file);

    let systemInstruction = "";
    
    // 3 BỘ NÃO AI ĐỘC LẬP (Prompts)
    const baseRules = `
    QUY TẮC CHUNG QUAN TRỌNG:
    1. **Ngày tháng**: Tìm ngày chứng từ (thường DD/MM/YYYY) và CHUYỂN ĐỔI NGAY sang chuẩn ISO: **YYYY-MM-DD**. Ví dụ: "15/10/2025" -> "2025-10-15".
    2. **Con số**: Loại bỏ dấu phân cách hàng nghìn. "100.000" -> 100000. Dấu phẩy thập phân -> dấu chấm.
    3. **Tên hàng**: Lấy đầy đủ tên và quy cách.
    `;

    if (mode === 'inbound') {
        systemInstruction = `Bạn là Chuyên gia Xử lý Phiếu NHẬP Kho. 
        Nhiệm vụ: Chỉ trích xuất thông tin hàng NHẬP vào kho.
        ${baseRules}
        
        QUY TẮC RIÊNG CHO PHIẾU NHẬP:
        - BẮT BUỘC gán trường 'type' là "INBOUND".
        - 'supplierName': Là tên Nhà cung cấp hoặc người giao hàng.
        - Bỏ qua các dòng phí vận chuyển, thuế, chiết khấu, chỉ lấy danh sách hàng hóa thực tế nhập kho.
        `;
    } else if (mode === 'outbound') {
        systemInstruction = `Bạn là Chuyên gia Xử lý Phiếu XUẤT Kho.
        Nhiệm vụ: Chỉ trích xuất thông tin hàng XUẤT ra khỏi kho.
        ${baseRules}
        
        QUY TẮC RIÊNG CHO PHIẾU XUẤT:
        - BẮT BUỘC gán trường 'type' là "OUTBOUND".
        - 'supplierName': Là tên Khách hàng hoặc đơn vị nhận hàng.
        - Chỉ lấy hàng hóa vật lý, không lấy dịch vụ.
        `;
    } else {
        // GENERAL
        systemInstruction = `Bạn là Chuyên gia Phân tích Tài liệu Kho Tổng hợp.
        Nhiệm vụ: Đọc hiểu tài liệu, tự xác định đây là phiếu Nhập hay Xuất và trích xuất toàn bộ thông tin chi tiết.
        ${baseRules}
        
        QUY TẮC RIÊNG:
        - Đọc tiêu đề hoặc ngữ cảnh để xác định 'type': Nếu Nhập/Mua -> "INBOUND", Nếu Xuất/Bán -> "OUTBOUND".
        - Trích xuất MỌI dòng hàng hóa có số lượng.
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: "Hãy phân tích hình ảnh này theo hướng dẫn hệ thống." }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema,
                temperature: 0.1,
            },
        });
        
        const jsonText = response.text.trim();
        const extractedData = JSON.parse(jsonText);
        
        // Validate dữ liệu cơ bản
        if (!extractedData.type || !Array.isArray(extractedData.items)) {
            throw new Error("Cấu trúc dữ liệu không hợp lệ.");
        }

        return extractedData as ExtractedTransactionData;

    } catch (error) {
        console.error("Lỗi Gemini API:", error);
        throw new Error("Không thể đọc dữ liệu từ ảnh. Vui lòng thử lại hoặc chụp rõ nét hơn.");
    }
};