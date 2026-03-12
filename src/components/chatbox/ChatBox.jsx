import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { displayMoney } from "../../helpers/utils";
import { history } from "../../routers/AppRouter";
import firebase from "../../services/firebase";
import { getAIReply } from "../../services/chatService";
import logo from "./logo-chatbox.png";
import robot from "./robot.jpg";
import "../../styles/7 - chatbox/chatbox.css";

// # GHI CHÚ:
// Cooldown ngắn ở client để tránh người dùng bấm gửi liên tục.
const SEND_COOLDOWN_MS = 1200;
const MAX_HISTORY = 20;
const SESSION_PREFIX = "stylist_ai_session:";
const STREAM_WORDS_PER_CHUNK = 10;
const STREAM_MIN_DELAY_MS = 24;
const STREAM_MAX_DELAY_MS = 76;

// # GHI CHÚ:
// Các gợi ý nhanh để người dùng có thể thử ngay mà không cần tự gõ.
const QUICK_SUGGESTIONS = [
  "Tư vấn áo khoác dưới 150.000",
  "Gợi ý áo sơ mi đi làm",
  "Có size gì?",
  "Có màu gì?"
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// # GHI CHÚ:
// SafeLink fallback sang thẻ <a> nếu chưa có Router context.
const SafeLink = ({ to, children, ...rest }) => {
  const href = typeof to === "string" ? to : to?.pathname || "/";
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        if (rest.onClick) rest.onClick(e);
        if (e.defaultPrevented) return;

        if (history && typeof history.push === "function" && href.startsWith("/")) {
          e.preventDefault();
          history.push(href);
        }
      }}
    >
      {children}
    </a>
  );
};

// # GHI CHÚ:
// Streaming theo cụm từ/câu để tránh cắt cụt giữa từ hoặc mất đoạn cuối.
const splitTextForStreaming = (text = "") => {
  const clean = String(text || "").trim();
  if (!clean) return [];

  const sentenceParts = clean.match(/[^.!?…]+[.!?…]?/g)?.map((s) => s.trim()).filter(Boolean) || [clean];
  const chunks = [];

  sentenceParts.forEach((sentence) => {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (words.length <= STREAM_WORDS_PER_CHUNK) {
      chunks.push(sentence);
      return;
    }

    for (let i = 0; i < words.length; i += STREAM_WORDS_PER_CHUNK) {
      chunks.push(words.slice(i, i + STREAM_WORDS_PER_CHUNK).join(" "));
    }
  });

  return chunks;
};

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// # GHI CHÚ:
// Hàm tạo message có id duy nhất, giúp React render list ổn định.
const createMessage = (sender, text, extra = {}) => ({
  id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sender,
  text,
  ...extra
});

const parseWeight = (normText) => {
  const byKg = normText.match(/(\d{2,3})\s*(kg|kilogram|kilo)\b/);
  if (byKg) return Number(byKg[1]);

  const byNang = normText.match(/\bnang\s*(\d{2,3})\b/);
  if (byNang) return Number(byNang[1]);

  return null;
};

const parseHeight = (normText) => {
  const byCm = normText.match(/(\d{3})\s*(cm|centimet|centimeter)\b/);
  if (byCm) return Number(byCm[1]);

  const byMeterPair = normText.match(/\b1\s*m\s*(\d{2})\b/);
  if (byMeterPair) return Number(`1${byMeterPair[1]}`);

  const byCao = normText.match(/\bcao\s*(\d(?:[.,]\d{2})|\d{3})\b/);
  if (byCao) {
    const raw = byCao[1].replace(",", ".");
    if (raw.includes(".")) {
      const meter = Number(raw);
      if (Number.isFinite(meter)) return Math.round(meter * 100);
    }
    const cm = Number(raw);
    if (Number.isFinite(cm)) return cm;
  }

  return null;
};

const extractBodyProfile = (message = "") => {
  const norm = normalizeText(message);
  const height = parseHeight(norm);
  const weight = parseWeight(norm);

  return {
    height: Number.isFinite(height) && height >= 120 && height <= 230 ? height : null,
    weight: Number.isFinite(weight) && weight >= 30 && weight <= 200 ? weight : null
  };
};

