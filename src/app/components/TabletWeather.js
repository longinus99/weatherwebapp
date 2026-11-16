'use client'
import { useEffect, useState } from 'react'
import districts from './seoulDistricts.json'
import styles from './tabletWeather.module.css'

const clockFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hourCycle: 'h23', hour: '2-digit', minute: '2-digit' })
const dateFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long' })
const weekFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', weekday: 'short' })
const colors = ['#a7d6ff', '#b6dfad', '#ffd391', '#f3aaa4']
const grades = ['좋음', '보통', '나쁨', '매우 나쁨']
const pollenGrades = { 0: '낮음', 1: '보통', 2: '높음', 3: '매우 높음' }

function weatherIcon(code) {
  if (code == null) return ['–', '예보 없음']
  if (code === 0) return ['☀️', '맑음']
  if (code < 3) return ['🌤️', '구름 조금']
  if (code === 3) return ['☁️', '흐림']
  if (code <= 48) return ['🌫️', '안개']
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['🌨️', '눈']
  if (code >= 95) return ['⛈️', '뇌우']
  return ['🌧️', '비']
}

const round = (value, suffix) => Number.isFinite(value) ? Math.round(value) + suffix : '–'

async function request(path, signal, asText = false) {
  const response = await fetch(path, { signal })
  if (!response.ok) throw new Error('Request failed')
  return asText ? response.text() : response.json()
}

function AirMap({ air, unavailable }) {
  const [metric, setMetric] = useState('ultra')
  const [selected, setSelected] = useState('도봉구')
  const limits = metric === 'ultra' ? [15, 35, 75] : [30, 80, 150]
  const current = air?.[selected]
  const observed = String(current?.observedAt ?? '')
  const timestamp = /^\d{12}$/.test(observed)
    ? observed.slice(4, 6) + '.' + observed.slice(6, 8) + ' ' + observed.slice(8, 10) + ':' + observed.slice(10, 12)
    : observed
  const grade = value => {
    const index = limits.findIndex(limit => value <= limit)
    return index === -1 ? 3 : index
  }

  return <section className={styles.panel} aria-label="서울 미세먼지">
    <div className={styles.heading}>
      <h2>서울 미세먼지</h2>
      <div className={styles.switch}>
        <button type="button" aria-pressed={metric === 'ultra'} onClick={() => setMetric('ultra')}>PM2.5</button>
        <button type="button" aria-pressed={metric === 'fine'} onClick={() => setMetric('fine')}>PM10</button>
      </div>
    </div>
    <svg className={styles.map} viewBox="0 0 464 386" aria-label="서울 25개 자치구 대기질 지도">
      {districts.map(({ name, x, y, d }) => {
        const value = air?.[name]?.[metric]
        return <g key={name} onClick={() => setSelected(name)}>
          <title>{name} {value == null ? '관측값 없음' : value + ' µg/m³'}</title>
          <path d={d} fill={value == null ? '#dfe8ee' : colors[grade(value)]}
            stroke={selected === name ? '#173957' : '#ffffff'} strokeWidth={selected === name ? 2 : 1} />
          <text x={x} y={y} textAnchor="middle">{name.replace(/구$/, '')}</text>
          <text x={x} y={y + 11} textAnchor="middle">{value ?? '–'}</text>
        </g>
      })}
    </svg>
    <div className={styles.legend}>{grades.map((label, i) =>
      <span key={label}><i style={{ background: colors[i] }} />{label}</span>)}</div>
    <div className={styles.mapDetails}>
      <select aria-label="대기질 자치구" value={selected} onChange={event => setSelected(event.target.value)}>
        {districts.map(({ name }) => <option key={name}>{name}</option>)}
      </select>
      <span aria-live="polite">{current?.[metric] == null ? '–' : current[metric] + ' µg/m³ · ' + grades[grade(current[metric])]}</span>
      <small>{unavailable ? '대기질 연결 실패' : timestamp ? timestamp + ' 관측' : '서울시 관측'}</small>
    </div>
  </section>
}

const todayHours = ['08', '11', '14', '17', '20', '23']
const rainFormat = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 })

