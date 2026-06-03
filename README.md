# ⚽ Copa dos Amigos

Plataforma de bolão da Copa do Mundo 2026 — Next.js + TypeScript + Tailwind + Supabase.

## Funcionalidades

- Cadastro e login de participantes
- Controle de pagamentos (Pago / Pendente / Isento)
- Palpites com bloqueio automático após início da partida
- Ranking em tempo real com desempate por placar exato → resultado → data
- Ligas privadas com código de convite
- Painel admin: participantes, pagamentos, resultados
- Premiação automática: 70% / 20% / 10%

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Supabase (auth, banco, realtime)
- **Deploy:** Vercel

## Como rodar localmente

1. Clone o projeto:
   ```bash
   git clone https://github.com/pedromelocostaa-oss/copa-dos-amigos.git
   cd copa-dos-amigos
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o ambiente — copie o exemplo e preencha com suas chaves do Supabase:
   ```bash
   cp .env.local.example .env.local
   ```

4. Rode o banco de dados — cole o conteúdo de `supabase/schema.sql` no SQL Editor do seu projeto Supabase.

5. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

6. Acesse [http://localhost:3000](http://localhost:3000)

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key   # nunca committar!
```

## Colaboradores

- Pedro Melo Costa
- Fernando (fernandoinnecco98@gmail.com)
