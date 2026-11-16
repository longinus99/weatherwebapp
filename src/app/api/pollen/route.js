import { pollenIssueTime } from '../../pollenSeason'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const areaNo = searchParams.get('areaNo') || '1100000000'

  const time = pollenIssueTime()
  if (!time) return new Response('<response/>', {
    headers: { 'Content-Type': 'application/xml' },
  })

  const apiKey = process.env.NEXT_PUBLIC_SEOUL_POLLEN_API_KEY
  if (!apiKey) return new Response('Pollen API key missing', { status: 503 })

  const url = `http://apis.data.go.kr/1360000/HealthWthrIdxServiceV3/getPinePollenRiskIdxV3?serviceKey=${apiKey}&pageNo=1&numOfRows=10&dataType=XML&areaNo=${areaNo}&time=${time}`

  try {
    const res = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error()
    const data = await res.text()

    return new Response(data, {
      headers: { 'Content-Type': 'application/xml' },
    })
  } catch (error) {
    return new Response('Pollen API Error', { status: 500 })
  }
}
