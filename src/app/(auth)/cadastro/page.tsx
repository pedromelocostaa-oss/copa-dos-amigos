'use client'

import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CadastroForm() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  // 'form' | 'check-email' — muda de estado quando email de confirmação é enviado
  const [screen, setScreen]     = useState<'form' | 'check-email'>('form')

  const router      = useRouter()
  const searchParams = useSearchParams()
  const supabase    = createClient()

  // next é a rota pós-auth (ex.: /entrar/AB12CD)
  const next = searchParams.get('next') ?? '/onboarding'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        // Se email confirmation estiver ligada, o link de confirmação redirecionará
        // para esta URL — o usuário vai direto ao bolão de onde veio.
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    })

    setLoading(false)

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Este email já está cadastrado. Faça login.')
      } else if (signUpError.message.includes('rate limit') || signUpError.message.includes('too many')) {
        setError('Muitos cadastros em pouco tempo. Aguarde alguns minutos e tente novamente.')
      } else {
        setError(signUpError.message)
      }
      return
    }

    // Supabase retorna session=null quando confirmation de email está ligada.
    // Verifica se sessão foi criada imediatamente.
    const hasSession = !!data.session

    if (hasSession) {
      // Confirmação desligada (ou usuário já confirmado): vai direto para o destino
      router.push(next)
    } else {
      // Confirmação ligada: mostra tela de "verifique seu email"
      setScreen('check-email')
    }
  }

  // ── Tela de "verifique seu email" ────────────────────────────────────────
  if (screen === 'check-email') {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-green-600 to-green-800 px-5 py-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-5 text-center">
            <div className="text-6xl">📬</div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Confirme seu email</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Enviamos um link de confirmação para
              </p>
              <p className="font-semibold text-green-700">{email}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left space-y-2">
              <p className="text-sm font-bold text-blue-800">O que fazer agora:</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Abra seu email</li>
                <li>Clique no link de confirmação</li>
                <li>Você será redirecionado automaticamente para o bolão</li>
              </ol>
            </div>

            <p className="text-xs text-gray-400">
              Não recebeu?{' '}
              <button
                onClick={() => setScreen('form')}
                className="text-green-600 font-medium hover:underline"
              >
                Tentar novamente
              </button>
            </p>

            <Link
              href="/login"
              className="block w-full text-center text-sm text-gray-400 hover:text-green-600 transition"
            >
              Já confirmei → Fazer login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulário de cadastro ────────────────────────────────────────────────
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Seu nome
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Pedro Silva"
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3.5 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3.5 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3.5 focus:outline-none transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 min-h-[56px] text-base"
            >
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
