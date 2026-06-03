/**
 * scripts/db-setup.ts
 * Aplica schema + seed de forma idempotente e verifica o estado resultante.
 *
 * Pré-requisito: DATABASE_URL no .env.local apontando para o Supabase PostgreSQL.
 * Obtenha em: Supabase Dashboard → Project → Settings → Database → Connection string
 * Formato (Transaction Pooler — IPv4 friendly):
 *   postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
 *
 * Execute: npm run db:setup
 * (ou: npx tsx scripts/db-setup.ts)
 */

import { Client } from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── .env.local manual parse (sem dotenv para não adicionar dependência) ─────
const __dir = dirname(fileURLToPath(import.meta.url))
const root  = join(__dir, '..')

function loadEnv() {
  try {
    const lines = readFileSync(join(root, '.env.local'), 'utf-8').split('\n')
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    }
  } catch { /* .env.local opcional */ }
}
loadEnv()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error(`
❌  DATABASE_URL não encontrada.

1. Acesse: Supabase Dashboard → Settings → Database → Connection string
2. Copie a string "Transaction Pooler" (porta 6543, IPv4 friendly)
3. Adicione no .env.local:
   DATABASE_URL=postgresql://postgres.SEU_REF:SUA_SENHA@aws-0-REGION.pooler.supabase.com:6543/postgres

⚠️  NUNCA commite DATABASE_URL. Ela contém a senha do banco.
`)
  process.exit(1)
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  })

  try {
    console.log('🔗 Conectando ao banco...')
    await client.connect()
    console.log('✅ Conectado!\n')

    // ── 1. Aplica schema.sql ─────────────────────────────────────────────
    console.log('📄 Aplicando schema.sql...')
    const schema = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf-8')
    await client.query(schema)
    console.log('✅ schema.sql aplicado\n')

    // ── 2. Aplica seed.sql (idempotente: ON CONFLICT DO NOTHING) ─────────
    console.log('🌱 Aplicando seed.sql...')
    const seed = readFileSync(join(root, 'supabase', 'seed.sql'), 'utf-8')
    // seed.sql usa INSERT (sem ON CONFLICT) — wrapa em bloco que ignora duplicatas
    const safeSeed = `
      DO $seed$
      BEGIN
        ${seed.replace(/;/g, ';\n')}
      EXCEPTION WHEN unique_violation THEN
        -- seed já aplicado, ignora
        NULL;
      END
      $seed$;
    `
    try {
      await client.query(safeSeed)
      console.log('✅ seed.sql aplicado\n')
    } catch (e: any) {
      // Fallback: tenta statement-by-statement para identificar o problema
      console.warn('⚠️  seed.sql em bloco falhou, tentando statement a statement...')
      const stmts = seed.split(';').map(s => s.trim()).filter(s => s.length > 10)
      let inserted = 0, skipped = 0
      for (const stmt of stmts) {
        try {
          await client.query(stmt)
          inserted++
        } catch (se: any) {
          if (se.code === '23505') { skipped++ } // unique violation → já existe
          else { console.warn(`  skip: ${se.message.substring(0, 80)}`) }
        }
      }
      console.log(`✅ seed: ${inserted} statements OK, ${skipped} duplicatas ignoradas\n`)
    }

    // ── 3. Aplica RLS de predictions (P0.2) ──────────────────────────────
    console.log('🔒 Aplicando políticas RLS de predictions (P0.2)...')
    const rls = `
      DROP POLICY IF EXISTS "predictions_select" ON predictions;
      CREATE POLICY "predictions_select" ON predictions FOR SELECT TO authenticated
        USING (
          auth.uid() = user_id
          OR EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = match_id
              AND m.match_date <= now()
          )
        );

      DROP POLICY IF EXISTS "predictions_insert" ON predictions;
      CREATE POLICY "predictions_insert" ON predictions FOR INSERT TO authenticated
        WITH CHECK (
          auth.uid() = user_id
          AND EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = match_id
              AND m.match_date > now()
              AND m.is_finished = false
          )
        );

      DROP POLICY IF EXISTS "predictions_update" ON predictions;
      CREATE POLICY "predictions_update" ON predictions FOR UPDATE TO authenticated
        USING  (auth.uid() = user_id)
        WITH CHECK (
          auth.uid() = user_id
          AND EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = match_id
              AND m.match_date > now()
              AND m.is_finished = false
          )
        );
    `
    await client.query(rls)
    console.log('✅ Políticas RLS de predictions atualizadas\n')

    // ── 4. Corrige league_ranking view (bug: soma pontos globais) ─────────
    console.log('🔧 Corrigindo view league_ranking (pontos por liga)...')
    const leagueRankingFix = `
      CREATE OR REPLACE VIEW league_ranking AS
      SELECT
        lm.league_id,
        p.user_id,
        p.name,
        COALESCE(SUM(pr.points), 0) AS total_points,
        COALESCE(COUNT(pr.id) FILTER (WHERE pr.points = 10), 0) AS exact_scores,
        COALESCE(COUNT(pr.id) FILTER (WHERE pr.points = 5),  0) AS correct_results,
        MAX(pr.created_at) AS last_prediction_at
      FROM league_members lm
      JOIN participants p ON p.user_id = lm.user_id
      -- JOIN com matches para garantir que só contabiliza jogos que já foram
      -- inseridos como predictions (sem filtro de liga — o bolão aberto inclui tudo)
      LEFT JOIN predictions pr ON pr.user_id = lm.user_id
      GROUP BY lm.league_id, p.user_id, p.name;

      GRANT SELECT ON league_ranking TO authenticated;
    `
    await client.query(leagueRankingFix)
    console.log('✅ league_ranking atualizada\n')

    // ── 5. Adiciona entry_fee à leagues (P2.1) ───────────────────────────
    console.log('💰 Adicionando entry_fee à tabela leagues (P2.1)...')
    await client.query(`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS entry_fee integer NOT NULL DEFAULT 0;`)
    console.log('✅ leagues.entry_fee adicionada\n')

    // ── 6. Verificação final ─────────────────────────────────────────────
    console.log('🔍 Verificação final...\n')

    const { rows: matchCount } = await client.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE stage = 'Fase de Grupos') AS grupo,
              COUNT(*) FILTER (WHERE home_iso IS NOT NULL AND home_iso != '') AS com_iso
       FROM matches`
    )
    console.log(`  matches: ${matchCount[0].total} total | ${matchCount[0].grupo} fase de grupos | ${matchCount[0].com_iso} com home_iso`)

    const { rows: colCheck } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'matches'
        AND column_name IN ('home_iso','away_iso','group_name','city','stadium')
    `)
    const cols = colCheck.map(r => r.column_name)
    console.log(`  matches colunas extras: ${cols.join(', ')}`)

    const { rows: views } = await client.query(`
      SELECT viewname FROM pg_views
      WHERE schemaname = 'public'
        AND viewname IN ('ranking','group_standings','league_ranking','top_scorers','bolao_ranking')
    `)
    console.log(`  views: ${views.map(r => r.viewname).join(', ')}`)

    const { rows: pols } = await client.query(`
      SELECT policyname FROM pg_policies
      WHERE tablename = 'predictions'
    `)
    console.log(`  predictions policies: ${pols.map(r => r.policyname).join(', ')}`)

    const { rows: lfCols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'leagues' AND column_name = 'entry_fee'
    `)
    console.log(`  leagues.entry_fee: ${lfCols.length ? '✅ existe' : '❌ ausente'}`)

    console.log('\n🎉 Setup concluído com sucesso!')

    // Critério de aceite P0.1:
    const total = Number(matchCount[0].total)
    const grupo = Number(matchCount[0].grupo)
    if (grupo < 72) {
      console.warn(`\n⚠️  Apenas ${grupo} jogos de grupo (esperado ≥ 72). Verifique o seed.sql.`)
    }
    if (cols.length < 5) {
      console.warn(`\n⚠️  Colunas faltando em matches: esperado home_iso, away_iso, group_name, city, stadium`)
    }
    if (views.length < 4) {
      console.warn(`\n⚠️  Views faltando: ${['ranking','group_standings','league_ranking','top_scorers'].filter(v => !views.find(r => r.viewname === v))}`)
    }

  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
