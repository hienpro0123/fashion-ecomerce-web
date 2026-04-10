import firebase from "./config";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
import firebaseService from "./firebase";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1/models";

// # GHI CHÚ:
// Danh sách model fallback, ưu tiên model nhẹ trước để giảm timeout.
const MODEL_FALLBACK = Array.from(
  new Set(
    String(import.meta.env.VITE_GEMINI_MODELS || "gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.1-flash-lite-preview")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean)
  )
);

const REQUEST_GAP_MS = 1200;
const MAX_CONTEXT_HISTORY = 10;
const MAX_PROMPT_PRODUCTS = 5;
const GEMINI_TIMEOUT_MS = 25000;

const MAX_RETRIES_429 = 3;
const BACKOFF_MS = [1000, 2000, 4000];

const NO_PRODUCT_MESSAGE = "Xin lỗi, mình chưa tìm thấy sản phẩm khớp hoàn toàn với nhu cầu của bạn.";
const LOADING_TEXT = "Đang tải dữ liệu sản phẩm, bạn vui lòng chờ trong giây lát nhé.";
const ALL_429_MESSAGE = "Hệ thống đang bận, bạn vui lòng thử lại sau vài giây.";

let queue = Promise.resolve();
let lastCallTime = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined) return NaN;
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return NaN;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const safeReadJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const parseRetryAfterMs = (retryAfterHeader) => {
  if (!retryAfterHeader) return 0;
  const sec = Number(retryAfterHeader);
  if (!Number.isNaN(sec) && sec > 0) return sec * 1000;

  const retryDate = Date.parse(retryAfterHeader);
  if (Number.isNaN(retryDate)) return 0;
  return Math.max(0, retryDate - Date.now());
};

// # GHI CHÚ:
// Tạo URL Gemini theo model.
const buildUrl = (model) => `${GEMINI_BASE_URL}/${model}:generateContent?key=${API_KEY}`;

const serializeProducts = (products = []) =>
  products
    .slice(0, 25)
    .map(
      (p) => `
* ${p.name}
  Thương hiệu: ${p.brand || "Không rõ"}
  Giá: ${toNumber(p.price) || p.price || "Không rõ"} VND
  Size: ${(p.sizes || []).join(", ") || "Không rõ"}
  Màu: ${(p.availableColors || []).join(", ") || "Không rõ"}
  Mô tả: ${p.description || "Không có mô tả"}
`
    )
    .join("\n");

const fetchProducts = async () => {
  try {
    const snapshot = await firebaseService.db.collection("products").get();
    return { products: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })), error: null };
  } catch (error) {
    return { products: [], error };
  }
};

const parseMoneyAmount = (rawValue, rawUnit = "") => {
  const value = Number(String(rawValue).replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return NaN;

  const unit = normalize(rawUnit);
  if (unit === "tr" || unit === "trieu") return Math.round(value * 1000000);
  if (unit === "k" || unit === "nghin" || unit === "ngan") return Math.round(value * 1000);

  // # GHI CHÚ:
  // Nếu không có đơn vị thì giữ nguyên. Data shop hiện đang theo VND tuyệt đối.
  return Math.round(value);
};

const extractPriceIntent = (messageNorm) => {
  const matches = [
    ...messageNorm.matchAll(/(\d+(?:[.,]\d+)?)(?:\s*)(trieu|tr|k|nghin|ngan)?/g)
  ];

  const values = matches
    .map((m) => parseMoneyAmount(m[1], m[2]))
    .filter((n) => Number.isFinite(n));

  if (!values.length) return null;

  const hasRange =
    (messageNorm.includes("tu") && messageNorm.includes("den")) ||
    messageNorm.includes("-") ||
    messageNorm.includes("khoang");

  if (hasRange && values.length >= 2) {
    const sorted = values.slice(0, 2).sort((a, b) => a - b);
    return { min: sorted[0], max: sorted[1] };
  }

  if (/\b(duoi|nho hon|khong qua|toi da|under)\b/.test(messageNorm)) {
    return { max: values[0] };
  }

  if (/\b(tren|lon hon|toi thieu|from)\b/.test(messageNorm)) {
    return { min: values[0] };
  }

  return { min: Math.round(values[0] * 0.85), max: Math.round(values[0] * 1.15) };
};

const STOP_WORDS = new Set([
  "gi",
  "nao",
  "nào",
  "thi",
  "thì",
  "sao",
  "dau",
  "đâu",
  "co",
  "có",
  "khong",
  "không",
  "toi",
  "cho",
  "voi",
  "với",
  "can",
  "cần",
  "muon",
  "muốn",
  "gia",
  "mau",
  "size",
  "hang",
  "thuong",
  "hieu"
]);

const tokenizeQuery = (queryNorm) =>
  queryNorm
    .split(" ")
    .filter(Boolean)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token) && !/^\d+$/.test(token));

