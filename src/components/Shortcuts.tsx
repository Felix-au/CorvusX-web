import { useState } from 'react'
import { motion } from 'framer-motion'
import styles from './Shortcuts.module.css'

// All 9 shortcuts from ConfigHelper.ts DEFAULT_SHORTCUTS
const shortcuts = [
  { keys: ['Ctrl', 'B'],              label: 'Stealth Toggle',           action: 'Toggle overlay visibility — show or hide CorvusX without breaking focus on any other app.' },
  { keys: ['Ctrl', 'H'],              label: 'Screenshot & Analyze',     action: 'Capture a full screenshot and immediately start AI analysis on the current screen.' },
  { keys: ['Ctrl', 'Shift', 'Space'], label: 'Show & Center',            action: 'Center and show the CorvusX overlay window on your current monitor.' },
  { keys: ['Ctrl', 'Shift', 'V'],     label: 'Voice Recording',          action: 'Start or stop global voice recording. Audio is transcribed and analyzed by Gemini multimodal.' },
  { keys: ['Ctrl', 'Alt', 'C'],       label: 'Copy Latest Response',     action: 'Copy the latest AI response to clipboard, stripping any code block formatting.' },
  { keys: ['Ctrl', 'Alt', 'K'],       label: 'Ghost Writer (Type)',      action: 'Simulate typing the latest response character-by-character into any active window with smart indentation.' },
  { keys: ['Ctrl', 'Alt', 'X'],       label: 'Ghost Keyboard',           action: 'Silently mirror all keystrokes from any other window into CorvusX chat input via uIOhook.' },
  { keys: ['Ctrl', 'U'],              label: 'Declutter UI',             action: 'Clear all chat messages and audio from the UI while keeping backend context intact.' },
  { keys: ['Ctrl', 'O'],              label: 'New Session',              action: 'Start a completely fresh session — clears UI and resets the entire AI conversation history.' },
]

export default function Shortcuts() {
  const [active, setActive] = useState<number | null>(null)

  return (
    <section className={styles.section} id="shortcuts">
      <div className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>Master the Shortcuts</h2>
          <p className={styles.sub}>CorvusX lives in the background. These 9 global shortcuts are your entire interface.</p>
        </motion.div>

        <motion.div
          className={styles.grid}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {shortcuts.map((s, i) => (
            <div
              key={s.label}
              className={`${styles.item} ${active === i ? styles.itemActive : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <div className={styles.keys}>
                {s.keys.map(k => <kbd key={k}>{k}</kbd>)}
              </div>
              <div className={styles.label}>{s.label}</div>
              <div className={`${styles.action} ${active === i ? styles.actionVisible : ''}`}>
                {s.action}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
