package com.i2i.cryptopal.scheduler;

import com.i2i.cryptopal.model.PriceTrend;
import com.i2i.cryptopal.repository.PriceTrendRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Random;

@Component // 1. Spring'e bu sınıfın arka planda yaşayan bir parça olduğunu söyler
@RequiredArgsConstructor // 2. Sınıftaki 'final' değişkenleri otomatik olarak bağlar (Dependency Injection)
@Slf4j // 3. Konsola renkli loglar (bilgilendirme yazıları) yazabilmemizi sağlar
public class TickerEngine {

    // Bizim dış bağlantı kapılarımız (Dependency)
    private final StringRedisTemplate redisTemplate; // Redis'e veri yazmak için kullandığımız araç
    private final PriceTrendRepository priceTrendRepository; // PostgreSQL trend yazıcısı

    private final Random random = new Random(); // Rastgele sayı üretici

    // Sanal piyasamızın başlangıç fiyatları (Açılış değerleri)
    private BigDecimal btcPrice = new BigDecimal("60000.00");
    private BigDecimal ethPrice = new BigDecimal("3000.00");

    // Spring Bootun zaman ayarı: fixedRate = 15000 (15 saniyede bir bu metot otomatik olarak tetiklenir)
    @Scheduled(fixedRate = 15000)
    public void generateNewPrices() {
        
        // 1.ADIM: BTC ve ETH için yeni dalgalı fiyatlar hesapla
        btcPrice = calculateNewPrice(btcPrice);
        ethPrice = calculateNewPrice(ethPrice);

        log.info("Yeni Fiyatlar Üretildi -> BTC: ${}, ETH: ${}", btcPrice, ethPrice);

        // 2.ADIM: Anlık fiyatları REDIS'e yaz (Eski fiyatı siler, yenisini yazar)
        redisTemplate.opsForValue().set("BTC", btcPrice.toString());
        redisTemplate.opsForValue().set("ETH", ethPrice.toString());

        // 3. ADIM: Grafik çizimi geçmişi için fiyatı POSTGRESQL'e kaydet (Trend analizi)
        PriceTrend btcTrend = PriceTrend.builder()
                .assetName("BTC")
                .price(btcPrice)
                .build();

        PriceTrend ethTrend = PriceTrend.builder()
                .assetName("ETH")
                .price(ethPrice)
                .build();

        priceTrendRepository.save(btcTrend);
        priceTrendRepository.save(ethTrend);
        
        log.info("Yeni fiyat trendleri basariyla kaydedildi.");
    }

    // Fiyatı her 15 saniyede bir % -1.5 ile % +1.5 arasında rastgele dalgalandıran matematiksel fonksiyonn
    private BigDecimal calculateNewPrice(BigDecimal currentPrice) {
        // -1.5 ile +1.5 arasında rastgele bir yüzde oranı üretir
        double percentChange = -1.5 + (3.0 * random.nextDouble());
        
        // Değişim miktarını hesapla: mevcutFiyat * değişimOranı / 100
        BigDecimal change = currentPrice.multiply(BigDecimal.valueOf(percentChange))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        // Yeni fiyatı hesapla (mevcut fiyata değişim miktarını ekle) ve virgülden sonra 2 haneye yuvarla
        BigDecimal newPrice = currentPrice.add(change);
        return newPrice.setScale(2, RoundingMode.HALF_UP);
    }
}
