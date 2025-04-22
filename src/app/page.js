'use client'
import { useEffect, useState } from 'react'
import styles from './page.module.css'
import WeatherCard from './components/WeatherCard'

export default function Home() {
  const [dustData, setDustData] = useState({})
  const [forecastData, setForecastData] = useState({})
  const [pollenData, setPollenData] = useState(null)

  // 지역 설정 (미세먼지 코드 + 좌표)
  const regions = {
    서대문구: { code: '111191', nx: '59', ny: '127' },
    도봉구: { code: '111171', nx: '61', ny: '129' },
  }

  useEffect(() => {
    const fetchDust = async (code) => {
      const res = await fetch(`/api/finedust?code=${code}`)
      const text = await res.text()
      const xml = new DOMParser().parseFromString(text, 'text/xml')

      return {
        maxIndex: xml.getElementsByTagName('MAXINDEX')[0]?.textContent || '없음',
        grade: xml.getElementsByTagName('GRADE')[0]?.textContent || '없음'
      }
    }

    const fetchForecast = async (nx, ny) => {
      const res = await fetch(`/api/weather?nx=${nx}&ny=${ny}`)
      return await res.json()
    }

    const fetchPollen = async () => {
      const res = await fetch('/api/pollen')
      const text = await res.text()
      const xml = new DOMParser().parseFromString(text, 'text/xml')
      const item = xml.getElementsByTagName('item')[0]
      let index = item?.getElementsByTagName('today')[0]?.textContent || ''
      if (!index) index = item?.getElementsByTagName('tomorrow')[0]?.textContent || ''
      setPollenData({ index })
    }

    const load = async () => {
      const dustPromises = Object.entries(regions).map(async ([region, { code }]) => {
        const data = await fetchDust(code)
        return [region, data]
      })
    
      // 병렬로 예보 데이터 요청
      const forecastPromises = Object.entries(regions).map(async ([region, { nx, ny }]) => {
        const data = await fetchForecast(nx, ny)
        return [region, data]
      })
    
      const dustEntries = await Promise.all(dustPromises)
      const forecastEntries = await Promise.all(forecastPromises)
    
      setDustData(Object.fromEntries(dustEntries))
      setForecastData(Object.fromEntries(forecastEntries))
    
      // 꽃가루 API는 하나니까 그냥 호출
      await fetchPollen()
    }

    load()
  }, [])

  // 지역별 미세먼지와 기상정보 보여줌
  return (
    <div>
      {Object.keys(regions).map((region) => (
        <div key={region}>
          <WeatherCard
            region={region}
            dust={dustData[region]}
            forecast={forecastData[region]}
          />
          <br />
        </div>
      ))}

      <div className={styles.container}>
        <h1 className={styles.title}>서울 꽃가루 위험지수 🌲</h1>
        {pollenData?.index ? (
          <p className={`${styles.desc} ${styles['_' + pollenData.index]}`}>
            🌼 꽃가루 지수: {pollenData.index}
          </p>
        ) : (
          <p className={styles.load}>불러오는 중...</p>
        )}
      </div>
    </div>
  )
}
