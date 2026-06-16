import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import styles from './Features.module.css'

const features = [
  {
    icon: '👁',
    tag: 'STEALTH HUD',
    title: 'Invisible Overlay',
    desc: 'Sits silently above every app. Toggle globally with Ctrl+B. Content-protected — invisible in screen recordings and Zoom/Meet/Teams.',
    status: 'CONTENT PROTECTION ACTIVE',
    accent: 'cyan',
  },
  {
    icon: '📸',
    tag: 'VISION AI',
    title: 'Smart Screen Capture',
    desc: 'Press Ctrl+H in any app — coding interview, meeting, debugging session. CorvusX hides itself, captures invisibly, and begins AI analysis.',
    status: 'SCREENSHOT ENGINE READY',
    accent: 'violet',
  },
  {
    icon: '🎤',
    tag: 'AUDIO AI',
    title: 'Voice Intelligence',
    desc: 'Record voice globally with Ctrl+Shift+V. Transcribes and responds as an interview candidate or meeting participant in seconds.',
    status: 'MULTIMODAL AUDIO ACTIVE',
    accent: 'cyan',
  },
  {
    icon: '⌨️',
    tag: 'GHOST KEYBOARD',
    title: 'Ghost Keyboard Mode',
    desc: 'Activate with Ctrl+Alt+X. Every keystroke you type in ANY other window is silently mirrored into CorvusX\'s input via uIOhook-napi.',
    status: 'uIOHOOK LISTENER READY',
    accent: 'violet',
  },
  {
    icon: '✍️',
    tag: 'GHOST WRITER',
    title: 'Auto-Type AI Answers',
    desc: 'Press Ctrl+Alt+K and CorvusX types the latest AI response character-by-character into any active window with smart indentation handling.',
    status: 'TYPING SIMULATOR READY',
    accent: 'cyan',
  },
  {
    icon: '🔀',
    tag: 'DUAL ENGINE',
    title: 'Gemini + OmniKey',
    desc: 'Switch between Google Gemini (direct) and OmniKey (unified proxy for GPT-4o, Claude, Gemini). Configured live from the HUD with Ctrl+I.',
    status: 'DUAL PROVIDER AVAILABLE',
    accent: 'violet',
  },
]

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <section className={styles.section} id="features">
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>Built for Your Most Critical Moments</h2>
          <p className={styles.sub}>Every feature engineered for zero-friction, invisible deployment.</p>
        </motion.div>

        <div className={styles.grid} ref={ref}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature: f, delay }: { feature: typeof features[0]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={styles.card}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
    >
      <div className={styles.cardTop}>
        <div className={`${styles.iconBox} ${f.accent === 'violet' ? styles.iconViolet : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
        </div>
        <span className={`${styles.tag} ${f.accent === 'violet' ? styles.tagViolet : ''}`}>{f.tag}</span>
      </div>
      <h3 className={styles.cardTitle}>{f.title}</h3>
      <p className={styles.cardDesc}>{f.desc}</p>
      <div className={styles.cardStatus}>
        <span className={`${styles.statusDot} ${f.accent === 'violet' ? styles.statusViolet : ''}`} />
        {f.status}
      </div>
    </motion.div>
  )
}
