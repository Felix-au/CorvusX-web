import { useRef } from 'react'
import { motion } from 'framer-motion'
import DemoWizard from './DemoWizard'
import styles from './Hero.module.css'

export default function Hero() {
  const demoRef = useRef<HTMLDivElement>(null)

  return (
    <section className={styles.hero} id="hero">
      {/* Animated BG grid */}
      <div className={styles.bgGrid} />
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      {/* Hero text */}
      <div className={styles.content}>
        <motion.div
          className={styles.badge}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <span className={styles.badgeDot} />
          Stealth AI · Always On Top · Invisible to Screen Recorders
        </motion.div>

        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          Intelligence<br />
          <span className={styles.gradientText}>in the Shadows</span>
        </motion.h1>

        <motion.p
          className={styles.sub}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          A premium, invisible overlay that sits silently above every app — providing real-time AI reasoning,
          screenshot analysis, voice intelligence, and ghost typing during your most critical moments.
        </motion.p>

        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <a href="#download" className={styles.btnPrimary} id="hero-download-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download for Windows
          </a>
          <a
            href="#demo"
            className={styles.btnGhost}
            onClick={e => { e.preventDefault(); demoRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
          >
            Watch Live Demo ↓
          </a>
        </motion.div>

        <motion.p
          className={styles.meta}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Free · Open Source · Gemini + OmniKey Powered
        </motion.p>
      </div>

      {/* Live Demo Wizard */}
      <motion.div
        ref={demoRef}
        id="demo"
        className={styles.demoWrapper}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
      >
        <DemoWizard />
      </motion.div>
    </section>
  )
}
