function concentration(value) {
  if (value == null || String(value).trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

export async function GET() {
  const key = process.env.SEOUL_AIR_API_KEY || process.env.NEXT_PUBLIC_SEOUL_FINE_DUST_API_KEY
  if (!key) return Response.json({ error: '서울시 대기질 API 키가 필요합니다.' }, { status: 503 })

  try {
    const url = 'http://openapi.seoul.go.kr:8088/' + encodeURIComponent(key) + '/json/RealtimeCityAir/1/25/'
    const upstream = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(8000) })
    if (!upstream.ok) throw new Error()
    const data = await upstream.json()
    const rows = data.RealtimeCityAir?.row
    if (!Array.isArray(rows) || !rows.length) throw new Error()
    const districts = Object.fromEntries(rows.map(row => [row.MSRSTE_NM, {
      fine: concentration(row.PM10),
      ultra: concentration(row.PM25),
      observedAt: row.MSRDT,
    }]))
    return Response.json(districts, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' },
    })
  } catch {
    return Response.json({ error: '서울시 대기질을 불러오지 못했습니다.' }, { status: 502 })
  }
}
