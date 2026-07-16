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

    // Temiz Constructor - Kullanılmayan UserRepository tamamen kaldırıldı
    public WalletService(UserWalletRepository userWalletRepository, 
                         TransactionRepository transactionRepository,
                         StringRedisTemplate redisTemplate) {
        this.userWalletRepository = userWalletRepository;
        this.transactionRepository = transactionRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Cüzdan Bilgilerini Getirme Metodu
     */
    public UserWallet getWalletByUserId(Long userId) {
        return userWalletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cüzdan bulunamadı!"));
    }

    /**
     * Cüzdana USDT (Dolar) Yatırma Metodu
     */
    @Transactional
    public UserWallet depositUsdt(Long userId, BigDecimal amount) {
        UserWallet wallet = userWalletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cüzdan bulunamadı!"));
        
        wallet.setUsdtBalance(wallet.getUsdtBalance().add(amount));
        
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
                .orElseThrow(() -> new RuntimeException("Cüzdan bulunamadı!"));

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
                throw new RuntimeException("Yetersiz bakiye! İşlem için yeterli USDT bulunmuyor.");
            }

            wallet.setUsdtBalance(wallet.getUsdtBalance().subtract(totalCost));
            
            if ("BTC".equalsIgnoreCase(coinKey)) {
                wallet.setBtcBalance(wallet.getBtcBalance().add(request.getAmount()));
            } else if ("ETH".equalsIgnoreCase(coinKey)) {
                wallet.setEthBalance(wallet.getEthBalance().add(request.getAmount()));
            } else {
                throw new RuntimeException("Geçersiz coin sembolü! Sadece BTC veya ETH işlem görebilir.");
            }
        } 
        // 4. SELL (Satım) İşlemi İş Mantığı
        else if ("SELL".equalsIgnoreCase(request.getAction())) {
            if ("BTC".equalsIgnoreCase(coinKey) && wallet.getBtcBalance().compareTo(request.getAmount()) < 0) {
                throw new RuntimeException("Yetersiz BTC varlığı!");
            } else if ("ETH".equalsIgnoreCase(coinKey) && wallet.getEthBalance().compareTo(request.getAmount()) < 0) {
                throw new RuntimeException("Yetersiz ETH varlığı!");
            }

            if ("BTC".equalsIgnoreCase(coinKey)) {
                wallet.setBtcBalance(wallet.getBtcBalance().subtract(request.getAmount()));
            } else if ("ETH".equalsIgnoreCase(coinKey)) {
                wallet.setEthBalance(wallet.getEthBalance().subtract(request.getAmount()));
            }

            wallet.setUsdtBalance(wallet.getUsdtBalance().add(totalCost));
        } else {
            throw new RuntimeException("Geçersiz işlem tipi! Sadece BUY veya SELL yapılabilir.");
        }

        // Ana kullanıcı profilindeki bakiye alanını senkronize et
        if (wallet.getUser() != null) {
            wallet.getUser().setBalance(wallet.getUsdtBalance());
        }

        // 5. Güncellenen verileri kaydetmee
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

        //dekont görüntüleme için TradeResponse nesnesi oluşturuluyor ve geri döndürülüyor
        return new TradeResponse(
                "SUCCESS",
                request.getAction().toUpperCase() + " işlemi anlık fiyat üzerinden başarıyla gerçekleşti.",
                request.getAction().toUpperCase(),
                coinKey,
                request.getAmount(),
                coinPrice, // burası modeldeki executionPrice alanına oturacak
                totalCost
        );
    }
}