function TodayForecast({ hours, unavailable }) {
  const readings = todayHours.map(label => ({
    ...hours?.find(({ time }) => time.slice(11, 13) === label),
    label,
  }))
  const maxRain = Math.max(1, ...readings.map(({ rain }) => rain ?? 0))
  const points = readings.map(({ rain }, index) => Number.isFinite(rain)
    ? { x: 50 + index * 100, y: 74 - 56 * rain / maxRain }
    : null)
  const path = points.map((point, index) => point
    ? (points[index - 1] ? 'L' : 'M') + point.x + ' ' + point.y
    : '').join(' ')

  return <>
    <div className={styles.chartHeading}>시간당 강수량 <span>(mm)</span></div>
    <svg className={styles.rainChart} viewBox="0 0 600 82" preserveAspectRatio="none" role="img"
      aria-label="08시부터 23시까지 시간대별 강수량 선그래프">
      {[18, 46, 74].map(y => <line key={y} x1="16" y1={y} x2="584" y2={y} className={styles.chartGrid} />)}
      <path d={path} className={styles.chartLine} />
      {points.map((point, index) => point &&
        <circle key={readings[index].label} cx={point.x} cy={point.y} r="4" className={styles.chartDot}>
          <title>{readings[index].label}시 · {rainFormat.format(readings[index].rain)} mm</title>
        </circle>)}
    </svg>
    <div className={styles.tiles}>
      {readings.map(({ label, rain, temperature }) =>
        <div className={styles.hourReading} key={label}>
          <small>{label}시</small>
          <span>{Number.isFinite(rain) ? rainFormat.format(rain) + ' mm' : '–'}</span>
          <strong>{round(temperature, '°')}</strong>
        </div>)}
    </div>
    {unavailable && <small className={styles.caption}>예보 갱신 실패</small>}
  </>
}

export default function TabletWeather({ onSwitch }) {
  const [now, setNow] = useState(null)
  const [region, setRegion] = useState('도봉구')
  const [forecast, setForecast] = useState(null)
  const [air, setAir] = useState(null)
  const [airUnavailable, setAirUnavailable] = useState(false)
  const [forecastUnavailable, setForecastUnavailable] = useState(false)
  const [pollen, setPollen] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    function updateClock() { setNow(new Date()) }
    function refresh() {
      request('/api/tablet-forecast', signal).then(data => {
        if (!signal.aborted) { setForecast(data); setForecastUnavailable(false) }
      }).catch(() => { if (!signal.aborted) setForecastUnavailable(true) })
      request('/api/seoul-air', signal).then(data => {
        if (!signal.aborted) { setAir(data); setAirUnavailable(false) }
      }).catch(() => { if (!signal.aborted) setAirUnavailable(true) })
      request('/api/pollen', signal, true).then(xml => {
        const item = new DOMParser().parseFromString(xml, 'application/xml').querySelector('item')
        const value = item?.querySelector('today')?.textContent?.trim()
        if (!signal.aborted) setPollen(pollenGrades[value] ?? null)
      }).catch(() => { if (!signal.aborted) setPollen(null) })
    }
    updateClock()
    refresh()
    const clock = setInterval(updateClock, 1000)
    const refreshTimer = setInterval(refresh, 600000)
    return () => {
      controller.abort()
      clearInterval(clock)
      clearInterval(refreshTimer)
    }
  }, [])

  const data = forecast?.[region]

  return <main className={styles.screen}>
    <header className={styles.top}>
      <div><div>{now ? dateFormat.format(now) : '–'}</div><time>{now ? clockFormat.format(now) : '–:–'}</time></div>
      <button type="button" onClick={onSwitch}>기본 모드</button>
    </header>
    <div className={styles.columns}>
      <div className={styles.weather}>
        <section className={styles.panel}>
          <div className={styles.heading}>
            <h2>오늘 날씨</h2>
            <select aria-label="날씨 지역" value={region} onChange={event => setRegion(event.target.value)}>
              <option>도봉구</option><option>서대문구</option>
            </select>
          </div>
          <TodayForecast hours={data?.hours} unavailable={forecastUnavailable} />
        </section>
        <section className={styles.panel}>
          <div className={styles.heading}><h2>일주일 날씨</h2></div>
          <div className={styles.week}>
            {(data?.days ?? Array.from({ length: 7 }, (_, index) => ({ index }))).map((day, index) => {
              const [icon, condition] = weatherIcon(day.code)
              return <div className={styles.tile} key={day.date ?? day.index}>
                <small>{index === 0 ? '오늘' : day.date ? weekFormat.format(new Date(day.date + 'T12:00:00+09:00')) : '–'}</small>
                <span className={styles.icon} role="img" aria-label={condition}>{icon}</span>
                <span><b>{round(day.high, '°')}</b> <small>{round(day.low, '°')}</small></span>
              </div>
            })}
          </div>
        </section>
        <section className={styles.pollen}>서울 꽃가루 위험지수 <strong>{pollen ?? '–'}</strong></section>
      </div>
      <AirMap air={air} unavailable={airUnavailable} />
    </div>
    <footer className={styles.caption}>예보 Open-Meteo · 대기질 서울시 · 꽃가루 기상청</footer>
  </main>
}