const buildPhrases = (tokens = []) => {
  const phrases = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (i + 1 < tokens.length) phrases.push(`${tokens[i]} ${tokens[i + 1]}`);
    if (i + 2 < tokens.length) phrases.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }
  return Array.from(new Set(phrases));
};

const detectColorFamiliesFromQuery = (queryNorm) => {
  const families = new Set();

  if (queryNorm.includes("xanh la")) families.add("green");
  if (queryNorm.includes("xanh duong") || queryNorm.includes("xanh navy") || queryNorm.includes("xanh bien")) {
    families.add("blue");
  }

  const mapping = [
    { key: "den", family: "black" },
    { key: "trang", family: "white" },
    { key: "xam", family: "gray" },
    { key: "ghi", family: "gray" },
    { key: "nau", family: "brown" },
    { key: "be", family: "brown" },
    { key: "do", family: "red" },
    { key: "vang", family: "yellow" },
    { key: "cam", family: "orange" },
    { key: "tim", family: "purple" },
    { key: "hong", family: "pink" },
    { key: "xanh", family: "blue" }
  ];

  mapping.forEach(({ key, family }) => {
    if (queryNorm.includes(key)) families.add(family);
  });

  return families;
};

const inferHexColorFamily = (hexColor = "") => {
  const hex = String(hexColor).replace("#", "").trim();
  if (![3, 6].includes(hex.length)) return "unknown";

  const full =
    hex.length === 3 ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` : hex;
  const int = Number.parseInt(full, 16);
  if (!Number.isFinite(int)) return "unknown";

  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  if (diff < 18) {
    const l = (max + min) / 2;
    if (l < 45) return "black";
    if (l > 220) return "white";
    return "gray";
  }

  if (r > g && g > b && r < 210) return "brown";

  let hue = 0;
  if (max === r) hue = ((g - b) / diff) * 60;
  else if (max === g) hue = (2 + (b - r) / diff) * 60;
  else hue = (4 + (r - g) / diff) * 60;
  if (hue < 0) hue += 360;

  if (hue < 15 || hue >= 345) return "red";
  if (hue < 45) return "orange";
  if (hue < 70) return "yellow";
  if (hue < 165) return "green";
  if (hue < 200) return "cyan";
  if (hue < 255) return "blue";
  if (hue < 290) return "purple";
  return "pink";
};

const inferTextColorFamily = (colorText = "") => {
  const c = normalize(colorText);
  if (!c) return "unknown";
  if (c.includes("den")) return "black";
  if (c.includes("trang")) return "white";
  if (c.includes("xam") || c.includes("ghi")) return "gray";
  if (c.includes("nau") || c.includes("be")) return "brown";
  if (c.includes("do")) return "red";
  if (c.includes("vang")) return "yellow";
  if (c.includes("cam")) return "orange";
  if (c.includes("tim")) return "purple";
  if (c.includes("hong")) return "pink";
  if (c.includes("xanh la")) return "green";
  if (c.includes("xanh")) return "blue";
  return "unknown";
};

const getProductColorFamilies = (product) => {
  const colors = product.availableColors || product.colors || [];
  return new Set(
    colors
      .map((c) => (String(c).startsWith("#") ? inferHexColorFamily(c) : inferTextColorFamily(c)))
      .filter((f) => f && f !== "unknown")
  );
};

const isColorMatch = (product, colorFamilies) => {
  if (!colorFamilies || colorFamilies.size === 0) return true;
  const productFamilies = getProductColorFamilies(product);
  return [...colorFamilies].some((f) => productFamilies.has(f));
};

const detectIntent = (message, products = []) => {
  const queryNorm = normalize(message);
  const brands = Array.from(new Set(products.map((p) => normalize(p.brand)).filter(Boolean)));
  const brandMatches = brands.filter((b) => queryNorm.includes(b));

  const explicitSize = queryNorm.match(/\b(xxxl|xxl|xl|l|m|s)\b/i)?.[1]?.toUpperCase() || null;

  return {
    queryNorm,
    priceIntent: extractPriceIntent(queryNorm),
    asksColor: /\b(mau|color)\b/.test(queryNorm),
    asksSize: /\b(size|co size|form|vua)\b/.test(queryNorm),
    asksBrand: /\b(brand|hang|thuong hieu)\b/.test(queryNorm) || brandMatches.length > 0,
    asksFeatured: /\b(noi bat|featured|best seller|ban chay)\b/.test(queryNorm),
    asksRecommended: /\b(goi y|de xuat|recommended)\b/.test(queryNorm),
    colorFamilies: detectColorFamiliesFromQuery(queryNorm),
    explicitSize,
    requestedBrands: brandMatches
  };
};

const filterProducts = (products, message, providedIntent = null) => {
  // # GHI CHÚ:
  // Filter production: tận dụng price, size, brand, màu, featured/recommended và loại score=0.
  const intent = providedIntent || detectIntent(message, products);
  const tokens = tokenizeQuery(intent.queryNorm);
  const phrases = buildPhrases(tokens);

  return products
    .map((product) => {
      if (toNumber(product.quantity) <= 0) return null;

      const nameNorm = normalize(product.name);
      const brandNorm = normalize(product.brand);
      const descNorm = normalize(product.description);
      const keywordNorms = (product.keywords || []).map((k) => normalize(k));
      const sizeNorms = (product.sizes || []).map((s) => normalize(s));

      const searchable = [nameNorm, brandNorm, descNorm, ...keywordNorms, ...sizeNorms].join(" ");

      // Price filter chặt: có intent giá thì bắt buộc price hợp lệ và đúng khoảng.
      const price = toNumber(product.price);
      if (intent.priceIntent) {
        if (!Number.isFinite(price)) return null;
        if (intent.priceIntent.min !== undefined && price < intent.priceIntent.min) return null;
        if (intent.priceIntent.max !== undefined && price > intent.priceIntent.max) return null;
      }

      if (intent.explicitSize && !sizeNorms.includes(normalize(intent.explicitSize))) return null;
      if (intent.asksFeatured && !product.isFeatured) return null;
      if (intent.asksRecommended && !product.isRecommended) return null;
      if (intent.requestedBrands.length > 0 && !intent.requestedBrands.includes(brandNorm)) return null;
      if (intent.asksColor && intent.colorFamilies.size > 0 && !isColorMatch(product, intent.colorFamilies)) {
        return null;
      }

      let score = 0;
      let hasSemanticHit = false;

      phrases.forEach((phrase) => {
        if (keywordNorms.includes(phrase)) {
          score += 24;
          hasSemanticHit = true;
        } else if (nameNorm.includes(phrase)) {
          score += 18;
          hasSemanticHit = true;
        } else if (descNorm.includes(phrase)) {
          score += 8;
          hasSemanticHit = true;
        }
      });

      tokens.forEach((token) => {
        if (keywordNorms.some((k) => k === token || k.includes(token))) {
          score += 10;
          hasSemanticHit = true;
        } else if (sizeNorms.includes(token)) {
          score += 8;
          hasSemanticHit = true;
        } else if (nameNorm.split(" ").includes(token)) {
          score += 7;
          hasSemanticHit = true;
        } else if (brandNorm.split(" ").includes(token)) {
          score += 6;
          hasSemanticHit = true;
        } else if (searchable.includes(token)) {
          score += 3;
          hasSemanticHit = true;
        }
      });

      if (intent.requestedBrands.length > 0 && intent.requestedBrands.includes(brandNorm)) score += 8;
      if (intent.explicitSize && sizeNorms.includes(normalize(intent.explicitSize))) score += 6;
      if (intent.asksColor && intent.colorFamilies.size > 0 && isColorMatch(product, intent.colorFamilies)) {
        score += 6;
      }
      if (product.isRecommended) score += 2;
      if (product.isFeatured) score += 1;

      // # GHI CHÚ:
      // Nếu query có nội dung cụ thể mà không có semantic hit thì loại để tránh lọt sản phẩm sai.
      if ((tokens.length > 0 || phrases.length > 0) && !hasSemanticHit) return null;

      return score > 0 ? { product, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product);
};

const rankRelatedProducts = (products, message, excludedIds = [], limit = 3) => {
  const queryNorm = normalize(message);
  const tokens = tokenizeQuery(queryNorm);
  const phrases = buildPhrases(tokens);
  const excluded = new Set(excludedIds);

  return products
    .filter((p) => !excluded.has(p.id) && toNumber(p.quantity) > 0)
    .map((product) => {
      const searchable = normalize(
        [product.name, product.brand, product.description, ...(product.keywords || [])].join(" ")
      );

      let score = 0;
      if (product.isRecommended) score += 6;
      if (product.isFeatured) score += 4;

      phrases.forEach((phrase) => {
        if (searchable.includes(phrase)) score += 8;
      });

      tokens.forEach((token) => {
        if (searchable.includes(token)) score += 3;
      });

      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.product);
};

const getShortIntentMessage = (message, chatHistory = [], currentProduct) => {
  const q = normalize(message);
  const shortQueries = ["mau gi", "dau", "size nao", "mau nao", "thi sao"];
  const isShortContextual = shortQueries.some((item) => q === item || q.includes(item));

  if (!isShortContextual) return message;

  const lastAssistant = [...chatHistory].reverse().find((m) => m?.role === "assistant")?.text || "";
  const focus = currentProduct?.name
    ? `Sản phẩm đang xét: ${currentProduct.name}.`
    : "Chưa có sản phẩm cố định.";

  return `${message}\n\n# BỔ SUNG NGỮ CẢNH\nĐây là câu hỏi ngắn theo ngữ cảnh trước đó. ${focus}\nTóm tắt phản hồi trước: ${lastAssistant}`;
};

