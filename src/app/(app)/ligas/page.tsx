// U4.1: /ligas era rota órfã sobrepondo-se a /onboarding e /dashboard.
// Redirecionado para /dashboard onde criar/entrar em bolão já está integrado.
import { redirect } from 'next/navigation'

export default function LigasPage() {
  redirect('/dashboard')
}
