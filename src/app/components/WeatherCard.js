'use client'
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, LabelList } from 'recharts'
import styles from '../page.module.css'

export default function WeatherCard({ region, dust, forecast }) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>서울 {region} 기상정보</h1>
      
      {dust ? (
        <p className={`${styles.desc} ${styles[dust.grade]}`}>
          지수: {dust.maxIndex} / 등급: {dust.grade}
        </p>
      ) : <p className={styles.load}>불러오는 중...</p>}

      {forecast && (
        <>
          <p className={styles.index}>
            {forecast.tmx}°C / {forecast.tmn}°C
          </p>

          {forecast.rain && (
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={forecast.rain} margin={{ top: 30 }}>
                <XAxis
                  dataKey="time"
                  tickFormatter={(t) => `${t.slice(0, 2)}시`}
                  interval={0}
                  padding={{ left: 15, right: 15 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4285f4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                >
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v) => `${v}%`}
                    dy={-10}
                    style={{ fill: '#4285f4', fontSize: 12 }}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  )
}
