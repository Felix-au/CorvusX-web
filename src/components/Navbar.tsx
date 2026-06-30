import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import styles from './Navbar.module.css'

const links = [
  { label: 'Demo',         href: '#demo' },
  { label: 'Features',     href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Shortcuts',    href: '#shortcuts' },
  { label: 'FAQ',          href: '#faq' },
]

interface NavbarProps {
  isDark?: boolean
  onThemeToggle?: (dark: boolean) => void
}

export default function Navbar({ isDark: propIsDark, onThemeToggle }: NavbarProps) {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [localIsDark, setLocalIsDark] = useState(true)

  const isDark = propIsDark !== undefined ? propIsDark : localIsDark

  const handleToggle = () => {
    if (onThemeToggle) {
      onThemeToggle(!isDark)
    } else {
      setLocalIsDark(!isDark)
    }
  }

  // Apply theme to <html> on toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.div
      className={styles.navbarWrapper}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>


          {/* Desktop links */}
          <ul className={styles.links}>
            {links.map(l => (
              <li key={l.href}>
                <a href={l.href} className={styles.link}>{l.label}</a>
              </li>
            ))}
          </ul>

          {/* Theme toggle */}
          <motion.button
            className={styles.themeToggle}
            onClick={handleToggle}
            whileTap={{ scale: 0.88 }}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.span key="sun" initial={{ opacity:0, rotate:-90 }} animate={{ opacity:1, rotate:0 }} exit={{ opacity:0, rotate:90 }} transition={{ duration: 0.2 }}>
                  <Sun size={16} />
                </motion.span>
              ) : (
                <motion.span key="moon" initial={{ opacity:0, rotate:90 }} animate={{ opacity:1, rotate:0 }} exit={{ opacity:0, rotate:-90 }} transition={{ duration: 0.2 }}>
                  <Moon size={16} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <a href="#download" className={styles.cta}>Download Free</a>

          {/* Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span className={menuOpen ? styles.bar1Open : styles.bar1} />
            <span className={menuOpen ? styles.bar2Open : styles.bar2} />
            <span className={menuOpen ? styles.bar3Open : styles.bar3} />
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className={styles.mobileMenu}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {links.map(l => (
                <a key={l.href} href={l.href} className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}>
                  {l.label}
                </a>
              ))}
              <button className={styles.mobileThemeRow} onClick={handleToggle}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                {isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              </button>
              <a href="#download" className={styles.mobileCta}
                onClick={() => setMenuOpen(false)}>
                Download Free
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.div>
  )
}
