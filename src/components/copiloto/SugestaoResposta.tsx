'use client'

import { useState } from 'react'

interface Interacao {
  direcao: string
  mensagem: string
  criadoEm: string
}

interface Props {
  osId: string
  clienteNome: string
  descricao: string
  intencao: string
  urgencia: string
  canal: string
  protocolo: string
  interacoes: Interacao[]
}

const urgenciaCor: Record<string, string> = {
  alta:  'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-green-100 text-green-700',
}

export function SugestaoResposta({
  osId,
  clienteNome,
  descricao,
  intencao,
  urgencia,
  canal,
  protocolo,
  interacoes,
}: Props) {
  const [textoAtendente, setTextoAtendente] = useState('')
  const [sugestao, setSugestao] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function gerarSugestao() {
    setCarregando(true)
    setSugestao('')

    const res = await fetch('/api/agentes/copiloto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ osId, textoAtendente }),
    })

    if (!res.ok || !res.body) {
      setSugestao('Erro ao gerar sugestão. Tente novamente.')
      setCarregando(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setSugestao((prev) => prev + decoder.decode(value))
    }

    setCarregando(false)
  }

  function copiarSugestao() {
    navigator.clipboard.writeText(sugestao)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da OS */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{clienteNome}</h2>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgenciaCor[urgencia]}`}>
            {urgencia.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-gray-600">{descricao}</p>
        <p className="text-xs text-gray-400">
          {intencao} · {canal} · protocolo #{protocolo}
        </p>
      </div>

      {/* Histórico de interações */}
      {interacoes.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase">Histórico</p>
          {interacoes.map((i, idx) => (
            <div
              key={idx}
              className={`flex ${i.direcao === 'entrada' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-sm px-3 py-2 rounded-lg text-sm ${
                  i.direcao === 'entrada'
                    ? 'bg-white border border-gray-200 text-gray-800'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {i.mensagem}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campo do atendente */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          O que você quer dizer? (opcional — deixe vazio para sugestão completa)
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Ex: quero informar que o técnico vai amanhã..."
          value={textoAtendente}
          onChange={(e) => setTextoAtendente(e.target.value)}
        />
      </div>

      <button
        onClick={gerarSugestao}
        disabled={carregando}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition"
      >
        {carregando ? 'Gerando sugestão...' : 'Gerar sugestão com IA'}
      </button>

      {/* Sugestão gerada */}
      {(sugestao || carregando) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Sugestão do Copiloto</p>
            {sugestao && !carregando && (
              <button
                onClick={copiarSugestao}
                className="text-xs text-blue-600 hover:underline"
              >
                Copiar
              </button>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap min-h-[80px]">
            {sugestao}
            {carregando && (
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
