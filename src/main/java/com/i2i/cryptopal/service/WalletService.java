package com.i2i.cryptopal.service;

import com.i2i.cryptopal.dto.TradeRequest;
import com.i2i.cryptopal.dto.TradeResponse;
import com.i2i.cryptopal.model.Transaction;
import com.i2i.cryptopal.model.UserWallet;
import com.i2i.cryptopal.repository.TransactionRepository;
import com.i2i.cryptopal.repository.UserWalletRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class WalletService {

    private final UserWalletRepository userWalletRepository;
    private final TransactionRepository transactionRepository;
    private final StringRedisTemplate redisTemplate;

    // Temiz Constructor Entegrasyonu
    public WalletService(UserWalletRepository userWalletRepository, 
                         TransactionRepository transactionRepository,
                         StringRedisTemplate redisTemplate) {
        this.userWalletRepository = userWalletRepository;
        this.transactionRepository = transactionRepository;
        this.redisTemplate = redisTemplate;
    }

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
        // 1. Güvenlik Kontrolü
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Yatırılacak miktar 0'dan büyük olmalıdır!");
        }

        // 2. Cüzdanı Bulma
        UserWallet wallet = getWalletByUserId(userId);
        
        // 3. Null Kontrolü ve Hesaplama
        BigDecimal currentBalance = wallet.getUsdtBalance();
        if (currentBalance == null) {
            currentBalance = BigDecimal.ZERO;
        }
        
        // 4. Yeni Bakiyeyi Ekleme
        wallet.setUsdtBalance(currentBalance.add(amount));
        
        // 5. Profil Bakiyesi ile Senkronizasyon
        if (wallet.getUser() != null) {
            wallet.getUser().setBalance(wallet.getUsdtBalance());
        }
        
        return userWalletRepository.save(wallet);
    }

    /**
     * i2i Dökümanı Modül 5.2.1 ve 5.4: Canlı Redis Destekli Alım-Satım Emir Yönetimi
     */
    @Transactional
    public TradeResponse processTradeOrder(TradeRequest request) {
        // 1. Kullanıcı cüzdanını doğrula
        UserWallet wallet = userWalletRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Cüzdan bulunamadı!"));  //güncellendi (Ferhat)
        // 2. Redis üzerinden anlık fiyatı çek
        String coinKey = request.getCoinSymbol().toUpperCase(); 
        String cachedPrice = redisTemplate.opsForValue().get(coinKey);

        if (cachedPrice == null) {
            throw new RuntimeException("Anlık piyasa fiyatı şu anda alınamıyor! Lütfen birkaç saniye sonra tekrar deneyin.");
        }

        BigDecimal coinPrice = new BigDecimal(cachedPrice);
        BigDecimal totalCost = request.getAmount().multiply(coinPrice);

        // 3. BUY (Alım) İşlemi İş Mantığı
        if ("BUY".equalsIgnoreCase(request.getAction())) {
            if (wallet.getUsdtBalance().compareTo(totalCost) < 0) {
                throw new IllegalArgumentException("Yetersiz bakiye! İşlem için yeterli USDT bulunmuyor.");   // güncellendi( Ferjat)
            }

            wallet.setUsdtBalance(wallet.getUsdtBalance().subtract(totalCost));
            
            if ("BTC".equalsIgnoreCase(coinKey)) {
                wallet.setBtcBalance(wallet.getBtcBalance().add(request.getAmount()));
            } else if ("ETH".equalsIgnoreCase(coinKey)) {
                wallet.setEthBalance(wallet.getEthBalance().add(request.getAmount()));
            } else {
                throw new IllegalArgumentException("Geçersiz coin sembolü! Sadece BTC veya ETH işlem görebilir.");  // güncellendi (Ferhat)
            }
        } 
        // 4. SELL (Satım) İşlemi İş Mantığı
        else if ("SELL".equalsIgnoreCase(request.getAction())) {
            if ("BTC".equalsIgnoreCase(coinKey) && wallet.getBtcBalance().compareTo(request.getAmount()) < 0) {
                throw new IllegalArgumentException("Yetersiz BTC varlığı!"); //güncellendi (ferhat)
            } else if ("ETH".equalsIgnoreCase(coinKey) && wallet.getEthBalance().compareTo(request.getAmount()) < 0) {
                throw new IllegalArgumentException("Yetersiz ETH varlığı!");  // güncelledim(ferhst)
            }

            if ("BTC".equalsIgnoreCase(coinKey)) {
                wallet.setBtcBalance(wallet.getBtcBalance().subtract(request.getAmount()));
            } else if ("ETH".equalsIgnoreCase(coinKey)) {
                wallet.setEthBalance(wallet.getEthBalance().subtract(request.getAmount()));
            }

            wallet.setUsdtBalance(wallet.getUsdtBalance().add(totalCost));
        } else {
            throw new IllegalArgumentException("Geçersiz işlem tipi! Sadece BUY veya SELL yapılabilir.");  // güncelledim(Ferhat)
        }

        // Ana kullanıcı profilindeki bakiye alanını senkronize et
        if (wallet.getUser() != null) {
            wallet.getUser().setBalance(wallet.getUsdtBalance());
        }

        // 5. Güncellenen cüzdan verilerini kaydet
        userWalletRepository.save(wallet);

        // 6. Değiştirilemez İşlem Dekontunu (Transaction Log) Kaydet
        Transaction txLog = new Transaction();
        txLog.setUser(wallet.getUser());
        txLog.setTransactionType(request.getAction().toUpperCase());
        txLog.setAssetName(coinKey); 
        txLog.setAmount(request.getAmount());
        txLog.setPrice(coinPrice); 
        txLog.setTotalCost(totalCost); 
        
        transactionRepository.save(txLog);

        // 7. API kılavuzuna uygun saf işlem dekontu nesnesini dön
        return new TradeResponse(
                "SUCCESS",
                request.getAction().toUpperCase() + " işlemi anlık fiyat üzerinden başarıyla gerçekleşti.",
                request.getAction().toUpperCase(),
                coinKey,
                request.getAmount(),
                coinPrice, 
                totalCost
        );
    }

    /**
     * Kullanıcının veritabanındaki geçmiş alım/satım işlemlerini getirir.
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.List<Transaction> getTransactionHistory(Long userId) {
        UserWallet wallet = getWalletByUserId(userId);
        return transactionRepository.findByUserOrderByCreatedAtDesc(wallet.getUser());
    }


}