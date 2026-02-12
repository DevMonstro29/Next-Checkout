const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const dns = require("dns").promises;
const https = require("https");
const http = require("http");

const ENCRYPTION_PREFIX = "enc:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey() {
  const secret = (process.env.ENCRYPTION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!secret || secret.length < 16) return null;
  return crypto.pbkdf2Sync(secret, "portopag-api-key-salt", 100000, KEY_LENGTH, "sha256");
}

function encryptApiKey(plain) {
  const key = getEncryptionKey();
  if (!key || !plain) return plain;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  return ENCRYPTION_PREFIX + combined.toString("base64");
}

function decryptApiKey(encrypted) {
  if (!encrypted || !encrypted.startsWith(ENCRYPTION_PREFIX)) return encrypted;
  const key = getEncryptionKey();
  if (!key) return encrypted;
  try {
    const raw = Buffer.from(encrypted.slice(ENCRYPTION_PREFIX.length), "base64");
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(ciphertext) + decipher.final("utf8");
  } catch (e) {
    return encrypted;
  }
}

// Carregar variáveis de ambiente do .env
try {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
} catch (e) {}

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(user) {
  if (!user?.email) return false;
  const email = user.email.trim().toLowerCase();
  if (ADMIN_EMAIL && email === ADMIN_EMAIL) return true;
  return ADMIN_EMAILS.some((a) => a && email === a);
}

const logFile = path.join(__dirname, "error.log");

function log(msg) {
  var line = new Date().toISOString() + " - " + msg + "\n";
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {}
  console.log(line);
}

process.on("uncaughtException", function (err) {
  log("UNCAUGHT: " + err.stack);
  process.exit(1);
});

process.on("unhandledRejection", function (err) {
  log("UNHANDLED REJECTION: " + (err && err.stack ? err.stack : err));
});

log("Iniciando servidor...");
log("Node version: " + process.version);
log("__dirname: " + __dirname);
try {
  log("Arquivos na raiz: " + fs.readdirSync(__dirname).join(", "));
} catch (e) {
  log("Aviso readdir: " + (e && e.message));
}

var distExists = fs.existsSync(path.join(__dirname, "dist"));
var distIndexExists = fs.existsSync(path.join(__dirname, "dist", "index.html"));
log("dist/ existe: " + distExists);
log("dist/index.html existe: " + distIndexExists);

var express, cors;
try {
  express = require("express");
  log("express carregado OK");
} catch (e) {
  log("ERRO ao carregar express: " + e.message);
  process.exit(1);
}
try {
  cors = require("cors");
  log("cors carregado OK");
} catch (e) {
  log("ERRO ao carregar cors: " + e.message);
  process.exit(1);
}

var app = express();
var PORT = process.env.PORT || 8080;

const PORTOPAG_API_URL = "https://api.portopag.com/api/v1";
const PORTOPAG_API_KEY = process.env.PORTOPAG_API_KEY || "";

// Supabase (para buscar API key do usuário)
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = require("@supabase/supabase-js").createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    log("Supabase conectado (service role)");
  } catch (e) {
    log("Supabase não carregado: " + (e.message || e));
  }
}

const FRONTEND_URL = (process.env.FRONTEND_URL || "").trim();
const API_BASE_URL = (process.env.API_BASE_URL || process.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const allowedOrigins = ["https://app.nextcheckoutbr.com", "http://localhost:8080", "http://localhost:5173"];
if (FRONTEND_URL) {
  FRONTEND_URL.split(",").forEach((o) => {
    const x = o.trim().replace(/^["']|["']$/g, "");
    if (x && !allowedOrigins.includes(x)) allowedOrigins.push(x);
  });
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigins.length > 0) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
}));

