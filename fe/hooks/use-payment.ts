import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function usePayment(onSuccess?: () => void) {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VNPAY'>('CASH');
  const [isPaying, setIsPaying] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const openPayment = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsPaymentOpen(true);
  };

  const handlePayment = async () => {
    if (!user?.token || !selectedOrderId) return;
    
    console.log(`[DEBUG] Gửi yêu cầu thanh toán: Đơn #${selectedOrderId}, Phương thức: ${paymentMethod}`);
    
    setIsPaying(true);
    try {
      const resp = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          paymentMethod: paymentMethod,
          paymentStatus: 'PENDING'
        })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(extractErrorMessage(data, "Lỗi tạo hóa đơn thanh toán"));

      console.log("[DEBUG] Kết quả từ Backend:", data);

      if (paymentMethod === 'VNPAY' && data.paymentUrl) {
         console.log("[DEBUG] Đang chuyển hướng đến VNPay...");
         window.location.href = data.paymentUrl;
         return;
      }

      toast.success(paymentMethod === 'CASH' 
        ? "Đã gửi yêu cầu thanh toán bằng tiền mặt. Vui lòng giao dịch với nhân viên tại quầy." 
        : "Đã tạo hóa đơn thanh toán.");
        
      setIsPaymentOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xử lý thanh toán");
    } finally {
      setIsPaying(false);
    }
  };

  return {
    isPaymentOpen,
    setIsPaymentOpen,
    paymentMethod,
    setPaymentMethod,
    isPaying,
    selectedOrderId,
    openPayment,
    handlePayment,
  };
}
