import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers } from 'lucide-react'
import styles from './VersionSwitcher.module.css'

const versions = [
  { path: '/', label: 'V1: Default Overhaul' },
  { path: '/experiment', label: 'V2: Experiment' },
]

export default function VersionSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const currentPath = window.location.pathname

  const activeVersion = versions.find(v => v.path === currentPath) || versions[0]

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.menu}
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className={styles.menuHeader}>Switch Landing Version</div>
            {versions.map(v => (
              <button
                key={v.path}
                className={`${styles.menuItem} ${currentPath === v.path ? styles.menuItemActive : ''}`}
                onClick={() => {
                  window.location.pathname = v.path
                }}
              >
                <span className={styles.dot} />
                {v.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        <Layers size={14} className={styles.icon} />
        <span>{activeVersion.label}</span>
      </motion.button>
    </div>
  )
}
