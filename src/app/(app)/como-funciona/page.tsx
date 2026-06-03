import Link from 'next/link'

export default function ComoFuncionaPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-6">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">⚽ Como Funciona</h1>
        <p className="text-gray-500">Tudo que você precisa saber sobre o Copa dos Amigos</p>
      </div>

      {/* Passo a passo */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">🚀 Primeiros passos</h2>
        <div className="space-y-3">
          {[
            {
              step: '1',
              icon: '🏆',
              title: 'Crie um bolão',
              desc: 'Dê um nome para o seu bolão e defina o valor da entrada (opcional). Um código único é gerado automaticamente.',
            },
            {
              step: '2',
              icon: '📲',
              title: 'Convide seus amigos',
              desc: 'Compartilhe o código ou o link de convite no WhatsApp, Instagram ou onde preferir. Seus amigos entram com o código.',
            },
            {
              step: '3',
              icon: '💰',
              title: 'Confirmem o pagamento',
              desc: 'Cada participante faz o depósito combinado. O admin do bolão confirma os pagamentos para liberar os palpites.',
            },
            {
              step: '4',
              icon: '✏️',
              title: 'Façam os palpites',
              desc: 'Antes de cada jogo começar, registre seu palpite: placar exato do mandante e do visitante. Após o jogo, o palpite trava automaticamente.',
            },
            {
              step: '5',
              icon: '🏅',
              title: 'Acompanhe o ranking',
              desc: 'Os pontos são somados automaticamente após cada jogo. Veja em tempo real quem está ganhando.',
            },
          ].map(item => (
            <div key={item.step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pontuação */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">🎯 Sistema de pontuação</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="text-3xl">🥇</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">10 pontos — Placar exato</p>
                <p className="text-sm text-gray-500">Você acertou o placar exato do jogo</p>
                <p className="text-xs text-green-600 mt-0.5 font-medium">Ex: chutou 2×1 e foi 2×1</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="text-3xl">🥈</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">5 pontos — Resultado correto</p>
                <p className="text-sm text-gray-500">Você acertou quem ganhou (ou empate), mas não o placar</p>
                <p className="text-xs text-green-600 mt-0.5 font-medium">Ex: chutou 2×0 e foi 3×1 (vitória do mandante)</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="text-3xl">❌</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">0 pontos — Errou</p>
                <p className="text-sm text-gray-500">O resultado real foi diferente do que você chutou</p>
                <p className="text-xs text-red-400 mt-0.5 font-medium">Ex: chutou vitória do Brasil e foi empate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Desempate */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">⚖️ Critério de desempate</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-sm text-gray-600">Em caso de empate em pontos, a classificação é definida por:</p>
          <ol className="space-y-2">
            {[
              'Mais placares exatos acertados (10 pts)',
              'Mais resultados corretos (5 pts)',
              'Data do último palpite registrado (quem registrou antes fica na frente)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Premiação */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">🏆 Premiação</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-green-600 text-white">
            <p className="font-semibold">Prêmio total = nº de participantes × valor da entrada</p>
            <p className="text-green-100 text-sm mt-0.5">Ex: 10 pessoas × R$20 = R$200 de prêmio</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { pos: '🥇 1º lugar', pct: '70%', desc: 'R$140 no exemplo acima' },
              { pos: '🥈 2º lugar', pct: '20%', desc: 'R$40 no exemplo acima' },
              { pos: '🥉 3º lugar', pct: '10%', desc: 'R$20 no exemplo acima' },
            ].map(item => (
              <div key={item.pos} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-gray-900">{item.pos}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <span className="text-2xl font-bold text-green-700">{item.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regras importantes */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">📋 Regras importantes</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          {[
            { icon: '🔒', text: 'Palpites travam automaticamente quando o jogo começa — registre antes!' },
            { icon: '💳', text: 'Apenas participantes com pagamento confirmado têm os palpites contados.' },
            { icon: '👤', text: 'O criador do bolão é o admin e pode confirmar pagamentos e inserir resultados.' },
            { icon: '📱', text: 'Você pode participar de múltiplos bolões ao mesmo tempo.' },
            { icon: '🔢', text: 'Cada bolão tem um código único de 6 letras/números para convites.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="text-xl shrink-0">{item.icon}</span>
              <span className="leading-relaxed">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">❓ Perguntas frequentes</h2>
        <div className="space-y-2">
          {[
            {
              q: 'Posso editar meu palpite depois de registrar?',
              a: 'Sim, você pode alterar seu palpite quantas vezes quiser até o jogo começar.',
            },
            {
              q: 'E se eu não fizer palpite de um jogo?',
              a: 'Sem palpite = 0 pontos naquele jogo. Faça todos os palpites possíveis!',
            },
            {
              q: 'Quem pode ver o ranking?',
              a: 'Todos os participantes do bolão podem ver o ranking em tempo real.',
            },
            {
              q: 'Como o pagamento é confirmado?',
              a: 'O admin do bolão confirma manualmente no painel de administração. Combine com seu grupo como enviar o comprovante.',
            },
            {
              q: 'O que acontece nos jogos de mata-mata com prorrogação?',
              a: 'O palpite é baseado no placar ao final dos 90 minutos (ou 120 minutos de prorrogação). Pênaltis não contam para o placar.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="font-semibold text-gray-900 text-sm">📌 {item.q}</p>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-green-600 rounded-2xl p-6 text-center text-white space-y-4">
        <p className="text-xl font-bold">Pronto para jogar?</p>
        <p className="text-green-100 text-sm">Crie seu bolão agora e convide seus amigos!</p>
        <Link href="/onboarding"
          className="inline-block bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition text-base">
          Criar meu bolão 🏆
        </Link>
      </div>

    </div>
  )
}
