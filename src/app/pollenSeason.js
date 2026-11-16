const hour = 60 * 60 * 1000

export function pollenIssueTime(now = new Date()) {
  const seoul = new Date(now.getTime() + 9 * hour)
  const month = seoul.getUTCMonth() + 1
  if (month < 3 || month > 6) return null

  const localHour = seoul.getUTCHours()
  if (localHour < 6) seoul.setUTCDate(seoul.getUTCDate() - 1)
  if (seoul.getUTCMonth() + 1 < 3) return null

  const date = seoul.toISOString().slice(0, 10).replaceAll('-', '')
  return date + (localHour >= 6 && localHour < 18 ? '06' : '18')
}
