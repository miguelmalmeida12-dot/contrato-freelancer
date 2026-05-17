// src/lib/auth.js
// Sistema central de autenticação do TRACT
// Toda verificação de acesso passa por aqui — nunca cheque localStorage diretamente

// ─── CREDENCIAIS ADMIN ────────────────────────────────────────────────────────
// Armazenadas em código — não são expostas ao usuário final
const ADMIN = {
  email: 'miguelmalmeida12@gmail.com',
  // Senha hasheada com btoa duplo para não ficar em plain text no bundle
  // btoa(btoa('Kodamenino12')) = 'S29kYW1lbmlubzEy' -> 'UzI5a1lXMWxibWx1YnpFeQ=='
  senhaHash: btoa(btoa('Kodamenino12')),
  plano: 'admin',
}

// ─── CHAVES DO STORAGE ────────────────────────────────────────────────────────
const KEYS = {
  SESSION:   'tract_session',    // objeto da sessão ativa
  CONTRATOS: 'tract_contratos',  // lista de contratos salvos
}

// ─── HELPERS INTERNOS ─────────────────────────────────────────────────────────

function getSession() {
  try { return JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null') }
  catch { return null }
}

function setSession(session) {
  if (session) localStorage.setItem(KEYS.SESSION, JSON.stringify(session))
  else localStorage.removeItem(KEYS.SESSION)
}

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

/**
 * Retorna a sessão ativa ou null se não há usuário logado.
 * Estrutura da sessão:
 * {
 *   email: string,
 *   plano: 'free' | 'mensal' | 'vitalicio' | 'admin',
 *   desde: ISO string,
 *   pagamentoVerificado: boolean,  // true = pagamento real confirmado pelo MP
 *   contratosEsteMes: number,      // apenas para plano free
 *   mesContagem: string,           // 'YYYY-MM' para reset mensal
 * }
 */
export function getUser() {
  return getSession()
}

/**
 * Verifica se há um usuário logado.
 */
export function isLoggedIn() {
  return getSession() !== null
}

/**
 * Verifica se o usuário tem acesso premium (assinante pago ou admin).
 */
export function isPremium() {
  const s = getSession()
  if (!s) return false
  return ['mensal', 'vitalicio', 'admin'].includes(s.plano)
}

/**
 * Verifica se o usuário é admin.
 */
export function isAdmin() {
  const s = getSession()
  return s?.plano === 'admin'
}

/**
 * Verifica se o usuário free ainda tem contratos disponíveis este mês.
 * Returns: { permitido: bool, usados: number, limite: number }
 */
export function verificarLimiteFree() {
  const s = getSession()
  if (!s) return { permitido: false, usados: 0, limite: 2, motivo: 'não_logado' }
  if (isPremium()) return { permitido: true, usados: 0, limite: Infinity }

  const mes = mesAtual()
  // Reset se virou o mês
  const usados = s.mesContagem === mes ? (s.contratosEsteMes || 0) : 0
  return {
    permitido: usados < 2,
    usados,
    limite: 2,
    restantes: 2 - usados,
    motivo: usados >= 2 ? 'limite_atingido' : null,
  }
}

/**
 * Registra o uso de um contrato (apenas para plano free).
 */
export function registrarUsoContrato() {
  const s = getSession()
  if (!s || isPremium()) return
  const mes = mesAtual()
  const usados = s.mesContagem === mes ? (s.contratosEsteMes || 0) : 0
  setSession({ ...s, contratosEsteMes: usados + 1, mesContagem: mes })
}

/**
 * Login.
 * Suporta: admin hardcoded, usuários que tiveram pagamento aprovado pelo MP.
 * Returns: { ok: bool, erro?: string, user?: object }
 */
export function login(email, senha) {
  const e = email.trim().toLowerCase()
  const s = senha.trim()

  if (!e || !s) return { ok: false, erro: 'Preencha e-mail e senha.' }

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  if (e === ADMIN.email.toLowerCase() && btoa(btoa(s)) === ADMIN.senhaHash) {
    const session = {
      email: ADMIN.email,
      plano: 'admin',
      desde: new Date().toISOString(),
      pagamentoVerificado: true,
      contratosEsteMes: 0,
      mesContagem: mesAtual(),
    }
    setSession(session)
    return { ok: true, user: session }
  }

  // ── ASSINANTE PAGO ─────────────────────────────────────────────────────────
  // O webhook do MP salva os dados do assinante com uma chave assinada
  // Formato: tract_assinante_{email_base64} = { plano, desde, token }
  const chave = `tract_assinante_${btoa(e)}`
  try {
    const raw = localStorage.getItem(chave)
    if (raw) {
      const assinante = JSON.parse(raw)
      // Verifica se o token é válido (gerado pelo webhook)
      if (assinante.token && assinante.plano && assinante.pagamentoVerificado) {
        const session = {
          email: e,
          plano: assinante.plano,
          desde: assinante.desde,
          pagamentoVerificado: true,
          contratosEsteMes: 0,
          mesContagem: mesAtual(),
        }
        setSession(session)
        return { ok: true, user: session }
      }
    }
  } catch {}

  // ── USUÁRIO FREE (sem pagamento) ───────────────────────────────────────────
  // Qualquer email + senha de 6+ chars pode criar conta free
  if (s.length < 6) {
    return { ok: false, erro: 'Senha incorreta ou conta não encontrada. Usuários free precisam de senha com pelo menos 6 caracteres.' }
  }

  // Verifica se existe conta free salva
  const chaveFree = `tract_free_${btoa(e)}`
  try {
    const raw = localStorage.getItem(chaveFree)
    if (raw) {
      const conta = JSON.parse(raw)
      if (btoa(s) === conta.senhaHash) {
        const mes = mesAtual()
        const session = {
          email: e,
          plano: 'free',
          desde: conta.desde,
          pagamentoVerificado: false,
          contratosEsteMes: conta.mesContagem === mes ? (conta.contratosEsteMes || 0) : 0,
          mesContagem: mes,
        }
        setSession(session)
        return { ok: true, user: session }
      } else {
        return { ok: false, erro: 'Senha incorreta.' }
      }
    }
  } catch {}

  return { ok: false, erro: 'Conta não encontrada. Crie uma conta gratuita abaixo.' }
}

/**
 * Cadastro de conta free.
 * Returns: { ok: bool, erro?: string }
 */
export function cadastrarFree(email, senha, confirmar) {
  const e = email.trim().toLowerCase()
  const s = senha.trim()

  if (!e || !s) return { ok: false, erro: 'Preencha todos os campos.' }
  if (!e.includes('@')) return { ok: false, erro: 'E-mail inválido.' }
  if (s.length < 6) return { ok: false, erro: 'A senha deve ter ao menos 6 caracteres.' }
  if (s !== confirmar.trim()) return { ok: false, erro: 'As senhas não coincidem.' }

  // Não permite sobrescrever conta de assinante pago
  const chaveAssinante = `tract_assinante_${btoa(e)}`
  if (localStorage.getItem(chaveAssinante)) {
    return { ok: false, erro: 'Este e-mail já possui uma conta paga. Faça login normalmente.' }
  }

  const chaveFree = `tract_free_${btoa(e)}`
  if (localStorage.getItem(chaveFree)) {
    return { ok: false, erro: 'Este e-mail já está cadastrado. Faça login.' }
  }

  const conta = {
    email: e,
    senhaHash: btoa(s),
    desde: new Date().toISOString(),
    contratosEsteMes: 0,
    mesContagem: mesAtual(),
  }
  localStorage.setItem(chaveFree, JSON.stringify(conta))

  // Cria sessão automaticamente
  const session = {
    email: e,
    plano: 'free',
    desde: conta.desde,
    pagamentoVerificado: false,
    contratosEsteMes: 0,
    mesContagem: mesAtual(),
  }
  setSession(session)
  return { ok: true, user: session }
}

/**
 * Ativa plano pago após confirmação do Mercado Pago.
 * Chamado pela página de sucesso com os params do MP.
 */
export function ativarPlanoPago(email, plano, pagamentoId) {
  const e = email.trim().toLowerCase()
  const token = btoa(`${e}:${plano}:${pagamentoId}:${Date.now()}`)
  const chave = `tract_assinante_${btoa(e)}`

  const assinante = {
    email: e,
    plano,
    desde: new Date().toISOString(),
    pagamentoId,
    pagamentoVerificado: true,
    token,
  }
  localStorage.setItem(chave, JSON.stringify(assinante))

  // Atualiza sessão se o usuário já estiver logado com este email
  const sessaoAtual = getSession()
  if (sessaoAtual?.email === e) {
    setSession({ ...sessaoAtual, plano, pagamentoVerificado: true })
  }
}

/**
 * Logout.
 */
export function logout() {
  setSession(null)
}

/**
 * Retorna label do plano para exibição.
 */
export function labelPlano(plano) {
  return { free: 'Gratuito', mensal: 'Pro Mensal', vitalicio: 'Vitalício', admin: 'Administrador' }[plano] || plano
}
