export function addDays(dateStr, n) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((new Date() - new Date(dateStr)) / 86400000)
}

export function isDueToday(lead) {
  if (lead.outcome || !lead.quote_date || lead.stage !== 'Follow-Up') return false
  const da = daysSince(lead.quote_date)
  const fu = lead.fu_count || 0
  return (fu === 0 && da >= 2) || (fu === 1 && da >= 5) || (fu === 2 && da >= 10)
}

export function stageLabel(lead) {
  return lead.outcome || lead.stage
}

export function stageBadgeClass(lead) {
  if (lead.outcome === 'Won')  return 'bw'
  if (lead.outcome === 'Lost') return 'bl'
  if (lead.outcome === 'Cold') return 'bc'
  return 'bs'
}

export function getFuDates(lead) {
  if (!lead.quote_date) return null
  return {
    fu1: addDays(lead.quote_date, 2),
    fu2: addDays(lead.quote_date, 5),
    fu3: addDays(lead.quote_date, 10),
  }
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
