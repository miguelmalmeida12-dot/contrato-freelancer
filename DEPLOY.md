# 🚀 Deploy no Vercel — Guia Completo

## Pré-requisitos
- Conta no GitHub: https://github.com
- Conta no Vercel: https://vercel.com (gratuita)
- Conta de desenvolvedor no Mercado Pago: https://www.mercadopago.com.br/developers
- API Key da Anthropic: https://console.anthropic.com/settings/keys

---

## Passo 1 — Subir o projeto no GitHub

```bash
# Na pasta do projeto
cd contrato-freelancer

# Inicia o git
git init
git add .
git commit -m "feat: gerador de contratos com IA e Mercado Pago"

# Cria um repositório no GitHub (pelo site) e conecta
git remote add origin https://github.com/SEU_USUARIO/contrato-freelancer.git
git branch -M main
git push -u origin main
```

---

## Passo 2 — Conectar ao Vercel

1. Acesse https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `contrato-freelancer`
4. Em **Framework Preset**, selecione **Vite**
5. Clique em **Deploy** (vai falhar na primeira vez — é normal, faltam as variáveis)

---

## Passo 3 — Configurar as variáveis de ambiente

No painel do Vercel:
1. Vá em **Settings → Environment Variables**
2. Adicione as seguintes variáveis (copie do `.env.example`):

| Variável | Onde obter | Exemplo |
|----------|-----------|---------|
| `MP_ACCESS_TOKEN` | MP Developers → Credenciais | `APP_USR-...` |
| `ANTHROPIC_API_KEY` | console.anthropic.com | `sk-ant-...` |
| `VITE_APP_URL` | URL do seu Vercel | `https://contrato-freelancer.vercel.app` |
| `VITE_PRECO_MENSAL` | Defina você | `3700` (= R$37,00) |
| `VITE_PRECO_VITALICIO` | Defina você | `19700` (= R$197,00) |

3. Após adicionar as variáveis, clique em **Redeploy**

---

## Passo 4 — Obter o Access Token do Mercado Pago

### Para testes (sandbox):
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Crie um novo aplicativo
3. Vá em **Credenciais de teste**
4. Copie o **Access Token** (começa com `TEST-`)

### Para produção:
1. Na mesma tela, acesse **Credenciais de produção**
2. Copie o **Access Token** (começa com `APP_USR-`)

> ⚠️ **Atenção**: Use `TEST-` para testar e `APP_USR-` para receber pagamentos reais.

---

## Passo 5 — Configurar o Webhook do Mercado Pago

Para receber notificações de pagamento aprovado:

1. No painel do MP: https://www.mercadopago.com.br/developers/panel/webhooks
2. Clique em **"Adicionar webhook"**
3. URL: `https://SEU-PROJETO.vercel.app/api/webhook-pagamento`
4. Eventos: selecione **`payment`**
5. Salve

---

## Passo 6 — Testar o pagamento em sandbox

Use os dados de teste do Mercado Pago:

**Cartão aprovado:**
- Número: `5031 4332 1540 6351`
- Vencimento: qualquer data futura
- CVV: `123`
- Nome: `APRO`

**Cartão recusado:**
- Nome: `OTHE` (outros erros)

---

## Estrutura de arquivos final

```
contrato-freelancer/
├── api/
│   ├── criar-pagamento.js     ← Cria preferência no Mercado Pago
│   ├── webhook-pagamento.js   ← Recebe confirmações de pagamento
│   └── gerar-clausulas.js     ← Gera cláusulas com Claude API
├── src/
│   ├── pages/
│   │   ├── Landing.jsx        ← Página de vendas com planos
│   │   ├── Gerador.jsx        ← App principal do gerador
│   │   ├── Sucesso.jsx        ← Pós-pagamento aprovado
│   │   └── PagamentoFalhou.jsx
│   ├── App.jsx                ← Router
│   ├── main.jsx               ← Entry point
│   └── index.css
├── index.html
├── vite.config.js
├── vercel.json                ← Configuração de rotas
├── package.json
└── .env.example               ← Variáveis necessárias
```

---

## Próximos passos após o deploy

### Adicionar banco de dados (Supabase)
Para persistir assinaturas e controlar acesso:

```bash
npm install @supabase/supabase-js
```

Crie uma tabela `assinantes` no Supabase:
```sql
create table assinantes (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  plano text not null,           -- 'mensal' ou 'vitalicio'
  ativo boolean default true,
  pagamento_id text,
  criado_em timestamptz default now()
);
```

Descomente o código Supabase no `webhook-pagamento.js` e adicione as variáveis:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

### Adicionar envio de email (Resend)
```bash
npm install resend
```

Descomente o código Resend no `webhook-pagamento.js` e adicione:
- `RESEND_API_KEY`

### Domínio personalizado
No Vercel: **Settings → Domains → Add Domain**
Ex: `contrato.seusite.com.br`

---

## Comandos úteis para desenvolvimento local

```bash
# Instalar dependências
npm install

# Rodar localmente (frontend + API)
npm run dev

# Build para produção
npm run build

# Ver logs das funções serverless no Vercel
vercel logs https://contrato-freelancer.vercel.app/api/criar-pagamento
```

---

## Custos estimados de operação

| Serviço | Plano gratuito | Custo após |
|---------|----------------|-----------|
| Vercel | 100GB bandwidth/mês | $20/mês |
| Claude API | — | ~R$0,01 por contrato gerado |
| Mercado Pago | — | 4,99% por transação aprovada |
| Supabase | 500MB banco, 2GB storage | $25/mês |

> Com 20 assinantes pagando R$37/mês = R$740 MRR, o custo operacional fica abaixo de R$50/mês.