const parseRecommendedPayload = (rawText = "") => {
  const text = String(rawText || "").trim();
  if (!text) return { cleanText: "", recommendedProducts: [] };

  let parsed = null;
  let payloadStart = -1;

  const fenced = text.match(/```json\s*([\s\S]*?)\s*```\s*$/i);
  if (fenced) {
    try {
      const obj = JSON.parse(fenced[1]);
      if (obj && typeof obj === "object") {
        parsed = obj;
        payloadStart = text.lastIndexOf("```");
      }
    } catch {
      // # GHI CHÚ: Parse lỗi thì bỏ qua payload, vẫn giữ câu trả lời gốc.
    }
  }

  if (!parsed) {
    const bracePositions = [];
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === "{") bracePositions.push(i);
    }

    for (let i = bracePositions.length - 1; i >= 0; i -= 1) {
      const start = bracePositions[i];
      const candidate = text.slice(start).trim();
      if (!candidate.endsWith("}")) continue;

      try {
        const obj = JSON.parse(candidate);
        if (obj && typeof obj === "object") {
          parsed = obj;
          payloadStart = start;
          break;
        }
      } catch {
        // # GHI CHÚ: Thử tiếp vị trí "{" trước đó để tăng độ chịu lỗi.
      }
    }
  }

  const ids = Array.isArray(parsed?.recommendedProducts)
    ? parsed.recommendedProducts.filter((id) => typeof id === "string" && id.trim())
    : [];

  const cleanText = payloadStart >= 0 ? text.slice(0, payloadStart).trim() : text;
  return {
    cleanText: cleanText || text,
    recommendedProducts: Array.from(new Set(ids))
  };
};

const rankProducts = ({ products, message, userProfile, recommendedOrder = [] }) => {
  const normQuery = normalizeText(message);
  const tokens = normQuery.split(" ").filter((token) => token.length >= 2);
  const orderScore = recommendedOrder.reduce((acc, id, idx) => {
    acc[id] = (recommendedOrder.length - idx) * 20;
    return acc;
  }, {});

  return [...products]
    .map((product) => {
      const searchable = normalizeText(
        [
          product.name,
          product.brand,
          product.description,
          ...(product.sizes || []),
          ...(product.colors || []),
          ...(product.availableColors || [])
        ].join(" ")
      );

      let score = orderScore[product.id] || 0;
      tokens.forEach((token) => {
        if (searchable.includes(token)) score += 3;
      });

      if (userProfile?.weight && Array.isArray(product.sizes)) {
        const hasBasicSize = product.sizes.some((size) => ["m", "l", "xl", "xxl"].includes(String(size).toLowerCase()));
        if (hasBasicSize) score += 2;
      }

      return { ...product, __score: score };
    })
    .sort((a, b) => b.__score - a.__score);
};

// # GHI CHÚ:
// Component icon gửi (mũi tên giấy) - dùng SVG inline, không phụ thuộc thư viện ngoài.
const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <path
      d="M21.5 2.6a1 1 0 0 0-1.05-.2L3.2 9a1 1 0 0 0 .08 1.9l7.3 2.1 2.1 7.3a1 1 0 0 0 .9.72h.07a1 1 0 0 0 .92-.59l6.86-17.23a1 1 0 0 0-.02-.64Z"
      fill="currentColor"
    />
  </svg>
);

// # GHI CHÚ:
// Component icon đóng (dấu X).
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false">
    <path
      d="M6.7 5.3a1 1 0 0 0-1.4 1.4L10.6 12l-5.3 5.3a1 1 0 0 0 1.4 1.4l5.3-5.3 5.3 5.3a1 1 0 0 0 1.4-1.4L13.4 12l5.3-5.3a1 1 0 1 0-1.4-1.4L12 10.6 6.7 5.3Z"
      fill="currentColor"
    />
  </svg>
);

// # GHI CHÚ:
// Component icon làm mới (mũi tên tròn).
const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <polyline points="21 3 21 9 15 9" />
  </svg>
);

