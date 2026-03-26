package com.bepro.MiniOrderSys.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bepro.MiniOrderSys.dto.response.InvoiceResponse;
import com.bepro.MiniOrderSys.service.InvoiceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminInvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAll());
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<InvoiceResponse> completeInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.complete(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<InvoiceResponse> rejectInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.reject(id));
    }
}