// Webhook PortoPag (docs.portopag.com): event, transaction_id no root; responder 200 OK em <5s
app.post("/api/webhook/portopag", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const rawBody = (req.body && Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "") || "{}";
    const timestamp = (req.headers["x-pagou-timestamp"] || req.headers["x-portopag-timestamp"] || "").toString();
    const signature = (req.headers["x-pagou-signature"] || req.headers["x-portopag-signature"] || "").toString();
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: "JSON inválido" });
    }
    const event = (payload.event || payload.event_name || payload.name || "").toLowerCase();
    const txnId = payload.transaction_id || (payload.data && (payload.data.transaction_id || payload.data.transactionid)) || payload.id || "";

    if (!txnId) {
      return res.status(400).json({ error: "transaction_id ausente" });
    }

    if (!supabase) {
      return res.status(503).json({ error: "Banco não configurado" });
    }

    const { data: sale } = await supabase
      .from("sales")
      .select("id, checkout_id")
      .eq("transaction_id", txnId)
      .maybeSingle();

    if (!sale) {
      log("Webhook: venda não encontrada para transaction_id=" + txnId);
      return res.status(200).json({ received: true });
    }

    if (timestamp && signature) {
      let apiKey = PORTOPAG_API_KEY;
      if (sale.checkout_id) {
        const { data: checkout } = await supabase.from("checkouts").select("user_id").eq("id", sale.checkout_id).single();
        if (checkout) {
          const { data: settings } = await supabase.from("user_settings").select("portopag_api_key").eq("user_id", checkout.user_id).maybeSingle();
          if (settings?.portopag_api_key) apiKey = decryptApiKey(settings.portopag_api_key);
        }
      }
      if (apiKey) {
        const message = timestamp + rawBody;
        const hmac = crypto.createHmac("sha256", apiKey);
        hmac.update(message);
        const computed = hmac.digest("hex");
        try {
          const sigBuf = Buffer.from(signature, "hex");
          const compBuf = Buffer.from(computed, "hex");
          if (sigBuf.length !== compBuf.length || !crypto.timingSafeEqual(sigBuf, compBuf)) {
            return res.status(401).json({ error: "Assinatura inválida" });
          }
        } catch {
          return res.status(401).json({ error: "Assinatura inválida" });
        }
      }
    }

    if (event === "payment.paid") {
      const paidAt = payload.paid_at || new Date().toISOString();
      await supabase.from("sales").update({ status: "paid", paid_at: paidAt }).eq("id", sale.id);
      log("Webhook: venda " + sale.id + " marcada como paga (transaction_id=" + txnId + ")");
    } else if (event === "payment.expired") {
      await supabase.from("sales").update({ status: "expired" }).eq("id", sale.id);
      log("Webhook: venda " + sale.id + " marcada como expirada (transaction_id=" + txnId + ")");
    } else if (event === "payment.failed") {
      await supabase.from("sales").update({ status: "cancelled" }).eq("id", sale.id);
      log("Webhook: venda " + sale.id + " marcada como cancelada (transaction_id=" + txnId + ")");
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Erro webhook PortoPag:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

app.use(express.json());

// Helper para fazer requests HTTP sem depender de fetch global
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = lib.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: JSON.parse(data),
          });
        } catch (e) {
          resolve({ ok: false, status: res.statusCode, json: { error: data } });
        }
      });
    });

    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", port: PORT, node: process.version });
});

// Obter perfil e status de aprovação do usuário logado
app.get("/api/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  const token = auth.slice(7);
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: "Não autorizado" });

    let { data: profile } = await supabase.from("profiles").select("user_id, full_name, approved, is_admin, is_banned").eq("user_id", user.id).maybeSingle();

    const adminByDb = !!(profile && profile.is_admin);
    const adminByEnv = isAdmin(user);
    const isAdminUser = adminByDb || adminByEnv;

    if (!profile) {
      const { error: insErr } = await supabase.from("profiles").insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || "",
        approved: isAdminUser,
        is_admin: isAdminUser,
        email: user.email || "",
      });
      if (!insErr) profile = { user_id: user.id, full_name: user.user_metadata?.full_name || "", approved: isAdminUser, is_admin: isAdminUser };
    } else if (isAdminUser && (!profile.approved || !profile.is_admin)) {
      await supabase.from("profiles").update({ approved: true, is_admin: true }).eq("user_id", user.id);
      profile = { ...profile, approved: true, is_admin: true };
    }

    const banned = !!(profile && profile.is_banned);
    const approvedByProfile = !!(profile && profile.approved);
    const approved = banned ? false : (isAdminUser || approvedByProfile);
    res.json({
      user: { id: user.id, email: user.email },
      profile: {
        full_name: (profile && profile.full_name) || user.user_metadata?.full_name || "",
        approved,
        isAdmin: isAdminUser,
      },
    });
  } catch (e) {
    console.error("Erro /api/me:", e);
    res.status(500).json({ error: e.message || "Erro ao buscar perfil" });
  }
});

