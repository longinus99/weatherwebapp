import styles from './page.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>서울 날씨</h1>
      <p className={styles.desc}>현재 맑니? 🌤️</p>
    </div>
  )
}