const buildRelatedSuggestionText = (products = [], limit = 2) => {
  const picks = products.slice(0, limit);
  if (!picks.length) return "";
  return `Gợi ý thêm: ${picks.map((p) => `${p.name} (${toNumber(p.price) || p.price || "chưa có giá"} VND)`).join(", ")}.`;
};

const buildNoProductSuggestion = (allProducts = [], relatedProducts = []) => {
  const base = relatedProducts.length ? relatedProducts : allProducts.slice(0, 3);
  const list = base
    .slice(0, 3)
    .map((p) => `- ${p.name} (${p.brand || "Không rõ thương hiệu"}, ${toNumber(p.price) || p.price || "chưa có giá"} VND)`)
    .join("\n");

  const payload = base.slice(0, 2).map((p) => p.id);

  if (!list) {
    return `${NO_PRODUCT_MESSAGE} Bạn có thể mô tả rõ hơn về kiểu dáng, màu sắc hoặc ngân sách để mình tư vấn sát hơn.`;
  }

  return `${NO_PRODUCT_MESSAGE}\nMình gợi ý một số sản phẩm gần nhất:\n${list}\n\n${JSON.stringify({ recommendedProducts: payload })}`;
};

const getColorMoodText = (product) => {
  if (!product) return "";
  const families = [...getProductColorFamilies(product)];
  if (!families.length) return "";

  const moodMap = {
    black: "Màu đen tạo cảm giác mạnh mẽ, gọn gàng và dễ phối đồ.",
    white: "Màu trắng mang cảm giác sạch sẽ, trẻ trung và sáng outfit.",
    gray: "Màu xám cho cảm giác trung tính, hiện đại và lịch sự.",
    brown: "Gam nâu tạo cảm giác ấm áp, trưởng thành và nam tính.",
    blue: "Gam xanh cho cảm giác thanh lịch, dễ dùng khi đi làm hoặc đi chơi.",
    green: "Gam xanh lá mang cảm giác mới mẻ và năng động.",
    red: "Màu đỏ tạo điểm nhấn nổi bật, hợp khi muốn outfit có cá tính.",
    yellow: "Màu vàng tạo cảm giác trẻ trung và nổi bật hơn trong set đồ.",
    orange: "Màu cam mang cảm giác năng lượng, phù hợp khi phối đồ casual.",
    purple: "Màu tím tạo cảm giác thời trang và khác biệt.",
    pink: "Màu hồng tạo cảm giác mềm mại, trẻ trung nếu phối đúng tông."
  };

  return moodMap[families[0]] || "";
};

