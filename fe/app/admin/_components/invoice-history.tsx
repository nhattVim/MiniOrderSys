"use client";

import { useEffect } from "react";
import { formatVnd } from "@/lib/utils";
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Banknote, 
  History,
  RefreshCw,
  Search,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminHistory } from "@/hooks/use-admin-history";

export default function InvoiceHistory() {
  const { invoices, isLoading, fetchHistory } = useAdminHistory();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Lịch sử hóa đơn toàn hệ thống
          </h2>
          <p className="text-sm text-muted-foreground italic tracking-tight">
            Xem lại toàn bộ các giao dịch đã thực hiện từ trước đến nay
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchHistory} 
          disabled={isLoading}
          className="rounded-xl font-bold gap-2 self-start sm:self-center"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Cập nhật dữ liệu
        </Button>
      </div>

      {isLoading && invoices.length === 0 ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
           <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
           <p className="text-slate-400 font-bold italic tracking-wider">Đang tải lịch sử...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
           <div className="h-20 w-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
             <Search className="h-10 w-10" />
           </div>
           <p className="text-slate-500 font-black text-xl italic mt-4">Chưa có dữ liệu hóa đơn nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div 
              key={inv.id} 
              className={`group grid grid-cols-1 md:grid-cols-[auto_1fr_120px_160px_140px] items-center gap-4 bg-white p-5 rounded-3xl border transition-all hover:shadow-lg ${
                inv.paymentStatus === 'COMPLETED' ? 'border-slate-100 shadow-sm' : 
                inv.paymentStatus === 'CANCELLED' ? 'border-rose-100 bg-rose-50/5 opacity-80' :
                'border-amber-200 bg-amber-50/20 shadow-amber-100/50 shadow-md'
              }`}
            >
              {/* Cột 1: Bàn */}
              <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                inv.paymentStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                inv.paymentStatus === 'CANCELLED' ? 'bg-rose-50 text-rose-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                <span className="text-[10px] font-black uppercase leading-tight">Bàn</span>
                <span className="text-xl font-black leading-tight">{inv.tableNumber}</span>
              </div>
              
              {/* Cột 2: Mã đơn & Hóa đơn */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">Hóa đơn #{inv.id}</span>
                  <Badge 
                    variant={inv.paymentStatus === 'COMPLETED' ? "secondary" : "destructive"} 
                    className={`text-[9px] h-4 px-1 font-black shadow-none border-none whitespace-nowrap ${
                      inv.paymentStatus === 'COMPLETED' ? 'bg-emerald-500 text-white' : 
                      inv.paymentStatus === 'CANCELLED' ? 'bg-rose-500 text-white' : 
                      'bg-amber-500 text-white'
                    }`}
                  >
                    {inv.paymentStatus === 'COMPLETED' ? 'Hoàn tất' : 
                     inv.paymentStatus === 'CANCELLED' ? 'Đã hủy' : 'Chờ xử lý'}
                  </Badge>
                </div>
                <h4 className="font-black text-lg text-slate-800 truncate">Mã đơn: <span className="text-primary">#{inv.orderId}</span></h4>
              </div>

              {/* Cột 3: Thanh toán */}
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Thanh toán</p>
                <div className="flex items-center gap-1.5 font-black text-sm text-slate-700 whitespace-nowrap">
                  {inv.paymentMethod === 'VNPAY' ? (
                    <>
                      <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                      VNPay
                    </>
                  ) : (
                    <>
                      <Banknote className="h-3.5 w-3.5 text-amber-500" />
                      Tiền mặt
                    </>
                  )}
                </div>
              </div>

              {/* Cột 4: Thời gian */}
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Thời gian</p>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-50/80 bg-slate-400/10 px-2 py-0.5 rounded-lg text-slate-500 whitespace-nowrap">
                  <Calendar className="h-3 w-3" />
                  {new Date(inv.createdAt).toLocaleString("vi-VN", { 
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </div>
              </div>

              {/* Cột 5: Tổng cộng */}
              <div className="space-y-0.5 text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng cộng</p>
                <p className="text-xl font-black text-primary whitespace-nowrap">{formatVnd(inv.totalAmount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
