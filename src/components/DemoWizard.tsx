/**
 * DemoWizard.tsx — Pixel-perfect replica of CorvusX app UI
 *
 * Fixes applied:
 * 1. Opacity slider actually changes the wizard card's background alpha (CSS var)
 * 2. Useless blurred desktop background removed — clean minimal wrapper
 * 3. Tall steps scroll inside a fixed-height body area
 * 4. AI response elements render Markdown (code blocks, bold, inline code)
 * 5. Colors use --card / --border / --text CSS vars → light/dark theme aware
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sparkles, Laptop, Key, ArrowRight, ArrowLeft, Check,
  AlertTriangle, Command, Eye, EyeOff, Palette, Mic, MicOff,
  Settings, Send
} from 'lucide-react'
import styles from './DemoWizard.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'onboarding' | 'hud'
type Provider = 'gemini' | 'omnikey'
type Mode = 'code' | 'general'
type HudTab = 'screenshot' | 'voice' | 'ghost'
interface ChatMsg { role: 'user' | 'gemini'; text: string }

// ─── Demo AI content ──────────────────────────────────────────────────────────
const DEMO_RESPONSE = `\`\`\`python
def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
\`\`\`

**O(n) time · O(n) space** — HashMap approach. Single pass through the array.`

const GHOST_CODE = `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i`

const VOICE_RESPONSE = `**Question:** "Tell me about a time you handled a difficult production bug."

**CorvusX:** At my previous role, a memory leak in our Node.js backend caused cascading failures during peak load. I used \`clinic.js\` to profile the heap, traced it to unclosed DB connections in our ORM, and patched it with proper connection pooling — restoring full stability within **40 minutes** with zero data loss.`

// ─── Simple Markdown renderer (no extra deps) ─────────────────────────────────
function MarkdownBlock({ text, light }: { text: string; light?: boolean }) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let inCode = false
  let codeLang = ''
  let codeLines: string[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLang = line.slice(3).trim()
        codeLines = []
      } else {
        const codeStr = codeLines.join('\n')
        nodes.push(
          <pre key={`code-${i}`} className={light ? styles.codeBlockLight : styles.codeBlock}>
            <code>{codeStr}</code>
          </pre>
        )
        inCode = false
        codeLang = ''
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
    if (m[1]) parts.push(<code key={idx++} className={light ? styles.inlineCodeLight : styles.inlineCode}>{m[1].slice(1,-1)}</code>)
    else if (m[2]) parts.push(<strong key={idx++}>{m[2].slice(2,-2)}</strong>)
    else if (m[3]) parts.push(<em key={idx++}>{m[3].slice(1,-1)}</em>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<span key={idx++}>{text.slice(last)}</span>)
  return parts.length ? parts : [text]
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DemoWizard() {
  // Onboarding state
  const [phase,   setPhase]   = useState<Phase>('onboarding')
  const [step,    setStep]    = useState(1)
  const [opacity, setOpacity] = useState(0.25)
  const [provider, setProvider] = useState<Provider>('gemini')
  const [apiKey, setApiKey]   = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [mode,    setMode]    = useState<Mode>('code')
  const [codingLanguage, setCodingLanguage] = useState('Auto-Detect')
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle'|'success'|'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasTestedSuccessfully, setHasTestedSuccessfully] = useState(false)

  // HUD state
  const [hudTab, setHudTab] = useState<HudTab>('screenshot')
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioResult, setAudioResult] = useState<string|null>(null)
  const [ghostText, setGhostText] = useState('')
  const [ghostTyping, setGhostTyping] = useState(false)
  const [isGhostActive, setIsGhostActive] = useState(false)
  const [scanActive, setScanActive] = useState(false)
  const [hudVisible, setHudVisible] = useState(false)
  const ghostRef = useRef<ReturnType<typeof setInterval>|null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, chatLoading])
  useEffect(() => () => { if (ghostRef.current) clearInterval(ghostRef.current) }, [])

  // Onboarding helpers
  const simulateTest = useCallback(() => {
    if (!apiKey.trim()) { setTestStatus('error'); setErrorMessage('API Key cannot be empty.'); return }
    setIsTesting(true); setTestStatus('idle')
    setTimeout(() => { setIsTesting(false); setTestStatus('success'); setHasTestedSuccessfully(true) }, 1400)
  }, [apiKey])

  const handleNext = () => {
    if (step === 3 && !hasTestedSuccessfully) return
    if (step < 6) setStep(s => s + 1)
    else { setPhase('hud'); setStep(1) }
  }
  const handleBack = () => { if (step > 1) setStep(s => s - 1) }

  const resetProvider = (p: Provider) => {
    setProvider(p); setHasTestedSuccessfully(false); setTestStatus('idle')
  }
  const resetApiKey = (k: string) => {
    setApiKey(k); setHasTestedSuccessfully(false); setTestStatus('idle')
  }

  // HUD helpers
  const triggerCapture = () => {
    if (scanActive) return
    setScanActive(true); setHudVisible(false); setChatMessages([])
    setTimeout(() => {
      setScanActive(false); setHudVisible(true); setChatLoading(true)
      setTimeout(() => {
        setChatMessages([
          { role: 'user', text: 'Sent screenshots' },
          { role: 'gemini', text: DEMO_RESPONSE }
        ])
        setChatLoading(false)
      }, 1200)
    }, 1400)
  }

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
      }
    }, 22)
  }, [ghostTyping])

  const sendChat = () => {
    if (!chatInput.trim()) return
    const msg = chatInput.trim(); setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]); setChatLoading(true)
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'gemini', text: "I'll analyze that for you. Here's a concise answer optimized for your coding interview." }])
      setChatLoading(false)
    }, 900)
  }

  const restartDemo = () => {
    setPhase('onboarding'); setStep(1)
    setChatMessages([]); setAudioResult(null); setGhostText('')
    setScanActive(false); setHudVisible(false); setIsGhostActive(false)
  }

  // Card background reacts to opacity slider
  const cardStyle = { '--card-opacity': opacity } as React.CSSProperties

  return (
    <div className={styles.demoShell}>
      <AnimatePresence mode="wait">
        {phase === 'onboarding' ? (
          <motion.div key="onboarding"
            initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.97 }} transition={{ duration:0.25 }}
          >
            <div className={styles.wizardCard} style={cardStyle}>
              <div className={styles.glowTR} />
              <div className={styles.glowBL} />

              {/* Progress header */}
              <div className={styles.wizardHeader}>
                <span className={styles.wizardLabel}>CorvusX Setup • Step {step} of 6</span>
                <div className={styles.progressDots}>
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className={`${styles.dot} ${
                      i===step ? styles.dotActive : i<step ? styles.dotDone : styles.dotPending
                    }`} />
                  ))}
                </div>
              </div>

              {/* Scrollable body */}
              <div className={styles.wizardBody}>
                <AnimatePresence mode="wait">
                  <motion.div key={step}
                    initial={{ opacity:0, x:14 }} animate={{ opacity:1, x:0 }}
                    exit={{ opacity:0, x:-14 }} transition={{ duration:0.2 }}
                  >
                    {/* ── STEP 1: APPEARANCE ── */}
                    {step === 1 && (
                      <div className={styles.stepSpace}>
                        <div className={styles.stepHead}><Palette className={styles.iconPink}/><h1 className={styles.stepH1}>Customize Appearance</h1></div>
                        <p className={styles.stepP}>Adjust the window styling to ensure all text remains highly readable against your desktop background. Changes apply live below.</p>
                        <div className={styles.divider}>
                          <label className={styles.fieldLabel}>Background Theme</label>
                          <div className={styles.themeCard}>
                            <span className={styles.themeCardTitle}>🌙 Dark Backdrop (Default)</span>
                            <span className={styles.themeCardSub}>Translucent blackish background optimized for stealth HUD integration.</span>
                          </div>
                          <div className={styles.opacitySection}>
                            <div className={styles.opacityLabelRow}>
                              <span className={styles.fieldLabel}>Backdrop Opacity</span>
                              <span className={styles.opacityVal}>{Math.round(opacity * 100)}%</span>
                            </div>
                            {/* Live preview strip */}
                            <div className={styles.opacityPreview} style={{ '--preview-opacity': opacity } as React.CSSProperties}>
                              <span className={styles.opacityPreviewText}>Preview</span>
                            </div>
                            <input
                              type="range" min="0.05" max="1" step="0.05"
                              value={opacity}
                              onChange={e => setOpacity(parseFloat(e.target.value))}
                              className={styles.slider}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2: WELCOME ── */}
                    {step === 2 && (
                      <div className={styles.stepSpace}>
                        <div className={styles.stepHead}><Sparkles className={`${styles.iconYellow} ${styles.pulse}`}/><h1 className={styles.stepH1}>Welcome to CorvusX</h1></div>
                        <p className={styles.stepP}>Intelligence in the shadows. A premium, always-on-top overlay providing real-time cognitive reasoning, screen analysis, and meeting insights.</p>
                        <div className={styles.divider}>
                          {[
                            { icon:'🕵️', title:'Stealth HUD Overlay', sub:'Sits silently above all your apps, invisibly, and helps you.' },
                            { icon:'🔍', title:'Multimodal Intelligence', sub:'Instantly extracts problems from screenshots or processes voice transcription clips.' },
                            { icon:'⌨️', title:'Ghost Writer & Ghost Keyboard', sub:'Type AI responses character-by-character or mirror keystrokes globally via uIOhook.' },
                          ].map(f => (
                            <div key={f.title} className={styles.featureRow}>
                              <div className={styles.featureIconBox}><span>{f.icon}</span></div>
                              <div><h3 className={styles.featureTitle}>{f.title}</h3><p className={styles.featureSub}>{f.sub}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 3: PROVIDER ── */}
                    {step === 3 && (
                      <div className={styles.stepSpace}>
                        <div className={styles.stepHead}><Key className={styles.iconBlue}/><h1 className={styles.stepH1}>Configure AI Provider</h1></div>
                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Select Provider</label>
                          <div className={styles.providerGrid}>
                            {([
                              { id:'gemini' as Provider, icon:'☁️', name:'Google Gemini', sub:'Direct cloud connection via Google AI Studio.' },
                              { id:'omnikey' as Provider, icon:'🔑', name:'OmniKey Proxy', sub:'Reverse LLM proxy created by felix-au.' },
                            ]).map(p => (
                              <button key={p.id}
                                className={`${styles.providerBtn} ${provider===p.id ? (p.id==='gemini'?styles.provBtnBlue:styles.provBtnPurple) : styles.provBtnOff}`}
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
                            <a href="#" className={styles.keyLink}>{provider==='gemini'?'Get free Gemini API Key →':'Get free OmniKey Key →'}</a>
                          </div>
                          <div className={styles.keyWrap}>
                            <input
                              type={showApiKey ? 'text' : 'password'}
                              placeholder={provider==='gemini' ? 'Enter Gemini Key (starts with AIzaSy...)' : 'Enter OmniKey Key'}
                              value={apiKey}
                              onChange={e => resetApiKey(e.target.value)}
                              className={styles.keyInput}
                            />
                            <button className={styles.eyeBtn} onClick={() => setShowApiKey(v => !v)}>
                              {showApiKey ? <EyeOff size={14}/> : <Eye size={14}/>}
                            </button>
                          </div>
                        </div>
                        <div className={styles.testRow}>
                          <button className={styles.testBtn} onClick={simulateTest} disabled={isTesting||!apiKey.trim()}>
                            {isTesting ? 'Testing…' : 'Test Connection'}
                          </button>
                          <div>
                            {testStatus==='success' && <span className={styles.testOk}><Check size={13}/> Connected Successfully!</span>}
                            {testStatus==='error' && <span className={styles.testErr}><AlertTriangle size={13}/> {errorMessage}</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 4: MODE ── */}
                    {step === 4 && (
                      <div className={styles.stepSpace}>
                        <div className={styles.stepHead}><Laptop className={styles.iconPurple}/><h1 className={styles.stepH1}>Choose Assistant Mode</h1></div>
                        <p className={styles.stepP}>Choose the primary style for your Wingman AI. You can switch modes instantly at any time from the HUD overlay.</p>
                        <div className={styles.modeStack}>
                          {[
                            { id:'code' as Mode, icon:'💻', name:'Code Assistant (Default & Recommended)', sub:'Designed for coding interviews or solving technical programming questions. Returns direct, concise, production-ready code with no fluff.', dot:styles.dotBlue, active:styles.modeActiveBlue },
                            { id:'general' as Mode, icon:'🌟', name:'General Assistant', sub:'Designed for general meetings, summaries, or daily tasks. Returns direct, concise, conversational replies in a single brief paragraph.', dot:styles.dotPurple, active:styles.modeActivePurple },
                          ].map(m => (
                            <div key={m.id}
                              className={`${styles.modeCard} ${mode===m.id ? m.active : styles.modeOff}`}
                              onClick={() => setMode(m.id)}
                            >
                              <div className={styles.modeTop}>
                                <span className={styles.modeTitle}>{m.icon} {m.name}</span>
                                {mode===m.id && <div className={m.dot}/>}
                              </div>
                              <p className={styles.modeSub}>{m.sub}</p>
                            </div>
                          ))}
                        </div>
                        {mode==='code' && (
                          <motion.div className={styles.field}
                            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                          >
                            <label className={styles.fieldLabel}>Default Coding Language</label>
                            <select value={codingLanguage} onChange={e=>setCodingLanguage(e.target.value)} className={styles.select}>
                              {['Auto-Detect','Python','JavaScript','TypeScript','Java','C','C++','Go','Rust'].map(l=>(
                                <option key={l} value={l}>{l}</option>
                              ))}
                            </select>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* ── STEP 5: SHORTCUTS ── */}
                    {step === 5 && (
                      <div className={styles.stepSpace}>
                        <div className={styles.stepHead}><Command className={styles.iconWhite}/><h1 className={styles.stepH1}>Master the Shortcuts</h1></div>
                        <p className={styles.stepP}>CorvusX sits silently in the background. Memorize these 9 global shortcuts to activate and use it in stealth mode:</p>
                        <div className={styles.scList}>
                          {[
                            { label:'Show / Center Overlay', sub:'Center overlay window on active workspace.', keys:['⌘/Ctrl','Shift','Space'] },
                            { label:'Stealth Show / Hide', sub:'Silently toggle window visibility.', keys:['⌘/Ctrl','B'] },
                            { label:'Screenshot Analysis', sub:'Capture current screen and analyze immediately.', keys:['⌘/Ctrl','H'] },
                            { label:'Reset & Clear Context', sub:'Start a completely fresh chat session.', keys:['⌘/Ctrl','O'] },
                            { label:'Clear UI Clutter', sub:'Clear chat and audio results from UI (retains context).', keys:['⌘/Ctrl','U'] },
                            { label:'Copy Latest Response', sub:'Copy latest text response to clipboard.', keys:['⌘/Ctrl','Alt','C'] },
                            { label:'Toggle Voice Recording', sub:'Start or stop voice input recording globally.', keys:['⌘/Ctrl','Shift','V'] },
                            { label:'Ghost Keyboard Mode', sub:'Passively mirror global keystrokes into the overlay's chat input.', keys:['⌘/Ctrl','Alt','X'] },
                            { label:'Ghost Writer (Simulate Typing)', sub:'Simulate typing the latest response character-by-character.', keys:['⌘/Ctrl','Alt','K'] },
                          ].map((sc,i) => (
                            <div key={i} className={styles.scItem}>
                              <div className={styles.scLeft}>
                                <span className={styles.scLabel}>{sc.label}</span>
                                <span className={styles.scSub}>{sc.sub}</span>
                              </div>
                              <div className={styles.scKeys}>
                                {sc.keys.map(k=><kbd key={k} className={styles.kbdWiz}>{k}</kbd>)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 6: READY ── */}
                    {step === 6 && (
                      <div className={styles.stepSpaceCenter}>
                        <div className={styles.readyCircle}><Check className={styles.readyCheck}/></div>
                        <h1 className={styles.stepH1}>You're Ready to Go!</h1>
                        <p className={styles.stepPCenter}>All settings have been successfully configured. CorvusX will now sit silently in the background. Press <kbd className={styles.kbdWiz}>⌘/Ctrl+B</kbd> at any time to toggle the overlay.</p>
                        <div className={styles.readyBox}>
                          <div className={styles.readyLine}>🎯 <strong>Initial Mode:</strong> {mode==='code'?'Code Assistant':'General Assistant'}</div>
                          <div className={styles.readyLine}>📡 <strong>Provider:</strong> {provider==='gemini'?'Google Gemini':'OmniKey'}</div>
                          <div className={styles.readyLine}>🎨 <strong>Theme:</strong> Dark Backdrop ({Math.round(opacity*100)}% Opacity)</div>
                          <div className={styles.readyMuted}>Settings saved in config.json</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer nav */}
              <div className={styles.wizardFooter}>
                {step>1 ? (
                  <button className={styles.backBtn} onClick={handleBack}><ArrowLeft size={13}/> Back</button>
                ) : <div/>}
                {step<6 ? (
                  <button className={styles.nextBtn} onClick={handleNext} disabled={step===3&&!hasTestedSuccessfully}>
                    Next <ArrowRight size={13}/>
                  </button>
                ) : (
                  <button className={styles.launchBtn} onClick={handleNext}>Launch CorvusX</button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ══════════════════ HUD PHASE ══════════════════ */
          <motion.div key="hud"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:16 }} transition={{ duration:0.3 }}
          >
            <div className={styles.hudShell}>
              {/* Command bar */}
              <div className={styles.hudBar}>
                <div className={styles.hudLeft}>
                  <div className={styles.hudLogo}>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" width="13" height="13">
                      <defs><linearGradient id="hg" x1="0" y1="0" x2="24" y2="24"><stop stopColor="#22d3ee"/><stop offset="1" stopColor="#a78bfa"/></linearGradient></defs>
                      <path stroke="url(#hg)" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <span className={styles.hudMode}>{mode==='code'?'💻 Code':'🌟 General'}</span>
                </div>
                <div className={styles.hudTabs}>
                  {(['screenshot','voice','ghost'] as HudTab[]).map(t => (
                    <button key={t}
                      className={`${styles.hudTab} ${hudTab===t?styles.hudTabActive:''}`}
                      onClick={() => setHudTab(t)}
                    >
                      {t==='screenshot'?'📸 Screenshot':t==='voice'?'🎤 Voice':'👻 Ghost'}
                    </button>
                  ))}
                </div>
                <div className={styles.hudRight}>
                  <button className={styles.hudIconBtn} title="Settings"><Settings size={12}/></button>
                  <button className={styles.hudRestartBtn} onClick={restartDemo} title="Restart">↺</button>
                </div>
              </div>

              <div className={styles.hudContent}>
                {/* ── Screenshot tab ── */}
                {hudTab==='screenshot' && (
                  <div className={styles.tabContent}>
                    {/* Mini mock IDE */}
                    <div className={styles.mockIde}>
                      {scanActive && (
                        <motion.div className={styles.scanLine}
                          initial={{ top:0, opacity:1 }} animate={{ top:'100%', opacity:0 }}
                          transition={{ duration:1.4, ease:'linear' }}
                        />
                      )}
                      <div className={styles.ideBar}>
                        <span className={styles.ideDot} style={{background:'#ff5f57'}}/>
                        <span className={styles.ideDot} style={{background:'#ffbd2e'}}/>
                        <span className={styles.ideDot} style={{background:'#28ca41'}}/>
                        <span className={styles.ideTitle}>interview_problem.py — VS Code</span>
                      </div>
                      <pre className={styles.ideCode}>{`# LeetCode #1 — Two Sum
def twoSum(nums, target):
    # Your solution here…
    pass`}</pre>
                      <AnimatePresence>
                        {hudVisible && (
                          <motion.div className={styles.hudPip}
                            initial={{opacity:0,scale:0.85,y:6}} animate={{opacity:1,scale:1,y:0}}
                            exit={{opacity:0,scale:0.85}} transition={{duration:0.22}}
                          >
                            <span className={styles.pipDot}/> CorvusX analyzing…
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button className={styles.captureBtn} onClick={triggerCapture} disabled={scanActive}>
                      {scanActive ? '⏳ Capturing…' : '📸 Simulate Ctrl+H — Screenshot & Analyze'}
                    </button>

                    {/* Chat thread — mirrors Queue.tsx */}
                    <AnimatePresence>
                      {(chatMessages.length>0||chatLoading) && (
                        <motion.div className={styles.chatWrap}
                          initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.28}}
                        >
                          <div className={styles.chatBubbles}>
                            {chatMessages.map((msg,i) => (
                              <div key={i} className={`${styles.chatRow} ${msg.role==='user'?styles.chatRowUser:styles.chatRowGemini}`}>
                                <div className={`${styles.bubble} ${msg.role==='user'?styles.bubbleUser:styles.bubbleGemini}`}>
                                  {msg.role==='gemini'
                                    ? <MarkdownBlock text={msg.text} light={msg.role==='user'}/>
                                    : <span className={styles.bubblePlainText}>{msg.text}</span>
                                  }
                                </div>
                              </div>
                            ))}
                            {chatLoading && (
                              <div className={styles.chatRowGemini}>
                                <div className={`${styles.bubble} ${styles.bubbleGemini}`}>
                                  <span className={styles.dots}><span/><span/><span/></span>
                                  <span className={styles.dotsText}>gemini-2.5-flash is replying…</span>
                                </div>
                              </div>
                            )}
                            <div ref={chatEndRef}/>
                          </div>
                          <form className={styles.chatForm} onSubmit={e=>{e.preventDefault();sendChat()}}>
                            <input
                              className={styles.chatInput}
                              placeholder="Type your message…"
                              value={chatInput}
                              onChange={e=>setChatInput(e.target.value)}
                              disabled={chatLoading}
                            />
                            <button type="submit" className={styles.chatSend} disabled={chatLoading||!chatInput.trim()}>
                              <Send size={13}/>
                            </button>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── Voice tab ── */}
                {hudTab==='voice' && (
                  <div className={styles.tabContent}>
                    <div className={styles.voiceRow}>
                      <button className={`${styles.voiceBtn} ${isRecording?styles.voiceBtnRec:''}`} onClick={triggerVoice}>
                        {isRecording?<MicOff size={14}/>:<Mic size={14}/>}
                        {isRecording?'Stop Recording (Ctrl+Shift+V)':'Start Voice Recording (Ctrl+Shift+V)'}
                      </button>
                      {isRecording && (
                        <motion.div className={styles.recBadge}
                          animate={{opacity:[1,0.3,1]}} transition={{repeat:Infinity,duration:1}}
                        >
                          <span className={styles.recDot}/> REC
                        </motion.div>
                      )}
                    </div>
                    <AnimatePresence>
                      {(audioLoading||audioResult) && (
                        <motion.div className={styles.audioWrap}
                          initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.28}}
                        >
                          <div className={styles.audioHeader}>
                            <span className={styles.audioTitle}>🎤 Voice Input Status</span>
                            {audioResult&&!audioLoading && (
                              <button className={styles.audioClose} onClick={()=>setAudioResult(null)}>✕ Close</button>
                            )}
                          </div>
                          {audioLoading ? (
                            <div className={styles.audioLoading}>
                              <span className={styles.dots}><span/><span/><span/></span>
                              <span className={styles.audioLoadingText}>Processing voice recording &amp; transcribing request…</span>
                            </div>
                          ) : audioResult ? (
                            <div className={styles.audioResult}>
                              <MarkdownBlock text={audioResult}/>
                            </div>
                          ) : null}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── Ghost tab ── */}
                {hudTab==='ghost' && (
                  <div className={styles.tabContent}>
                    <div className={styles.ghostInfo}>
                      <p className={styles.ghostP}><strong>Ghost Writer</strong> — <kbd className={styles.kbdWiz}>Ctrl+Alt+K</kbd> types the latest AI response character-by-character into any active window with smart auto-indentation to prevent IDE formatting conflicts.</p>
                      <p className={styles.ghostP}><strong>Ghost Keyboard</strong> — <kbd className={styles.kbdWiz}>Ctrl+Alt+X</kbd> silently mirrors every keystroke you type in other windows directly into CorvusX's chat input via <code className={styles.inlineCode}>uIOhook</code>.</p>
                    </div>
                    <div className={`${styles.ghostPreview} ${isGhostActive?styles.ghostPreviewActive:''}`}>
                      <div className={styles.ideBar}>
                        <span className={styles.ideDot} style={{background:'#ff5f57'}}/>
                        <span className={styles.ideDot} style={{background:'#ffbd2e'}}/>
                        <span className={styles.ideDot} style={{background:'#28ca41'}}/>
                        <span className={styles.ideTitle}>LeetCode Submit — Active Window</span>
                      </div>
                      <pre className={styles.ghostCode}>{ghostText}<span className={styles.cursor}>|</span></pre>
                    </div>
                    <button className={styles.ghostBtn} onClick={startGhostTyping} disabled={ghostTyping}>
                      {ghostTyping ? '⌨️ Typing into active window…' : '▶ Simulate Ghost Writer (Ctrl+Alt+K)'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
