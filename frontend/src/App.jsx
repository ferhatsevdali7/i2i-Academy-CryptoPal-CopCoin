import React, { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://localhost:8080";

// oturum suresi dolunca (401) tum uygulamayi tek noktadan cikis ekranina atmak icin
let sessionExpiredHandler = null;

async function apiFetch(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401 && sessionExpiredHandler) {
    sessionExpiredHandler();
  }
  return res;
}

const COLORS = {
  bg: "#000000",
  sidebar: "#0a0a0a",
  card: "#0a0a0a",
  cardBorder: "#1c1c1c",
  cardBorderHover: "#2c2c2c",
  inputBg: "#121212",
  inputBorder: "#232323",
  textMain: "#ffffff",
  textMuted: "#8a8a8a",
  yellow: "#fdc700",
  yellowHover: "#e8b700",
  errorBg: "#220d0e",
  errorBorder: "#3a1416",
  errorText: "#ff583c",
  successBg: "#0d2214",
  successBorder: "#163a1e",
  successText: "#4ade80",
};

const pageBg = {
  background:
    "radial-gradient(circle at 15% 0%, rgba(253,199,0,0.05), transparent 40%), radial-gradient(circle at 85% 100%, rgba(253,199,0,0.04), transparent 45%), #000000",
};

const COINS = [
  { symbol: "BTC", name: "Bitcoin", badgeBg: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", badgeBg: "#8a92b2" },
];

// ---------------- SHARED UI ----------------

function IconBadge({ size = 56, radius = 16 }) {
  return (
    <div
      className="flex items-center justify-center mx-auto shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(155deg, ${COLORS.yellow}, #e0ac00)`,
        borderRadius: radius,
        boxShadow: `0 6px 20px -6px rgba(253,199,0,0.45)`,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.46, height: size * 0.46 }}>
        <path d="M3 17L9 11L13 15L21 7" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7H21V13" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block rounded-full animate-spin"
      style={{ width: 14, height: 14, border: "2px solid rgba(20,20,20,0.3)", borderTopColor: "#141414" }}
    />
  );
}

function MessageBox({ text, type }) {
  if (!text) return null;
  const isError = type === "error";
  return (
    <div
      className="mt-3.5 rounded-xl px-3.5 py-3 text-sm text-center"
      style={{
        background: isError ? COLORS.errorBg : COLORS.successBg,
        border: `1px solid ${isError ? COLORS.errorBorder : COLORS.successBorder}`,
        color: isError ? COLORS.errorText : COLORS.successText,
      }}
    >
      {text}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div className="mb-4">
      <label className="block text-xs mb-2 font-medium" style={{ color: "#a3a3a3" }}>{label}</label>
      <input
        {...props}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
        onFocus={(e) => { e.target.style.borderColor = COLORS.yellow; e.target.style.background = "#161616"; }}
        onBlur={(e) => { e.target.style.borderColor = COLORS.inputBorder; e.target.style.background = COLORS.inputBg; }}
      />
    </div>
  );
}

function PrimaryButton({ children, loading, loadingText, ghost, ...props }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 transition-all"
      style={{
        background: ghost ? COLORS.inputBg : hover && !loading ? COLORS.yellowHover : COLORS.yellow,
        color: ghost ? COLORS.textMain : "#141414",
        border: ghost ? `1px solid ${hover ? COLORS.cardBorderHover : COLORS.inputBorder}` : "none",
        opacity: loading || props.disabled ? 0.6 : 1,
        cursor: loading || props.disabled ? "not-allowed" : "pointer",
      }}
    >
      {loading ? (<><Spinner /><span>{loadingText || "Lütfen bekleyin..."}</span></>) : children}
    </button>
  );
}

function fmtUsd(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return "-";
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AssetBadge({ label, bg, size = 28 }) {
  return (
    <span
      className="flex items-center justify-center rounded-lg font-bold shrink-0"
      style={{ width: size, height: size, background: bg, color: "#141414", fontSize: size * 0.4 }}
    >
      {label}
    </span>
  );
}

function Card({ title, className = "", children, right = null, height = null }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`rounded-[20px] p-6 transition-all ${className}`}
      style={{
        background: COLORS.card,
        border: `1px solid ${hover ? COLORS.cardBorderHover : COLORS.cardBorder}`,
        boxShadow: hover ? "0 20px 40px -24px rgba(0,0,0,0.7)" : "none",
        height: height || undefined,
        display: height ? "flex" : undefined,
        flexDirection: height ? "column" : undefined,
      }}
    >
      {title && (
        <div className="flex items-center justify-between mb-4.5 shrink-0">
          <h2 className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.textMain }}>
            <span className="inline-block rounded-full" style={{ width: 7, height: 7, background: COLORS.yellow, boxShadow: `0 0 8px ${COLORS.yellow}` }} />
            {title}
          </h2>
          {right}
        </div>
      )}
      <div style={height ? { overflowY: "auto", flex: 1, minHeight: 0 } : undefined}>
        {children}
      </div>
    </div>
  );
}

// ---------------- AUTH SCREEN ----------------

