/**
 * DemoWizard.tsx — Pixel-perfect replica of CorvusX app UI
 *
 * Aligned with real CorvusX-application visual language:
 * - Onboarding: matches OnboardingWizard.tsx (liquid-glass, Tailwind-style classes via inline CSS vars)
 * - HUD Command Bar: matches QueueCommands.tsx exactly (LED, Show/Hide, Record Voice, Chat, Code, Models, Hotkeys, Logout)
 * - HUD Panels: matches Queue.tsx Chat, ModelSelector, and ShortcutManager layout
 *
 * Changes:
 * 1. Step 3: no API key test required — both options work, skip allowed
 * 2. Step 4: coding language locked to Auto-Detect (disabled select)
 * 3. DEMO_RESPONSE returns JavaScript (not Python) to match CodexPage editor
 * 4. Enter-to-send: after Ctrl+H scan, shows "press Enter to analyse" state
 * 5. 📋 Copy Code button on AI response bubble
 * 6. HUD command bar matches real app QueueCommands
 * 7. Removed mock IDE from HUD; overlay floats cleanly over Codex.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sparkles, Laptop, ArrowRight, ArrowLeft, Check,
  AlertTriangle, Eye, EyeOff,
  Send, Copy, CheckCheck, LogOut
} from 'lucide-react'
import styles from './DemoWizard.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'onboarding' | 'hud'
type Provider = 'gemini' | 'omnikey'
type Mode = 'code' | 'general'
interface ChatMsg { role: 'user' | 'gemini'; text: string }

// ─── Demo AI content (JavaScript to match editor) ─────────────────────────────
const DEMO_RESPONSE = `\`\`\`javascript
var twoSum = function(nums, target) {
    var seen = {};
    for (var i = 0; i < nums.length; i++) {
        var complement = target - nums[i];
        if (complement in seen) return [seen[complement], i];
        seen[nums[i]] = i;
    }
};
\`\`\`

**O(n) time · O(n) space** — HashMap approach. Single pass through the array.`

const GHOST_CODE = `var twoSum = function(nums, target) {
    var seen = {};
    for (var i = 0; i < nums.length; i++) {
        var complement = target - nums[i];
        if (complement in seen) return [seen[complement], i];
        seen[nums[i]] = i;
    }
};`

const VOICE_RESPONSE = `**Question:** "Tell me about a time you handled a difficult production bug."

**CorvusX:** At my previous role, a memory leak in our Node.js backend caused cascading failures during peak load. I used \`clinic.js\` to profile the heap, traced it to unclosed DB connections in our ORM, and patched it with proper connection pooling — restoring full stability within **40 minutes** with zero data loss.`

// Mock screenshot base64/preview
const MOCK_SCREENSHOT = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABACAYAAACFhMmIAAAABmJLR0QA/wD/AP+gvaeTAAAAcElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBjAL1gAAH6C51IAAAAAElFTkSuQmCC"

// ─── Simple Markdown renderer ─────────────────────────────────
function MarkdownBlock({ text, light }: { text: string; light?: boolean }) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let inCode = false
  let codeLines: string[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLines = []
      } else {
        const codeStr = codeLines.join('\n')
        nodes.push(
          <pre key={`code-${i}`} className={light ? styles.codeBlockLight : styles.codeBlock}>
            <code>{codeStr}</code>
          </pre>
        )
        inCode = false
        codeLines = []
      }
      return
    }
    if (inCode) { codeLines.push(line); return }

    if (!line.trim()) { nodes.push(<br key={`br-${i}`} />); return }

    nodes.push(
      <div key={`line-${i}`} className={styles.mdLine}>
        {parseInline(line, light)}
      </div>
    )
  })
  // Flush open code block
  if (inCode && codeLines.length) {
    nodes.push(
      <pre key="code-end" className={light ? styles.codeBlockLight : styles.codeBlock}>
        <code>{codeLines.join('\n')}</code>
      </pre>
    )
  }

  return <div className={styles.markdown}>{nodes}</div>
}

function parseInline(text: string, light?: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g
  let last = 0; let m; let idx = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={idx++}>{text.slice(last, m.index)}</span>)
    if (m[1]) parts.push(<code key={idx++} className={light ? styles.inlineCodeLight : styles.inlineCode}>{m[1].slice(1, -1)}</code>)
    else if (m[2]) parts.push(<strong key={idx++}>{m[2].slice(2, -2)}</strong>)
    else if (m[3]) parts.push(<em key={idx++}>{m[3].slice(1, -1)}</em>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<span key={idx++}>{text.slice(last)}</span>)
  return parts.length ? parts : [text]
}

// ─── Interfaces ──────────────────────────────────────────────────────────
interface DemoWizardProps {
  onPhaseChange?: (phase: Phase) => void
  onGhostComplete?: (code: string) => void
  externalTrigger?: 'screenshot' | 'ghost' | null
  onCopyCode?: () => void
  onAwaitEnter?: () => void
  onResultReady?: () => void
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DemoWizard({ onPhaseChange, onGhostComplete, externalTrigger, onCopyCode, onAwaitEnter, onResultReady }: DemoWizardProps = {}) {
  // Onboarding state
  const [phase, setPhase] = useState<Phase>('onboarding')
  const [step, setStep] = useState(1)
  const opacity = 0.25
  const [provider, setProvider] = useState<Provider>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [mode, setMode] = useState<Mode>('code')
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // HUD panels state (matching Queue.tsx)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioResult, setAudioResult] = useState<string | null>(null)
  const [ghostText, setGhostText] = useState('')
  const [ghostTyping, setGhostTyping] = useState(false)
  const [isGhostActive, setIsGhostActive] = useState(false)

  // Screenshot state: 'idle' | 'scanning' | 'awaitEnter' | 'loading' | 'done'
  const [screenshotState, setScreenshotState] = useState<'idle' | 'scanning' | 'awaitEnter' | 'loading' | 'done'>('idle')
  const [attachedScreenshots, setAttachedScreenshots] = useState<string[]>([])

  const [copied, setCopied] = useState(false)
  const ghostRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatScrollerRef = useRef<HTMLDivElement>(null)

  // Scroll chat container internally — never scrollIntoView which moves the whole page
  useEffect(() => {
    const el = chatScrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chatMessages, chatLoading])
  useEffect(() => () => { if (ghostRef.current) clearInterval(ghostRef.current) }, [])

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  // Onboarding helpers
  const simulateTest = useCallback(() => {
    if (!apiKey.trim()) { setTestStatus('error'); setErrorMessage('API Key cannot be empty.'); return }
    setIsTesting(true); setTestStatus('idle')
    setTimeout(() => { setIsTesting(false); setTestStatus('success') }, 1400)
  }, [apiKey])

  const handleNext = () => {
    if (step < 3) setStep(s => s + 1)
    else { setPhase('hud'); setStep(1); setIsChatOpen(true) }
  }
  const handleBack = () => { if (step > 1) setStep(s => s - 1) }

  const resetProvider = (p: Provider) => {
    setProvider(p); setTestStatus('idle')
  }
  const resetApiKey = (k: string) => {
    setApiKey(k); setTestStatus('idle')
  }

  // HUD helpers ─────────────────────────────────────────────────────────────────
  const triggerCapture = useCallback(() => {
    if (screenshotState === 'scanning') return
    setScreenshotState('scanning')
    setIsChatOpen(false)
    setChatMessages([])
    setAttachedScreenshots([])
    setTimeout(() => {
      setScreenshotState('awaitEnter')
      setAttachedScreenshots([MOCK_SCREENSHOT])
      setIsChatOpen(true)
      onAwaitEnter?.()
    }, 1400)
  }, [screenshotState, onAwaitEnter])

  const confirmSend = useCallback(() => {
    if (screenshotState !== 'awaitEnter') return
    setScreenshotState('loading')
    setChatLoading(true)
    setAttachedScreenshots([])
    setTimeout(() => {
      setChatMessages([
        { role: 'user', text: 'Sent screenshots' },
        { role: 'gemini', text: DEMO_RESPONSE }
      ])
      setChatLoading(false)
      setScreenshotState('done')
      onResultReady?.()
    }, 1200)
  }, [screenshotState, onResultReady])

  const triggerVoice = () => {
    if (isRecording) {
      setIsRecording(false); setAudioLoading(true)
      setTimeout(() => { setAudioLoading(false); setAudioResult(VOICE_RESPONSE) }, 1600)
    } else {
      setIsRecording(true); setAudioResult(null)
    }
  }

  const startGhostTyping = useCallback(() => {
    if (ghostTyping) return
    setGhostText(''); setGhostTyping(true); setIsGhostActive(true)
    let idx = 0
    ghostRef.current = setInterval(() => {
      idx++
      setGhostText(GHOST_CODE.slice(0, idx))
      if (idx >= GHOST_CODE.length) {
        clearInterval(ghostRef.current!); setGhostTyping(false)
        setTimeout(() => setIsGhostActive(false), 800)
        onGhostComplete?.(GHOST_CODE)
      }
    }, 22)
  }, [ghostTyping, onGhostComplete])

  useEffect(() => {
    if (!externalTrigger) return
    if (externalTrigger === 'screenshot') {
      triggerCapture()
    } else if (externalTrigger === 'ghost') {
      startGhostTyping()
    }
  }, [externalTrigger, triggerCapture, startGhostTyping])

  // Enter key: confirm send when awaiting — stopPropagation prevents scroll-snap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && screenshotState === 'awaitEnter') {
        e.preventDefault()
        e.stopPropagation()
        confirmSend()
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [screenshotState, confirmSend])

  const sendChat = () => {
    if (!chatInput.trim()) return
    const msg = chatInput.trim(); setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]); setChatLoading(true)
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'gemini', text: "I'll analyze that for you. Here's a concise answer optimized for your coding interview." }])
      setChatLoading(false)
    }, 900)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GHOST_CODE).catch(() => { })
    setCopied(true)
    onCopyCode?.()
    setTimeout(() => setCopied(false), 2000)
  }

  const restartDemo = () => {
    setPhase('onboarding'); setStep(1)
    setChatMessages([]); setAudioResult(null); setGhostText('')
    setScreenshotState('idle'); setIsChatOpen(true); setIsSettingsOpen(false); setIsShortcutsOpen(false)
    setAttachedScreenshots([])
  }

  // Card background reacts to opacity slider
  const cardStyle = { '--card-opacity': opacity } as React.CSSProperties

  return (
    <div className={styles.demoShell}>
      <AnimatePresence mode="wait">
        {phase === 'onboarding' ? (
          <motion.div key="onboarding"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}
          >
            <div className={styles.wizardCard} style={cardStyle}>
              <div className={styles.glowTR} />
              <div className={styles.glowBL} />

              {/* Progress header */}
              <div className={styles.wizardHeader}>
                <span className={styles.wizardLabel}>CorvusX Setup • Step {step} of 3</span>
                <div className={styles.progressDots}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`${styles.dot} ${i === step ? styles.dotActive : i < step ? styles.dotDone : styles.dotPending
                      }`} />
                  ))}
                </div>
              </div>

              {/* Scrollable body */}
              <div className={styles.wizardBody}>
                <AnimatePresence mode="wait">
                  <motion.div key={step}
                    initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.2 }}
                  >
                    {/* ── STEP 1: WELCOME ── */}
                    {step === 1 && (
                      <div className={styles.stepSpace}>
                        <div className={styles.stepHead}><Sparkles className={`${styles.iconYellow} ${styles.pulse}`} /><h1 className={styles.stepH1}>Welcome to CorvusX</h1></div>
                        <p className={styles.stepP}>Intelligence in the shadows. A premium, always-on-top overlay providing real-time cognitive reasoning, screen analysis, and meeting insights.</p>
                        <div className={styles.divider}>
                          {[
                            { icon: '🕵️', title: 'Stealth HUD Overlay', sub: 'Sits silently above all your apps, invisibly, and helps you.' },
                            { icon: '🔍', title: 'Multimodal Intelligence', sub: 'Instantly extracts problems from screenshots or processes voice transcription clips.' },
                            { icon: '⌨️', title: 'Ghost Writer & Ghost Keyboard', sub: 'Type AI responses character-by-character or mirror keystrokes globally via uIOhook.' },
                          ].map(f => (
                            <div key={f.title} className={styles.featureRow}>
                              <div className={styles.featureIconBox}><span>{f.icon}</span></div>
                              <div><h3 className={styles.featureTitle}>{f.title}</h3><p className={styles.featureSub}>{f.sub}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2: MODE ── */}
                    {step === 2 && (
                      <div className={styles.stepSpace}>
                        <div className={styles.stepHead}><Laptop className={styles.iconPurple} /><h1 className={styles.stepH1}>Choose Assistant Mode</h1></div>
                        <p className={styles.stepP}>Choose the primary style for your Wingman AI. You can switch modes instantly at any time from the HUD overlay.</p>
                        <div className={styles.modeStack}>
                          {[
                            { id: 'code' as Mode, icon: '💻', name: 'Code Assistant (Default & Recommended)', sub: 'Designed for coding interviews or solving technical programming questions. Returns direct, concise, production-ready code with no fluff.', dot: styles.dotBlue, active: styles.modeActiveBlue },
                            { id: 'general' as Mode, icon: '🌟', name: 'General Assistant', sub: 'Designed for general meetings, summaries, or daily tasks. Returns direct, concise, conversational replies in a single brief paragraph.', dot: styles.dotPurple, active: styles.modeActivePurple },
                          ].map(m => (
                            <div key={m.id}
                              className={`${styles.modeCard} ${mode === m.id ? m.active : styles.modeOff}`}
                              onClick={() => setMode(m.id)}
                            >
                              <div className={styles.modeTop}>
                                <span className={styles.modeTitle}>{m.icon} {m.name}</span>
                                {mode === m.id && <div className={m.dot} />}
                              </div>
                              <p className={styles.modeSub}>{m.sub}</p>
                            </div>
                          ))}
                        </div>
                        {mode === 'code' && (
                          <motion.div className={styles.field}
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          >
                            <label className={styles.fieldLabel}>
                              Default Coding Language
                            </label>
                            <select value="Auto-Detect" disabled className={`${styles.select} ${styles.selectLocked}`}>
                              <option value="Auto-Detect">Auto-Detect</option>
                            </select>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* ── STEP 3: READY ── */}
                    {step === 3 && (
                      <div className={styles.stepSpaceCenter}>
                        <div className={styles.readyCircle}><Check className={styles.readyCheck} /></div>
                        <h1 className={styles.stepH1}>You're Ready to Go!</h1>
                        <p className={styles.stepPCenter}>All settings have been successfully configured. CorvusX will now sit silently in the background. Press <kbd className={styles.kbdWiz}>⌘/Ctrl+B</kbd> at any time to toggle the overlay.</p>
                        <div className={styles.readyBox}>
                          <div className={styles.readyLine}>🎯 <strong>Initial Mode:</strong> {mode === 'code' ? 'Code Assistant' : 'General Assistant'}</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer nav */}
              <div className={styles.wizardFooter}>
                {step > 1 ? (
                  <button className={styles.backBtn} onClick={handleBack}><ArrowLeft size={13} /> Back</button>
                ) : <div />}
                {step < 3 ? (
                  <button className={styles.nextBtn} onClick={handleNext}>
                    Next <ArrowRight size={13} />
                  </button>
                ) : (
                  <button className={styles.launchBtn} onClick={handleNext}>Launch CorvusX</button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ══════════════════ HUD PHASE — matches actual application UI (img 3) ══════════════════ */
          <motion.div key="hud"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.3 }}
            className={styles.hudWrapper}
          >
            {/* The horizontal command bar — matches img 3 (QueueCommands.tsx style) */}
            <div className={styles.hudBarOuter}>
              <div className={styles.hudBarPill}>

                {/* Stealth Status LED */}
                <div className={styles.hudLedWrapper} title="Stealth Assistant Idle & Ready">
                  <span className={`${styles.hudLedDot} ${chatLoading || screenshotState === 'loading' ? styles.hudLedYellow : styles.hudLedGreen}`} />
                </div>

                {/* Show/Hide */}
                <div className={styles.hudBarGroup}>
                  <span className={styles.hudBarLabel}>Show/Hide</span>
                  <div className={styles.hudKeyCaps}>
                    <button className={styles.hudKeyCap}>⌘</button>
                    <button className={styles.hudKeyCap}>B</button>
                  </div>
                </div>

                {/* Voice Recording Button */}
                <div className={styles.hudBarGroup}>
                  <button
                    className={`${styles.hudBarBtn} ${isRecording ? styles.hudBarBtnRecording : ''}`}
                    onClick={triggerVoice}
                    type="button"
                  >
                    {isRecording ? (
                      <span className={styles.hudRecordingFlex}>
                        <span className={styles.hudRecordingPing} />
                        <span>Stop Recording</span>
                      </span>
                    ) : (
                      <span>🎤 Record Voice</span>
                    )}
                  </button>
                </div>

                {/* Chat Button */}
                <div className={styles.hudBarGroup}>
                  <button
                    className={`${styles.hudBarBtn} ${isChatOpen ? styles.hudBarBtnActive : ''}`}
                    onClick={() => { setIsChatOpen(prev => !prev); setIsSettingsOpen(false); setIsShortcutsOpen(false) }}
                    type="button"
                  >
                    <span>💬 Chat</span>
                  </button>
                </div>

                {/* Mode Toggle Button */}
                <div className={styles.hudBarGroup}>
                  <button
                    className={styles.hudBarBtnMode}
                    onClick={() => setMode(prev => prev === 'code' ? 'general' : 'code')}
                    type="button"
                  >
                    <span>{mode === 'code' ? '💻 Code' : '🌟 General'}</span>
                  </button>
                </div>

                {/* Settings/Models Button */}
                <div className={styles.hudBarGroup}>
                  <button
                    className={`${styles.hudBarBtn} ${isSettingsOpen ? styles.hudBarBtnActive : ''}`}
                    onClick={() => { setIsSettingsOpen(prev => !prev); setIsChatOpen(false); setIsShortcutsOpen(false) }}
                    type="button"
                  >
                    <span>⚙️ Models</span>
                  </button>
                </div>

                {/* Shortcuts/Hotkeys Button */}
                <div className={styles.hudBarGroup}>
                  <button
                    className={`${styles.hudBarBtn} ${isShortcutsOpen ? styles.hudBarBtnActive : ''}`}
                    onClick={() => { setIsShortcutsOpen(prev => !prev); setIsChatOpen(false); setIsSettingsOpen(false) }}
                    type="button"
                  >
                    <span>⌨️ Hotkeys</span>
                  </button>
                </div>

                {/* Separator */}
                <div className={styles.hudBarSeparator} />

                {/* Restart/Logout Button */}
                <button
                  className={styles.hudLogoutBtn}
                  title="Restart Demo"
                  onClick={restartDemo}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>

            {/* Floating Panels Container (matching Queue.tsx) */}
            <div className={styles.hudPanels}>

              {/* Chat Panel */}
              {isChatOpen && (
                <div className={`${styles.panelCard} ${isGhostActive ? styles.ghostGlow : ""}`}>

                  {/* Messages list */}
                  <div className={styles.chatScroller} ref={chatScrollerRef}>
                    {chatMessages.length === 0 ? (
                      <div className={styles.chatEmptyState}>
                        💬 Chat with ☁️ {provider === 'gemini' ? 'CorvusX' : 'omnikey-auto'}
                        <br />
                        <span className={styles.chatEmptyStateSub}>Take a screenshot (Ctrl+H) for automatic analysis</span>
                        <br />
                        <span className={styles.chatEmptyStateSub}>Click ⚙️ Models to switch AI providers</span>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`${styles.chatRow} ${msg.role === "user" ? styles.chatRowUser : styles.chatRowGemini}`}
                        >
                          <div className={`${styles.bubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleGemini}`}>
                            <MarkdownBlock text={msg.text} light={false} />
                            {msg.role === "gemini" && idx === chatMessages.length - 1 && (
                              <div className={styles.bubbleActions}>
                                <button
                                  type="button"
                                  onClick={handleCopyCode}
                                  className={styles.copyCodeBtn}
                                >
                                  {copied ? <CheckCheck size={11} className={styles.copyCheckIcon} /> : <Copy size={11} />}
                                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className={styles.chatRowGemini}>
                        <div className={`${styles.bubble} ${styles.bubbleGemini}`}>
                          <span className={styles.loadingFlex}>
                            <span className={styles.dots}><span /><span /><span /></span>
                            <span className={styles.loadingText}>{provider === 'gemini' ? 'CorvusX' : 'omnikey-auto'} is replying...</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attached screenshots — text-only pill */}
                  {attachedScreenshots.length > 0 && (
                    <div className={styles.attachmentChipRow}>
                      {attachedScreenshots.map((_, idx) => (
                        <div key={idx} className={styles.attachmentChip}>
                          <span className={styles.attachmentChipLabel}>📷 Screenshot ready</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input form */}
                  <form
                    className={styles.panelForm}
                    onSubmit={e => { e.preventDefault(); e.stopPropagation(); if (screenshotState === 'awaitEnter') confirmSend(); else sendChat() }}
                  >
                    <input
                      className={`${styles.panelInput} ${isGhostActive ? styles.panelInputGhost : ""}`}
                      placeholder="Type your message..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      className={styles.panelSendBtn}
                      disabled={chatLoading || (screenshotState !== 'awaitEnter' && !chatInput.trim())}
                    >
                      <Send size={13} />
                    </button>
                  </form>

                </div>
              )}

              {/* Models panel (broader space, matches Step 3) */}
              {isSettingsOpen && (
                <div className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <span className={styles.panelHeaderTitle}>⚙️ Configure AI Provider</span>
                    <button className={styles.panelCloseBtn} onClick={() => setIsSettingsOpen(false)}>✕</button>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Select Provider</label>
                    <div className={styles.providerGrid}>
                      {([
                        { id: 'gemini' as Provider, icon: '☁️', name: 'Google Gemini', sub: 'Direct cloud connection via Google AI Studio.' },
                        { id: 'omnikey' as Provider, icon: '🔑', name: 'OmniKey Proxy', sub: 'Reverse LLM proxy created by felix-au.' },
                      ]).map(p => (
                        <button key={p.id}
                          className={`${styles.providerBtn} ${provider === p.id ? (p.id === 'gemini' ? styles.provBtnBlue : styles.provBtnPurple) : styles.provBtnOff}`}
                          onClick={() => resetProvider(p.id)}
                        >
                          <span className={styles.provBtnTitle}>{p.icon} {p.name}</span>
                          <span className={styles.provBtnSub}>{p.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <div className={styles.keyLabelRow}>
                      <label className={styles.fieldLabel}>API Key</label>
                    </div>
                    <div className={styles.keyWrap}>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={provider === 'gemini' ? 'Enter Gemini Key (starts with AIzaSy...)' : 'Enter OmniKey Key'}
                        value={apiKey}
                        onChange={e => resetApiKey(e.target.value)}
                        className={styles.keyInput}
                      />
                      <button className={styles.eyeBtn} onClick={() => setShowApiKey(v => !v)}>
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className={styles.testRow}>
                    <button className={styles.testBtn} onClick={simulateTest} disabled={isTesting || !apiKey.trim()}>
                      {isTesting ? 'Testing…' : 'Test Connection'}
                    </button>
                    <div>
                      {testStatus === 'success' && <span className={styles.testOk}><Check size={13} /> Connected Successfully!</span>}
                      {testStatus === 'error' && <span className={styles.testErr}><AlertTriangle size={13} /> {errorMessage}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Hotkeys panel (matches Step 5) */}
              {isShortcutsOpen && (
                <div className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <span className={styles.panelHeaderTitle}>⌨️ Master the Shortcuts</span>
                    <button className={styles.panelCloseBtn} onClick={() => setIsShortcutsOpen(false)}>✕</button>
                  </div>

                  <div className={styles.scList}>
                    {[
                      { label: 'Show / Center Overlay', sub: 'Center overlay window on active workspace.', keys: ['⌘/Ctrl', 'Shift', 'Space'] },
                      { label: 'Stealth Show / Hide', sub: 'Silently toggle window visibility.', keys: ['⌘/Ctrl', 'B'] },
                      { label: 'Screenshot Analysis', sub: 'Capture current screen and analyze immediately.', keys: ['⌘/Ctrl', 'H'] },
                      { label: 'Reset & Clear Context', sub: 'Start a completely fresh chat session.', keys: ['⌘/Ctrl', 'O'] },
                      { label: 'Clear UI Clutter', sub: 'Clear chat and audio results from UI (retains context).', keys: ['⌘/Ctrl', 'U'] },
                      { label: 'Copy Latest Response', sub: 'Copy latest text response to clipboard.', keys: ['⌘/Ctrl', 'Alt', 'C'] },
                      { label: 'Toggle Voice Recording', sub: 'Start or stop voice input recording globally.', keys: ['⌘/Ctrl', 'Shift', 'V'] },
                      { label: 'Ghost Keyboard Mode', sub: "Passively mirror global keystrokes into the overlay's chat input.", keys: ['⌘/Ctrl', 'Alt', 'X'] },
                      { label: 'Ghost Writer (Simulate Typing)', sub: 'Simulate typing the latest response character-by-character.', keys: ['⌘/Ctrl', 'Alt', 'K'] },
                    ].map((sc, i) => (
                      <div key={i} className={styles.scItem}>
                        <div className={styles.scLeft}>
                          <span className={styles.scLabel}>{sc.label}</span>
                          <span className={styles.scSub}>{sc.sub}</span>
                        </div>
                        <div className={styles.scKeys}>
                          {sc.keys.map(k => <kbd key={k} className={styles.kbdWiz}>{k}</kbd>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional Audio Result Panel */}
              {(audioLoading || audioResult) && (
                <div className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <span className={styles.panelHeaderTitle}>🎤 Voice Input Status</span>
                    {audioResult && !audioLoading && (
                      <button onClick={() => setAudioResult(null)} className={styles.panelCloseBtn}>✕</button>
                    )}
                  </div>
                  {audioLoading ? (
                    <div className={styles.audioLoading}>
                      <span className={styles.loadingFlex}>
                        <span className={styles.dots}><span /><span /><span /></span>
                        <span className={styles.audioLoadingText}>Processing voice recording & transcribing request...</span>
                      </span>
                    </div>
                  ) : (
                    <div className={styles.audioResult}>
                      <MarkdownBlock text={audioResult || ""} />
                    </div>
                  )}
                </div>
              )}

              {/* Ghost Preview Box (Only when simulated typing is active in demo) */}
              {isGhostActive && (
                <div className={styles.panelCard}>
                  <div className={styles.panelHeader}>
                    <span className={styles.panelHeaderTitle} style={{ color: '#c084fc' }}>👻 Ghost Writer Active</span>
                  </div>
                  <pre className={styles.ghostCode}>{ghostText}<span className={styles.cursor}>|</span></pre>
                </div>
              )}

            </div>
          </motion.div>

        )}
      </AnimatePresence>
    </div>
  )
}
