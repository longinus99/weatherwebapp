'use client'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

export default function Home() {
  const [dustData, setDustData] = useState({ dobong: null, seodaemun: null })
  const [pollenData, setPollenData] = useState(null)

  useEffect(() => {
    const fetchDust = async (code, guName) => {
      const url = `/api/finedust?code=${code}`

      console.log(`📡 [${guName}] 요청 주소:`, url)

      try {
        const res = await fetch(url)
        const text = await res.text()

        console.log(`📦 [${guName}] XML 응답 내용:\n`, text)

        const parser = new DOMParser()
        const xml = parser.parseFromString(text, 'text/xml')

        const maxIndexNode = xml.getElementsByTagName('MAXINDEX')[0]
        const gradeNode = xml.getElementsByTagName('GRADE')[0]

        const maxIndex = maxIndexNode ? maxIndexNode.textContent : '없음'
        const grade = gradeNode ? gradeNode.textContent : '없음'

        console.log(`✅ [${guName}] 지수: ${maxIndex} / 등급: ${grade}`)

        return { maxIndex, grade }
      } catch (error) {
        console.error(`❌ [${guName}] API 오류:`, error)
        return { maxIndex: '에러', grade: '에러' }
      }
    }

    const fetchPollen = async () => {

      try {
        const res = await fetch('/api/pollen')
        const text = await res.text()

        console.log('📦 꽃가루 응답:', text)

        const parser = new DOMParser()
        const xml = parser.parseFromString(text, 'text/xml')

        const item = xml.getElementsByTagName('item')[0]
        const getValue = (tagName) =>
          item?.getElementsByTagName(tagName)[0]?.textContent?.trim() || ''

        let index = getValue('today')
        if (!index) {
          index = getValue('tomorrow')
        }

        console.log(`✅ 꽃가루 등급 index: ${index}`)

        setPollenData({ index })
      } catch (error) {
        console.error('❌ 꽃가루 API 오류:', error)
      }
    }

    const loadDustData = async () => {
      const dobong = await fetchDust('111171', '도봉구')
      const seodaemun = await fetchDust('111191', '서대문구')
      setDustData({ dobong, seodaemun })

      await fetchPollen()
    }

    loadDustData()
  }, [])

  // ✅ pollenData가 바뀔 때마다 확인
  useEffect(() => {
    console.log('🧪 pollenData 상태:', pollenData)
  }, [pollenData])

  return (
    <div>
      <div className={styles.container}>
        <h1 className={styles.title}>서울 서대문구 기상정보</h1>
        {dustData.seodaemun ? (
          <p className={`${styles.desc} ${styles[dustData.seodaemun.grade]}`}>
            지수: {dustData.seodaemun.maxIndex} / 등급: {dustData.seodaemun.grade}
          </p>
        ) : (
          <p className={styles.desc}>불러오는 중...</p>
        )}
      </div>

      <br />

      <div className={styles.container}>
        <h1 className={styles.title}>서울 도봉구 기상정보</h1>
        {dustData.dobong ? (
          <p className={`${styles.desc} ${styles[dustData.dobong.grade]}`}>
            지수: {dustData.dobong.maxIndex} / 등급: {dustData.dobong.grade}
          </p>
        ) : (
          <p className={styles.desc}>불러오는 중...</p>
        )}
      </div>

      <br />

      <div className={styles.container}>
        <h1 className={styles.title}>서울 꽃가루 위험지수 🌲</h1>
        {pollenData?.index ? (
        <p className={`${styles.desc} ${styles['_' + pollenData.index]}`}>
          🌼 꽃가루 지수: {pollenData.index}
        </p>
      ) : (
        <p className={styles.desc}>🌿 꽃가루 데이터 없음</p>
      )}
      </div>
    </div>
  )
}
