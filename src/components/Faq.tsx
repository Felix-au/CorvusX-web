import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import styles from './Faq.module.css'

const faqs = [
  {
    q: 'Is CorvusX visible in Zoom, Meet, or Teams screen shares?',
    a: "No. CorvusX uses Electron's setContentProtection(true) API which prevents the window from appearing in screen recordings and screen shares. It is only visible on your local display.",
  },
  {
    q: 'What AI providers does CorvusX support?',
    a: 'CorvusX supports Google Gemini directly via Google AI Studio (free API key) and OmniKey — a unified reverse proxy that lets you use GPT-4o, Claude, and Gemini models through a single omnikey- prefixed key.',
  },
  {
    q: 'How does Ghost Keyboard mode work?',
    a: 'Ghost Keyboard uses uIOhook-napi to listen to global keydown events system-wide. When active (Ctrl+Alt+X), every keystroke you type in another window (e.g., your IDE or browser) is silently mirrored into CorvusX\'s chat input — no focus switching needed.',
  },
  {
    q: 'What is Ghost Writer / Simulate Typing?',
    a: 'Ghost Writer (Ctrl+Alt+K) uses the TypingSimulator module to robotically type the latest AI response character-by-character into whatever window is currently active. It handles smart indentation to avoid formatting conflicts with IDEs like VSCode.',
  },
  {
    q: 'Is my data stored or sent anywhere?',
    a: 'Your API keys are stored locally in config.json inside your OS user data folder. Screenshots and voice recordings are processed locally or sent directly to Gemini/OmniKey APIs — CorvusX itself has no backend server.',
  },
  {
    q: 'Can I customize the keyboard shortcuts?',
    a: 'Yes. Open the Shortcut Manager with Ctrl+I → Shortcuts tab. All 9 global shortcuts are fully remappable and saved to config.json automatically.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className={styles.section} id="faq">
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>Common Questions</h2>
        </motion.div>

        <div className={styles.list}>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className={`${styles.item} ${open === i ? styles.itemOpen : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <button className={styles.question} onClick={() => setOpen(open === i ? null : i)}>
                <span>{faq.q}</span>
                <span className={styles.icon}>
                  {open === i ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    className={styles.answer}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <p>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