export const buildGeneralStylistPrompt = (userMessage) => `
# Vai trò
Bạn là stylist thời trang nam chuyên nghiệp.

# Câu hỏi khách hàng
"${userMessage}"

# Quy tắc
- Trả lời thành câu đầy đủ, không cụt câu.
- Không dùng dấu "..." ở cuối.
`;

export const buildStylistPrompt = ({
  userMessage,
  chatHistory = [],
  currentProduct,
  products = [],
  userProfile,
  intent,
  hasDirectMatch = true,
  relatedProducts = []
}) => `
# Vai trò
Bạn là Stylist AI cho shop thời trang nam.

# Mục tiêu
- Tư vấn tự nhiên như stylist thật.
- Không bịa sản phẩm, không bịa giá, không bịa size/màu.
- CHỈ dùng dữ liệu có trong danh sách sản phẩm.

# Ngữ cảnh hội thoại
${chatHistory.slice(-MAX_CONTEXT_HISTORY).map((m) => `${m.role}: ${m.text}`).join("\n")}

# Thông tin khách hàng
- Chiều cao: ${userProfile?.height || "Chưa cung cấp"}
- Cân nặng: ${userProfile?.weight || "Chưa cung cấp"}

# Intent phát hiện
- Hỏi giá: ${intent?.priceIntent ? "Có" : "Không"}
- Hỏi màu: ${intent?.asksColor ? "Có" : "Không"}
- Hỏi size: ${intent?.asksSize ? "Có" : "Không"}
- Hỏi thương hiệu: ${intent?.asksBrand ? "Có" : "Không"}

# Sản phẩm đang xét
${
  currentProduct
    ? `- ${currentProduct.name} | ${currentProduct.brand || "Không rõ"} | ${currentProduct.price || "Không rõ"} VND`
    : "Chưa có sản phẩm cố định"
}

# Danh sách sản phẩm phù hợp hiện tại
${products
  .slice(0, MAX_PROMPT_PRODUCTS)
  .map(
    (p) => `- ID: ${p.id} | ${p.name} | ${p.brand || "Không rõ"} | ${p.price || "Không rõ"} VND | Size: ${(p.sizes || []).join(", ") || "Không rõ"} | Màu: ${(p.availableColors || []).join(", ") || "Không rõ"}`
  )
  .join("\n")}

# Danh sách sản phẩm gần nhất để thay thế
${relatedProducts
  .slice(0, 3)
  .map((p) => `- ID: ${p.id} | ${p.name} | ${p.brand || "Không rõ"} | ${p.price || "Không rõ"} VND`)
  .join("\n")}

# Câu hỏi mới
"${userMessage}"

# Quy tắc bắt buộc
- Nếu có sản phẩm phù hợp (${hasDirectMatch ? "có" : "không"}): trả lời tối thiểu 3-5 câu.
- Luôn có phần mô tả phong cách và cách phối đồ thực tế.
- Tuyệt đối không trả lời cụt câu, không kết thúc bằng "...".
- Không được tạo ra sản phẩm ngoài danh sách.
- Nếu không có sản phẩm phù hợp trực tiếp: xin lỗi rõ ràng và đề xuất sản phẩm gần nhất trong danh sách thay thế.
- Nếu user hỏi size: tư vấn theo chiều cao/cân nặng nếu có, nếu thiếu thì nhắc user bổ sung.
- Nếu user hỏi màu: mô tả cảm giác màu sắc ngắn gọn.

# Đầu ra bổ sung
- Sau phần tư vấn, thêm 1 JSON object ở cuối cùng theo đúng định dạng:
{"recommendedProducts":["id_1","id_2"]}
- Chỉ dùng ID có trong danh sách đã cung cấp.
`;

