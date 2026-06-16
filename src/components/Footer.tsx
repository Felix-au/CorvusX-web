import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" width="20" height="20">
            <defs>
              <linearGradient id="fg" x1="0" y1="0" x2="24" y2="24">
                <stop stopColor="#00d9c8"/><stop offset="1" stopColor="#7c3aed"/>
              </linearGradient>
            </defs>
            <path stroke="url(#fg)" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>CorvusX</span>
        </div>
        <p className={styles.copy}>
          Intelligence in the Shadows · Open Source · Built with Electron + Gemini
        </p>
        <div className={styles.links}>
          <a href="#demo">Demo</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  )
}