function AuthScreen({ onAuthed, expiredNotice }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    expiredNotice ? { text: "Oturumun süresi doldu, güvenlik için tekrar giriş yapman gerekiyor.", type: "error" } : { text: "", type: "" }
  );

  const isLogin = mode === "login";

  const switchMode = (next) => {
    setMode(next);
    setMessage({ text: "", type: "" });
    setUsername("");
    setPassword("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || (isLogin ? "Giriş başarısız oldu!" : "Kayıt başarısız oldu!"), type: "error" });
        return;
      }

      if (isLogin) {
        setMessage({ text: data.message || "Giriş başarılı!", type: "success" });
        setTimeout(() => {
          onAuthed({ token: data.token, username: data.username, balance: data.balance, userId: data.id });
        }, 400);
      } else {
        setMessage({ text: data.message || "Kayıt başarılı! Şimdi giriş yapabilirsin.", type: "success" });
        setTimeout(() => {
          setMode("login");
          setMessage({ text: "", type: "" });
        }, 1000);
      }
    } catch (err) {
      setMessage({ text: "Sunucuya ulaşılamadı. Lütfen backend servisinin çalıştığından emin olun.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={pageBg}>
      <div
        className="w-full rounded-3xl px-8 pt-10 pb-8"
        style={{ maxWidth: 380, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, boxShadow: "0 40px 80px -30px rgba(0,0,0,0.9)" }}
      >
        <div className="mb-5"><IconBadge /></div>

        {isLogin ? (
          <>
            <h1 className="text-center font-bold text-2xl mb-2" style={{ color: COLORS.textMain, letterSpacing: "-0.02em" }}>Hoş Geldiniz</h1>
            <p className="text-center text-sm mb-7 px-1.5" style={{ color: COLORS.textMuted, lineHeight: 1.5 }}>İşlemlerinize devam etmek için lütfen giriş yapınız</p>
          </>
        ) : (
          <>
            <h1 className="text-center font-bold text-2xl mb-2" style={{ color: COLORS.textMain, letterSpacing: "-0.02em" }}>Aramıza Katıl</h1>
            <p className="text-center text-sm mb-7 px-1.5" style={{ color: COLORS.textMuted, lineHeight: 1.5 }}>Hesabını oluştur, sana özel başlangıç bakiyesiyle işlem yapmaya başla</p>
          </>
        )}

        <form onSubmit={submit}>
          <Field label="Kullanıcı Adı" type="text" placeholder="Kullanıcı adınız" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Field label="Şifre" type="password" placeholder="••••••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <PrimaryButton type="submit" loading={loading} loadingText={isLogin ? "Giriş yapılıyor..." : "Kayıt oluşturuluyor..."}>
            <span>{isLogin ? "Giriş Yap" : "Kayıt Ol"}</span>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
              <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PrimaryButton>
        </form>

        <MessageBox text={message.text} type={message.type} />

        <p className="text-center text-sm mt-5" style={{ color: COLORS.textMuted }}>
          {isLogin ? (
            <>Hesabın yok mu?{" "}<a onClick={() => switchMode("register")} className="font-bold cursor-pointer hover:underline" style={{ color: COLORS.yellow }}>Kayıt Ol</a></>
          ) : (
            <>Zaten hesabın var mı?{" "}<a onClick={() => switchMode("login")} className="font-bold cursor-pointer hover:underline" style={{ color: COLORS.yellow }}>Giriş Yap</a></>
          )}
        </p>
      </div>
    </div>
  );
}

// ---------------- SIDEBAR ----------------

function NavIcon({ path, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }}>
      <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { key: "home", label: "Ana Sayfa", icon: "M3 11L12 4L21 11M5 10V20H19V10" },
  { key: "portfolio", label: "Portföy", icon: "M4 4H20V20H4V4ZM4 10H20M10 10V20" },
  { key: "history", label: "İşlem Geçmişi", icon: "M12 8V12L15 15M21 12A9 9 0 1 1 12 3" },
];

function Sidebar({ active, onNavigate, username, onLogout, onOpenAccount }) {
  return (
    <div
      className="hidden md:flex flex-col shrink-0"
      style={{ width: 240, background: COLORS.sidebar, borderRight: `1px solid ${COLORS.cardBorder}`, minHeight: "100vh" }}
    >
      <div className="flex items-center gap-3.5 px-6 py-7">
        <IconBadge size={48} radius={14} />
        <span className="font-bold text-xl tracking-tight leading-none" style={{ color: COLORS.textMain }}>CopCoin</span>
      </div>

      <nav className="flex-1 px-3 mt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl mb-1 text-sm font-medium transition-all"
              style={{
                background: isActive ? "rgba(253,199,0,0.1)" : "transparent",
                color: isActive ? COLORS.yellow : COLORS.textMuted,
              }}
            >
              <NavIcon path={item.icon} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pb-5 pt-3" style={{ borderTop: `1px solid ${COLORS.cardBorder}` }}>
        <button
          onClick={onOpenAccount}
          className="w-full flex items-center gap-2.5 px-2 py-2 mb-2 rounded-xl transition-colors"
          style={{ background: "transparent" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.inputBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <span
            className="flex items-center justify-center rounded-full font-bold text-xs shrink-0"
            style={{ width: 32, height: 32, background: COLORS.yellow, color: "#141414" }}
          >
            {username?.[0]?.toUpperCase() || "?"}
          </span>
          <span className="text-[13.5px] font-semibold truncate flex-1 text-left" style={{ color: COLORS.textMain }}>{username}</span>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14, color: COLORS.textMuted }}>
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onLogout}
          className="w-full rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-colors"
          style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}

