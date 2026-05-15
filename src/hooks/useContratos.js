// src/hooks/useContratos.js
// Gerencia contratos salvos localmente por usuário
// Em produção: substituir localStorage por chamadas ao Supabase

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'tract_contratos'

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function useContratos() {
  const [contratos, setContratos] = useState([])

  useEffect(() => {
    setContratos(getAll())
  }, [])

  // Salva um novo contrato
  const salvarContrato = useCallback(({ tipo, data, clausulasIA }) => {
    const tipoLabels = {
      servicos: 'Prestação de Serviços',
      software: 'Desenvolvimento de Software',
      design: 'Design / Criação',
      influencer: 'Influencer Marketing',
    }

    // Tenta extrair um nome descritivo automaticamente
    const nomeCliente =
      data.cont_nome || data.cli_nome || data.dc_nome || data.mk_nome || ''
    const nomeServico =
      data.proj_nome || data.dg_tipo || data.cp_produto || tipoLabels[tipo] || ''

    const novoContrato = {
      id: `contrato_${Date.now()}`,
      tipo,
      tipoLabel: tipoLabels[tipo] || tipo,
      titulo: nomeCliente
        ? `${tipoLabels[tipo]} — ${nomeCliente}`
        : tipoLabels[tipo] || 'Contrato',
      descricao: nomeServico,
      data,
      clausulasIA: clausulasIA || null,
      criadoEm: new Date().toISOString(),
      status: 'rascunho', // 'rascunho' | 'assinado'
    }

    const lista = getAll()
    lista.unshift(novoContrato) // mais recente primeiro
    saveAll(lista)
    setContratos([...lista])
    return novoContrato
  }, [])

  // Remove um contrato por ID
  const removerContrato = useCallback((id) => {
    const lista = getAll().filter(c => c.id !== id)
    saveAll(lista)
    setContratos([...lista])
  }, [])

  // Atualiza o status de um contrato
  const atualizarStatus = useCallback((id, status) => {
    const lista = getAll().map(c => c.id === id ? { ...c, status } : c)
    saveAll(lista)
    setContratos([...lista])
  }, [])

  // Carrega um contrato para edição
  const carregarContrato = useCallback((id) => {
    return getAll().find(c => c.id === id) || null
  }, [])

  return { contratos, salvarContrato, removerContrato, atualizarStatus, carregarContrato }
}
