package com.i2i.cryptopal.config;

import com.i2i.cryptopal.security.SecurityInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final SecurityInterceptor securityInterceptor;

    public WebConfig(SecurityInterceptor securityInterceptor) {
        this.securityInterceptor = securityInterceptor;
    }

    // Interceptor Kayıt Alanı: Turnikeyi kapılara bağlıyoruz.
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(securityInterceptor)
                // Al-sat ve cüzdan işlemlerinin geçtiği tüm yolları zırhladık 
                .addPathPatterns("/api/trade/**", "/api/wallet/**")
                // Giriş, kayıt ve Swagger sayfalarını bu kontrolden muaf tutuyoruz
                .excludePathPatterns(
                        "/api/auth/login", 
                        "/api/auth/register",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/swagger-resources/**",
                        "/webjars/**"
                );
    }

    // GELECEĞE YATIRIM: Global CORS Yapılandırması (Frontend Entegrasyonunda Sıfır Hata Garantisi)
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Tüm API uçlarına izin ver
                .allowedOriginPatterns("*") // Tüm frontend portlarından gelen isteklere kapıyı aç
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // İzin verilen HTTP metotları
                .allowedHeaders("*") // Tüm header başlıklarına izin 
                .allowCredentials(true); // Cookie veya Auth header taşınmasına izin 
    }
}
