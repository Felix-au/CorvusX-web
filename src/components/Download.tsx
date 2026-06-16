import { motion } from 'framer-motion'
import { Download as DlIcon, Github } from 'lucide-react'
import styles from './Download.module.css'

export default function Download() {
  return (
    <section className={styles.section} id="download">
      <div className={styles.glow} />
      <div className={styles.inner}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className={styles.title}>Ready to Operate in the Shadows?</h2>
          <p className={styles.sub}>Free, open source, and yours to keep. No subscriptions, no data collection.</p>

          <div className={styles.btns}>
            <motion.a
              href="#"
              className={styles.btnPrimary}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              id="dl-windows"
            >
              <DlIcon size={18} />
              Download for Windows
            </motion.a>
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnGhost}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Github size={18} />
              View on GitHub
            </motion.a>
          </div>

          <p className={styles.meta}>Windows 10+ · Electron · Node.js · Gemini 2.5 Flash</p>
        </motion.div>
      </div>
    </section>
  )
}
