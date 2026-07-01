import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import styles from './Navbar.module.css'

interface NavbarProps {
  isDark?: boolean
  onThemeToggle?: (dark: boolean) => void
}

export default function Navbar({ isDark: propIsDark, onThemeToggle }: NavbarProps) {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [localIsDark, setLocalIsDark] = useState(() => {
    const saved = localStorage.getItem("corvusx-theme");
    return saved === "light" ? false : true;
  })

  const path = window.location.pathname
  const prefix = path === '/experiment' ? '' : '/experiment'
  const navLinks = [
    { label: 'Demo',         href: `${prefix}#demo` },
    { label: 'Features',     href: `${prefix}#features` },
    { label: 'How it Works', href: `${prefix}#how-it-works` },
    { label: 'Shortcuts',    href: `${prefix}#shortcuts` },
    { label: 'FAQ',          href: `${prefix}#faq` },
  ]

  const isDark = propIsDark !== undefined ? propIsDark : localIsDark

  const handleToggle = () => {
    const newDark = !isDark;
    localStorage.setItem("corvusx-theme", newDark ? "dark" : "light");
    if (onThemeToggle) {
      onThemeToggle(newDark)
    } else {
      setLocalIsDark(newDark)
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
          {/* Branding Heading */}
          <a href={path === '/experiment' ? '/' : '#'} className={styles.logo}>
            <span>CorvusX</span>
          </a>
          <ul className={styles.links}>
            {navLinks.map(l => (
              <li key={l.href}>
                <a href={l.href} className={styles.link}>{l.label}</a>
              </li>
            ))}
          </ul>

          <a
            href="https://github.com/Felix-au/CorvusX-Intelligence-in-the-Shadows/releases/latest"
            className={styles.cta}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>

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
          {/* Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span className={`${styles.bar} ${menuOpen ? styles.bar1Open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.bar2Open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.bar3Open : ''}`} />
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
              {navLinks.map(l => (
                <a key={l.href} href={l.href} className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}>
                  {l.label}
                </a>
              ))}
              <a
                href="https://github.com/Felix-au/CorvusX-Intelligence-in-the-Shadows/releases/latest"
                className={styles.mobileCta}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
              >
                Download
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.div>
  )
}
