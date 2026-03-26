import { MapPin, CheckCircle2, XCircle, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

import { formatVnd } from "@/lib/utils";
import { OrderResponse } from "@/types";

interface OrderCardProps {
  order: OrderResponse;
  onPaymentClick: (orderId: number) => void;
}

export function OrderCard({ order, onPaymentClick }: OrderCardProps) {
  return (
    <div className="group bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-primary/5 transition-all overflow-hidden">
      <div className="p-5 sm:p-8">
        {/* Thông tin chung của đơn */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between md:justify-start gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="h-14 w-14 sm:h-16 sm:w-16 bg-slate-50 rounded-2xl sm:rounded-3xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Đơn hàng</span>
                   <span className="text-xs font-black text-primary">#{order.orderId}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800">Bàn {order.tableNumber}</h3>
              </div>
            </div>
            
            {/* Tag trạng thái hiển thị riêng trên mobile để tiết kiệm diện tích */}
            <div className={`md:hidden px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest shrink-0 ${
              order.status === 'COMPLETED' 
                ? 'bg-emerald-50 text-emerald-600' 
                : order.status === 'CANCELLED'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {order.status === 'COMPLETED' ? <CheckCircle2 className="h-3 w-3" /> : order.status === 'CANCELLED' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {order.status === 'COMPLETED' ? 'Hoàn tất' : order.status === 'CANCELLED' ? 'Đã hủy' : 'Đang xử lý'}
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase font-black text-slate-400">Thời gian đặt</p>
              <p className="font-bold text-slate-600">
                {new Date(order.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
              order.status === 'COMPLETED' 
                ? 'bg-emerald-50 text-emerald-600' 
                : order.status === 'CANCELLED'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {order.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> : order.status === 'CANCELLED' ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {order.status === 'COMPLETED' ? 'Hoàn tất' : order.status === 'CANCELLED' ? 'Đã hủy' : 'Đang xử lý'}
            </div>
          </div>

          {/* Ngày đặt trên mobile */}
          <div className="md:hidden text-left pl-[4.5rem]">
            <p className="text-[10px] uppercase font-bold text-slate-400">
              {new Date(order.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Danh sách món ăn */}
        <div className="bg-slate-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-100/50">
          <div className="space-y-3 sm:space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start sm:items-center group/item gap-2">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <span className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-white flex items-center justify-center font-black text-[10px] sm:text-xs shadow-sm border border-slate-100 shrink-0 mt-0.5 sm:mt-0">
                    {item.quantity}
                  </span>
                  <span className="font-bold text-sm sm:text-base text-slate-700 transition-colors group-hover/item:text-primary leading-tight">
                    {item.productName}
                  </span>
                </div>
                <span className="font-black text-sm sm:text-base text-slate-400 tabular-nums shrink-0 pt-0.5 sm:pt-0">
                  @{formatVnd(item.unitPrice)}
                </span>
              </div>
            ))}
          </div>
          
          {order.discountAmount !== null && order.discountAmount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-rose-500 uppercase tracking-widest line-clamp-1">Ưu đãi giảm giá ({order.discountPercent}%)</span>
              <span className="font-black text-sm sm:text-base text-rose-500 shrink-0">-{formatVnd(order.discountAmount)}</span>
            </div>
          )}
        </div>

        {/* Tổng tiền và thao tác */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-5 sm:gap-4">
          <div className="flex items-center justify-between sm:block space-y-0.5">
             <p className="text-[10px] sm:text-xs uppercase font-black text-slate-400 tracking-[0.2em] mb-0 sm:mb-1">Tổng thanh toán</p>
             <p className="text-2xl sm:text-3xl font-black text-primary tracking-tighter">{formatVnd(order.totalAmount)}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
             {order.status === 'ORDERED' && (
                <Button 
                  className="rounded-xl sm:rounded-2xl h-12 sm:h-14 px-6 sm:px-8 font-black bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 gap-2 w-full sm:w-auto text-sm sm:text-base"
                  onClick={() => onPaymentClick(order.orderId)}
                >
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                  Thanh toán
                </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
