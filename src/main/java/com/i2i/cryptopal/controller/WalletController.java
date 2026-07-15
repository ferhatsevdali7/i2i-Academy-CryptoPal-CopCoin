package com.i2i.cryptopal.controller;

import com.i2i.cryptopal.model.UserWallet;
import com.i2i.cryptopal.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    /**
     * Kullanıcının cüzdan bilgilerini ve bakiyelerini getirir.
     * GET http://localhost:8080/api/wallet/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserWallet> getWallet(@PathVariable Long userId) {
        UserWallet wallet = walletService.getWalletByUserId(userId);
        return ResponseEntity.ok(wallet);
    }

    /**
     * Kullanıcının cüzdanına sanal USDT (Dolar) yatırır.
     * POST http://localhost:8080/api/wallet/{userId}/deposit?amount=1000
     */
    @PostMapping("/{userId}/deposit")
    public ResponseEntity<UserWallet> depositUsdt(
            @PathVariable Long userId,
            @RequestParam BigDecimal amount) {
        UserWallet updatedWallet = walletService.depositUsdt(userId, amount);
        return ResponseEntity.ok(updatedWallet);
    }
}