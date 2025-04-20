// src/app/api/pollen/route.js
export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const areaNo = searchParams.get('areaNo') || '1100000000'
  
    const apiKey = process.env.NEXT_PUBLIC_SEOUL_POLLEN_API_KEY
    const time = new Date().toISOString().slice(0, 13).replace(/[-T]/g, '')
  
    const url = `http://apis.data.go.kr/1360000/HealthWthrIdxServiceV3/getPinePollenRiskIdxV3?serviceKey=${apiKey}&pageNo=1&numOfRows=10&dataType=XML&areaNo=${areaNo}&time=${time}`
  
    try {
      const res = await fetch(url)
      const data = await res.text()
  
      return new Response(data, {
        headers: { 'Content-Type': 'application/xml' },
      })
    } catch (error) {
      return new Response('Pollen API Error', { status: 500 })
    }
  }
  