// # GHI CHÚ:
// Gọi Gemini 1 lần, có timeout để tránh treo lâu.
const callGemini = async ({ model, promptText }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(model), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.72,
          topP: 0.92,
          maxOutputTokens: 760
        }
      })
    });

    const data = await safeReadJson(response);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    return {
      ok: response.ok,
      status: response.status,
      text,
      data,
      retryAfterMs: parseRetryAfterMs(response.headers.get("Retry-After"))
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: "",
      data: { error: { message: String(error?.message || "Unknown error") } },
      retryAfterMs: 0
    };
  } finally {
    clearTimeout(timeout);
  }
};

// # GHI CHÚ:
// Retry thông minh cho 429: tối đa 3 lần retry với backoff 1s -> 2s -> 4s.
const retryLogic = async ({ model, promptText }) => {
  for (let attempt = 0; attempt <= MAX_RETRIES_429; attempt += 1) {
    const result = await callGemini({ model, promptText });

    if (result.status !== 429) {
      return result;
    }

    if (attempt < MAX_RETRIES_429) {
      const waitMs = result.retryAfterMs > 0 ? result.retryAfterMs : BACKOFF_MS[attempt] || BACKOFF_MS[BACKOFF_MS.length - 1];
      await sleep(waitMs);
    }
  }

  return {
    ok: false,
    status: 429,
    text: "",
    data: { error: { message: "Rate limited after retries" } },
    retryAfterMs: 0
  };
};

