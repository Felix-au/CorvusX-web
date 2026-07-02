import { motion } from 'framer-motion'
import styles from './HowItWorks.module.css'

const steps = [
  {
    num: 'STEP 01',
    title: 'Download & Launch',
    desc: 'Download the Windows installer. CorvusX starts silently in your system tray — no splash screen. Toggle visibility anytime with Ctrl+B.',
    mini: <MiniLaunch />,
  },
  {
    num: 'STEP 02',
    title: 'Configure Your AI Engine',
    desc: 'Open settings with Ctrl+I. Enter your free Gemini API key (from Google AI Studio) or OmniKey. Pick Code Mode or General Mode.',
    mini: <MiniConfig />,
  },
  {
    num: 'STEP 03',
    title: 'Capture Any Screen',
    desc: 'Press Ctrl+H in any app — coding interview, meeting, debugging session. CorvusX hides itself, captures invisibly, and returns an AI solution.',
    mini: <MiniCapture />,
  },
  {
    num: 'STEP 04',
    title: 'Get the Answer & Type It',
    desc: 'CorvusX returns a direct, production-ready answer. Copy with Ctrl+Alt+C or use Ghost Writer (Ctrl+Alt+K) to auto-type into any window.',
    mini: <MiniSolution />,
  },
]

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>How it Works</h2>
          <p className={styles.sub}>Get set up in under 60 seconds.</p>
        </motion.div>

        <div className={styles.steps}>
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              className={`${styles.step} ${i % 2 === 1 ? styles.stepReverse : ''}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.65, delay: 0.05 }}
            >
              <div className={styles.left}>
                <span className={styles.stepNum}>{s.num}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
              <div className={styles.right}>
                {s.mini}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MiniWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.miniWindow}>
      <div className={styles.miniBar}>
        <span className={`${styles.miniDot} ${styles.r}`} />
        <span className={`${styles.miniDot} ${styles.y}`} />
        <span className={`${styles.miniDot} ${styles.g}`} />
        <span className={styles.miniTitle}>{title}</span>
      </div>
      <div className={styles.miniBody}>{children}</div>
    </div>
  )
}

function MiniLaunch() {
  return (
    <MiniWindow title="CorvusX — System Tray">
      <div className={styles.launchIcon}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ width: 28, height: 28 }}>
          <defs><linearGradient id="mg" x1="0" y1="0" x2="24" y2="24"><stop stopColor="#00d9c8" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
          <path stroke="url(#mg)" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className={styles.miniBadgeRow}>
        <span className={styles.miniBadge}>● System Tray Active</span>
        <span className={styles.miniBadge}>● Stealth Mode On</span>
      </div>
      <div className={styles.miniCta}>Click to Launch →</div>
    </MiniWindow>
  )
}

function MiniConfig() {
  return (
    <MiniWindow title="Settings — AI Provider">
      <div className={styles.miniProviders}>
        <div className={`${styles.miniProvider} ${styles.miniProviderActive}`}>☁️ Gemini</div>
        <div className={styles.miniProvider}>🔑 OmniKey</div>
      </div>
      <div className={styles.miniInputRow}>
        <div className={styles.miniInput}>AIzaSy••••••••••••</div>
        <div className={styles.miniTestBtn}>✓ Test</div>
      </div>
      <div className={styles.miniConnected}>✓ Connected — CorvusX</div>
    </MiniWindow>
  )
}

function MiniCapture() {
  return (
    <MiniWindow title="Screenshot Analysis">
      <div className={styles.miniPreview}>
        <motion.div
          className={styles.miniScan}
          animate={{ top: ['0%', '100%'], opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        />
        <div className={styles.miniPreviewCode}>
          <span style={{ color: 'var(--muted)' }}>{'// LeetCode #146 — LRU Cache'}</span>{'\n'}
          <span style={{ color: 'var(--cyan)' }}>class </span>LRUCache {'{'}{'\n'}
          {'  '}<span style={{ color: '#7c3aed' }}>constructor</span>(cap) {'{ ... }'}
        </div>
      </div>
      <div className={styles.miniAnalyzing}>
        <motion.span
          className={styles.pulseDot}
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
        Analyzing with Gemini…
      </div>
    </MiniWindow>
  )
}

function MiniSolution() {
  return (
    <MiniWindow title="AI Solution — Ready">
      <div className={styles.miniSolutionCode}>
        <span style={{ color: 'var(--cyan)' }}>class </span>LRUCache {'{'}{'\n'}
        {'  '}<span style={{ color: '#7c3aed' }}>constructor</span>(cap) {'{'}{'\n'}
        {'    '}<span style={{ color: '#e8f4ff' }}>this</span>.map = <span style={{ color: 'var(--cyan)' }}>new</span> Map(){'\n'}
        {'  }'}{'\n'}
        {'}'}
      </div>
      <div className={styles.miniActions}>
        <span className={styles.miniKbd}>Ctrl+Alt+C</span> Copy
        <span className={styles.miniKbd}>Ctrl+Alt+K</span> Type
      </div>
    </MiniWindow>
  )
}
