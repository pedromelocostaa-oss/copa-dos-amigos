'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  leagueId: string
  code: string
  leagueName: string
}

type Tab = 'cadastro' | 'login'

export default function EntrarInlineForm({ leagueId, code, leagueName }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('cadastro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cadastro
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  async function joinLeague(userId: string) {
    await supabase.from('league_members').upsert(
      { league_id: leagueId, user_id: userId },
      { onConflict: 'league_id,user_id' }
    )
    router.push('/palpites')
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/entrar/${code}`,
      },
    })

    if (signUpError) {
      setError(signUpError.message.includes('already registered')
        ? 'Este e-mail já está cadastrado. Use a aba "Já tenho conta".'
        : signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      // Confirmação desligada — entra direto
      await joinLeague(data.session.user.id)
    } else {
      // Email de confirmação enviado — avisa e aguarda
      setError('__check_email__')
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })

    if (loginError) {
      setError('E-mail ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }

    await joinLeague(data.session.user.id)
  }

  if (error === '__check_email__') {
    return (
      <div className="bg-white rounded-2xl p-6 text-center space-y-3 shadow-xl">
        <div className="text-4xl">📬</div>
        <p className="font-bold text-gray-900">Confirme seu e-mail</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Enviamos um link para <strong>{email}</strong>.<br />
          Clique nele e você será direcionado para o bolão <strong>{leagueName}</strong>.
        </p>
        <button
          onClick={() => setError('')}
          className="text-green-600 text-sm underline"
        >
          Usar outro e-mail
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-gray-100">
        <button
          onClick={() => { setTab('cadastro'); setError('') }}
          className={`py-3.5 text-sm font-semibold transition ${
            tab === 'cadastro'
              ? 'bg-green-600 text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Criar conta
        </button>
        <button
          onClick={() => { setTab('login'); setError('') }}
          className={`py-3.5 text-sm font-semibold transition ${
            tab === 'login'
              ? 'bg-green-600 text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Já tenho conta
        </button>
      </div>

      <div className="p-5 space-y-4">
        {tab === 'cadastro' ? (
          <form onSubmit={handleCadastro} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Seu nome"
              autoComplete="name"
              style={{ fontSize: '16px' }}
              className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 focus:outline-none transition"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Seu e-mail"
              autoComplete="email"
              style={{ fontSize: '16px' }}
              className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 focus:outline-none transition"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Senha (mín. 6 caracteres)"
              autoComplete="new-password"
              style={{ fontSize: '16px' }}
              className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 focus:outline-none transition"
            />
            {error && error !== '__check_email__' && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-black py-4 rounded-xl text-lg disabled:opacity-50 transition min-h-[56px]"
            >
              {loading ? 'Entrando...' : 'Entrar no bolão ⚽'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
              placeholder="Seu e-mail"
              autoComplete="email"
              style={{ fontSize: '16px' }}
              className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 focus:outline-none transition"
            />
            <input
              type="password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              required
              placeholder="Sua senha"
              autoComplete="current-password"
              style={{ fontSize: '16px' }}
              className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-3 focus:outline-none transition"
            />
            {error && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-black py-4 rounded-xl text-lg disabled:opacity-50 transition min-h-[56px]"
            >
              {loading ? 'Entrando...' : 'Entrar no bolão ⚽'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400">
          Grátis · Sem cartão · Cancele quando quiser
        </p>
      </div>
    </div>
  )
}
