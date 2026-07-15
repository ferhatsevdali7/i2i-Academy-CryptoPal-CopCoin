package com.i2i.cryptopal.service;

import com.i2i.cryptopal.model.UserWallet;
import com.i2i.cryptopal.repository.UserWalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserWalletRepository userWalletRepository;

    /**
     * Kullanıcı ID'sine göre cüzdan bilgilerini veritabanından getirir.
     */
    @Transactional(readOnly = true)
    public UserWallet getWalletByUserId(Long userId) {
        return userWalletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cüzdan bulunamadı! Kullanıcı ID: " + userId));
    }

    /**
     * Kullanıcının cüzdanına sanal USDT (Dolar) yatırır.
     */
    @Transactional
    public UserWallet depositUsdt(Long userId, BigDecimal amount) {
        // 1. Güvenlik Kontrolü: Yatırılacak miktar sıfır veya negatif olamaz
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Yatırılacak miktar 0'dan büyük olmalıdır!");
        }

        // 2. Cüzdanı Veritabanından Bulma
        UserWallet wallet = getWalletByUserId(userId);
        
        // 3. Null Kontrolü ve Hesaplama
        BigDecimal currentBalance = wallet.getUsdtBalance();
        if (currentBalance == null) {
            currentBalance = BigDecimal.ZERO;
        }
        
        // 4. Yeni Bakiyeyi Ekleme (BigDecimal toplama işlemi)
        wallet.setUsdtBalance(currentBalance.add(amount));

        // 5. Veritabanına Kaydetme ve Güncel Cüzdanı Geri Dönme
        return userWalletRepository.save(wallet);
    }
}
