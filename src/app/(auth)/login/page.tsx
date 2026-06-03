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
  const [loading, setLoading]  = useState(false)
  const [googleLoading, setGL] = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const next = searchParams.get('next') ?? '/dashboard'

  async function handleGoogle() {
    setGL(true)
    const redirectTo = `${window.location.origin}/auth/callback?next=${next}`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    // Supabase redireciona o browser — setGL nunca volta para false aqui
  }

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

        {/* Google OAuth — 1 toque no mobile */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 bg-white rounded-xl py-3.5 text-gray-700 font-semibold transition disabled:opacity-50 min-h-[52px]"
        >
          {/* Ícone Google SVG inline — sem dependência */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">ou com email</span>
          <div className="flex-1 h-px bg-gray-200" />
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

