import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './DemoWizard.module.css'

// ─── Step definitions (each maps to a real feature from the CorvusX codebase) ───
const STEPS = ['🚀 Launch', '⚙️ Configure', '📸 Capture', '🧠 Analyze'] as const
type Step = 0 | 1 | 2 | 3

// ─── Ghost typing content ───
const GHOST_CODE = `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i`

export default function DemoWizard() {
  const [step, setStep] = useState<Step>(0)
  const [provider, setProvider] = useState<'gemini' | 'omnikey'>('gemini')
  const [mode, setMode] = useState<'code' | 'general'>('code')
  const [scanning, setScanning] = useState(false)
  const [hudVisible, setHudVisible] = useState(false)
  const [analyzeTab, setAnalyzeTab] = useState<'code' | 'voice' | 'ghost'>('code')
  const [ghostText, setGhostText] = useState('')
  const [ghostTyping, setGhostTyping] = useState(false)
  const ghostRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Capture simulation ───
  const triggerCapture = useCallback(() => {
    if (scanning) return
    setScanning(true)
    setHudVisible(false)
    setTimeout(() => {
      setScanning(false)
      setHudVisible(true)
    }, 1400)
  }, [scanning])

  // Reset hud when leaving step
  useEffect(() => { if (step !== 2) setHudVisible(false) }, [step])

  // ─── Ghost typing simulation ───
  const startGhostTyping = useCallback(() => {
    if (ghostTyping) return
    setGhostText('')
    setGhostTyping(true)
    let idx = 0
    ghostRef.current = setInterval(() => {
      idx++
      setGhostText(GHOST_CODE.slice(0, idx))
      if (idx >= GHOST_CODE.length) {
        clearInterval(ghostRef.current!)
        setGhostTyping(false)
      }
    }, 28)
  }, [ghostTyping])

  useEffect(() => () => { if (ghostRef.current) clearInterval(ghostRef.current) }, [])

  const cfgModel = provider === 'gemini' ? '"gemini-2.5-flash"' : '"auto"'
  const cfgProvider = provider === 'gemini' ? '"gemini"' : '"omnikey"'

  const goNext = () => { if (step < 3) setStep((step + 1) as Step) }
  const goBack = () => { if (step > 0) setStep((step - 1) as Step) }

  return (
    <div className={styles.window}>
      {/* ── Title bar ── */}
      <div className={styles.titlebar}>
        <div className={styles.trafficLights}>
          <span className={`${styles.tl} ${styles.red}`} />
          <span className={`${styles.tl} ${styles.yellow}`} />
          <span className={`${styles.tl} ${styles.green}`} />
        </div>
        <span className={styles.windowTitle}>CorvusX — Live Demo</span>
        <div className={styles.tabs}>
          {STEPS.map((label, i) => (
            <button
              key={i}
              className={`${styles.tab} ${step === i ? styles.tabActive : ''}`}
              onClick={() => setStep(i as Step)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ width: '100%' }}
          >
            {/* ────────── STEP 0: LAUNCH ────────── */}
            {step === 0 && (
              <div className={styles.stepCenter}>
                <motion.div
                  className={styles.launchIcon}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                    <defs>
                      <linearGradient id="ig" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#00d9c8"/><stop offset="1" stopColor="#7c3aed"/>
                      </linearGradient>
                    </defs>
                    <path stroke="url(#ig)" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </motion.div>
                <h3 className={styles.stepTitle}>CorvusX is Active</h3>
                <p className={styles.stepDesc}>
                  Starts silently in the system tray — no splash screen, no distractions.
                  Invisible to screen share and recordings via <code>setContentProtection(true)</code>.
                </p>
                <div className={styles.badges}>
                  {['● Stealth Active', '● Click-Through On', '● Always On Top', '● Screen Share Safe'].map(b => (
                    <span key={b} className={styles.badge}>{b}</span>
                  ))}
                </div>
                <div className={styles.codeBlock}>
                  <span className={styles.cmt}>{'// electron/main.ts — Window initialization'}</span>{'\n'}
                  <span className={styles.key}>mainWindow</span>
                  <span className={styles.fn}>.setAlwaysOnTop</span>
                  (<span className={styles.bool}>true</span>, <span className={styles.str}>"screen-saver"</span>){'\n'}
                  <span className={styles.key}>mainWindow</span>
                  <span className={styles.fn}>.setContentProtection</span>(<span className={styles.bool}>true</span>){'\n'}
                  <span className={styles.key}>mainWindow</span>
                  <span className={styles.fn}>.setSkipTaskbar</span>(<span className={styles.bool}>true</span>)
                </div>
              </div>
            )}

            {/* ────────── STEP 1: CONFIGURE ────────── */}
            {step === 1 && (
              <div className={styles.stepLeft}>
                <h3 className={styles.stepTitle}>Configure AI Provider</h3>
                <p className={styles.stepDesc}>
                  Select your engine. Open settings anytime with <kbd>Ctrl+I</kbd>.
                </p>

                <div className={styles.providerGrid}>
                  {(['gemini', 'omnikey'] as const).map(p => (
                    <button
                      key={p}
                      className={`${styles.providerCard} ${provider === p ? styles.providerActive : ''}`}
                      onClick={() => setProvider(p)}
                    >
                      <span className={styles.providerIcon}>{p === 'gemini' ? '☁️' : '🔑'}</span>
                      <div>
                        <div className={styles.providerName}>{p === 'gemini' ? 'Google Gemini' : 'OmniKey Proxy'}</div>
                        <div className={styles.providerSub}>{p === 'gemini' ? 'Direct via Google AI Studio' : 'Multi-model unified gateway'}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className={styles.modeGrid}>
                  {(['code', 'general'] as const).map(m => (
                    <button
                      key={m}
                      className={`${styles.modeCard} ${mode === m ? styles.modeActive : ''}`}
                      onClick={() => setMode(m)}
                    >
                      <span>{m === 'code' ? '💻 Code Mode' : '🌟 General Mode'}</span>
                      <small>{m === 'code' ? 'Production-ready code, no fluff' : 'Meetings, summaries, Q&A'}</small>
                    </button>
                  ))}
                </div>

                <div className={styles.configPreview}>
                  <span className={styles.cmt}>{'// config.json — saved automatically'}</span>{'\n'}
                  {'{'}{'\n'}
                  {'  '}<span className={styles.key}>"provider"</span>{': '}<span className={styles.str}>{cfgProvider}</span>,{'\n'}
                  {'  '}<span className={styles.key}>"model"</span>{': '}<span className={styles.str}>{cfgModel}</span>,{'\n'}
                  {'  '}<span className={styles.key}>"mode"</span>{': '}<span className={styles.str}>"{mode}"</span>,{'\n'}
                  {'  '}<span className={styles.key}>"stealthActive"</span>{': '}<span className={styles.bool}>true</span>{'\n'}
                  {'}'}
                </div>
              </div>
            )}

            {/* ────────── STEP 2: CAPTURE ────────── */}
            {step === 2 && (
              <div className={styles.stepLeft}>
                <h3 className={styles.stepTitle}>Screenshot Analysis</h3>
                <p className={styles.stepDesc}>
                  Press <kbd>Ctrl+H</kbd>. CorvusX hides itself, captures your screen, then reappears with the analysis.
                </p>

                <div className={styles.captureWrap}>
                  <div className={styles.captureScreen}>
                    {scanning && (
                      <motion.div
                        className={styles.scanLine}
                        initial={{ top: 0, opacity: 1 }}
                        animate={{ top: '100%', opacity: 0 }}
                        transition={{ duration: 1.3, ease: 'linear' }}
                      />
                    )}
                    {/* Mock IDE in background */}
                    <div className={styles.mockIde}>
                      <div className={styles.ideBar}>
                        <span className={styles.ideDot} style={{ background: '#ff5f57' }} />
                        <span className={styles.ideDot} style={{ background: '#ffbd2e' }} />
                        <span className={styles.ideDot} style={{ background: '#28ca41' }} />
                        <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: 8 }}>interview_problem.py — VS Code</span>
                      </div>
                      <div className={styles.ideCode}>
                        <span className={styles.cmt}>{'# LeetCode #1 — Two Sum'}</span>{'\n'}
                        <span className={styles.cmt}>{'# Given nums[], return indices of two numbers that add to target'}</span>{'\n\n'}
                        <span className={styles.key}>def </span>
                        <span className={styles.fn}>twoSum</span>(nums, target):{'\n'}
                        {'    '}<span className={styles.cmt}>{'# Your solution here...'}</span>{'\n'}
                        {'    '}<span className={styles.key}>pass</span>
                      </div>
                    </div>
                    {/* CorvusX HUD overlay */}
                    <AnimatePresence>
                      {hudVisible && (
                        <motion.div
                          className={styles.hud}
                          initial={{ opacity: 0, scale: 0.9, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className={styles.hudHeader}>
                            <span className={styles.hudDot} />
                            CorvusX — Analyzing…
                          </div>
                          <div className={styles.hudStatus}>🔍 Problem detected · OCR complete · Sending to Gemini</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <button className={styles.captureBtn} onClick={triggerCapture} disabled={scanning}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/>
                  </svg>
                  {scanning ? 'Capturing…' : 'Simulate Ctrl+H Capture'}
                </button>
              </div>
            )}

            {/* ────────── STEP 3: ANALYZE ────────── */}
            {step === 3 && (
              <div className={styles.stepLeft}>
                <h3 className={styles.stepTitle}>Instant AI Response</h3>
                <p className={styles.stepDesc}>
                  Wingman AI returns a direct, production-ready response — no fluff, no markdown headers.
                </p>

                <div className={styles.analyzeTabs}>
                  {(['code', 'voice', 'ghost'] as const).map(t => (
                    <button
                      key={t}
                      className={`${styles.aTab} ${analyzeTab === t ? styles.aTabActive : ''}`}
                      onClick={() => setAnalyzeTab(t)}
                    >
                      {t === 'code' ? '💻 Code Solution' : t === 'voice' ? '🎤 Voice Analysis' : '👻 Ghost Writer'}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={analyzeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Code tab */}
                    {analyzeTab === 'code' && (
                      <div>
                        <div className={styles.analyzeMeta}>
                          <span className={styles.aBadge}>Gemini 2.5 Flash</span>
                          <span className={styles.aBadge}>Code Mode</span>
                          <span className={`${styles.aBadge} ${styles.aBadgeCyan}`}>O(n) · HashMap</span>
                        </div>
                        <div className={styles.codeOutput}>
                          {`def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i`.split('\n').map((line, i) => (
                            <div key={i} className={styles.codeLine}>{line || '\u00a0'}</div>
                          ))}
                        </div>
                        <p className={styles.copyHint}>
                          Press <kbd>Ctrl+Alt+C</kbd> to copy · <kbd>Ctrl+Alt+K</kbd> to ghost-type into your IDE
                        </p>
                      </div>
                    )}

                    {/* Voice tab */}
                    {analyzeTab === 'voice' && (
                      <div>
                        <div className={styles.analyzeMeta}>
                          <span className={styles.aBadge}>🎤 Voice Input</span>
                          <span className={styles.aBadge}>General Mode</span>
                        </div>
                        <div className={styles.voiceBlock}>
                          <div className={styles.voiceRow}>
                            <div className={styles.voiceLabel}>🎙 Interviewer said:</div>
                            <div className={styles.voiceText}>"Tell me about a time you solved a difficult technical problem under pressure."</div>
                          </div>
                          <div className={styles.voiceRow}>
                            <div className={`${styles.voiceLabel} ${styles.voiceLabelCyan}`}>🤖 CorvusX reply:</div>
                            <div className={`${styles.voiceText} ${styles.voiceReply}`}>
                              "At my last role, our production database experienced a cascade failure during peak traffic. I isolated the issue to a deadlock in our connection pool, rolled back a migration, and implemented a circuit breaker — restoring service within 20 minutes."
                            </div>
                          </div>
                        </div>
                        <p className={styles.copyHint}>
                          Press <kbd>Ctrl+Shift+V</kbd> to record · <kbd>Ctrl+Alt+C</kbd> to copy response
                        </p>
                      </div>
                    )}

                    {/* Ghost Writer tab */}
                    {analyzeTab === 'ghost' && (
                      <div>
                        <div className={styles.analyzeMeta}>
                          <span className={styles.aBadge}>👻 Ghost Writer</span>
                          <span className={styles.aBadge}>Simulate Typing</span>
                        </div>
                        <p className={styles.ghostDesc}>
                          Ghost Writer types the AI solution character-by-character into <strong>any active window</strong> — your IDE, browser,
                          text field — with smart auto-indentation to prevent VSCode formatting conflicts.
                        </p>
                        <div className={styles.ghostPreview}>
                          <div className={styles.ghostBar}>
                            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>LeetCode Submit — Active Window</span>
                          </div>
                          <div className={styles.ghostContent}>
                            <pre className={styles.ghostTyped}>{ghostText}</pre>
                            <span className={styles.cursor}>|</span>
                          </div>
                        </div>
                        <button
                          className={styles.ghostBtn}
                          onClick={startGhostTyping}
                          disabled={ghostTyping}
                        >
                          {ghostTyping ? '⌨️ Typing…' : '▶ Simulate Ghost Typing (Ctrl+Alt+K)'}
                        </button>
                        <p className={styles.copyHint} style={{ marginTop: 8 }}>
                          <kbd>Ctrl+Alt+X</kbd> enables Ghost Keyboard — mirrors all keystrokes from other windows
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer navigation ── */}
      <div className={styles.footer}>
        <button className={styles.navBtn} onClick={goBack} disabled={step === 0}>← Back</button>
        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${step === i ? styles.dotActive : ''}`}
              onClick={() => setStep(i as Step)}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
        {step < 3
          ? <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={goNext}>Next →</button>
          : <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={() => setStep(0)}>↺ Replay</button>
        }
      </div>
    </div>
  )
}
