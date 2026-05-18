// src/lib/auth.js — TRACT Auth v3
// Regra: toda verificação passa por aqui. Leitura sempre direta do localStorage.

const SESSION_KEY = 'tract_sess_v2'
const ADMIN_EMAIL = 'miguelmalmeida12@gmail.com'
const ADMIN_PASS  = 'Kodamenino12'

// ─── HELPERS INTERNOS ─────────────────────────────────────────────────────────

export function lerSessao() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s || !s.email || !s.plano) return null
    return s
  } catch { return null }
}

function gravarSessao(s) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else    localStorage.removeItem(SESSION_KEY)
  } catch {}
}

function chaveUsuario(email) {
  return 'tract_u_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

export function getUser()    { return lerSessao() }
export function isLoggedIn() { return lerSessao() !== null }
export function isAdmin()    { return lerSessao()?.plano === 'admin' }
export function isPremium()  {
  const s = lerSessao()
  return s ? ['mensal','vitalicio','admin'].includes(s.plano) : false
}

export function verificarLimiteFree() {
  const s = lerSessao()
  if (!s)           return { permitido:false, usados:0, restantes:0, limite:2 }
  if (isPremium())  return { permitido:true,  usados:0, restantes:999, limite:999 }
  const mes    = mesAtual()
  const usados = s.mesContagem === mes ? (s.contratosEsteMes||0) : 0
  return { permitido:usados<2, usados, restantes:Math.max(0,2-usados), limite:2 }
}

export function registrarUsoContrato() {
  const s = lerSessao()
  if (!s || isPremium()) return
  const mes    = mesAtual()
  const usados = s.mesContagem === mes ? (s.contratosEsteMes||0) : 0
  gravarSessao({ ...s, contratosEsteMes:usados+1, mesContagem:mes })
}

export function login(email, senha) {
  const e = (email||'').trim().toLowerCase()
  const s = (senha||'').trim()
  if (!e || !s) return { ok:false, erro:'Preencha e-mail e senha.' }

  // ADMIN
  if (e === ADMIN_EMAIL.toLowerCase() && s === ADMIN_PASS) {
    const session = { email:ADMIN_EMAIL, plano:'admin', desde:new Date().toISOString(),
                      pagamentoVerificado:true, contratosEsteMes:0, mesContagem:mesAtual() }
    gravarSessao(session)
    return { ok:true, user:session }
  }

  // ASSINANTE PAGO
  try {
    const raw = localStorage.getItem('tract_pago_' + chaveUsuario(e))
    if (raw) {
      const d = JSON.parse(raw)
      if (d.pagamentoVerificado && d.plano) {
        const session = { email:e, plano:d.plano, desde:d.desde,
                          pagamentoVerificado:true, contratosEsteMes:0, mesContagem:mesAtual() }
        gravarSessao(session)
        return { ok:true, user:session }
      }
    }
  } catch {}

  // FREE
  if (s.length < 6) return { ok:false, erro:'Senha deve ter ao menos 6 caracteres.' }
  try {
    const raw = localStorage.getItem('tract_free_' + chaveUsuario(e))
    if (raw) {
      const conta = JSON.parse(raw)
      if (conta.senha === s) {
        const mes = mesAtual()
        const session = { email:e, plano:'free', desde:conta.desde,
                          pagamentoVerificado:false,
                          contratosEsteMes: conta.mesContagem===mes ? (conta.contratosEsteMes||0) : 0,
                          mesContagem:mes }
        gravarSessao(session)
        return { ok:true, user:session }
      }
      return { ok:false, erro:'Senha incorreta.' }
    }
  } catch {}

  return { ok:false, erro:'Conta não encontrada. Crie uma conta gratuita abaixo.' }
}

export function cadastrarFree(email, senha, confirmar) {
  const e = (email||'').trim().toLowerCase()
  const s = (senha||'').trim()
  if (!e||!s)           return { ok:false, erro:'Preencha todos os campos.' }
  if (!e.includes('@')) return { ok:false, erro:'E-mail inválido.' }
  if (s.length < 6)     return { ok:false, erro:'Senha deve ter ao menos 6 caracteres.' }
  if (s !== (confirmar||'').trim()) return { ok:false, erro:'As senhas não coincidem.' }

  const chFree = 'tract_free_' + chaveUsuario(e)
  const chPago = 'tract_pago_' + chaveUsuario(e)
  if (localStorage.getItem(chFree)) return { ok:false, erro:'E-mail já cadastrado. Faça login.' }
  if (localStorage.getItem(chPago)) return { ok:false, erro:'Este e-mail tem conta paga. Faça login.' }

  const mes   = mesAtual()
  const conta = { email:e, senha:s, desde:new Date().toISOString(), contratosEsteMes:0, mesContagem:mes }
  localStorage.setItem(chFree, JSON.stringify(conta))

  const session = { email:e, plano:'free', desde:conta.desde,
                    pagamentoVerificado:false, contratosEsteMes:0, mesContagem:mes }
  gravarSessao(session)
  return { ok:true, user:session }
}

export function ativarPlanoPago(email, plano, pagamentoId) {
  const e = (email||'').trim().toLowerCase()
  const dados = { email:e, plano, desde:new Date().toISOString(),
                  pagamentoId, pagamentoVerificado:true }
  localStorage.setItem('tract_pago_' + chaveUsuario(e), JSON.stringify(dados))
  const s = lerSessao()
  if (s && s.email.toLowerCase() === e) gravarSessao({ ...s, plano, pagamentoVerificado:true })
}

export function logout() { gravarSessao(null) }

export function labelPlano(plano) {
  return { free:'Gratuito', mensal:'Pro Mensal', vitalicio:'Vitalício', admin:'Administrador' }[plano] || plano
}