function MobileNav({ active, onNavigate }) {
  return (
    <div
      className="flex md:hidden overflow-x-auto gap-2 px-4 py-3 mb-2"
      style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap"
            style={{ background: isActive ? "rgba(253,199,0,0.1)" : COLORS.inputBg, color: isActive ? COLORS.yellow : COLORS.textMuted }}
          >
            <NavIcon path={item.icon} size={14} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------- MINI SPARKLINE (for home list rows) ----------------

function MiniSparkline({ points, color }) {
  if (!points || points.length < 2) {
    return <div style={{ width: 90, height: 32 }} />;
  }
  const prices = points.map((p) => parseFloat(p.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 90, h = 32;
  const step = w / (prices.length - 1);
  const path = prices
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------- HOME VIEW ----------------

function HomeView({ prices, lastPrices, history, onInspect }) {
  function priceChange(sym) {
    const last = lastPrices[sym];
    const current = prices[sym];
    if (!last || !current) return null;
    const diff = current - last;
    if (diff === 0) return null;
    const pct = ((diff / last) * 100).toFixed(2);
    return { up: diff > 0, text: (diff > 0 ? "▲ +" : "▼ ") + pct + "%" };
  }

  return (
    <div className="max-w-[1000px]">
      <h1 className="text-2xl font-bold mb-1" style={{ color: COLORS.textMain, letterSpacing: "-0.02em" }}>Piyasa</h1>
      <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>Kriptoların canlı fiyatlarını takip et, incele ve işlem yap.</p>

      <Card height={480}>
        {COINS.map((coin, i) => {
          const change = priceChange(coin.symbol);
          return (
            <div
              key={coin.symbol}
              className="flex items-center justify-between py-4 gap-4 flex-wrap"
              style={{ borderBottom: i < COINS.length - 1 ? `1px solid ${COLORS.cardBorder}` : "none" }}
            >
              <div className="flex items-center gap-3" style={{ minWidth: 160 }}>
                <AssetBadge label={coin.symbol[0]} bg={coin.badgeBg} size={36} />
                <div>
                  <div className="font-bold text-sm" style={{ color: COLORS.textMain }}>{coin.name}</div>
                  <div className="text-xs" style={{ color: COLORS.textMuted }}>{coin.symbol}/USDT</div>
                </div>
              </div>

              <MiniSparkline points={history[coin.symbol]} color={change ? (change.up ? COLORS.successText : COLORS.errorText) : COLORS.yellow} />

              <div className="text-right" style={{ minWidth: 110 }}>
                <div className="font-bold text-sm" style={{ color: COLORS.textMain }}>{fmtUsd(prices[coin.symbol])}</div>
                {change && (
                  <div className="text-xs" style={{ color: change.up ? COLORS.successText : COLORS.errorText }}>{change.text}</div>
                )}
              </div>

              <button
                onClick={() => onInspect(coin.symbol)}
                className="rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors shrink-0"
                style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.yellow; e.currentTarget.style.color = COLORS.yellow; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.inputBorder; e.currentTarget.style.color = COLORS.textMain; }}
              >
                İncele
              </button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ---------------- COIN DETAIL VIEW (chart + buy/sell) ----------------

function LineChart({ points }) {
  if (!points || points.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height: 220, color: COLORS.textMuted, fontSize: 13 }}>
        Grafik verisi henüz oluşuyor...
      </div>
    );
  }
  const prices = points.map((p) => parseFloat(p.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 700, h = 220, pad = 10;
  const step = (w - pad * 2) / (prices.length - 1);
  const coords = prices.map((p, i) => [pad + i * step, h - pad - ((p - min) / range) * (h - pad * 2)]);
  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1][0].toFixed(1)} ${h} L ${coords[0][0].toFixed(1)} ${h} Z`;
  const up = prices[prices.length - 1] >= prices[0];
  const lineColor = up ? COLORS.successText : COLORS.errorText;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 220 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chartFade)" stroke="none" />
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CoinDetailView({ coin, price, lastPrice, history, historyLoading, userId, token, onBack, onTraded }) {
  const [action, setAction] = useState("BUY");
  const [usdValue, setUsdValue] = useState("");
  const [coinValue, setCoinValue] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState({ text: "", type: "" });

  const coinInfo = COINS.find((c) => c.symbol === coin);

  const change = (() => {
    if (!lastPrice || !price) return null;
    const diff = price - lastPrice;
    if (diff === 0) return null;
    const pct = ((diff / lastPrice) * 100).toFixed(2);
    return { up: diff > 0, text: (diff > 0 ? "▲ +" : "▼ ") + pct + "%" };
  })();

  const updateFromUsd = (val) => {
    setUsdValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && price > 0) {
      setCoinValue((num / price).toFixed(8));
    } else {
      setCoinValue("");
    }
  };

  const updateFromCoin = (val) => {
    setCoinValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && price > 0) {
      setUsdValue((num * price).toFixed(2));
    } else {
      setUsdValue("");
    }
  };

  const submitTrade = async (e) => {
    e.preventDefault();
    const amount = parseFloat(coinValue);
    if (!amount || amount <= 0) return;
    setTradeMessage({ text: "", type: "" });
    setTradeLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/trade/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: Number(userId), coinSymbol: coin, action, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTradeMessage({ text: data.error || data.message || "İşlem başarısız oldu.", type: "error" });
        return;
      }
      setTradeMessage({ text: data.message || "İşlem başarıyla gerçekleşti.", type: "success" });
      setUsdValue("");
      setCoinValue("");
      onTraded({
        action,
        coin,
        amount,
        price: data.executionPrice || price,
        total: data.totalCost || amount * price,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    } catch (err) {
      setTradeMessage({ text: "Sunucuya ulaşılamadı. Backend çalışıyor mu?", type: "error" });
    } finally {
      setTradeLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px]">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium mb-5"
        style={{ color: COLORS.textMuted }}
      >
        <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Piyasaya dön
      </button>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <AssetBadge label={coin[0]} bg={coinInfo?.badgeBg} size={44} />
        <div>
          <div className="font-bold text-xl" style={{ color: COLORS.textMain }}>{coinInfo?.name} <span style={{ color: COLORS.textMuted, fontWeight: 500 }}>· {coin}/USDT</span></div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg" style={{ color: COLORS.textMain }}>{fmtUsd(price)}</span>
            {change && <span className="text-sm" style={{ color: change.up ? COLORS.successText : COLORS.errorText }}>{change.text}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <Card title="Fiyat Grafiği" className="col-span-12 lg:col-span-7" height={480}>
          {historyLoading ? (
            <div className="flex items-center justify-center gap-2" style={{ height: 220, color: COLORS.textMuted, fontSize: 13 }}>
              <Spinner /> Yükleniyor...
            </div>
          ) : (
            <LineChart points={history} />
          )}
        </Card>

        <Card title={`${coin} Al / Sat`} className="col-span-12 lg:col-span-5" height={480}>
          <form onSubmit={submitTrade}>
            <div className="flex gap-2 mb-4">
              {["BUY", "SELL"].map((a) => {
                const isActive = action === a;
                const isBuy = a === "BUY";
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAction(a)}
                    className="flex-1 rounded-xl py-2.5 font-bold text-[13.5px] transition-all"
                    style={{
                      background: isActive ? (isBuy ? COLORS.successBg : COLORS.errorBg) : COLORS.inputBg,
                      border: `1px solid ${isActive ? (isBuy ? COLORS.successBorder : COLORS.errorBorder) : COLORS.inputBorder}`,
                      color: isActive ? (isBuy ? COLORS.successText : COLORS.errorText) : COLORS.textMuted,
                    }}
                  >
                    {isBuy ? "AL" : "SAT"}
                  </button>
                );
              })}
            </div>

            <div className="mb-3">
              <label className="block text-xs mb-2 font-medium" style={{ color: "#a3a3a3" }}>Dolar (USD)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={usdValue}
                  onChange={(e) => updateFromUsd(e.target.value)}
                  className="w-full rounded-xl pl-4 pr-14 py-3 text-sm outline-none"
                  style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: COLORS.textMuted }}>USD</span>
              </div>
            </div>

            <div className="flex justify-center my-1">
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: 28, height: 28, background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}` }}
              >
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}>
                  <path d="M7 10L12 15L17 10" stroke={COLORS.yellow} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>

            <div className="mb-4">
              <label className="block text-xs mb-2 font-medium" style={{ color: "#a3a3a3" }}>Miktar ({coin})</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.00000001"
                  min="0"
                  placeholder="0.00000000"
                  value={coinValue}
                  onChange={(e) => updateFromCoin(e.target.value)}
                  className="w-full rounded-xl pl-4 pr-14 py-3 text-sm outline-none"
                  style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: COLORS.textMuted }}>{coin}</span>
              </div>
            </div>

            <PrimaryButton type="submit" loading={tradeLoading} loadingText="Gönderiliyor...">
              {action === "BUY" ? "Satın Al" : "Sat"}
            </PrimaryButton>
          </form>
          <MessageBox text={tradeMessage.text} type={tradeMessage.type} />
        </Card>
      </div>
    </div>
  );
}

