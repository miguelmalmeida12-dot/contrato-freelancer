import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ativarPlanoPago } from '../lib/auth.js'

export default function Sucesso() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const plano       = params.get('plano') || localStorage.getItem('tract_pag_plano') || 'mensal'
    const email       = localStorage.getItem('tract_pag_email') || ''
    const pagamentoId = params.get('payment_id') || params.get('collection_id') || 'mp_' + Date.now()
    if (email) ativarPlanoPago(email, plano, pagamentoId)
    localStorage.removeItem('tract_pag_email')
    localStorage.removeItem('tract_pag_plano')
    // limpa chaves antigas
    localStorage.removeItem('plano_ativo')
    localStorage.removeItem('plano_email')
    localStorage.removeItem('plano_desde')
  }, [])

  const plano = params.get('plano') || 'mensal'

  return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0', display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
      <div style={{ maxWidth:480, textAlign:'center' }}>
        <div style={{ fontFamily:'Georgia,serif', fontSize:26, color:'#1A1612', marginBottom:12 }}>
          TR<span style={{ color:'#C8502A' }}>A</span>CT
        </div>
        <div style={{ fontSize:56, marginBottom:20 }}>🎉</div>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:32, color:'#1A1612', marginBottom:12 }}>
          Pagamento aprovado!
        </h1>
        <p style={{ fontSize:15, color:'#5C5448', lineHeight:1.7, marginBottom:12 }}>
          Seu acesso ao plano <strong>{plano === 'vitalicio' ? 'Vitalício' : 'Pro Mensal'}</strong> foi ativado.
        </p>
        <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:6, padding:'12px 16px', fontSize:13, color:'#92400E', marginBottom:28, lineHeight:1.6 }}>
          <strong>Próximo passo:</strong> faça login com o e-mail usado no pagamento para acessar sua conta premium.
        </div>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/')}
            style={{ padding:'12px 28px', background:'#1A1612', color:'#F7F5F0', border:'none', borderRadius:3, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Fazer login →
          </button>
          <button onClick={() => navigate('/app')}
            style={{ padding:'12px 24px', background:'none', color:'#5C5448', border:'1px solid #CEC8BF', borderRadius:3, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            Ir para o gerador
          </button>
        </div>
      </div>
    </div>
  )
}
