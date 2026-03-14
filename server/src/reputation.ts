import { db } from './db.js'

interface CreditScore {
  score: number
  report_count: number
}

const getScoreStmt = db.prepare(
  'SELECT score, report_count FROM credit_scores WHERE agent_name = ?',
)

const recalcScoreStmt = db.prepare(`
  SELECT CAST(ROUND(AVG(score)) AS INTEGER) as avg_score, COUNT(DISTINCT reporter) as unique_reporters
  FROM credit_reports WHERE target = ?
`)

const upsertScoreStmt = db.prepare(`
  INSERT INTO credit_scores (agent_name, score, report_count, updated_at)
  VALUES (?, ?, ?, unixepoch())
  ON CONFLICT(agent_name) DO UPDATE SET
    score = excluded.score,
    report_count = excluded.report_count,
    updated_at = unixepoch()
`)

// Rate limit: check if reporter already submitted within 24h
const recentReportStmt = db.prepare(
  'SELECT id FROM credit_reports WHERE reporter = ? AND target = ? AND created_at > unixepoch() - 86400',
)

// Upsert: one active report per (reporter, target) — update replaces the old score
const upsertReportStmt = db.prepare(`
  INSERT INTO credit_reports (reporter, target, score, reason)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(reporter, target) DO UPDATE SET
    score = excluded.score,
    reason = excluded.reason,
    created_at = unixepoch()
`)

const getReportsStmt = db.prepare(
  'SELECT reporter, score, reason, created_at FROM credit_reports WHERE target = ? ORDER BY created_at DESC LIMIT 50',
)

export function getReputation(name: string): CreditScore {
  const row = getScoreStmt.get(name) as CreditScore | undefined
  return row ?? { score: 50, report_count: 0 }
}

export function submitReport(
  reporter: string,
  target: string,
  score: number,
  reason?: string,
): CreditScore | null {
  // Rate limit: one update per (reporter, target) per 24h
  const recent = recentReportStmt.get(reporter, target)
  if (recent) return null

  upsertReportStmt.run(reporter, target, score, reason ?? null)

  // Recalculate from all reports (accurate, not incremental)
  const calc = recalcScoreStmt.get(target) as { avg_score: number; unique_reporters: number }
  upsertScoreStmt.run(target, calc.avg_score, calc.unique_reporters)

  return { score: calc.avg_score, report_count: calc.unique_reporters }
}

export function getReports(name: string) {
  return getReportsStmt.all(name)
}