// ---------------- PORTFOLIO VIEW ----------------

function PortfolioView({ wallet, walletError, prices }) {
  const usdt = wallet ? parseFloat(wallet.usdtBalance || 0) : 0;
  const btcQty = wallet ? parseFloat(wallet.btcBalance || 0) : 0;
  const ethQty = wallet ? parseFloat(wallet.ethBalance || 0) : 0;
  const totalValue = usdt + btcQty * (prices.BTC || 0) + ethQty * (prices.ETH || 0);

  return (
    <div className="max-w-[1000px]">
      <h1 className="text-2xl font-bold mb-1" style={{ color: COLORS.textMain, letterSpacing: "-0.02em" }}>Portföyüm</h1>
      <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>Nakit bakiyen ve sahip olduğun varlıklar.</p>

      <Card height={480}>
        <div className="text-3xl font-bold mb-1" style={{ letterSpacing: "-0.02em", color: COLORS.textMain }}>{fmtUsd(totalValue)}</div>
        <div className="text-[13px] mb-5" style={{ color: COLORS.textMuted }}>Toplam Portföy Değeri (USDT + BTC + ETH)</div>

        {[
          { label: "USDT (Nakit)", badge: <AssetBadge label="$" bg={COLORS.yellow} />, qty: fmtUsd(usdt), val: null },
          { label: "BTC", badge: <AssetBadge label="B" bg="#f7931a" />, qty: btcQty.toFixed(6) + " BTC", val: fmtUsd(btcQty * (prices.BTC || 0)) },
          { label: "ETH", badge: <AssetBadge label="E" bg="#8a92b2" />, qty: ethQty.toFixed(6) + " ETH", val: fmtUsd(ethQty * (prices.ETH || 0)) },
        ].map((row, i, arr) => (
          <div
            key={row.label}
            className="flex justify-between items-center py-3 text-sm"
            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.cardBorder}` : "none" }}
          >
            <div className="flex items-center gap-2.5 font-semibold" style={{ color: COLORS.textMain }}>{row.badge}{row.label}</div>
            <div className="text-right">
              <div style={{ color: COLORS.textMain }}>{row.qty}</div>
              {row.val && <div className="text-[12.5px]" style={{ color: COLORS.textMuted }}>{row.val}</div>}
            </div>
          </div>
        ))}
        <MessageBox text={walletError} type="error" />
      </Card>
    </div>
  );
}

// ---------------- HISTORY VIEW ----------------

function HistoryView({ transactions, error, loading }) {
  return (
    <div className="max-w-[1000px]">
      <h1 className="text-2xl font-bold mb-1" style={{ color: COLORS.textMain, letterSpacing: "-0.02em" }}>İşlem Geçmişi</h1>
      <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>Bugüne kadar gerçekleştirdiğin tüm al/sat işlemleri.</p>

      <Card height={480}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8" style={{ color: COLORS.textMuted, fontSize: 13 }}>
            <Spinner /> Yükleniyor...
          </div>
        ) : error ? (
          <MessageBox text={error} type="error" />
        ) : transactions.length === 0 ? (
          <div className="text-center text-[13.5px] py-8" style={{ color: COLORS.textMuted }}>
            Henüz bir işlem yapmadın. Piyasa sayfasından bir coin seçip al/sat yapabilirsin.
          </div>
        ) : (
          transactions.map((t, i) => {
            const isBuy = t.transactionType === "BUY";
            return (
              <div
                key={t.id ?? i}
                className="flex justify-between items-center py-3.5 text-sm"
                style={{ borderBottom: i < transactions.length - 1 ? `1px solid ${COLORS.cardBorder}` : "none" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      background: isBuy ? COLORS.successBg : COLORS.errorBg,
                      color: isBuy ? COLORS.successText : COLORS.errorText,
                    }}
                  >
                    {isBuy ? "AL" : "SAT"}
                  </span>
                  <span className="font-semibold" style={{ color: COLORS.textMain }}>{t.assetName}</span>
                  <span style={{ color: COLORS.textMuted }}>{parseFloat(t.amount).toFixed(6)} {t.assetName}</span>
                </div>
                <div className="text-right">
                  <div style={{ color: COLORS.textMain }}>{fmtUsd(t.totalCost)}</div>
                  <div className="text-[11.5px]" style={{ color: COLORS.textMuted }}>
                    {new Date(t.createdAt).toLocaleString("tr-TR")}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

// ---------------- COPCOIN AI WIDGET (floating bottom-right) ----------------

function AiWidget({ token }) {
  const [open, setOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [aiLog, setAiLog] = useState([]);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState({ text: "", type: "" });
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [aiLog, aiLoading]);

  const openPanel = () => {
    setOpen(true);
    setBubbleDismissed(true);
  };

  const submitAi = async (e) => {
    e.preventDefault();
    const question = aiQuestion.trim();
    if (!question) return;
    setAiMessage({ text: "", type: "" });
    setAiLog((log) => [...log, { role: "question", text: question }]);
    setAiQuestion("");
    setAiLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/ai/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiMessage({ text: data.error || data.message || "Yapay zeka servisi şu anda yanıt vermiyor. Lütfen daha sonra tekrar deneyiniz.", type: "error" });
        return;
      }
      setAiLog((log) => [...log, { role: "answer", text: data.answer }]);
    } catch (err) {
      setAiMessage({ text: "Sunucuya ulaşılamadı. Backend çalışıyor mu?", type: "error" });
    } finally {
      setAiLoading(false);
    }
  };

  const botIconPath = "M12 3L14 9L20 12L14 15L12 21L10 15L4 12L10 9L12 3Z";

  return (
    <>
      {/* Konuşma balonu */}
      {!open && !bubbleDismissed && (
        <div
          className="fixed z-40 flex items-end gap-2"
          style={{ bottom: 96, right: 24, maxWidth: 260 }}
        >
          <div
            onClick={openPanel}
            className="rounded-2xl rounded-br-sm px-4 py-3 text-[13px] cursor-pointer transition-transform hover:-translate-y-0.5"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textMain, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.6)", lineHeight: 1.45 }}
          >
            <div className="font-bold mb-0.5" style={{ color: COLORS.yellow }}>CopCoin AI</div>
            Merhaba! Portföyün ve piyasa trendleri hakkında merak ettiklerini sorabilirsin — yardımcı olayım mı?
          </div>
          <button
            onClick={() => setBubbleDismissed(true)}
            className="rounded-full flex items-center justify-center shrink-0"
            style={{ width: 20, height: 20, background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMuted, fontSize: 11, marginBottom: 2 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Yuvarlak buton */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed flex items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          bottom: 24, right: 24, width: 58, height: 58,
          background: `linear-gradient(155deg, ${COLORS.yellow}, #e0ac00)`,
          boxShadow: "0 10px 30px -8px rgba(253,199,0,0.55)",
          zIndex: open ? 20 : 60,
        }}
        aria-label="CopCoin AI Botu"
      >
        <svg viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }}>
          <path d={botIconPath} stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Sağdan açılan panel */}
      <div
        className="fixed top-0 right-0 h-full flex flex-col transition-transform duration-300"
        style={{
          width: 300,
          maxWidth: "88vw",
          background: COLORS.sidebar,
          borderLeft: `1px solid ${COLORS.cardBorder}`,
          transform: open ? "translateX(0)" : "translateX(100%)",
          boxShadow: open ? "-20px 0 50px -20px rgba(0,0,0,0.6)" : "none",
          zIndex: 50,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
          <span
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 34, height: 34, background: `linear-gradient(155deg, ${COLORS.yellow}, #e0ac00)` }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 17, height: 17 }}>
              <path d={botIconPath} stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="flex-1">
            <div className="font-bold text-sm" style={{ color: COLORS.textMain }}>CopCoin AI</div>
            <div className="text-[11.5px]" style={{ color: COLORS.textMuted }}>Size nasıl yardımcı olabilirim?</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg flex items-center justify-center shrink-0"
            style={{ width: 28, height: 28, background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMuted }}
            aria-label="Kapat"
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}>
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {aiLog.length === 0 && (
            <div className="text-center text-[13px] py-6 px-2" style={{ color: COLORS.textMuted }}>
              Portföyün ve piyasa trendleri hakkında bir soru sor.
            </div>
          )}
          {aiLog.map((entry, i) => (
            <div
              key={i}
              className="rounded-2xl px-3.5 py-3 text-[13.3px]"
              style={{
                lineHeight: 1.5,
                maxWidth: "88%",
                alignSelf: entry.role === "question" ? "flex-end" : "flex-start",
                background: entry.role === "question" ? COLORS.inputBg : "#151107",
                color: entry.role === "question" ? COLORS.textMain : "#f4e2a6",
                border: `1px solid ${entry.role === "question" ? COLORS.inputBorder : "#2a2210"}`,
              }}
            >
              {entry.text}
            </div>
          ))}
          {aiLoading && (
            <div className="flex items-center gap-2 self-start text-[12.5px]" style={{ color: COLORS.textMuted }}>
              <Spinner /> Düşünüyor...
            </div>
          )}
          <div ref={logEndRef} />
        </div>

        <div className="px-4 pb-4 pt-2" style={{ borderTop: `1px solid ${COLORS.cardBorder}` }}>
          <MessageBox text={aiMessage.text} type={aiMessage.type} />
          <form onSubmit={submitAi} className="mt-2">
            <div className="flex items-end gap-2">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Bir şeyler sor..."
                required
                rows={1}
                className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none"
                style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitAi(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{ width: 40, height: 40, background: COLORS.yellow, opacity: aiLoading ? 0.6 : 1 }}
              >
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 17, height: 17 }}>
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#141414" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ---------------- ACCOUNT PANEL (profil, sifre degistir, hesap sil) ----------------

