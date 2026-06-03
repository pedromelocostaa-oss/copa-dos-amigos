'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bolaoCode, setBolaoCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const next = searchParams.get('next') ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha incorretos. Verifique e tente novamente.')
      setLoading(false)
    } else {
      const code = bolaoCode.trim().toUpperCase()
      router.push(code.length >= 4 ? `/entrar/${code}` : next)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError('Erro ao enviar email. Verifique o endereço.')
    } else {
      setInfo('Email de recuperação enviado! Verifique sua caixa de entrada.')
      setShowReset(false)
    }
  }

  if (showReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-5">
          <button onClick={() => setShowReset(false)} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Voltar ao login
          </button>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">Recuperar senha</h2>
            <p className="text-gray-500 text-sm">Digite seu email e enviaremos um link para redefinir sua senha.</p>
          </div>
          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 min-h-[48px]">
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-green-700">⚽ Copa dos Amigos</h1>
          <p className="text-gray-500 text-sm">Faça login para acessar sua conta</p>
        </div>

        {info && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-4 py-3">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="seu@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-base" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <button type="button" onClick={() => { setShowReset(true); setResetEmail(email) }}
                className="text-xs text-green-600 hover:underline">
                Esqueci minha senha
              </button>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-base" />
          </div>

          {/* Código de bolão (opcional) */}
          <button type="button" onClick={() => setShowCode(v => !v)}
            className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1">
            {showCode ? '▾' : '▸'} Tenho um código de bolão
          </button>
          {showCode && (
            <input type="text" value={bolaoCode}
              onChange={e => setBolaoCode(e.target.value.toUpperCase())}
              maxLength={6} placeholder="Ex: AB12CD"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 font-mono text-2xl tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-green-500 text-base" />
          )}

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 min-h-[56px] text-base">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-green-600 font-semibold hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
