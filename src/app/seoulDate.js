const dayMs = 24 * 60 * 60 * 1000
const seoulOffsetMs = 9 * 60 * 60 * 1000

export function seoulDate(now = new Date(), daysFromToday = 0) {
  return new Date(now.getTime() + seoulOffsetMs + daysFromToday * dayMs).toISOString().slice(0, 10)
}