function AccountPanel({ token, username, userId, onClose, onAccountDeleted }) {
  const [tab, setTab] = useState("info"); // info | password | danger

  // sifre degistirme formu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: "", type: "" });

  // hesap silme onayi
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState({ text: "", type: "" });

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setPwMessage({ text: "", type: "" });

    if (newPassword !== confirmPassword) {
      setPwMessage({ text: "Yeni şifreler birbiriyle uyuşmuyor.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setPwMessage({ text: "Yeni şifre en az 6 karakter olmalı.", type: "error" });
      return;
    }

    setPwLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMessage({ text: data.error || data.message || "Şifre değiştirilemedi.", type: "error" });
        return;
      }
      setPwMessage({ text: data.message || "Şifre güncellendi.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwMessage({ text: "Sunucuya ulaşılamadı. Backend çalışıyor mu?", type: "error" });
    } finally {
      setPwLoading(false);
    }
  };

  const submitDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteMessage({ text: "", type: "" });
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMessage({ text: data.error || data.message || "Hesap silinemedi.", type: "error" });
        return;
      }
      onAccountDeleted();
    } catch (err) {
      setDeleteMessage({ text: "Sunucuya ulaşılamadı. Backend çalışıyor mu?", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { key: "info", label: "Hesap Bilgileri" },
    { key: "password", label: "Şifre Değiştir" },
    { key: "danger", label: "Hesap Silme" },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 70 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-3xl overflow-hidden"
        style={{ maxWidth: 440, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, boxShadow: "0 40px 90px -30px rgba(0,0,0,0.9)" }}
      >
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
          <span
            className="flex items-center justify-center rounded-full font-bold text-base shrink-0"
            style={{ width: 44, height: 44, background: COLORS.yellow, color: "#141414" }}
          >
            {username?.[0]?.toUpperCase() || "?"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: COLORS.textMain }}>{username}</div>
            <div className="text-[11.5px]" style={{ color: COLORS.textMuted }}>Hesap Ayarları</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg flex items-center justify-center shrink-0"
            style={{ width: 30, height: 30, background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMuted }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 15, height: 15 }}>
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3">
          {tabs.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-colors"
                style={{
                  background: isActive ? "rgba(253,199,0,0.1)" : "transparent",
                  color: isActive ? COLORS.yellow : COLORS.textMuted,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-5" style={{ minHeight: 320 }}>
          {tab === "info" && (
            <div>
              <div className="flex justify-between items-center py-3 text-sm">
                <span style={{ color: COLORS.textMuted }}>Kullanıcı Adı</span>
                <span className="font-semibold" style={{ color: COLORS.textMain }}>{username}</span>
              </div>
            </div>
          )}

          {tab === "password" && (
            <form onSubmit={submitPasswordChange}>
              <Field label="Mevcut Şifre" type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              <Field label="Yeni Şifre" type="password" placeholder="En az 6 karakter" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <Field label="Yeni Şifre (Tekrar)" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <PrimaryButton type="submit" loading={pwLoading} loadingText="Güncelleniyor...">Şifreyi Güncelle</PrimaryButton>
              <MessageBox text={pwMessage.text} type={pwMessage.type} />
            </form>
          )}

          {tab === "danger" && (
            <div>
              <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}` }}
              >
                <div className="font-bold text-sm mb-1.5" style={{ color: COLORS.errorText }}>Hesabı kalıcı olarak sil</div>
                <p className="text-[12.5px] leading-relaxed" style={{ color: COLORS.textMuted }}>
                  Bu işlem geri alınamaz. Cüzdanın, işlem geçmişin ve hesap bilgilerin tamamen silinir.
                </p>
              </div>

              {!deleteConfirming ? (
                <button
                  onClick={() => setDeleteConfirming(true)}
                  className="w-full rounded-2xl py-3 font-bold text-sm"
                  style={{ background: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, color: COLORS.errorText }}
                >
                  Hesabımı Sil
                </button>
              ) : (
                <form onSubmit={submitDeleteAccount}>
                  <Field label="Onaylamak için şifreni gir" type="password" placeholder="••••••••" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setDeleteConfirming(false); setDeletePassword(""); setDeleteMessage({ text: "", type: "" }); }}
                      className="flex-1 rounded-xl py-3 text-sm font-semibold"
                      style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={deleteLoading}
                      className="flex-1 rounded-xl py-3 text-sm font-bold"
                      style={{ background: COLORS.errorText, color: "#1a0000", opacity: deleteLoading ? 0.6 : 1 }}
                    >
                      {deleteLoading ? "Siliniyor..." : "Evet, Sil"}
                    </button>
                  </div>
                  <MessageBox text={deleteMessage.text} type={deleteMessage.type} />
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- DASHBOARD ROOT ----------------

function Dashboard({ session, onLogout, onAccountDeleted }) {
  const { token, username, userId } = session;

  const [view, setView] = useState("home"); // home | portfolio | history | ai
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);

  const [prices, setPrices] = useState({ BTC: 0, ETH: 0 });
  const [lastPrices, setLastPrices] = useState({ BTC: null, ETH: null });

  const [homeHistory, setHomeHistory] = useState({ BTC: [], ETH: [] });
  const [detailHistory, setDetailHistory] = useState([]);
  const [detailHistoryLoading, setDetailHistoryLoading] = useState(false);

  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [transactionsError, setTransactionsError] = useState("");
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const loadPrices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/market/prices`);
      const data = await res.json();
      const btc = parseFloat(data.BTC);
      const eth = parseFloat(data.ETH);
      setPrices((prevPrices) => {
        setLastPrices({ BTC: prevPrices.BTC || null, ETH: prevPrices.ETH || null });
        return { BTC: btc, ETH: eth };
      });
    } catch (err) {
      // fiyat çekilemezse sessiz geç
    }
  }, []);

  const loadHomeHistory = useCallback(async () => {
    try {
      const [btcRes, ethRes] = await Promise.all([
        fetch(`${API_BASE}/api/market/history?asset=BTC`),
        fetch(`${API_BASE}/api/market/history?asset=ETH`),
      ]);
      const btcData = await btcRes.json();
      const ethData = await ethRes.json();
      setHomeHistory({ BTC: btcData.slice(-30), ETH: ethData.slice(-30) });
    } catch (err) {}
  }, []);

  const loadDetailHistory = useCallback(async (symbol) => {
    setDetailHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/market/history?asset=${symbol}`);
      const data = await res.json();
      setDetailHistory(data.slice(-60));
    } catch (err) {
      setDetailHistory([]);
    } finally {
      setDetailHistoryLoading(false);
    }
  }, []);

  const loadWallet = useCallback(async () => {
    if (!userId) return;
    setWalletError("");
    try {
      const res = await apiFetch(`${API_BASE}/api/wallet/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) {
        setWalletError(data.error || data.message || "Cüzdan bilgisi alınamadı.");
        return;
      }
      setWallet(data);
    } catch (err) {
      setWalletError("Sunucuya ulaşılamadı. Backend çalışıyor mu?");
    }
  }, [token, userId]);

  // islem gecmisini artik backend'den cekiyoruz, sayfa yenilense de kaybolmuyor
  const loadTransactions = useCallback(async () => {
    if (!userId) return;
    setTransactionsError("");
    try {
      const res = await apiFetch(`${API_BASE}/api/wallet/${userId}/transactions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) {
        setTransactionsError(data.error || data.message || "İşlem geçmişi alınamadı.");
        return;
      }
      setTransactions(data);
    } catch (err) {
      setTransactionsError("Sunucuya ulaşılamadı. Backend çalışıyor mu?");
    } finally {
      setTransactionsLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    loadPrices();
    loadHomeHistory();
    const interval = setInterval(() => { loadPrices(); loadHomeHistory(); }, 15000);
    return () => clearInterval(interval);
  }, [loadPrices, loadHomeHistory]);

  useEffect(() => { loadWallet(); }, [loadWallet]);
  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  useEffect(() => {
    if (view === "detail" && selectedCoin) {
      loadDetailHistory(selectedCoin);
    }
  }, [view, selectedCoin, loadDetailHistory]);

  const handleInspect = (symbol) => {
    setSelectedCoin(symbol);
    setView("detail");
  };

  const handleTraded = () => {
    loadWallet();
    loadTransactions();
  };

  const handleNavigate = (key) => {
    setView(key);
    setSelectedCoin(null);
  };

  return (
    <div className="min-h-screen flex" style={pageBg}>
      <Sidebar
        active={view === "detail" ? "home" : view}
        onNavigate={handleNavigate}
        username={username}
        onLogout={onLogout}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <div className="flex-1 flex flex-col">
        <MobileNav active={view === "detail" ? "home" : view} onNavigate={handleNavigate} />
        <div className="flex-1 p-6 md:p-8" style={{ color: COLORS.textMain, minHeight: 640 }}>
          {view === "home" && <HomeView prices={prices} lastPrices={lastPrices} history={homeHistory} onInspect={handleInspect} />}

          {view === "detail" && selectedCoin && (
            <CoinDetailView
              coin={selectedCoin}
              price={prices[selectedCoin]}
              lastPrice={lastPrices[selectedCoin]}
              history={detailHistory}
              historyLoading={detailHistoryLoading}
              userId={userId}
              token={token}
              onBack={() => { setView("home"); setSelectedCoin(null); }}
              onTraded={handleTraded}
            />
          )}

          {view === "portfolio" && <PortfolioView wallet={wallet} walletError={walletError} prices={prices} />}
          {view === "history" && <HistoryView transactions={transactions} error={transactionsError} loading={transactionsLoading} />}
        </div>
      </div>

      <AiWidget token={token} />

      {accountOpen && (
        <AccountPanel
          token={token}
          username={username}
          userId={userId}
          onClose={() => setAccountOpen(false)}
          onAccountDeleted={onAccountDeleted}
        />
      )}
    </div>
  );
}

// ---------------- APP ROOT ----------------

const SESSION_KEY = "copcoin_session";

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [expiredNotice, setExpiredNotice] = useState(false);

  const handleAuthed = (s) => {
    setSession(s);
    setExpiredNotice(false);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  };

  const handleLogout = async () => {
    if (session?.token) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` } });
      } catch (e) {}
    }
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  // hesap silindiginde backend zaten oturumu Redis'ten temizliyor, burada sadece local session'i sifirliyoruz
  const handleAccountDeleted = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  // herhangi bir istek 401 donerse (token suresi dolmus/gecersiz) otomatik cikis yapip
  // kullaniciya net bir uyari gosteriyoruz, "Unauthorized" gibi teknik bir yazi yerine
  useEffect(() => {
    sessionExpiredHandler = () => {
      sessionStorage.removeItem(SESSION_KEY);
      setSession(null);
      setExpiredNotice(true);
    };
    return () => { sessionExpiredHandler = null; };
  }, []);

  const numberInputStyle = (
    <style>{`
      input[type=number]::-webkit-outer-spin-button,
      input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type=number] {
        -moz-appearance: textfield;
      }
    `}</style>
  );

  if (!session) return (<>{numberInputStyle}<AuthScreen onAuthed={handleAuthed} expiredNotice={expiredNotice} /></>);
  return (<>{numberInputStyle}<Dashboard session={session} onLogout={handleLogout} onAccountDeleted={handleAccountDeleted} /></>);
}
