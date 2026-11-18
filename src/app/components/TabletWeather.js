'use client'
import { useEffect, useRef, useState } from 'react'
import { seoulDate } from '../seoulDate'
import { pollenIssueTime } from '../pollenSeason'
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
  const response = await fetch(path, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error('Request failed')
  return asText ? response.text() : response.json()
}

function AirMap({ air }) {
  const [metric, setMetric] = useState('ultra')
  const limits = metric === 'ultra' ? [15, 35, 75] : [30, 80, 150]
  const grade = value => {
    const index = limits.findIndex(limit => value <= limit)
    return index === -1 ? 3 : index
  }

  return <section className={styles.panel + ' ' + styles.airPanel} aria-label="서울 미세먼지">
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
        return <g key={name}>
          <title>{name} {value == null ? '관측값 없음' : value + ' µg/m³'}</title>
          <path d={d} fill={value == null ? '#dfe8ee' : colors[grade(value)]}
            stroke="#ffffff" strokeWidth={1} />
          <text x={x} y={y} textAnchor="middle">{name.replace(/구$/, '')}</text>
          <text x={x} y={y + 11} textAnchor="middle">{value ?? '–'}</text>
        </g>
      })}
    </svg>
    <div className={styles.legend}>{grades.map((label, i) =>
      <span key={label}><i style={{ background: colors[i] }} />{label}</span>)}</div>
  </section>
}

function AirDetails({ air, unavailable }) {
  const observed = Object.values(air ?? {}).map(row => String(row.observedAt ?? '')).sort().at(-1) ?? ''
  const timestamp = /^\d{12}$/.test(observed)
    ? observed.slice(4, 6) + '.' + observed.slice(6, 8) + ' ' + observed.slice(8, 10) + ':' + observed.slice(10, 12)
    : observed

  return <footer className={styles.airDetails}>
    <small className={styles.caption}>{unavailable ? '대기질 연결 실패' : timestamp ? timestamp + ' 관측' : '서울시 관측'}</small>
    <div className={styles.caption}>예보 Open-Meteo · 대기질 서울시 · 꽃가루 기상청</div>
  </footer>
}

const todayHours = ['08', '10', '12', '14', '16', '18', '20', '22', '24']

