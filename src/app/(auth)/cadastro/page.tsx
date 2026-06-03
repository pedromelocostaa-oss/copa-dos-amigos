'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CadastroForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const next = searchParams.get('next') ?? '/onboarding'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      setError(error.message === 'User already registered'
        ? 'Este email já está cadastrado. Faça login.'
        : error.message)
      setLoading(false)
    } else {
      router.push(next)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-green-600 to-green-800 px-5 py-8">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center text-white space-y-1">
          <h1 className="text-2xl font-bold">⚽ Copa dos Amigos</h1>
          <p className="text-green-100 text-sm">Crie sua conta gratuitamente</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Seu nome</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                required placeholder="Pedro Silva"
                autoComplete="name"
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3.5 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="seu@email.com"
                autoComplete="email"
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3.5 focus:outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={6} placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3.5 focus:outline-none transition" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 min-h-[56px] text-base">
              {loading ? 'Criando conta...' : 'Criar conta grátis →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 pt-1">
            Já tem conta?{' '}
            <Link href="/login" className="text-green-600 font-bold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return <Suspense><CadastroForm /></Suspense>
}
