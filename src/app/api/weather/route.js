// src/app/api/weather/route.js
export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const nx = searchParams.get('nx') || '60'
    const ny = searchParams.get('ny') || '127'
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
    const apiUrl = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"

    const now = new Date()
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const yyyy = kst.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const base_date = `${yyyy}${mm}${dd}`

    const params = new URLSearchParams({
        serviceKey: apiKey,
        numOfRows: '1000',
        pageNo: '1',
        dataType: 'JSON',
        base_date,
        base_time: '0200',
        nx: nx,
        ny: ny
    })

    const url = `${apiUrl}?${params.toString()}`

    try {
        const res = await fetch(url)
        const data = await res.json()

        const items = data.response.body.items.item

        const get = (category, fcstTime) =>
            items.find(item => item.category === category && item.fcstTime === fcstTime)?.fcstValue || null
        const targetTimes = ['0800', '1100', '1400', '1700', '2000', '2300']
        const rain = targetTimes.map(time => ({
            time,
            value: parseInt(get('POP', time)) || 0
        }))
        const result = {
            tmx: get('TMX', '1500'),
            tmn: get('TMN', '0600'),
            rain
        }
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        console.error('❌ 날씨 API 오류:', err)
        return new Response(JSON.stringify({ error: '기상청 API 오류' }), { status: 500 })
    }
}