// Listar usuários aguardando aprovação (admin)
app.get("/api/pending-users", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) return res.status(401).json({ error: "Não autorizado" });
  const token = auth.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: "Acesso negado" });
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle();
    if (!checkIsAdmin(user, profile)) return res.status(403).json({ error: "Acesso negado" });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, created_at")
      .eq("approved", false)
      .order("created_at", { ascending: false });

    const users = (profiles || []).map((p) => ({
      id: p.user_id,
      full_name: p.full_name || "",
      email: p.email || "",
      created_at: p.created_at,
    }));

    res.json({ users });
  } catch (e) {
    console.error("Erro /api/pending-users:", e);
    res.status(500).json({ error: e.message || "Erro ao listar usuários" });
  }
});

// Listar todos os usuários aprovados com estatísticas (admin)
app.get("/api/admin/users", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) return res.status(401).json({ error: "Não autorizado" });
  const token = auth.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: "Acesso negado" });
    const { data: adminProfile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle();
    if (!checkIsAdmin(user, adminProfile)) return res.status(403).json({ error: "Acesso negado" });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, created_at, is_banned")
      .eq("approved", true)
      .eq("is_admin", false)
      .order("created_at", { ascending: false });

    const users = [];
    for (const p of profiles || []) {
      const { count: checkoutCount } = await supabase.from("checkouts").select("id", { count: "exact", head: true }).eq("user_id", p.user_id);
      const { data: checkouts } = await supabase.from("checkouts").select("id, custom_domain").eq("user_id", p.user_id);
      const checkoutIds = (checkouts || []).map((c) => c.id);
      const domainsCount = (checkouts || []).filter((c) => c.custom_domain).length;
      let salesCount = 0;
      let revenueCents = 0;
      if (checkoutIds.length > 0) {
        const { data: sales } = await supabase.from("sales").select("amount_cents, status").in("checkout_id", checkoutIds).eq("status", "paid");
        salesCount = (sales || []).length;
        revenueCents = (sales || []).reduce((acc, s) => acc + (s.amount_cents || 0), 0);
      }
      users.push({
        id: p.user_id,
        full_name: p.full_name || "",
        email: p.email || "",
        created_at: p.created_at,
        is_banned: !!p.is_banned,
        checkout_count: checkoutCount || 0,
        sales_count: salesCount,
        revenue_cents: revenueCents,
        domains_count: domainsCount,
      });
    }
    res.json({ users });
  } catch (e) {
    console.error("Erro /api/admin/users:", e);
    res.status(500).json({ error: e.message || "Erro ao listar usuários" });
  }
});

// Banir usuário (admin)
app.post("/api/admin/ban-user/:userId", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) return res.status(401).json({ error: "Não autorizado" });
  const token = auth.slice(7);
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "ID do usuário obrigatório" });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: "Acesso negado" });
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle();
    if (!checkIsAdmin(user, profile)) return res.status(403).json({ error: "Acesso negado" });
    const { data: target } = await supabase.from("profiles").select("is_admin").eq("user_id", userId).maybeSingle();
    if (target && target.is_admin) return res.status(403).json({ error: "Não é possível banir o administrador" });

    await supabase.from("profiles").update({ is_banned: true }).eq("user_id", userId);
    res.json({ success: true });
  } catch (e) {
    console.error("Erro /api/admin/ban-user:", e);
    res.status(500).json({ error: e.message || "Erro ao banir usuário" });
  }
});

