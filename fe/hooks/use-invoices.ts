"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { InvoiceResponse } from '@/types';
import { extractErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import { SocketClient, SOCKET_CONFIG } from '@/config/socket';

export const useInvoices = (token: string | undefined) => {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<SocketClient | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const resp = await fetch('/api/admin/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(extractErrorMessage(data, 'Lỗi tải hóa đơn'));

      const activeInvoices = data
        .filter((inv: InvoiceResponse) => 
          inv.id && 
          inv.paymentStatus !== 'COMPLETED' && 
          inv.paymentStatus !== 'CANCELLED'
        )
        .sort((a: InvoiceResponse, b: InvoiceResponse) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setInvoices(activeInvoices);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    socketRef.current = new SocketClient(token);
    socketRef.current.connect(
      SOCKET_CONFIG.TOPICS.ADMIN_ORDERS,
      (newInvoice: InvoiceResponse) => {
        if (!newInvoice.id || !newInvoice.tableNumber) return;

        setInvoices(prev => {
          const isExist = prev.some(inv => inv.id === newInvoice.id);
          if (newInvoice.paymentStatus === 'COMPLETED' || newInvoice.paymentStatus === 'CANCELLED') {
            return prev.filter(inv => inv.id !== newInvoice.id);
          }
          
          if (isExist) {
            return prev.map(inv => inv.id === newInvoice.id ? newInvoice : inv);
          } else {
            toast.info(`Đơn hàng mới tại Bàn ${newInvoice.tableNumber}!`, {
              description: `Mã đơn: #${newInvoice.orderId}`
            });
            return [newInvoice, ...prev];
          }
        });
      },
      () => setIsConnected(true),
      () => setIsConnected(false)
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  const handleComplete = async (invoiceId: number) => {
    if (!token) return;
    setIsProcessing(invoiceId);
    try {
      const resp = await fetch(`/api/admin/invoices/${invoiceId}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(extractErrorMessage(data, 'Lỗi xác nhận thanh toán'));

      toast.success(`Đã xác nhận thanh toán cho hóa đơn #${invoiceId}`);
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (invoiceId: number) => {
    if (!token) return;
    if (!confirm('Bạn có chắc chắn muốn từ chối hóa đơn này? Hủy thanh toán và giải phóng bàn.')) return;
    
    setIsProcessing(invoiceId);
    try {
      const resp = await fetch(`/api/admin/invoices/${invoiceId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(extractErrorMessage(data, 'Lỗi từ chối thanh toán'));

      toast.success(`Đã từ chối hóa đơn #${invoiceId}`);
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  return {
    invoices,
    isLoading,
    isProcessing,
    isConnected,
    fetchInvoices,
    handleComplete,
    handleReject
  };
};