const ChatBox = () => {
  const auth = useSelector((state) => state.auth);

  // # GHI CHÚ:
  // State điều khiển mở/đóng khung chat.
  const [isOpen, setIsOpen] = useState(false);

  // # GHI CHÚ:
  // Danh sách tin nhắn hiển thị trong khung chat.
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  // # GHI CHÚ:
  // Dữ liệu người dùng và sản phẩm hiện tại để truyền context cho AI.
  const [userProfile, setUserProfile] = useState({ height: null, weight: null });
  const [currentProduct, setCurrentProduct] = useState(null);

  // # GHI CHÚ:
  // Lưu catalog để render card đề xuất + highlight theo id.
  const [productsById, setProductsById] = useState({});
  const [highlightedIds, setHighlightedIds] = useState([]);
  const [currentPath, setCurrentPath] = useState(history.location?.pathname || window.location.pathname);

  // # GHI CHÚ:
  // Nội dung input người dùng đang nhập.
  const [input, setInput] = useState("");

  // # GHI CHÚ:
  // Trạng thái AI đang trả lời để khóa nút gửi.
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // # GHI CHÚ:
  // Dòng trạng thái ngắn ở cuối chat (cooldown, lỗi API,...).
  const [statusText, setStatusText] = useState("");

  // # GHI CHÚ:
  // Mốc cooldown ở client để tránh gửi quá nhanh.
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [clock, setClock] = useState(Date.now());

  // # GHI CHÚ:
  // Ref cho khung chứa tin nhắn để tự động scroll xuống cuối.
  const chatBoxRef = useRef(null);

  // # GHI CHÚ:
  // Đảm bảo lời chào chỉ chạy 1 lần khi mở chat lần đầu.
  const hasOpenedRef = useRef(false);

  // # GHI CHÚ:
  // Khóa request để ngăn gửi đúp do click/enter liên tiếp.
  const requestLockRef = useRef(false);
  const hydratedSessionRef = useRef(false);
  const streamVersionRef = useRef(0);

  const sessionKey = useMemo(() => `${SESSION_PREFIX}${auth?.id || "guest"}`, [auth?.id]);

  // # GHI CHÚ:
  // Tính trạng thái cooldown + số giây còn lại.
  const isCoolingDown = cooldownUntil > clock;
  const cooldownSeconds = useMemo(
    () => Math.max(0, Math.ceil((cooldownUntil - clock) / 1000)),
    [cooldownUntil, clock]
  );

  const productIdFromPath = useMemo(() => {
    const matched = currentPath.match(/^\/product\/([^/?#]+)/);
    return matched ? decodeURIComponent(matched[1]) : null;
  }, [currentPath]);

  // # GHI CHÚ:
  // Mỗi khi có tin mới hoặc AI typing -> cuộn xuống cuối để thấy nội dung mới nhất.
  useEffect(() => {
    if (!chatBoxRef.current) return;
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages, isTyping, isStreaming]);

  // # GHI CHÚ:
  // Đồng hồ "nhịp" phục vụ cập nhật countdown cooldown trên UI.
  useEffect(() => {
    if (!isCoolingDown) return undefined;
    const timer = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(timer);
  }, [isCoolingDown]);

  // # GHI CHÚ:
  // Cleanup stream khi unmount để tránh state update sau khi component bị hủy.
  useEffect(() => () => {
    streamVersionRef.current += 1;
  }, []);

  // # GHI CHÚ:
  // Theo dõi route để lấy currentProduct khi user ở trang /product/:id.
  useEffect(() => {
    const unlisten = history.listen((location) => {
      setCurrentPath(location.pathname || "");
    });

    return () => {
      if (typeof unlisten === "function") unlisten();
    };
  }, []);

  // # GHI CHÚ:
  // Load catalog một lần để hiển thị card gợi ý sản phẩm theo id.
  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        const snapshot = await firebase.db.collection("products").get();
        if (!mounted) return;

        const index = {};
        snapshot.forEach((doc) => {
          index[doc.id] = { id: doc.id, ...doc.data() };
        });
        setProductsById(index);
      } catch (error) {
        console.error("Chatbox load products failed:", error);
        if (String(error?.message || "").toLowerCase().includes("permission")) {
          setStatusText("Không đủ quyền truy cập dữ liệu sản phẩm. Vui lòng đăng nhập hoặc kiểm tra Firestore rules.");
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  // # GHI CHÚ:
  // Đồng bộ currentProduct từ route hiện tại nếu có id hợp lệ.
  useEffect(() => {
    if (!productIdFromPath) return;

    const nextProduct = productsById[productIdFromPath];
    if (nextProduct && currentProduct?.id !== nextProduct.id) {
      setCurrentProduct(nextProduct);
    }
  }, [productIdFromPath, productsById, currentProduct?.id]);

  // # GHI CHÚ:
  // Khôi phục session theo từng user để không mất ngữ cảnh sau refresh.
  useEffect(() => {
    hydratedSessionRef.current = false;

    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw);

        const savedMessages = Array.isArray(parsed?.messages) ? parsed.messages : [];
        const savedHistory = Array.isArray(parsed?.chatHistory) ? parsed.chatHistory : [];
        const savedProfile = parsed?.userProfile && typeof parsed.userProfile === "object"
          ? parsed.userProfile
          : { height: null, weight: null };

        setMessages(savedMessages);
        setChatHistory(savedHistory.slice(-MAX_HISTORY));
        setUserProfile({
          height: Number.isFinite(savedProfile?.height) ? savedProfile.height : null,
          weight: Number.isFinite(savedProfile?.weight) ? savedProfile.weight : null
        });

        if (parsed?.currentProductId && productsById[parsed.currentProductId]) {
          setCurrentProduct(productsById[parsed.currentProductId]);
        }

        if (savedMessages.length > 0) {
          hasOpenedRef.current = true;
        }
      } else {
        setMessages([]);
        setChatHistory([]);
        setUserProfile({ height: null, weight: null });
        setHighlightedIds([]);
      }
    } catch (error) {
      console.error("Restore chat session failed:", error);
    } finally {
      hydratedSessionRef.current = true;
    }
  }, [sessionKey, productsById]);

  // # GHI CHÚ:
  // Persist session theo user hiện tại.
  useEffect(() => {
    if (!hydratedSessionRef.current) return;

    try {
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({
          messages,
          chatHistory,
          userProfile,
          currentProductId: currentProduct?.id || null
        })
      );
    } catch (error) {
      console.error("Persist chat session failed:", error);
    }
  }, [sessionKey, messages, chatHistory, userProfile, currentProduct?.id]);

  // # GHI CHÚ:
  // Lời chào khởi tạo khi người dùng mở chat lần đầu.
  useEffect(() => {
    if (!isOpen || hasOpenedRef.current) return;
    hasOpenedRef.current = true;

    const welcomeMessages = [
      createMessage("bot", "Chào mừng bạn đến với Stylist AI."),
      createMessage("bot", "Bạn cần tìm sản phẩm nào? Mình sẽ tư vấn theo dữ liệu thật của shop.")
    ];

    setMessages(welcomeMessages);
    setChatHistory([
      { role: "assistant", text: welcomeMessages[0].text },
      { role: "assistant", text: welcomeMessages[1].text }
    ]);
  }, [isOpen]);

  const pushMessage = (sender, text, extra = {}) => {
    setMessages((prev) => [...prev, createMessage(sender, text, extra)]);
  };

  const streamBotMessage = async ({ fullText, recommendedProducts = [] }) => {
    const streamVersion = streamVersionRef.current + 1;
    streamVersionRef.current = streamVersion;

    const streamingMsg = createMessage("bot", "", { recommendedProducts });
    setMessages((prev) => [...prev, streamingMsg]);

    setIsStreaming(true);
    setStatusText("Stylist đang soạn phản hồi...");

    try {
      if (!fullText) {
        if (streamVersion !== streamVersionRef.current) return "";
        setMessages((prev) =>
          prev.map((msg) => (msg.id === streamingMsg.id ? { ...msg, text: "..." } : msg))
        );
        return "...";
      }

      const chunks = splitTextForStreaming(fullText);
      let assembled = "";

      for (const chunk of chunks) {
        if (streamVersion !== streamVersionRef.current) {
          return assembled || String(fullText || "").trim();
        }

        assembled = `${assembled}${assembled ? " " : ""}${chunk}`.replace(/\s+([,.!?…])/g, "$1");

        setMessages((prev) =>
          prev.map((msg) => (msg.id === streamingMsg.id ? { ...msg, text: assembled } : msg))
        );

        const delay = Math.max(
          STREAM_MIN_DELAY_MS,
          Math.min(STREAM_MAX_DELAY_MS, 16 + chunk.length * 2)
        );
        await sleep(delay);
      }

      const finalText = String(fullText || assembled || "...").trim();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingMsg.id
            ? {
                ...msg,
                text: finalText,
                recommendedProducts
              }
            : msg
        )
      );
      return finalText;
    } finally {
      if (streamVersion === streamVersionRef.current) {
        setIsStreaming(false);
        setStatusText("");
      }
    }
  };

  // # GHI CHÚ:
  // Hàm gửi tin nhắn chính: chống gửi đúp, set typing, gọi AI, xử lý fallback.
  const handleSend = async (overrideText) => {
    const message = (overrideText ?? input).trim();
    if (!message) return;
    if (requestLockRef.current || isTyping || isStreaming) {
      setStatusText("Stylist đang xử lý tin trước đó, bạn chờ chút nhé.");
      return;
    }

    if (isCoolingDown) {
      setStatusText(`Bạn đang thao tác hơi nhanh. Vui lòng chờ ${cooldownSeconds} giây.`);
      return;
    }

    requestLockRef.current = true;
    setIsTyping(true);
    setStatusText("Stylist đang tìm sản phẩm phù hợp...");
    setCooldownUntil(Date.now() + SEND_COOLDOWN_MS);
    setClock(Date.now());

    const detectedProfile = extractBodyProfile(message);
    const nextProfile = {
      height: detectedProfile.height || userProfile?.height || null,
      weight: detectedProfile.weight || userProfile?.weight || null
    };

    if (detectedProfile.height || detectedProfile.weight) {
      setUserProfile(nextProfile);
    }

    pushMessage("user", message);
    setChatHistory((prev) => [...prev, { role: "user", text: message }].slice(-MAX_HISTORY));
    setInput("");

    try {
      const reply = await getAIReply(message, {
        chatHistory: [...chatHistory, { role: "user", text: message }].slice(-MAX_HISTORY),
        currentProduct,
        userProfile: nextProfile
      });

      const { cleanText, recommendedProducts: recommendedIds } = parseRecommendedPayload(reply);

      let rankedProducts = [];
      if (recommendedIds.length > 0) {
        const mappedProducts = recommendedIds.map((id) => productsById[id]).filter(Boolean);
        rankedProducts = rankProducts({
          products: mappedProducts,
          message,
          userProfile: nextProfile,
          recommendedOrder: recommendedIds
        }).slice(0, 4);

        setHighlightedIds(rankedProducts.map((item) => item.id));

        if (!currentProduct && rankedProducts[0]) {
          setCurrentProduct(rankedProducts[0]);
        }
      }

      const finalBotText = await streamBotMessage({
        fullText: cleanText,
        recommendedProducts: rankedProducts
      });

      setChatHistory((prev) =>
        [...prev, { role: "assistant", text: finalBotText || cleanText }].slice(-MAX_HISTORY)
      );
      setStatusText(String(cleanText).includes("429") ? "API đang giới hạn, vui lòng thử lại sau." : "");
    } catch (error) {
      console.error("Chat send failed:", error);
      pushMessage("bot", "Đã có lỗi kết nối. Bạn thử lại sau ít giây nhé.");
      setChatHistory((prev) => [...prev, { role: "assistant", text: "Đã có lỗi kết nối." }].slice(-MAX_HISTORY));
      setStatusText("Kết nối tạm thời không ổn định.");
    } finally {
      requestLockRef.current = false;
      setIsTyping(false);
    }
  };

  // # GHI CHÚ:
  // Làm mới cuộc trò chuyện về trạng thái ban đầu theo user hiện tại.
  const handleReset = () => {
    // # GHI CHÚ:
    // Hủy stream hiện tại trước khi reset để tránh ghi đè tin nhắn mới.
    streamVersionRef.current += 1;
    setIsStreaming(false);

    const resetMessages = [
      createMessage("bot", "Cuộc trò chuyện đã được làm mới."),
      createMessage("bot", "Bạn hãy mô tả sản phẩm cần tìm.")
    ];

    setMessages(resetMessages);
    setChatHistory([
      { role: "assistant", text: resetMessages[0].text },
      { role: "assistant", text: resetMessages[1].text }
    ]);
    setInput("");
    setStatusText("");
    setHighlightedIds([]);
    setCurrentProduct(productIdFromPath ? productsById[productIdFromPath] || null : null);
    setCooldownUntil(0);
    setClock(Date.now());

    try {
      sessionStorage.removeItem(sessionKey);
    } catch {
      // # GHI CHÚ: Nếu không remove được thì vẫn reset state trong RAM.
    }
  };

  // # GHI CHÚ:
  // UI chính của chatbox; render qua portal để không bị ảnh hưởng layout trang.
  const ui = (
    <div className="chat-portal-root">
      {!isOpen && (
        <button className="chat-float-btn" onClick={() => setIsOpen(true)} aria-label="Stylist AI">
          <img src={robot} alt="Mở Stylist AI" className="chat-float-avatar" />
        </button>
      )}

      {isOpen && (
        <section className="chat-container" role="dialog" aria-label="Stylist AI Chatbox">
          <header className="chat-header">
            <div className="chat-logo">
              <img src={logo} alt="Stylist AI" />
              <div className="chat-title-wrap">
                <span>Stylist AI</span>
                <small>Trợ lý thời trang nam</small>
              </div>
            </div>

            <div className="chat-actions">
              {/* # GHI CHÚ:
                  Nút làm mới dùng icon SVG, giữ aria-label để hỗ trợ accessibility. */}
              <button
                className="icon-btn"
                onClick={handleReset}
                aria-label="Làm mới cuộc trò chuyện"
                title="Làm mới"
              >
                <RefreshIcon />
              </button>

              {/* # GHI CHÚ:
                  Nút đóng dùng icon SVG, không dùng text để header gọn hơn. */}
              <button
                className="icon-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng chatbox"
                title="Đóng"
              >
                <CloseIcon />
              </button>
            </div>
          </header>

          <div className="chat-box" ref={chatBoxRef}>
            {messages.map((msg) => (
              <article key={msg.id} className={`chat-msg ${msg.sender}`}>
                <div className="chat-msg-content">
                  <p>{msg.text}</p>

                  {msg.sender === "bot" && Array.isArray(msg.recommendedProducts) && msg.recommendedProducts.length > 0 && (
                    <div className="chat-product-list">
                      {msg.recommendedProducts.map((product) => (
                        <SafeLink key={product.id}
                          to={`/product/${product.id}`}
                          className={`chat-product-card ${highlightedIds.includes(product.id) ? "is-highlighted" : ""}`}
                          onClick={() => setCurrentProduct(product)}
                        >
                          <strong>{product.name}</strong>
                          <span>{product.brand || "Nhãn chưa rõ"}</span>
                          <span className="price">{displayMoney(product.price || 0)}</span>
                        </SafeLink>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}

            {isTyping && (
              <article className="chat-msg bot">
                <p className="typing">
                  <span />
                  <span />
                  <span />
                </p>
              </article>
            )}
          </div>

          <div className="chat-suggestions">
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} disabled={isTyping || isStreaming} onClick={() => handleSend(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập nhu cầu: loại sản phẩm, mức giá..."
              disabled={isTyping || isStreaming}
              maxLength={260}
            />

            {/* # GHI CHÚ:
                Nút gửi chỉ hiển thị icon mũi tên để tối giản giao diện.
                Vẫn có aria-label để hỗ trợ screen reader. */}
            <button
              className="send-icon-btn"
              disabled={isTyping || isStreaming || isCoolingDown || !input.trim()}
              onClick={() => handleSend()}
              aria-label="Gửi tin nhắn"
              title="Gửi"
            >
              <SendIcon />
            </button>
          </div>

          {statusText && <div className="chat-status">{statusText}</div>}
        </section>
      )}
    </div>
  );

  if (typeof document === "undefined") return ui;
  return createPortal(ui, document.body);
};

export default ChatBox;