// Desbanir usuário (admin)
app.post("/api/admin/unban-user/:userId", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) return res.status(401).json({ error: "Não autorizado" });
  const token = auth.slice(7);
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "ID do usuário obrigatório" });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: "Acesso negado" });
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle();
    if (!checkIsAdmin(user, profile)) return res.status(403).json({ error: "Acesso negado" });

    await supabase.from("profiles").update({ is_banned: false }).eq("user_id", userId);
    res.json({ success: true });
  } catch (e) {
    console.error("Erro /api/admin/unban-user:", e);
    res.status(500).json({ error: e.message || "Erro ao desbanir usuário" });
  }
});

const APP_CANONICAL_HOST = (process.env.APP_CANONICAL_HOST || "app.nextcheckoutbr.com").trim().toLowerCase().replace(/\.$/, "");

function normalizeHost(h) {
  return (h || "").trim().toLowerCase().replace(/\.$/, "");
}

async function verifyDomainDns(domain) {
  const host = normalizeHost(domain);
  if (!host) return { verified: false, error: "Domínio inválido" };
  const canonical = normalizeHost(APP_CANONICAL_HOST);

  try {
    const cnames = await dns.resolve(host, "CNAME");
    const targets = (cnames || []).map((c) => normalizeHost(String(c)));
    if (targets.some((t) => t === canonical || t.endsWith("." + canonical) || t.replace(/\.$/, "") === canonical)) {
      return { verified: true };
    }
    return { verified: false, error: "CNAME não aponta para " + APP_CANONICAL_HOST };
  } catch (e) {
    if (e.code === "ENODATA") {
      try {
        const [customIps, canonicalIps] = await Promise.all([
          dns.resolve4(host),
          dns.resolve4(APP_CANONICAL_HOST),
        ]);
        const set = new Set(canonicalIps || []);
        if ((customIps || []).some((ip) => set.has(ip))) return { verified: true };
        return { verified: false, error: "Use CNAME apontando para " + APP_CANONICAL_HOST };
      } catch (e2) {
        return { verified: false, error: "Domínio não resolve. Configure o CNAME para " + APP_CANONICAL_HOST };
      }
    }
    if (e.code === "ENOTFOUND") {
      return { verified: false, error: "Domínio não encontrado" };
    }
    return { verified: false, error: e.message || "Erro ao verificar DNS" };
  }
}

// Verificar domínio personalizado (DNS CNAME)
app.post("/api/verify-domain", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) return res.status(401).json({ error: "Não autorizado" });
  const token = auth.slice(7);
  const { checkoutId, domain } = req.body || {};
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Não autorizado" });

    let domainToVerify = domain;

    if (checkoutId && !domain) {
      const { data: checkout, error: checkoutErr } = await supabase
        .from("checkouts")
        .select("id, custom_domain, user_id")
        .eq("id", checkoutId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (checkoutErr || !checkout) return res.status(404).json({ error: "Checkout não encontrado" });
      if (!checkout.custom_domain) return res.status(400).json({ error: "Nenhum domínio configurado neste checkout" });
      domainToVerify = checkout.custom_domain;
    } else if (!domainToVerify) {
      return res.status(400).json({ error: "Informe o domínio ou o ID do checkout" });
    }

    const result = await verifyDomainDns(domainToVerify);

    if (result.verified) {
      const ts = new Date().toISOString();
      await supabase
        .from("checkouts")
        .update({ domain_verified_at: ts, updated_at: ts })
        .eq("custom_domain", domainToVerify)
        .eq("user_id", user.id);
    }

    res.json({
      verified: result.verified,
      error: result.error || null,
      domain: domainToVerify,
    });
  } catch (e) {
    console.error("Erro /api/verify-domain:", e);
    res.status(500).json({ error: e.message || "Erro ao verificar domínio" });
  }
});

const VERCEL_API_TOKEN = (process.env.VERCEL_API_TOKEN || "").trim();
const VERCEL_PROJECT_ID = (process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME || "").trim();
const VERCEL_TEAM_ID = (process.env.VERCEL_TEAM_ID || "").trim();