const splitReplyAndJsonSuffix = (rawText = "") => {
  const text = String(rawText || "").trim();
  if (!text) return { bodyText: "", jsonSuffix: "" };

  const match = text.match(/\{[\s\S]*"recommendedProducts"[\s\S]*\}\s*$/);
  if (!match) return { bodyText: text, jsonSuffix: "" };

  const start = text.lastIndexOf(match[0]);
  const bodyText = text.slice(0, start).trim();
  const jsonSuffix = match[0].trim();
  return { bodyText, jsonSuffix };
};

const withRecommendedJson = (text, products = []) => {
  const ids = products.slice(0, 2).map((p) => p.id).filter(Boolean);
  if (!ids.length) return text;
  return `${text}\n\n${JSON.stringify({ recommendedProducts: ids })}`;
};

// # GHI CHÚ:
// Chỉ fallback khi text rỗng. Nếu text hợp lệ thì giữ nguyên nội dung AI, chỉ làm sạch nhẹ.
const validateReply = ({
  replyText,
  matchedProducts = [],
  relatedProducts = [],
  allProducts = [],
  intent,
  userProfile
}) => {
  const raw = String(replyText || "").trim();

  if (!raw) {
    const fallback = matchedProducts.length
      ? `Mình gợi ý nhanh: ${matchedProducts[0].name}. Bạn muốn mình tư vấn thêm cách phối đồ theo nhu cầu đi làm hay đi chơi không?`
      : buildNoProductSuggestion(allProducts, relatedProducts);
    return withRecommendedJson(fallback, matchedProducts.length ? matchedProducts : relatedProducts);
  }

  const { bodyText, jsonSuffix } = splitReplyAndJsonSuffix(raw);
  let text = bodyText || raw;

  text = text.replace(/(\.\.\.|…)\s*$/g, "").trim();
  if (text && !/[.!?]$/.test(text)) {
    text = `${text}.`;
  }

  const extraLines = [];

  if (intent?.asksSize) {
    if (userProfile?.height && userProfile?.weight) {
      extraLines.push(
        `Theo thông tin ${userProfile.height}cm / ${userProfile.weight}kg, bạn nên ưu tiên form vừa vai, tránh chọn quá ôm để mặc thoải mái hơn.`
      );
    } else {
      extraLines.push("Bạn có thể cho mình chiều cao và cân nặng để mình gợi ý size sát hơn.");
    }
  }

  if (intent?.asksColor) {
    const moodText = getColorMoodText(matchedProducts[0] || relatedProducts[0]);
    if (moodText) extraLines.push(moodText);
  }

  const relatedLine = buildRelatedSuggestionText(relatedProducts, 2);
  if (relatedLine) extraLines.push(relatedLine);

  const merged = [text, ...extraLines].filter(Boolean).join("\n\n").trim();

  if (jsonSuffix) {
    return `${merged}\n\n${jsonSuffix}`;
  }

  return withRecommendedJson(merged, matchedProducts.length ? matchedProducts : relatedProducts);
};

