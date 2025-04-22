// src/app/api/finedust/route.js
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  const apiKey = process.env.NEXT_PUBLIC_SEOUL_FINE_DUST_API_KEY
  const url = `http://openapi.seoul.go.kr:8088/${apiKey}/xml/ListAirQualityByDistrictService/1/5/${code}/`

  try {
    const res = await fetch(url)
    const data = await res.text()
    return new Response(data, {
      headers: { 'Content-Type': 'application/xml' },
    })
  } catch (err) {
    return new Response('API Error', { status: 500 })
  }
}