function HourlyForecast({ hours, date, unavailable }) {
  const nextDate = date ? new Date(Date.parse(date + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10) : null
  const readings = todayHours.map(label => {
    const time = label === '24' ? nextDate + 'T00:00' : date + 'T' + label + ':00'
    return { ...hours?.find(hour => hour.time === time), label }
  })
  const points = readings.map(({ probability }, index) => Number.isFinite(probability)
    ? { x: 50 + index * 100, y: 74 - 56 * probability / 100 }
    : null)
  const path = points.map((point, index) => point
    ? (points[index - 1] ? 'L' : 'M') + point.x + ' ' + point.y
    : '').join(' ')

  return <>
    <div className={styles.chartHeading}>강수확률 <span>(%)</span></div>
    <svg className={styles.rainChart} viewBox="0 0 900 82" preserveAspectRatio="none" role="img"
      aria-label="08시부터 24시까지 2시간 간격 강수확률 선그래프">
      {[18, 46, 74].map(y => <line key={y} x1="16" y1={y} x2="884" y2={y} className={styles.chartGrid} />)}
      <path d={path} className={styles.chartLine} />
      {points.map((point, index) => point &&
        <circle key={readings[index].label} cx={point.x} cy={point.y} r="5" className={styles.chartDot}>
          <title>{readings[index].label}시 · {round(readings[index].probability, '%')}</title>
        </circle>)}
    </svg>
    <div className={styles.tiles}>
      {readings.map(({ label, probability, temperature }) =>
        <div className={styles.hourReading} key={label}>
          <small>{label}시</small>
          <span>{round(probability, '%')}</span>
          <strong>{round(temperature, '°')}</strong>
        </div>)}
    </div>
    {unavailable && <small className={styles.caption}>예보 갱신 실패</small>}
  </>
}

export default function TabletWeather({ onSwitch }) {
  const screenRef = useRef(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState(false)
  const [now, setNow] = useState(null)
  const [region, setRegion] = useState('도봉구')
  const [selectedDate, setSelectedDate] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [air, setAir] = useState(null)
  const [airUnavailable, setAirUnavailable] = useState(false)
  const [forecastUnavailable, setForecastUnavailable] = useState(false)
  const [pollen, setPollen] = useState(null)

  useEffect(() => {
    let controller
    let loadedPollenIssue = null
    let lastRefresh = -Infinity
    let lastDate

    function refresh(current, date) {
      if (lastDate && lastDate !== date) setSelectedDate(null)
      lastDate = date
      lastRefresh = current.getTime()
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      request('/api/tablet-forecast', signal).then(data => {
        if (!signal.aborted) { setForecast(data); setForecastUnavailable(false) }
      }).catch(() => { if (!signal.aborted) setForecastUnavailable(true) })
      request('/api/seoul-air', signal).then(data => {
        if (!signal.aborted) { setAir(data); setAirUnavailable(false) }
      }).catch(() => { if (!signal.aborted) setAirUnavailable(true) })
      const issue = pollenIssueTime(current)
      if (!issue) {
        loadedPollenIssue = null
        setPollen(null)
        return
      }
      if (issue === loadedPollenIssue) return

      request('/api/pollen', signal, true).then(xml => {
        const item = new DOMParser().parseFromString(xml, 'application/xml').querySelector('item')
        const value = item?.querySelector('today')?.textContent?.trim()
        if (signal.aborted) return
        const grade = pollenGrades[value] ?? null
        if (grade) loadedPollenIssue = issue
        setPollen(grade)
      }).catch(() => { if (!signal.aborted) setPollen(null) })
    }
    function update(force = false) {
      if (document.visibilityState === 'hidden') return
      const current = new Date()
      const date = seoulDate(current)
      const elapsed = current.getTime() - lastRefresh
      setNow(current)
      if (date !== lastDate || elapsed >= 600000 || (force && elapsed >= 5000)) {
        refresh(current, date)
      }
    }

    const resume = () => update(true)
    update()
    const clock = setInterval(update, 1000)
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('pageshow', resume)
    window.addEventListener('focus', resume)
    window.addEventListener('online', resume)
    return () => {
      controller?.abort()
      clearInterval(clock)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('pageshow', resume)
      window.removeEventListener('focus', resume)
      window.removeEventListener('online', resume)
    }
  }, [])

  useEffect(() => {
    function syncFullscreen() {
      setFullscreen(document.fullscreenElement === screenRef.current)
      setFullscreenError(false)
    }
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  async function toggleFullscreen() {
    const screen = screenRef.current
    if (!screen) return
    setFullscreenError(false)
    try {
      if (document.fullscreenElement === screen) {
        await document.exitFullscreen()
      } else {
        await screen.requestFullscreen()
      }
    } catch {
      setFullscreenError(true)
    }
  }

  const regionForecast = forecast?.[region]
  const data = now && regionForecast?.days[0]?.date === seoulDate(now) ? regionForecast : null
  const firstDate = data?.days[0]?.date
  const activeDate = data?.days.some(day => day.date === selectedDate) ? selectedDate : firstDate
  const title = activeDate && activeDate !== firstDate
    ? dateFormat.format(new Date(activeDate + 'T12:00:00+09:00')) + ' 날씨'
    : '오늘 날씨'

  return <main ref={screenRef} className={styles.screen}>
    <header className={styles.top}>
      <div><div>{now ? dateFormat.format(now) : '–'}</div><time>{now ? clockFormat.format(now) : '–:–'}</time></div>
      <div className={styles.displayControls}>
        <div>
          <button type="button" onClick={toggleFullscreen}>{fullscreen ? '전체화면 종료' : '전체화면'}</button>
          <button type="button" onClick={onSwitch}>기본 모드</button>
        </div>
        {fullscreenError && <small role="status">이 브라우저에서 전체화면을 열 수 없어요.</small>}
      </div>
    </header>
    <div className={styles.columns}>
      <div className={styles.weather}>
        <section className={styles.panel}>
          <div className={styles.heading}>
            <h2 aria-live="polite">{title}</h2>
            <select aria-label="날씨 지역" value={region} onChange={event => setRegion(event.target.value)}>
              <option>도봉구</option><option>서대문구</option>
            </select>
          </div>
          <HourlyForecast hours={data?.hours} date={activeDate} unavailable={forecastUnavailable} />
        </section>
        <section className={styles.panel}>
          <div className={styles.heading}><h2>일주일 날씨</h2></div>
          <div className={styles.week}>
            {(data?.days ?? Array.from({ length: 7 }, (_, index) => ({ index }))).map((day, index) => {
              const [icon, condition] = weatherIcon(day.code)
              return <button type="button" className={styles.tile} key={day.date ?? day.index}
                disabled={!day.date} aria-pressed={Boolean(day.date && day.date === activeDate)}
                onClick={() => setSelectedDate(index === 0 ? null : day.date)}>
                <small>{index === 0 ? '오늘' : day.date ? weekFormat.format(new Date(day.date + 'T12:00:00+09:00')) : '–'}</small>
                <span className={styles.icon} role="img" aria-label={condition}>{icon}</span>
                <span><b>{round(day.high, '°')}</b> <small>{round(day.low, '°')}</small></span>
              </button>
            })}
          </div>
        </section>
      </div>
      <AirDetails air={air} unavailable={airUnavailable} />
      <AirMap air={air} />
      <section className={styles.pollen}>서울 꽃가루 위험지수 <strong>{pollen ?? '–'}</strong></section>
    </div>
  </main>
}
