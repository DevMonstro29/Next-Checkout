const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
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
function isAdmin(user) {
  if (!ADMIN_EMAIL || !user?.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL;
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
log("Arquivos na raiz: " + fs.readdirSync(__dirname).join(", "));

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
var PORT = process.env.PORT || 3000;

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
const corsOptions = FRONTEND_URL
  ? { origin: FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean), credentials: true }
  : {};
app.use(cors(corsOptions));
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

    let { data: profile } = await supabase.from("profiles").select("user_id, full_name, approved, is_admin").eq("user_id", user.id).maybeSingle();

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

    res.json({
      user: { id: user.id, email: user.email },
      profile: {
        full_name: (profile && profile.full_name) || user.user_metadata?.full_name || "",
        approved: !!(profile && profile.approved),
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
app.get("/api/payment-status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

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
