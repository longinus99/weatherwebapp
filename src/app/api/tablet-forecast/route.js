const locations = [
  { name: '도봉구', latitude: 37.6688, longitude: 127.0472 },
  { name: '서대문구', latitude: 37.5791, longitude: 126.9368 },
]

export async function GET() {
  const query = new URLSearchParams({
    latitude: locations.map(location => location.latitude).join(','),
    longitude: locations.map(location => location.longitude).join(','),
    hourly: 'temperature_2m,precipitation,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'Asia/Seoul',
    forecast_days: '7',
  })
  try {
    const upstream = await fetch('https://api.open-meteo.com/v1/forecast?' + query, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    })
    if (!upstream.ok) throw new Error()
    const data = await upstream.json()
    if (!Array.isArray(data) || data.length !== locations.length) throw new Error()
    const forecast = Object.fromEntries(locations.map(({ name }, index) => {
      const { hourly, daily } = data[index]
      return [name, {
        hours: hourly.time.map((time, i) => ({
          time, temperature: hourly.temperature_2m[i],
          rain: hourly.precipitation[i], probability: hourly.precipitation_probability[i],
        })).filter(({ time }) => time.slice(0, 10) === daily.time[0]),
        days: daily.time.map((date, i) => ({
          date, code: daily.weather_code[i], high: daily.temperature_2m_max[i], low: daily.temperature_2m_min[i],
        })),
      }]
    }))
    return Response.json(forecast, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' },
    })
  } catch {
    return Response.json({ error: '예보를 불러오지 못했습니다.' }, { status: 502 })
  }
}
