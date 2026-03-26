"use client";

import { useEffect } from "react";
import { formatVnd } from "@/lib/utils";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Clock, 
  CreditCard, 
  Banknote, 
  RefreshCw,
  ReceiptText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInvoices } from "@/hooks/use-invoices";

interface OrderManagementProps {
  token: string | undefined;
}

export default function OrderManagement({ token }: OrderManagementProps) {
  const { 
    invoices, 
    isLoading, 
    isProcessing, 
    fetchInvoices, 
    handleComplete,
    handleReject 
  } = useInvoices(token);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <ReceiptText className="h-6 w-6 text-primary" />
            Quản lý đơn hàng & Thanh toán
          </h2>
          <p className="text-sm text-muted-foreground italic">
            Theo dõi và phê duyệt các yêu cầu thanh toán thời gian thực
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchInvoices} 
          disabled={isLoading}
          className="rounded-xl font-bold gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Làm mới
        </Button>
      </div>

      {isLoading && invoices.length === 0 ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
           <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
           <p className="text-slate-400 font-bold italic tracking-wider">Đang kết nối hệ thống...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
           <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
             <CheckCircle2 className="h-10 w-10" />
           </div>
           <p className="text-emerald-800 font-black text-xl italic mt-4">Tuyệt vời! Không còn đơn hàng chờ xử lý.</p>
           <p className="text-slate-400 text-sm italic">Hệ thống sẽ tự động cập nhật khi có khách hàng đặt món mới.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {invoices.map((inv) => (
            <div 
              key={inv.id} 
              className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-primary/5 transition-all p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {/* Header Card */}
              <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn hàng</span>
                    <span className="text-xs font-black text-primary">#{inv.orderId}</span>
                  </div>
                  <h3 className="text-2xl font-black">Bàn {inv.tableNumber}</h3>
                </div>
                {inv.paymentMethod === 'VNPAY' ? (
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl flex items-center gap-1.5 font-bold text-[10px] uppercase border border-blue-100">
                    <CreditCard className="h-3 w-3" />
                    VNPay
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl flex items-center gap-1.5 font-bold text-[10px] uppercase border border-amber-100">
                    <Banknote className="h-3 w-3" />
                    Tiền mặt
                  </div>
                )}
              </div>

              {/* Amount Content */}
              <div className="flex items-end justify-between py-2">
                <div className="space-y-0.5">
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng cộng</p>
                   <p className="text-2xl font-black text-slate-800">{formatVnd(inv.totalAmount)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-full font-bold text-[9px] uppercase tracking-tighter">
                    <Clock className="h-3 w-3" />
                    {new Date(inv.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full font-bold text-[9px] uppercase tracking-tighter">
                     {inv.paymentStatus === 'PENDING' ? 'Chưa thanh toán' : inv.paymentStatus}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  variant="default" 
                  className="h-12 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/10 text-[10px] uppercase tracking-wider gap-2"
                  onClick={() => handleComplete(inv.id)}
                  disabled={isProcessing === inv.id}
                >
                  {isProcessing === inv.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Chấp nhận
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 rounded-xl font-bold border-2 border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-[10px] uppercase tracking-wider gap-2 transition-colors"
                  onClick={() => handleReject(inv.id)}
                  disabled={isProcessing === inv.id}
                >
                  {isProcessing === inv.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Từ chối
                    </>
                  )}
                </Button>
              </div>

              {inv.paymentMethod === 'VNPAY' && (
                <div className="px-3 py-1 bg-blue-50/50 text-blue-400 rounded-lg text-[9px] font-medium text-center italic border border-blue-50">
                  Lưu ý: Đơn VNPay có thể xử lý thủ công nếu cổng bị kẹt
                </div>
              )}

              <div className="pt-2">
                <p className="text-[10px] text-center text-slate-400 italic font-medium">
                  Cập nhật tự động qua hệ thống WebSocket
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