// Adicionar domínio automaticamente na Vercel (quando usuário salva custom_domain)
app.post("/api/add-vercel-domain", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) return res.status(401).json({ error: "Não autorizado" });
  const token = auth.slice(7);
  const { domain, checkoutId } = req.body || {};
  const domainName = (domain || "").trim().toLowerCase().replace(/^https?:\/\//, "");
  if (!domainName) return res.status(400).json({ error: "Domínio obrigatório" });
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return res.status(503).json({ error: "Integração Vercel não configurada. Defina VERCEL_API_TOKEN e VERCEL_PROJECT_ID no Railway." });
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Não autorizado" });
    let owned = false;
    if (checkoutId) {
      const { data: chk } = await supabase.from("checkouts").select("id").eq("id", checkoutId).eq("user_id", user.id).maybeSingle();
      owned = !!chk;
    }
    if (!owned) {
      const { data: rows } = await supabase
        .from("checkouts")
        .select("id")
        .eq("user_id", user.id)
        .eq("custom_domain", domainName)
        .limit(1);
      owned = !!(rows && rows.length > 0);
    }
    if (!owned) return res.status(403).json({ error: "Domínio não encontrado em seus checkouts" });

    const url = new URL(`https://api.vercel.com/v10/projects/${encodeURIComponent(VERCEL_PROJECT_ID)}/domains`);
    if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);
    const vercelRes = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + VERCEL_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domainName }),
    });
    const vercelData = await vercelRes.json().catch(() => ({}));

    if (!vercelRes.ok) {
      const errMsg = vercelData.error?.message || vercelData.message || vercelRes.statusText;
      if (vercelRes.status === 400 && (errMsg.includes("already") || vercelData.error?.code === "domain_already_in_use")) {
        return res.json({ success: true, message: "Domínio já está configurado na Vercel" });
      }
      return res.status(vercelRes.status).json({ error: errMsg || "Erro ao adicionar domínio na Vercel" });
    }
    res.json({ success: true, verified: !!vercelData.verified, message: "Domínio adicionado na Vercel. Configure o DNS conforme indicado." });
  } catch (e) {
    console.error("Erro /api/add-vercel-domain:", e);
    res.status(500).json({ error: e.message || "Erro ao adicionar domínio" });
  }
});

// Aprovar usuário (admin)
app.post("/api/approve-user/:userId", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) return res.status(401).json({ error: "Não autorizado" });
  const token = auth.slice(7);
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "ID do usuário obrigatório" });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: "Acesso negado" });
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle();
    if (!checkIsAdmin(user, profile)) return res.status(403).json({ error: "Acesso negado" });

    const { error: upErr } = await supabase.from("profiles").update({ approved: true }).eq("user_id", userId);
    if (upErr) throw upErr;
    res.json({ success: true });
  } catch (e) {
    console.error("Erro /api/approve-user:", e);
    res.status(500).json({ error: e.message || "Erro ao aprovar usuário" });
  }
});

// Obter status da API Key PortoPag (configurada ou não)
app.get("/api/portopag-status", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) {
    return res.status(401).json({ configured: false });
  }
  const token = auth.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ configured: false });
    const { data } = await supabase
      .from("user_settings")
      .select("portopag_api_key")
      .eq("user_id", user.id)
      .maybeSingle();
    const configured = !!(data && data.portopag_api_key);
    res.json({ configured });
  } catch (e) {
    res.status(500).json({ configured: false });
  }
});

// Salvar API Key PortoPag (criptografada)
app.post("/api/save-portopag-key", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  const token = auth.slice(7);
  const { apiKey } = req.body || {};
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Não autorizado" });
    const plain = (apiKey && typeof apiKey === "string") ? apiKey.trim() : "";
    let keyToStore = null;
    if (plain) {
      const encrypted = encryptApiKey(plain);
      if (!encrypted) {
        return res.status(400).json({ error: "Chave de criptografia não configurada. Adicione ENCRYPTION_SECRET ou SUPABASE_SERVICE_ROLE_KEY." });
      }
      keyToStore = encrypted;
    }
    const { error: upsertError } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: user.id, portopag_api_key: keyToStore, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (upsertError) throw upsertError;
    res.json({ success: true });
  } catch (e) {
    console.error("Erro ao salvar API key:", e);
    res.status(500).json({ error: e.message || "Erro ao salvar" });
  }
});

