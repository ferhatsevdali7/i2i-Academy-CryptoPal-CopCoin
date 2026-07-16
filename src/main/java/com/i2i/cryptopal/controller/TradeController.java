package com.i2i.cryptopal.controller;

import com.i2i.cryptopal.dto.TradeRequest;
import com.i2i.cryptopal.dto.TradeResponse;
import com.i2i.cryptopal.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController // Spring Boot'a bu sınıfın dışarıya API ucu açan bir kontrolcü olduğunu söyler.
@RequestMapping("/api/trade") // Bu controller içindeki tüm adreslerin "/api/trade" ile başlayacağını belirtir.
public class TradeController {

    // Hesap kitap ve veritabanı işlemlerini yapması için WalletService sınıfını çağıracağız.
    private final WalletService walletService;

    // Constructor Injection: Spring ayağa kalkarken WalletService'i bu sınıfa otomatik enjekte eder.
    public TradeController(WalletService walletService) {
        this.walletService = walletService;
    }

    // sözleşmede olan  POST /api/trade/order ucu tam olarak burası:
    @PostMapping("/order")
    public ResponseEntity<TradeResponse> executeOrder(@RequestBody TradeRequest tradeRequest) {
        
        // Frontend'den gelen isteği alıp işlenmesi için WalletService'e gönderiyoruz.
        TradeResponse response = walletService.processTradeOrder(tradeRequest);
        
        // Sonucu HTTP 200 (Başarılı) koduyla frontend'e geri fırlatıyoruz.
        return ResponseEntity.ok(response);
    }
}
