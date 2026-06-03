'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bolaoCode, setBolaoCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [error, setError] = useState('')
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
      setError('Email ou senha incorretos.')
      setLoading(false)
    } else {
      const code = bolaoCode.trim().toUpperCase()
      if (code.length >= 4) {
        router.push(`/entrar/${code}`)
      } else {
        router.push(next)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">⚽ Copa dos Amigos</h1>
          <p className="text-gray-500 mt-1">Faça login para acessar sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
              placeholder="••••••••"
            />
          </div>

          {/* Toggle código do bolão */}
          <button type="button" onClick={() => setShowCode(v => !v)}
            className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1">
            {showCode ? '▾' : '▸'} Tenho um código de bolão
          </button>

          {showCode && (
            <input
              type="text"
              value={bolaoCode}
              onChange={e => setBolaoCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="Ex: AB12CD"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 font-mono text-xl tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 min-h-[48px]">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-green-600 font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