// Criar pagamento PIX
app.post("/api/create-pix-payment", async (req, res) => {
  try {
    const { checkoutId, name, email, cpf, phone, productName, amountCents, utm_source, utm_campaign, utm_medium, utm_content, utm_term } = req.body;

    let apiKey = PORTOPAG_API_KEY;

    if (checkoutId && supabase) {
      const { data: checkout, error: checkoutError } = await supabase
        .from("checkouts")
        .select("user_id")
        .eq("id", checkoutId)
        .single();

      if (!checkoutError && checkout) {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("portopag_api_key")
          .eq("user_id", checkout.user_id)
          .maybeSingle();

        if (settings?.portopag_api_key) {
          apiKey = decryptApiKey(settings.portopag_api_key);
        } else {
          return res.status(400).json({
            success: false,
            error: "Configure sua API Key da PortoPag em Integrações no painel admin.",
          });
        }
      }
    }

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "API Key da PortoPag não configurada. Configure em Integrações ou nas variáveis de ambiente.",
      });
    }

    const cleanCpf = (cpf || "").replace(/\D/g, "");
    const cleanPhone = (phone || "").replace(/\D/g, "");
    const amount = parseInt(amountCents, 10) || 5890;
    const title = productName || "Taxa Transacional";

    const payload = {
      amount: amount,
      customer: {
        name,
        email: email || `${cleanCpf}@semmail.com`,
        cpf: cleanCpf,
        phone: cleanPhone,
      },
      paymentMethod: "pix",
      items: [
        {
          unitPrice: amount,
          title: title,
          quantity: 1,
          tangible: false,
        },
      ],
    };
    if (API_BASE_URL) {
      payload.notification_url = `${API_BASE_URL}/api/webhook/portopag`;
    }

    console.log("Enviando para PortoPag:", JSON.stringify(payload, null, 2));

    const response = await makeRequest(`${PORTOPAG_API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = response.json;
    console.log("Resposta PortoPag:", JSON.stringify(data, null, 2));

    if (!response.ok || !data.success) {
      return res.status(response.status).json({
        success: false,
        error:
          data.error?.message ||
          data.error?.details ||
          "Erro ao criar pagamento",
      });
    }

    // Registrar venda no painel (tabela sales)
    if (supabase && checkoutId) {
      try {
        await supabase.from("sales").insert({
          checkout_id: checkoutId,
          transaction_id: data.data.transaction_id || "",
          customer_name: name || null,
          customer_email: email || null,
          customer_cpf: (cpf || "").replace(/\D/g, "") || null,
          amount_cents: amount,
          product_name: productName || title || null,
          status: "pending",
        });
      } catch (insertErr) {
        console.error("Erro ao registrar venda (sales):", insertErr);
      }
    }

    return res.json({
      success: true,
      data: {
        transaction_id: data.data.transaction_id,
        pix_code: data.data.pix_code,
        pix_qr_code: data.data.pix_qr_code,
        amount: data.data.amount,
        status: data.data.status,
        expires_at: data.data.expires_at,
      },
    });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno ao processar pagamento",
    });
  }
});

function checkIsAdmin(user, profile) {
  return !!(profile && profile.is_admin) || isAdmin(user);
}

// Listar vendas do usuário (painel admin). Admin vê todas as vendas.
app.get("/api/sales", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  const token = auth.slice(7);
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: "Não autorizado" });
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle();
    const adminUser = checkIsAdmin(user, profile);

    let checkoutIds;
    if (adminUser) {
      const { data: allCheckouts } = await supabase.from("checkouts").select("id");
      checkoutIds = (allCheckouts || []).map((c) => c.id);
    } else {
      const { data: myCheckouts, error: checkoutsError } = await supabase
        .from("checkouts")
        .select("id")
        .eq("user_id", user.id);
      if (checkoutsError) throw checkoutsError;
      checkoutIds = (myCheckouts || []).map((c) => c.id);
    }

    if (checkoutIds.length === 0) {
      return res.json({ sales: [] });
    }

    const { data: sales, error } = await supabase
      .from("sales")
      .select("id, checkout_id, transaction_id, customer_name, customer_email, amount_cents, product_name, status, created_at, paid_at")
      .in("checkout_id", checkoutIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const { data: checkoutsList } = await supabase.from("checkouts").select("id, name, slug").in("id", [...new Set((sales || []).map((s) => s.checkout_id))]);
    const checkoutMap = {};
    (checkoutsList || []).forEach((c) => { checkoutMap[c.id] = c; });

    const list = (sales || []).map((s) => ({
      ...s,
      checkout_name: (checkoutMap[s.checkout_id] || {}).name,
      checkout_slug: (checkoutMap[s.checkout_id] || {}).slug,
    }));

    res.json({ sales: list });
  } catch (e) {
    console.error("Erro ao listar vendas:", e);
    res.status(500).json({ error: e.message || "Erro ao listar vendas" });
  }
});

// Estatísticas do painel (Início). Admin vê estatísticas globais.
app.get("/api/stats", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || !supabase) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  const token = auth.slice(7);
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: "Não autorizado" });
    const { data: statsProfile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).maybeSingle();
    const adminUser = checkIsAdmin(user, statsProfile);

    let checkoutIds;
    if (adminUser) {
      const { data: allCheckouts } = await supabase.from("checkouts").select("id");
      checkoutIds = (allCheckouts || []).map((c) => c.id);
    } else {
      const { data: myCheckouts } = await supabase.from("checkouts").select("id").eq("user_id", user.id);
      checkoutIds = (myCheckouts || []).map((c) => c.id);
    }

    if (checkoutIds.length === 0) {
      return res.json({ faturamento: 0, numVendas: 0, ticketMedio: 0 });
    }

    const { data: sales } = await supabase
      .from("sales")
      .select("amount_cents, status")
      .in("checkout_id", checkoutIds)
      .eq("status", "paid");

    const pagas = sales || [];
    const faturamento = pagas.reduce((acc, s) => acc + (s.amount_cents || 0), 0);
    const numVendas = pagas.length;
    const ticketMedio = numVendas > 0 ? Math.round(faturamento / numVendas) : 0;

    res.json({ faturamento, numVendas, ticketMedio });
  } catch (e) {
    console.error("Erro ao buscar stats:", e);
    res.status(500).json({ error: e.message || "Erro ao buscar estatísticas" });
  }
});

// Consultar status do pagamento (público)
// Prioriza o banco (atualizado pelo webhook) para evitar requisições excessivas à PortoPag
app.get("/api/payment-status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!transactionId) return res.status(400).json({ success: false, error: "transactionId obrigatório" });

    if (supabase) {
      const { data: sale } = await supabase
        .from("sales")
        .select("status, paid_at")
        .eq("transaction_id", transactionId)
        .maybeSingle();
      if (sale && sale.status === "paid") {
        return res.json({
          success: true,
          data: { status: "paid", paid_at: sale.paid_at },
        });
      }
    }

    const response = await makeRequest(
      `${PORTOPAG_API_URL}/public/status/${transactionId}`,
      { method: "GET" },
    );

    const data = response.json;

    if (!response.ok || !data.success) {
      return res.status(response.status).json({
        success: false,
        error: "Erro ao consultar status",
      });
    }

    // Se PortoPag retornou pago, atualizar banco como fallback (caso webhook não tenha chegado)
    const status = (data.data && data.data.status) ? String(data.data.status).toLowerCase() : "";
    if ((status === "paid" || status === "completed") && supabase) {
      const { data: existing } = await supabase.from("sales").select("id, status").eq("transaction_id", transactionId).maybeSingle();
      if (existing && existing.status !== "paid") {
        await supabase.from("sales").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", existing.id);
      }
    }

    return res.json(data);
  } catch (error) {
    console.error("Erro ao consultar status:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno ao consultar status",
    });
  }
});

// Quando FRONTEND_URL está definido = deploy separado, frontend em outro domínio
if (!FRONTEND_URL) {
  app.use(express.static(path.join(__dirname, "dist")));
  app.use(express.static(path.join(__dirname, "public")));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, function () {
  log("Servidor rodando na porta " + PORT);
});
