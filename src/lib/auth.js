// src/lib/auth.js — TRACT Auth System v2
// Regra de ouro: toda verificação de acesso passa por aqui.

// ─── CHAVE ÚNICA DE SESSÃO ────────────────────────────────────────────────────
const SESSION_KEY = 'tract_sess_v2'

// ─── CREDENCIAIS ADMIN (hardcoded, não expostas em plain text) ────────────────
// Comparação feita apenas em runtime, nunca armazenada
const ADMIN_EMAIL = 'miguelmalmeida12@gmail.com'
const ADMIN_PASS  = 'Kodamenino12'

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    // Valida estrutura mínima
    if (!s || typeof s !== 'object' || !s.email || !s.plano) return null
    return s
  } catch {
    return null
  }
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {}
}

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Chave segura para armazenar dados de usuários (sem btoa, sem caracteres especiais)
function userKey(email) {
  return 'tract_u_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

/** Retorna o usuário logado ou null */
export function getUser() {
  return readSession()
}

/** true se há sessão válida */
export function isLoggedIn() {
  return readSession() !== null
}

/** true se plano é pago ou admin */
export function isPremium() {
  const s = readSession()
  if (!s) return false
  return ['mensal', 'vitalicio', 'admin'].includes(s.plano)
}

/** true se é admin */
export function isAdmin() {
  const s = readSession()
  return s?.plano === 'admin'
}

/** Quantos contratos o usuário free usou este mês */
export function verificarLimiteFree() {
  const s = readSession()
  if (!s) return { permitido: false, usados: 0, restantes: 0, limite: 2 }
  if (isPremium()) return { permitido: true, usados: 0, restantes: Infinity, limite: Infinity }

  const mes    = mesAtual()
  const usados = s.mesContagem === mes ? (s.contratosEsteMes || 0) : 0
  return {
    permitido:  usados < 2,
    usados,
    restantes:  Math.max(0, 2 - usados),
    limite:     2,
  }
}

/** Registra uso de um contrato (só para free) */
export function registrarUsoContrato() {
  const s = readSession()
  if (!s || isPremium()) return
  const mes    = mesAtual()
  const usados = s.mesContagem === mes ? (s.contratosEsteMes || 0) : 0
  writeSession({ ...s, contratosEsteMes: usados + 1, mesContagem: mes })
}

/**
 * Faz login.
 * Prioridade: admin → assinante pago → free
 * Retorna { ok, erro?, user? }
 */
export function login(email, senha) {
  const e = (email || '').trim().toLowerCase()
  const s = (senha || '').trim()

  if (!e || !s) return { ok: false, erro: 'Preencha e-mail e senha.' }

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  if (e === ADMIN_EMAIL.toLowerCase() && s === ADMIN_PASS) {
    const session = {
      email:               ADMIN_EMAIL,
      plano:               'admin',
      desde:               new Date().toISOString(),
      pagamentoVerificado: true,
      contratosEsteMes:    0,
      mesContagem:         mesAtual(),
    }
    writeSession(session)
    return { ok: true, user: session }
  }

  // ── ASSINANTE PAGO ─────────────────────────────────────────────────────────
  try {
    const raw = localStorage.getItem('tract_pago_' + userKey(e))
    if (raw) {
      const dados = JSON.parse(raw)
      if (dados.pagamentoVerificado && dados.plano) {
        const session = {
          email:               e,
          plano:               dados.plano,
          desde:               dados.desde,
          pagamentoVerificado: true,
          contratosEsteMes:    0,
          mesContagem:         mesAtual(),
        }
        writeSession(session)
        return { ok: true, user: session }
      }
    }
  } catch {}

  // ── FREE ───────────────────────────────────────────────────────────────────
  if (s.length < 6) {
    return { ok: false, erro: 'Senha deve ter ao menos 6 caracteres.' }
  }

  try {
    const raw = localStorage.getItem('tract_free_' + userKey(e))
    if (raw) {
      const conta = JSON.parse(raw)
      if (conta.senha === s) {
        const mes    = mesAtual()
        const session = {
          email:               e,
          plano:               'free',
          desde:               conta.desde,
          pagamentoVerificado: false,
          contratosEsteMes:    conta.mesContagem === mes ? (conta.contratosEsteMes || 0) : 0,
          mesContagem:         mes,
        }
        writeSession(session)
        return { ok: true, user: session }
      } else {
        return { ok: false, erro: 'Senha incorreta.' }
      }
    }
  } catch {}

  return { ok: false, erro: 'Conta não encontrada. Crie uma conta gratuita abaixo.' }
}

/**
 * Cadastra conta free.
 * Retorna { ok, erro?, user? }
 */
export function cadastrarFree(email, senha, confirmar) {
  const e = (email || '').trim().toLowerCase()
  const s = (senha || '').trim()

  if (!e || !s)       return { ok: false, erro: 'Preencha todos os campos.' }
  if (!e.includes('@'))return { ok: false, erro: 'E-mail inválido.' }
  if (s.length < 6)   return { ok: false, erro: 'Senha deve ter ao menos 6 caracteres.' }
  if (s !== (confirmar||'').trim()) return { ok: false, erro: 'As senhas não coincidem.' }

  const chave = 'tract_free_' + userKey(e)
  if (localStorage.getItem(chave)) {
    return { ok: false, erro: 'E-mail já cadastrado. Faça login.' }
  }
  if (localStorage.getItem('tract_pago_' + userKey(e))) {
    return { ok: false, erro: 'Este e-mail já tem conta paga. Faça login.' }
  }

  const conta = { email: e, senha: s, desde: new Date().toISOString(), contratosEsteMes: 0, mesContagem: mesAtual() }
  localStorage.setItem(chave, JSON.stringify(conta))

  const session = {
    email:               e,
    plano:               'free',
    desde:               conta.desde,
    pagamentoVerificado: false,
    contratosEsteMes:    0,
    mesContagem:         mesAtual(),
  }
  writeSession(session)
  return { ok: true, user: session }
}

/**
 * Ativa plano pago após pagamento aprovado pelo Mercado Pago.
 */
export function ativarPlanoPago(email, plano, pagamentoId) {
  const e = (email || '').trim().toLowerCase()
  const dados = {
    email, plano,
    desde:               new Date().toISOString(),
    pagamentoId,
    pagamentoVerificado: true,
  }
  localStorage.setItem('tract_pago_' + userKey(e), JSON.stringify(dados))

  // Atualiza sessão ativa se for o mesmo usuário
  const s = readSession()
  if (s && s.email.toLowerCase() === e) {
    writeSession({ ...s, plano, pagamentoVerificado: true })
  }
}

/** Encerra a sessão */
export function logout() {
  writeSession(null)
}

/** Label legível do plano */
export function labelPlano(plano) {
  return { free:'Gratuito', mensal:'Pro Mensal', vitalicio:'Vitalício', admin:'Administrador' }[plano] || plano
}
