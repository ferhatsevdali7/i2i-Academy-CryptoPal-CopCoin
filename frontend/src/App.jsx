import React, { useState, useEffect, useCallback } from "react";

// Backend'in çalıştığı adres (local Spring Boot varsayılan portu)
const API_BASE = "http://localhost:8080";

const COLORS = {
  bg: "#000000",
  card: "#0a0a0a",
  cardBorder: "#1c1c1c",
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

function IconBadge({ size = 56, radius = 16 }) {
  return (
    <div
      className="flex items-center justify-center mx-auto"
      style={{ width: size, height: size, background: COLORS.yellow, borderRadius: radius }}
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
      <label className="block text-xs mb-2" style={{ color: "#b3b3b3" }}>{label}</label>
      <input
        {...props}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
        onFocus={(e) => { e.target.style.borderColor = COLORS.yellow; e.target.style.background = "#161616"; }}
        onBlur={(e) => { e.target.style.borderColor = COLORS.inputBorder; e.target.style.background = COLORS.inputBg; }}
      />
    </div>
  );
}

function PrimaryButton({ children, loading, loadingText, ghost, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="w-full rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 transition"
      style={{
        background: ghost ? COLORS.inputBg : COLORS.yellow,
        color: ghost ? COLORS.textMain : "#141414",
        border: ghost ? `1px solid ${COLORS.inputBorder}` : "none",
        opacity: loading || props.disabled ? 0.6 : 1,
        cursor: loading || props.disabled ? "not-allowed" : "pointer",
      }}
    >
      {loading ? (<><Spinner /><span>{loadingText || "Lütfen bekleyin..."}</span></>) : children}
    </button>
  );
}

// ---------------- AUTH SCREEN ----------------

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

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
        // RegisterResponse id döndürüyor, bunu login sonrası dashboard'a taşıyoruz
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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: COLORS.bg }}>
      <div
        className="w-full rounded-3xl px-8 pt-10 pb-8"
        style={{ maxWidth: 380, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }}
      >
        <div className="mb-5"><IconBadge /></div>

        {isLogin ? (
          <>
            <h1 className="text-center font-bold text-2xl mb-2" style={{ color: COLORS.textMain, letterSpacing: "-0.02em" }}>
              Hoş Geldiniz
            </h1>
            <p className="text-center text-sm mb-7 px-1.5" style={{ color: COLORS.textMuted, lineHeight: 1.5 }}>
              İşlemlerinize devam etmek için lütfen giriş yapınız
            </p>
          </>
        ) : (
          <>
            <h1 className="text-center font-bold text-2xl mb-2" style={{ color: COLORS.textMain, letterSpacing: "-0.02em" }}>
              Aramıza Katıl
            </h1>
            <p className="text-center text-sm mb-7 px-1.5" style={{ color: COLORS.textMuted, lineHeight: 1.5 }}>
              Hesabını oluştur, sana özel başlangıç bakiyesiyle işlem yapmaya başla
            </p>
          </>
        )}

        <form onSubmit={submit}>
          <Field
            label="Kullanıcı Adı"
            type="text"
            placeholder="Kullanıcı adınız"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Field
            label="Şifre"
            type="password"
            placeholder="••••••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <PrimaryButton
            type="submit"
            loading={loading}
            loadingText={isLogin ? "Giriş yapılıyor..." : "Kayıt oluşturuluyor..."}
          >
            <span>{isLogin ? "Giriş Yap" : "Kayıt Ol"}</span>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
              <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#141414" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PrimaryButton>
        </form>

        <MessageBox text={message.text} type={message.type} />

        <p className="text-center text-sm mt-5" style={{ color: COLORS.textMuted }}>
          {isLogin ? (
            <>Hesabın yok mu?{" "}
              <a onClick={() => switchMode("register")} className="font-bold cursor-pointer" style={{ color: COLORS.yellow }}>
                Kayıt Ol
              </a>
            </>
          ) : (
            <>Zaten hesabın var mı?{" "}
              <a onClick={() => switchMode("login")} className="font-bold cursor-pointer" style={{ color: COLORS.yellow }}>
                Giriş Yap
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ---------------- DASHBOARD ----------------

function fmtUsd(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return "-";
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Card({ title, className = "", children }) {
  return (
    <div className={`rounded-[20px] p-6 ${className}`} style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }}>
      <h2 className="flex items-center gap-2 text-sm mb-4.5" style={{ color: COLORS.textMain }}>
        <span className="inline-block rounded-full" style={{ width: 7, height: 7, background: COLORS.yellow }} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function AssetBadge({ label, bg }) {
  return (
    <span
      className="flex items-center justify-center rounded-lg font-bold text-[11px]"
      style={{ width: 28, height: 28, background: bg, color: "#141414" }}
    >
      {label}
    </span>
  );
}

function Dashboard({ session, onLogout }) {
  const { token, username } = session;
  const [userId, setUserId] = useState(session.userId || "");
  const [idInput, setIdInput] = useState("");

  const [prices, setPrices] = useState({ BTC: 0, ETH: 0 });
  const [lastPrices, setLastPrices] = useState({ BTC: null, ETH: null });
  const [priceError, setPriceError] = useState("");

  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState("");

  const [action, setAction] = useState("BUY");
  const [coin, setCoin] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState({ text: "", type: "" });

  const [aiLog, setAiLog] = useState([]); // {role:'question'|'answer', text}
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState({ text: "", type: "" });

  const authHeaders = useCallback((json) => {
    const h = { Authorization: `Bearer ${token}` };
    if (json) h["Content-Type"] = "application/json";
    return h;
  }, [token]);

  const loadPrices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/market/prices`);
      const data = await res.json();
      const btc = parseFloat(data.BTC);
      const eth = parseFloat(data.ETH);
      setLastPrices({ BTC: prices.BTC || null, ETH: prices.ETH || null });
      setPrices({ BTC: btc, ETH: eth });
      setPriceError("");
    } catch (err) {
      setPriceError("Fiyatlara ulaşılamadı. Backend çalışıyor mu?");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWallet = useCallback(async (id) => {
    if (!id) return;
    setWalletError("");
    try {
      const res = await fetch(`${API_BASE}/api/wallet/${id}`, { headers: authHeaders(false) });
      const data = await res.json();
      if (!res.ok) {
        setWalletError(data.error || data.message || "Cüzdan bilgisi alınamadı.");
        return;
      }
      setWallet(data);
    } catch (err) {
      setWalletError("Sunucuya ulaşılamadı. Backend çalışıyor mu?");
    }
  }, [authHeaders]);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 15000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  useEffect(() => {
    if (userId) loadWallet(userId);
  }, [userId, loadWallet]);

  const saveUserId = () => {
    if (!idInput.trim()) return;
    setUserId(idInput.trim());
  };

  const submitTrade = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setTradeMessage({ text: "", type: "" });
    setTradeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/trade/order`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ userId: Number(userId), coinSymbol: coin, action, amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTradeMessage({ text: data.error || data.message || "İşlem başarısız oldu.", type: "error" });
        return;
      }
      setTradeMessage({ text: data.message || "İşlem başarıyla gerçekleşti.", type: "success" });
      setAmount("");
      loadWallet(userId);
    } catch (err) {
      setTradeMessage({ text: "Sunucuya ulaşılamadı. Backend çalışıyor mu?", type: "error" });
    } finally {
      setTradeLoading(false);
    }
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
      const res = await fetch(`${API_BASE}/api/ai/query`, {
        method: "POST",
        headers: authHeaders(true),
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

  const usdt = wallet ? parseFloat(wallet.usdtBalance || 0) : 0;
  const btcQty = wallet ? parseFloat(wallet.btcBalance || 0) : 0;
  const ethQty = wallet ? parseFloat(wallet.ethBalance || 0) : 0;
  const totalValue = usdt + btcQty * (prices.BTC || 0) + ethQty * (prices.ETH || 0);

  function priceChange(sym) {
    const last = lastPrices[sym];
    const current = prices[sym];
    if (last === null || last === undefined || !current) return null;
    const diff = current - last;
    if (diff === 0) return null;
    const pct = ((diff / last) * 100).toFixed(2);
    return { up: diff > 0, text: (diff > 0 ? "▲ +" : "▼ ") + pct + "%" };
  }

  return (
    <div className="min-h-screen p-6" style={{ background: COLORS.bg, color: COLORS.textMain }}>
      <div className="max-w-[1100px] mx-auto mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <IconBadge size={40} radius={12} />
          <span className="font-bold text-lg">CryptoPal</span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="text-sm" style={{ color: COLORS.textMuted }}>
            Hoş geldin, <b style={{ color: COLORS.textMain }}>{username}</b>
          </span>
          <button
            onClick={onLogout}
            className="rounded-xl px-4 py-2 text-[13.5px]"
            style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {!userId && (
        <div
          className="max-w-[1100px] mx-auto mb-5 rounded-2xl px-4.5 py-3.5 text-[13.5px] flex items-center gap-3 flex-wrap"
          style={{ background: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, color: COLORS.errorText }}
        >
          <span>Backend girişte kullanıcı ID'si döndürmüyor, cüzdan/trade uçları için gerekli. ID'ni gir:</span>
          <input
            type="number"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            placeholder="örn: 1"
            className="rounded-lg px-3 py-2 text-[13.5px]"
            style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain, width: 100 }}
          />
          <button
            onClick={saveUserId}
            className="rounded-lg px-3.5 py-2 font-bold text-[13px]"
            style={{ background: COLORS.yellow, color: "#141414" }}
          >
            Kaydet
          </button>
        </div>
      )}

      <div className="max-w-[1100px] mx-auto grid grid-cols-12 gap-5">

        {/* WALLET */}
        <Card title="Cüzdanım" className="col-span-12 md:col-span-5">
          <div className="text-3xl font-bold mb-1" style={{ letterSpacing: "-0.02em" }}>{fmtUsd(totalValue)}</div>
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
              <div className="flex items-center gap-2.5 font-semibold">{row.badge}{row.label}</div>
              <div className="text-right">
                <div>{row.qty}</div>
                {row.val && <div className="text-[12.5px]" style={{ color: COLORS.textMuted }}>{row.val}</div>}
              </div>
            </div>
          ))}
          <MessageBox text={walletError} type="error" />
        </Card>

        {/* MARKET PRICES */}
        <Card title="Piyasa Fiyatları (Canlı)" className="col-span-12 md:col-span-7">
          {["BTC", "ETH"].map((sym) => {
            const change = priceChange(sym);
            return (
              <div key={sym} className="flex justify-between items-center py-3.5" style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                <div className="flex items-center gap-2.5 font-semibold">
                  <AssetBadge label={sym[0]} bg={sym === "BTC" ? "#f7931a" : "#8a92b2"} />
                  {sym}/USDT
                </div>
                <div>
                  <span className="font-bold text-base">{fmtUsd(prices[sym])}</span>
                  {change && (
                    <span className="text-xs ml-2" style={{ color: change.up ? COLORS.successText : COLORS.errorText }}>
                      {change.text}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div className="text-xs text-center mt-3.5" style={{ color: COLORS.textMuted }}>
            {priceError || "15 saniyede bir otomatik güncellenir"}
          </div>
        </Card>

        {/* TRADE */}
        <Card title="Al / Sat" className="col-span-12 md:col-span-6">
          <form onSubmit={submitTrade}>
            <div className="flex gap-2 mb-4">
              {["BUY", "SELL"].map((a) => {
                const active = action === a;
                const isBuy = a === "BUY";
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAction(a)}
                    className="flex-1 rounded-xl py-2.5 font-bold text-[13.5px]"
                    style={{
                      background: active ? (isBuy ? COLORS.successBg : COLORS.errorBg) : COLORS.inputBg,
                      border: `1px solid ${active ? (isBuy ? COLORS.successBorder : COLORS.errorBorder) : COLORS.inputBorder}`,
                      color: active ? (isBuy ? COLORS.successText : COLORS.errorText) : COLORS.textMuted,
                    }}
                  >
                    {isBuy ? "AL" : "SAT"}
                  </button>
                );
              })}
            </div>

            <div className="mb-4">
              <label className="block text-xs mb-2" style={{ color: "#b3b3b3" }}>Varlık</label>
              <select
                value={coin}
                onChange={(e) => setCoin(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain }}
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>

            <Field
              label="Miktar"
              type="number"
              step="0.0001"
              min="0"
              placeholder="örn: 0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <PrimaryButton type="submit" loading={tradeLoading} loadingText="Gönderiliyor...">
              Emri Gönder
            </PrimaryButton>
          </form>
          <MessageBox text={tradeMessage.text} type={tradeMessage.type} />
        </Card>

        {/* AI ASSISTANT */}
        <Card title="Yapay Zeka Asistanı" className="col-span-12 md:col-span-6">
          <div className="flex flex-col gap-3 mb-4 overflow-y-auto" style={{ maxHeight: 260 }}>
            {aiLog.length === 0 && (
              <div className="text-center text-[13.5px] py-5 px-2.5" style={{ color: COLORS.textMuted }}>
                Portföyün ve piyasa trendleri hakkında bir soru sor.
              </div>
            )}
            {aiLog.map((entry, i) => (
              <div
                key={i}
                className="rounded-2xl px-3.5 py-3 text-[13.8px]"
                style={{
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  maxWidth: entry.role === "question" ? "85%" : "90%",
                  alignSelf: entry.role === "question" ? "flex-end" : "flex-start",
                  background: entry.role === "question" ? COLORS.inputBg : "#151107",
                  color: entry.role === "question" ? COLORS.textMain : "#f4e2a6",
                  border: `1px solid ${entry.role === "question" ? COLORS.inputBorder : "#2a2210"}`,
                }}
              >
                {entry.text}
              </div>
            ))}
          </div>

          <form onSubmit={submitAi}>
            <div className="mb-4">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="örn: BTC trendine göre alım yapmalı mıyım?"
                required
                className="w-full rounded-xl px-3.5 py-3 text-sm outline-none resize-y"
                style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}`, color: COLORS.textMain, minHeight: 80 }}
              />
            </div>
            <PrimaryButton type="submit" ghost loading={aiLoading} loadingText="Düşünüyor...">
              Sor
            </PrimaryButton>
          </form>
          <MessageBox text={aiMessage.text} type={aiMessage.type} />
        </Card>

      </div>
    </div>
  );
}

// ---------------- APP ROOT ----------------

export default function App() {
  const [session, setSession] = useState(null); // { token, username, balance, userId }

  const handleAuthed = (s) => setSession(s);
  const handleLogout = async () => {
    if (session?.token) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.token}` },
        });
      } catch (e) {}
    }
    setSession(null);
  };

  if (!session) return <AuthScreen onAuthed={handleAuthed} />;
  return <Dashboard session={session} onLogout={handleLogout} />;
}
