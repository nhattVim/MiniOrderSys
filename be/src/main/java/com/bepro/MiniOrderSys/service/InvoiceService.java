package com.bepro.MiniOrderSys.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.bepro.MiniOrderSys.dto.request.InvoiceRequest;
import com.bepro.MiniOrderSys.dto.response.InvoiceResponse;
import com.bepro.MiniOrderSys.entity.CafeOrder;
import com.bepro.MiniOrderSys.entity.CafeTable;
import com.bepro.MiniOrderSys.entity.Invoice;
import com.bepro.MiniOrderSys.entity.enums.OrderStatus;
import com.bepro.MiniOrderSys.entity.enums.PaymentMethod;
import com.bepro.MiniOrderSys.entity.enums.PaymentStatus;
import com.bepro.MiniOrderSys.entity.enums.TableStatus;
import com.bepro.MiniOrderSys.repository.CafeOrderRepository;
import com.bepro.MiniOrderSys.repository.CafeTableRepository;
import com.bepro.MiniOrderSys.repository.InvoiceRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

  private final InvoiceRepository invoiceRepository;
  private final CafeOrderRepository cafeOrderRepository;
  private final CafeTableRepository cafeTableRepository;
  private final VNPayService vnPayService;
  private final SimpMessagingTemplate messagingTemplate;

  private InvoiceResponse toResponse(Invoice savedInvoice, String paymentUrl) {
    return new InvoiceResponse(
        savedInvoice.getId(),
        savedInvoice.getOrder().getId(),
        savedInvoice.getOrder().getTable().getTableNumber(),
        savedInvoice.getTotalAmount(),
        savedInvoice.getPaymentMethod(),
        savedInvoice.getPaymentStatus(),
        savedInvoice.getPaidAt(),
        savedInvoice.getCreatedAt(),
        paymentUrl);
  }

  @Transactional(readOnly = true)
  public List<InvoiceResponse> getAll() {
    return invoiceRepository.findAll().stream()
        .map(inv -> toResponse(inv, null))
        .collect(Collectors.toList());
  }

  @Transactional
  public InvoiceResponse process(InvoiceRequest request, HttpServletRequest requestHttp) {
    log.info("Initiating payment processing [orderId:{}]", request.orderId());
    log.debug("Payment properties [method:{}, requestedStatus:{}]", request.paymentMethod(), request.paymentStatus());

    CafeOrder order = cafeOrderRepository.findById(request.orderId())
        .orElseThrow(() -> {
          log.error("Order lookup failed: Order not found [orderId:{}]", request.orderId());
          return new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        });

    if (order.getStatus() != OrderStatus.ORDERED && order.getStatus() != OrderStatus.COMPLETED) {
      log.warn("Invalid order status for payment processing [orderId:{}, currentStatus:{}]", order.getId(),
          order.getStatus());
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order status is invalid for invoice processing");
    }

    Invoice invoice = invoiceRepository.findByOrderId(request.orderId())
        .orElseGet(() -> {
          log.debug("No existing invoice found. Constructing new invoice [orderId:{}]", request.orderId());
          return Invoice.builder()
              .order(order)
              .totalAmount(order.getTotalAmount())
              .createdAt(LocalDateTime.now())
              .build();
        });

    if (invoice.getPaymentStatus() == PaymentStatus.COMPLETED) {
      log.warn("Payment rejected: Invoice is already completed [invoiceId:{}, orderId:{}]", invoice.getId(),
          request.orderId());
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invoice is already completed and cannot be modified");
    }

    invoice.setPaymentMethod(request.paymentMethod());
    invoice.setPaymentStatus(request.paymentStatus());
    invoice.setPaidAt(request.paymentStatus() == PaymentStatus.COMPLETED ? LocalDateTime.now() : null);

    Invoice savedInvoice = invoiceRepository.save(invoice);
    log.info("Invoice persisted successfully [invoiceId:{}, totalAmount:{}]", savedInvoice.getId(),
        savedInvoice.getTotalAmount());

    if (request.paymentStatus() == PaymentStatus.COMPLETED) {
      log.info("Cash payment processed. Marking order as completed and releasing table [orderId:{}, tableNumber:{}]",
          order.getId(), order.getTable().getTableNumber());
      order.setStatus(OrderStatus.COMPLETED);
      cafeOrderRepository.save(order);

      CafeTable table = order.getTable();
      table.setStatus(TableStatus.AVAILABLE);
      cafeTableRepository.save(table);
    }

    String paymentUrl = null;
    log.info("Checking payment method: [requested:{}, enum:VNPAY]", request.paymentMethod());
    if (request.paymentMethod() == PaymentMethod.VNPAY && request.paymentStatus() != PaymentStatus.COMPLETED) {
      try {
        log.info("Requesting VNPay payment URL generation [invoiceId:{}]", savedInvoice.getId());
        paymentUrl = vnPayService.createPaymentUrl(requestHttp, savedInvoice);
        log.debug("VNPay payment URL generated successfully [invoiceId:{}]", savedInvoice.getId());
      } catch (Exception e) {
        log.error("Failed to generate VNPay payment URL [invoiceId:{}]", savedInvoice.getId(), e);
      }
    } else {
      log.info("Skipping VNPay URL generation for non-VNPAY method: {}", request.paymentMethod());
    }

    InvoiceResponse response = toResponse(savedInvoice, paymentUrl);
    messagingTemplate.convertAndSend("/topic/admin/orders", response);

    log.info("Payment processing finalized [orderId:{}]", request.orderId());
    return response;
  }

  @Transactional
  public InvoiceResponse complete(Long id) {
    log.info("Processing manual payment completion [invoiceId:{}]", id);
    Invoice invoice = invoiceRepository.findById(id)
        .orElseThrow(() -> {
          log.error("Payment completion failed: Invoice not found [invoiceId:{}]", id);
          return new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found");
        });

    if (invoice.getPaymentStatus() == PaymentStatus.COMPLETED) {
      log.warn("Payment completion bypassed: Invoice is already completed [invoiceId:{}]", id);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invoice is already completed");
    }

    invoice.setPaymentStatus(PaymentStatus.COMPLETED);
    invoice.setPaidAt(LocalDateTime.now());
    Invoice savedInvoice = invoiceRepository.save(invoice);
    log.debug("Invoice payment status updated to COMPLETED [invoiceId:{}]", id);

    CafeOrder order = invoice.getOrder();
    order.setStatus(OrderStatus.COMPLETED);
    cafeOrderRepository.save(order);

    CafeTable table = order.getTable();
    table.setStatus(TableStatus.AVAILABLE);
    cafeTableRepository.save(table);
    log.info("Table released successfully [tableNumber:{}, orderId:{}]", table.getTableNumber(), order.getId());

    InvoiceResponse response = toResponse(savedInvoice, null);
    messagingTemplate.convertAndSend("/topic/admin/orders", response);

    log.info("Payment completion finalized successfully [invoiceId:{}]", id);
    return response;
  }

  @Transactional
  public InvoiceResponse reject(Long id) {
    log.info("Rejecting payment [invoiceId:{}]", id);
    Invoice invoice = invoiceRepository.findById(id)
        .orElseThrow(() -> {
          log.error("Payment rejection failed: Invoice not found [invoiceId:{}]", id);
          return new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found");
        });

    if (invoice.getPaymentStatus() == PaymentStatus.COMPLETED) {
      log.error("Cannot reject a completed invoice [invoiceId:{}]", id);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reject a completed invoice");
    }

    invoice.setPaymentStatus(PaymentStatus.CANCELLED);
    Invoice savedInvoice = invoiceRepository.save(invoice);
    log.debug("Invoice status set to CANCELLED [invoiceId:{}]", id);

    CafeOrder order = invoice.getOrder();
    order.setStatus(OrderStatus.CANCELLED);
    cafeOrderRepository.save(order);

    CafeTable table = order.getTable();
    table.setStatus(TableStatus.AVAILABLE);
    cafeTableRepository.save(table);

    InvoiceResponse response = toResponse(savedInvoice, null);
    messagingTemplate.convertAndSend("/topic/admin/orders", response);

    log.info("Invoice rejected and order cancelled [invoiceId:{}]", id);
    return response;
  }
}