const enqueue = (task) => {
  queue = queue.then(task, task);
  return queue;
};

export const getAIReply = (message, context = {}) =>
  enqueue(async () => {
    try {
      if (!API_KEY) {
        return "Thiếu VITE_GEMINI_API_KEY trong biến môi trường. Vui lòng cấu hình file .env.";
      }

      const { products: allProducts, error: productError } = await fetchProducts();
      if (productError) {
        console.error("Lỗi tải sản phẩm từ Firebase:", productError);
        return "Không thể truy cập dữ liệu sản phẩm do thiếu quyền. Vui lòng đăng nhập hoặc kiểm tra Firestore rules.";
      }

      if (!allProducts.length) {
        return "Xin lỗi, hiện chưa có dữ liệu sản phẩm để tư vấn. Bạn vui lòng thử lại sau.";
      }

      const intent = detectIntent(message, allProducts);
      const filteredProducts = filterProducts(allProducts, message, intent);
      const matchedProducts = filteredProducts.slice(0, MAX_PROMPT_PRODUCTS);

      const relatedProducts = rankRelatedProducts(
        allProducts,
        message,
        matchedProducts.map((p) => p.id),
        3
      );

      const chatHistory = Array.isArray(context.chatHistory)
        ? context.chatHistory.slice(-MAX_CONTEXT_HISTORY)
        : [];

      const currentProduct =
        context.currentProduct || matchedProducts[0] || relatedProducts[0] || allProducts[0] || null;

      const userProfile = context.userProfile || null;
      const contextualMessage = getShortIntentMessage(message, chatHistory, currentProduct);

      const promptProducts = (matchedProducts.length ? matchedProducts : relatedProducts).slice(
        0,
        MAX_PROMPT_PRODUCTS
      );

      const promptText = buildStylistPrompt({
        userMessage: contextualMessage,
        chatHistory,
        currentProduct,
        products: promptProducts,
        userProfile,
        intent,
        hasDirectMatch: matchedProducts.length > 0,
        relatedProducts
      });

      const waitMs = REQUEST_GAP_MS - (Date.now() - lastCallTime);
      if (waitMs > 0) await sleep(waitMs);

      let allRateLimited = true;

      for (const model of MODEL_FALLBACK) {
        const result = await retryLogic({ model, promptText });
        lastCallTime = Date.now();

        if (result.ok) {
          return validateReply({
            replyText: result.text,
            matchedProducts,
            relatedProducts,
            allProducts,
            intent,
            userProfile
          });
        }

        if (result.status === 429) {
          continue;
        }

        allRateLimited = false;

        if (result.status === 404) {
          continue;
        }

        console.error(`Gemini error model=${model} status=${result.status}`, result.data);
      }

      if (allRateLimited) {
        return ALL_429_MESSAGE;
      }

      return validateReply({
        replyText: "",
        matchedProducts,
        relatedProducts,
        allProducts,
        intent,
        userProfile
      });
    } catch (error) {
      console.error("getAIReply unexpected error:", error);
      return "Hiện tại hệ thống đang gặp sự cố tạm thời, bạn vui lòng thử lại sau ít phút.";
    }
  });

export { buildUrl, callGemini, retryLogic, validateReply, filterProducts, serializeProducts };
