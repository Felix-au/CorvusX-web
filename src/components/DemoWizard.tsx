/**
 * DemoWizard.tsx
 *
 * A TWO-PHASE interactive demo that exactly mirrors the real CorvusX app UI:
 *
 * Phase 1 (Steps 1-6): Pixel-perfect replica of OnboardingWizard.tsx
 * Phase 2 (Step 7+):   Replica of the main Queue HUD — screenshot analysis,
 *                       voice input, and ghost writer
 *
 * All styles directly map to the app's CSS classes (liquid-glass, chat-container,
 * bg-white/10, border-white/15, etc.) which are replicated in DemoWizard.module.css
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sparkles,
  Laptop,
  Key,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Command,
  Eye,
  EyeOff,
  Palette,
  Mic,
  MicOff,
  Settings,
  ChevronRight,
  Send
} from 'lucide-react'
import styles from './DemoWizard.module.css'

type Phase = 'onboarding' | 'hud'
type Provider = 'gemini' | 'omnikey'
type Mode = 'code' | 'general'
type HudTab = 'screenshot' | 'voice' | 'ghost'

// ─── Ghost typing sample content ──────────────────────────────────────────────
const GHOST_CODE = `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i`

// ─── Simulated AI chat exchange ───────────────────────────────────────────────
const DEMO_CHAT: { role: 'user' | 'gemini'; text: string }[] = [
  { role: 'user',   text: 'Sent screenshots' },
  { role: 'gemini', text: '```python\ndef twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n```\n\nO(n) time · O(n) space · HashMap approach.' },
]

export default function DemoWizard() {
  // ── Phase state ──────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('onboarding')

  // ── Onboarding state (mirrors OnboardingWizard.tsx exactly) ─────────────────
  const [step, setStep] = useState(1)
  const [opacity, setOpacity] = useState(0.25)
  const [provider, setProvider] = useState<Provider>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [mode, setMode] = useState<Mode>('code')
  const [codingLanguage, setCodingLanguage] = useState('Auto-Detect')
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasTestedSuccessfully, setHasTestedSuccessfully] = useState(false)

  // ── HUD state (mirrors Queue.tsx) ────────────────────────────────────────────
  const [hudTab, setHudTab] = useState<HudTab>('screenshot')
  const [chatMessages, setChatMessages] = useState<typeof DEMO_CHAT>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioResult, setAudioResult] = useState<string | null>(null)
  const [ghostText, setGhostText] = useState('')
  const [ghostTyping, setGhostTyping] = useState(false)
  const [isGhostActive, setIsGhostActive] = useState(false)
  const ghostRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [scanActive, setScanActive] = useState(false)
  const [hudVisible, setHudVisible] = useState(false)

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  useEffect(() => () => { if (ghostRef.current) clearInterval(ghostRef.current) }, [])

  // ── Onboarding helpers ───────────────────────────────────────────────────────
  const simulateTest = useCallback(() => {
    if (!apiKey.trim()) {
      setTestStatus('error')
      setErrorMessage('API Key cannot be empty.')
      return
    }
    setIsTesting(true)
    setTestStatus('idle')
    setTimeout(() => {
      setIsTesting(false)
      setTestStatus('success')
      setHasTestedSuccessfully(true)
    }, 1400)
  }, [apiKey])

  const handleNext = () => {
    if (step === 3 && !hasTestedSuccessfully) return
    if (step < 6) setStep(s => s + 1)
    else { setPhase('hud'); setStep(1) }
  }
  const handleBack = () => { if (step > 1) setStep(s => s - 1) }

  // ── HUD helpers ──────────────────────────────────────────────────────────────
  const triggerCapture = () => {
    if (scanActive) return
    setScanActive(true)
    setHudVisible(false)
    setChatMessages([])
    setTimeout(() => {
      setScanActive(false)
      setHudVisible(true)
      setChatLoading(true)
      setTimeout(() => {
        setChatMessages(DEMO_CHAT)
        setChatLoading(false)
      }, 1200)
    }, 1300)
  }

  const triggerVoice = () => {
    if (isRecording) {
      setIsRecording(false)
      setAudioLoading(true)
      setTimeout(() => {
        setAudioLoading(false)
        setAudioResult('"Tell me about a time you handled a difficult bug in production."\n\n**CorvusX:** At my previous role, a memory leak in our Node.js backend caused cascading failures during peak hours. I used clinic.js to profile the heap, traced it to unclosed DB connections in our ORM, and patched it with proper connection pooling — restoring stability within 40 minutes.')
      }, 1600)
    } else {
      setIsRecording(true)
      setAudioResult(null)
    }
  }

  const startGhostTyping = useCallback(() => {
    if (ghostTyping) return
    setGhostText('')
    setGhostTyping(true)
    setIsGhostActive(true)
    let idx = 0
    ghostRef.current = setInterval(() => {
      idx++
      setGhostText(GHOST_CODE.slice(0, idx))
      if (idx >= GHOST_CODE.length) {
        clearInterval(ghostRef.current!)
        setGhostTyping(false)
        setTimeout(() => setIsGhostActive(false), 800)
      }
    }, 22)
  }, [ghostTyping])

  const sendChat = () => {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'gemini', text: "I'll analyze that for you. Based on your question, here's a concise answer optimized for clarity." }])
      setChatLoading(false)
    }, 1000)
  }

  // ── The outer wrapper (floating overlay on blurred desktop) ──────────────────
  return (
    <div className={styles.demoShell}>
      {/* Blurred desktop background mock */}
      <div className={styles.desktopBg}>
        <div className={styles.desktopMockIde}>
          <div className={styles.ideTopbar}>
            <span className={styles.ideDot} style={{ background: '#ff5f57' }} />
            <span className={styles.ideDot} style={{ background: '#ffbd2e' }} />
            <span className={styles.ideDot} style={{ background: '#28ca41' }} />
            <span className={styles.ideTabText}>interview_problem.py — VS Code</span>
          </div>
          <div className={styles.ideBody}>
            <pre className={styles.ideCode}>{`# LeetCode #1 — Two Sum
# Given an array of integers nums and an integer target,
# return indices of the two numbers that add up to target.

def twoSum(nums: list[int], target: int) -> list[int]:
    # Your solution here...
    pass


# Example:
# Input: nums = [2,7,11,15], target = 9
# Output: [0,1]`}</pre>
          </div>
        </div>
      </div>

      {/* ── CorvusX Overlay (the actual app window floating on top) ── */}
      <div className={styles.overlayWrapper}>
        <AnimatePresence mode="wait">
          {phase === 'onboarding' ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <OnboardingPhase
                step={step}
                opacity={opacity} setOpacity={setOpacity}
                provider={provider} setProvider={(p) => { setProvider(p); setHasTestedSuccessfully(false); setTestStatus('idle') }}
                apiKey={apiKey} setApiKey={(k) => { setApiKey(k); setHasTestedSuccessfully(false); setTestStatus('idle') }}
                showApiKey={showApiKey} setShowApiKey={setShowApiKey}
                mode={mode} setMode={setMode}
                codingLanguage={codingLanguage} setCodingLanguage={setCodingLanguage}
                isTesting={isTesting}
                testStatus={testStatus}
                errorMessage={errorMessage}
                hasTestedSuccessfully={hasTestedSuccessfully}
                onTest={simulateTest}
                onNext={handleNext}
                onBack={handleBack}
              />
            </motion.div>
          ) : (
            <motion.div
              key="hud"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35 }}
            >
              <HudPhase
                hudTab={hudTab}
                setHudTab={setHudTab}
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                chatLoading={chatLoading}
                isRecording={isRecording}
                audioLoading={audioLoading}
                audioResult={audioResult}
                setAudioResult={setAudioResult}
                ghostText={ghostText}
                ghostTyping={ghostTyping}
                isGhostActive={isGhostActive}
                scanActive={scanActive}
                hudVisible={hudVisible}
                mode={mode}
                onCapture={triggerCapture}
                onVoice={triggerVoice}
                onGhostType={startGhostTyping}
                onSendChat={sendChat}
                onRestart={() => { setPhase('onboarding'); setStep(1); setChatMessages([]); setAudioResult(null); setGhostText(''); setScanActive(false); setHudVisible(false) }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phase label */}
      <div className={styles.phaseLabel}>
        {phase === 'onboarding'
          ? `Setup Wizard · Step ${step} of 6`
          : 'Live HUD — Screenshot · Voice · Ghost Writer'}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING PHASE — mirrors OnboardingWizard.tsx exactly
// ═══════════════════════════════════════════════════════════════════════════════

interface OnboardingPhaseProps {
  step: number
  opacity: number; setOpacity: (v: number) => void
  provider: Provider; setProvider: (v: Provider) => void
  apiKey: string; setApiKey: (v: string) => void
  showApiKey: boolean; setShowApiKey: (v: boolean) => void
  mode: Mode; setMode: (v: Mode) => void
  codingLanguage: string; setCodingLanguage: (v: string) => void
  isTesting: boolean
  testStatus: 'idle' | 'success' | 'error'
  errorMessage: string
  hasTestedSuccessfully: boolean
  onTest: () => void
  onNext: () => void
  onBack: () => void
}

function OnboardingPhase(p: OnboardingPhaseProps) {
  const { step, opacity, setOpacity, provider, setProvider, apiKey, setApiKey,
    showApiKey, setShowApiKey, mode, setMode, codingLanguage, setCodingLanguage,
    isTesting, testStatus, errorMessage, hasTestedSuccessfully,
    onTest, onNext, onBack } = p

  return (
    <div className={styles.wizardCard}>
      {/* Decorative glows (matches app) */}
      <div className={styles.glowTR} />
      <div className={styles.glowBL} />

      {/* Progress Header */}
      <div className={styles.wizardHeader}>
        <span className={styles.wizardLabel}>CorvusX Setup • Step {step} of 6</span>
        <div className={styles.progressDots}>
          {[1,2,3,4,5,6].map(i => (
            <div
              key={i}
              className={`${styles.progressDot} ${
                i === step ? styles.dotActive : i < step ? styles.dotDone : styles.dotPending
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className={styles.wizardBody}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            {/* ─── STEP 1: APPEARANCE ─── */}
            {step === 1 && (
              <div className={styles.stepSpace}>
                <div className={styles.stepHeadRow}>
                  <Palette className={styles.iconPink} />
                  <h1 className={styles.stepH1}>Customize Appearance</h1>
                </div>
                <p className={styles.stepP}>
                  Adjust the window styling to ensure all text remains highly readable against your desktop background. Changes apply live below.
                </p>
                <div className={styles.dividerTop}>
                  {/* Theme card */}
                  <div className={styles.labelRow}>
                    <label className={styles.fieldLabel}>Background Theme</label>
                  </div>
                  <div className={styles.themeCard}>
                    <span className={styles.themeCardTitle}>🌙 Dark Backdrop (Default)</span>
                    <span className={styles.themeCardSub}>Translucent blackish background optimized for stealth HUD integration.</span>
                  </div>
                  {/* Opacity slider */}
                  <div className={styles.opacityRow}>
                    <div className={styles.opacityLabel}>
                      <span className={styles.fieldLabel}>Backdrop Opacity</span>
                      <span className={styles.opacityValue}>{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0.05" max="1.00" step="0.05"
                      value={opacity}
                      onChange={e => setOpacity(parseFloat(e.target.value))}
                      className={styles.opacitySlider}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 2: WELCOME ─── */}
            {step === 2 && (
              <div className={styles.stepSpace}>
                <div className={styles.stepHeadRow}>
                  <Sparkles className={`${styles.iconYellow} ${styles.animPulse}`} />
                  <h1 className={styles.stepH1}>Welcome to CorvusX</h1>
                </div>
                <p className={styles.stepP}>
                  Intelligence in the shadows. A premium, always-on-top overlay providing real-time cognitive reasoning, screen analysis, and meeting insights.
                </p>
                <div className={styles.dividerTop}>
                  <div className={styles.featureRow}>
                    <div className={styles.featureIconBox}><span className={styles.featureEmoji}>🕵️</span></div>
                    <div>
                      <h3 className={styles.featureTitle}>Stealth HUD Overlay</h3>
                      <p className={styles.featureSub}>Sits silently above all your apps, invisibly, and helps you.</p>
                    </div>
                  </div>
                  <div className={styles.featureRow}>
                    <div className={styles.featureIconBox}><span className={styles.featureEmoji}>🔍</span></div>
                    <div>
                      <h3 className={styles.featureTitle}>Multimodal Intelligence</h3>
                      <p className={styles.featureSub}>Instantly extracts problems from screenshots or processes voice transcription clips.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 3: PROVIDER & API KEY ─── */}
            {step === 3 && (
              <div className={styles.stepSpace}>
                <div className={styles.stepHeadRow}>
                  <Key className={styles.iconBlue} />
                  <h1 className={styles.stepH1}>Configure AI Provider</h1>
                </div>

                {/* Provider grid */}
                <div className={styles.fieldBlock}>
                  <label className={styles.fieldLabel}>Select Provider</label>
                  <div className={styles.providerGrid}>
                    {/* Gemini */}
                    <button
                      className={`${styles.providerBtn} ${provider === 'gemini' ? styles.providerBtnActiveBlue : styles.providerBtnInactive}`}
                      onClick={() => setProvider('gemini')}
                    >
                      <span className={styles.providerBtnTitle}>☁️ Google Gemini</span>
                      <span className={styles.providerBtnSub}>Direct cloud connection via Google AI Studio.</span>
                    </button>
                    {/* OmniKey */}
                    <button
                      className={`${styles.providerBtn} ${provider === 'omnikey' ? styles.providerBtnActivePurple : styles.providerBtnInactive}`}
                      onClick={() => setProvider('omnikey')}
                    >
                      <span className={styles.providerBtnTitle}>🔑 OmniKey Proxy</span>
                      <span className={styles.providerBtnSub}>Reverse LLM proxy created by felix-au.</span>
                    </button>
                  </div>
                </div>

                {/* API Key */}
                <div className={styles.fieldBlock}>
                  <div className={styles.keyLabelRow}>
                    <label className={styles.fieldLabel}>API Key</label>
                    <a href="#" className={styles.keyLink}>
                      {provider === 'gemini' ? 'Get free Gemini API Key →' : 'Get free OmniKey Key →'}
                    </a>
                  </div>
                  <div className={styles.keyInputWrap}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder={provider === 'gemini' ? 'Enter Gemini Key (starts with AIzaSy...)' : 'Enter OmniKey Key'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className={styles.keyInput}
                    />
                    <button className={styles.eyeBtn} onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Test button + status */}
                <div className={styles.testRow}>
                  <button
                    className={styles.testBtn}
                    onClick={onTest}
                    disabled={isTesting || !apiKey.trim()}
                  >
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </button>
                  <div className={styles.testStatus}>
                    {testStatus === 'success' && (
                      <span className={styles.testSuccess}><Check size={14} /> Connected Successfully!</span>
                    )}
                    {testStatus === 'error' && (
                      <span className={styles.testError}><AlertTriangle size={14} /> {errorMessage}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 4: MODE ─── */}
            {step === 4 && (
              <div className={styles.stepSpace}>
                <div className={styles.stepHeadRow}>
                  <Laptop className={styles.iconPurple} />
                  <h1 className={styles.stepH1}>Choose Assistant Mode</h1>
                </div>
                <p className={styles.stepP}>Choose the primary style for your Wingman AI. You can switch modes instantly at any time from the HUD overlay.</p>

                <div className={styles.modeStack}>
                  {/* Code */}
                  <div
                    className={`${styles.modeCard} ${mode === 'code' ? styles.modeCardActiveBlue : styles.modeCardInactive}`}
                    onClick={() => setMode('code')}
                  >
                    <div className={styles.modeCardTop}>
                      <span className={styles.modeCardTitle}>💻 Code Assistant (Default & Recommended)</span>
                      {mode === 'code' && <div className={styles.modeDotBlue} />}
                    </div>
                    <p className={styles.modeCardSub}>Designed for coding interviews or solving technical programming questions. Returns direct, concise, production-ready code with no fluff.</p>
                  </div>
                  {/* General */}
                  <div
                    className={`${styles.modeCard} ${mode === 'general' ? styles.modeCardActivePurple : styles.modeCardInactive}`}
                    onClick={() => setMode('general')}
                  >
                    <div className={styles.modeCardTop}>
                      <span className={styles.modeCardTitle}>🌟 General Assistant</span>
                      {mode === 'general' && <div className={styles.modeDotPurple} />}
                    </div>
                    <p className={styles.modeCardSub}>Designed for general meetings, summaries, or daily tasks. Returns direct, concise, conversational replies in a single brief paragraph.</p>
                  </div>
                </div>

                {mode === 'code' && (
                  <motion.div
                    className={styles.langBlock}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className={styles.fieldLabel}>Default Coding Language</label>
                    <select
                      value={codingLanguage}
                      onChange={e => setCodingLanguage(e.target.value)}
                      className={styles.langSelect}
                    >
                      {['Auto-Detect','Python','JavaScript','TypeScript','Java','C','C++','Go','Rust'].map(l => (
                        <option key={l} value={l} className={styles.langOption}>{l}</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </div>
            )}

            {/* ─── STEP 5: SHORTCUTS ─── */}
            {step === 5 && (
              <div className={styles.stepSpace}>
                <div className={styles.stepHeadRow}>
                  <Command className={styles.iconWhite} />
                  <h1 className={styles.stepH1}>Master the Shortcuts</h1>
                </div>
                <p className={styles.stepP}>CorvusX sits silently in the background. Memorize these key global shortcuts to activate and use it in stealth mode:</p>

                <div className={styles.shortcutList}>
                  {[
                    { label: 'Show / Center Overlay', sub: 'Center overlay window on active workspace.', keys: ['⌘/Ctrl','Shift','Space'] },
                    { label: 'Stealth Show / Hide',   sub: 'Silently toggle window visibility.',        keys: ['⌘/Ctrl','B'] },
                    { label: 'Screenshot Analysis',   sub: 'Capture current screen and analyze immediately.', keys: ['⌘/Ctrl','H'] },
                    { label: 'Reset & Clear Context', sub: 'Start a completely fresh chat session.',    keys: ['⌘/Ctrl','O'] },
                    { label: 'Clear UI Clutter',      sub: 'Clear chat and audio results from UI (retains context).', keys: ['⌘/Ctrl','U'] },
                    { label: 'Copy Latest Response',  sub: 'Copy latest text response to clipboard.',  keys: ['⌘/Ctrl','Alt','C'] },
                    { label: 'Toggle Voice Recording',sub: 'Start or stop voice input recording globally.', keys: ['⌘/Ctrl','Shift','V'] },
                    { label: 'Ghost Keyboard Mode',   sub: 'Passively mirror global keystrokes typed in other windows directly into the overlay\'s chat input.', keys: ['⌘/Ctrl','Alt','X'] },
                    { label: 'Ghost Writer (Simulate Typing)', sub: 'Simulate typing the latest response character-by-character with smart auto-indentation handling.', keys: ['⌘/Ctrl','Alt','K'] },
                  ].map((sc, i) => (
                    <div key={i} className={styles.shortcutItem}>
                      <div className={styles.shortcutLeft}>
                        <span className={styles.shortcutLabel}>{sc.label}</span>
                        <span className={styles.shortcutSub}>{sc.sub}</span>
                      </div>
                      <div className={styles.shortcutKeys}>
                        {sc.keys.map(k => <kbd key={k} className={styles.kbdKey}>{k}</kbd>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── STEP 6: READY ─── */}
            {step === 6 && (
              <div className={styles.stepSpaceCenter}>
                <div className={styles.readyCheck}>
                  <Check className={styles.readyCheckIcon} />
                </div>
                <h1 className={styles.stepH1}>You're Ready to Go!</h1>
                <p className={styles.stepPCenter}>
                  All settings have been successfully configured. CorvusX will now sit silently in the background. Press <kbd className={styles.kbdInline}>⌘/Ctrl+B</kbd> at any time to toggle the overlay.
                </p>
                <div className={styles.readySummary}>
                  <div className={styles.readySummaryLine}>🎯 <strong>Initial Mode:</strong> {mode === 'code' ? 'Code Assistant' : 'General Assistant'}</div>
                  <div className={styles.readySummaryLine}>📡 <strong>Provider:</strong> {provider === 'gemini' ? 'Google Gemini' : 'OmniKey'}</div>
                  <div className={styles.readySummaryLine}>🎨 <strong>Theme:</strong> Dark Backdrop ({Math.round(opacity * 100)}% Opacity)</div>
                  <div className={styles.readySummaryMuted}>Settings saved in config.json</div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation — matches app exactly */}
      <div className={styles.wizardFooter}>
        {step > 1 ? (
          <button className={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </button>
        ) : <div />}

        {step < 6 ? (
          <button
            className={styles.nextBtn}
            onClick={onNext}
            disabled={step === 3 && !hasTestedSuccessfully}
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <button className={styles.launchBtn} onClick={onNext}>
            Launch CorvusX
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HUD PHASE — mirrors the Queue.tsx main overlay UI
// ═══════════════════════════════════════════════════════════════════════════════

interface HudPhaseProps {
  hudTab: HudTab; setHudTab: (t: HudTab) => void
  chatMessages: typeof DEMO_CHAT
  chatInput: string; setChatInput: (v: string) => void
  chatLoading: boolean
  isRecording: boolean
  audioLoading: boolean
  audioResult: string | null; setAudioResult: (v: string | null) => void
  ghostText: string
  ghostTyping: boolean
  isGhostActive: boolean
  scanActive: boolean
  hudVisible: boolean
  mode: Mode
  onCapture: () => void
  onVoice: () => void
  onGhostType: () => void
  onSendChat: () => void
  onRestart: () => void
}

function HudPhase({ hudTab, setHudTab, chatMessages, chatInput, setChatInput,
  chatLoading, isRecording, audioLoading, audioResult, setAudioResult,
  ghostText, ghostTyping, isGhostActive, scanActive, hudVisible,
  mode, onCapture, onVoice, onGhostType, onSendChat, onRestart }: HudPhaseProps) {

  return (
    <div className={styles.hudShell}>
      {/* ── Command bar (matches the QueueCommands component bar) ── */}
      <div className={styles.hudBar}>
        <div className={styles.hudBarLeft}>
          <div className={styles.hudLogoBox}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" width="14" height="14">
              <defs><linearGradient id="hg" x1="0" y1="0" x2="24" y2="24"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#a78bfa"/></linearGradient></defs>
              <path stroke="url(#hg)" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className={styles.hudModeBadge}>{mode === 'code' ? '💻 Code' : '🌟 General'}</span>
        </div>
        <div className={styles.hudBarTabs}>
          <button
            className={`${styles.hudBarTab} ${hudTab === 'screenshot' ? styles.hudBarTabActive : ''}`}
            onClick={() => setHudTab('screenshot')}
          >📸 Screenshot</button>
          <button
            className={`${styles.hudBarTab} ${hudTab === 'voice' ? styles.hudBarTabActive : ''}`}
            onClick={() => setHudTab('voice')}
          >🎤 Voice</button>
          <button
            className={`${styles.hudBarTab} ${hudTab === 'ghost' ? styles.hudBarTabActive : ''}`}
            onClick={() => setHudTab('ghost')}
          >👻 Ghost</button>
        </div>
        <div className={styles.hudBarRight}>
          <button className={styles.hudIconBtn} title="Settings"><Settings size={12} /></button>
          <button className={styles.hudRestartBtn} onClick={onRestart} title="Restart demo">↺</button>
        </div>
      </div>

      {/* ── Screenshot Tab ── */}
      {hudTab === 'screenshot' && (
        <div className={styles.hudContent}>
          {/* Mock desktop capture area */}
          <div className={styles.captureArea}>
            {scanActive && (
              <motion.div
                className={styles.scanLine}
                initial={{ top: 0, opacity: 1 }}
                animate={{ top: '100%', opacity: 0 }}
                transition={{ duration: 1.3, ease: 'linear' }}
              />
            )}
            <div className={styles.captureIde}>
              <div className={styles.captureIdeBar}>
                <span className={styles.captureIdeDot} style={{ background: '#ff5f57' }} />
                <span className={styles.captureIdeDot} style={{ background: '#ffbd2e' }} />
                <span className={styles.captureIdeDot} style={{ background: '#28ca41' }} />
                <span className={styles.captureIdeTitle}>interview_problem.py</span>
              </div>
              <pre className={styles.captureIdeCode}>{`# LeetCode #1 — Two Sum
def twoSum(nums, target):
    # Your solution here...
    pass`}</pre>
            </div>

            {/* CorvusX HUD mini overlay visible after capture */}
            <AnimatePresence>
              {hudVisible && (
                <motion.div
                  className={styles.captureHud}
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className={styles.captureHudDot} />
                  <span className={styles.captureHudText}>Analyzing with Gemini...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Capture trigger button */}
          <button
            className={styles.captureBtn}
            onClick={onCapture}
            disabled={scanActive}
          >
            {scanActive ? '⏳ Capturing...' : '📸 Simulate Ctrl+H — Screenshot & Analyze'}
          </button>

          {/* Chat thread — mirrors Queue.tsx chat container */}
          <AnimatePresence>
            {(chatMessages.length > 0 || chatLoading) && (
              <motion.div
                className={`${styles.chatContainer} ${isGhostActive ? styles.chatContainerGhost : ''}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.chatMessages}>
                  {chatMessages.length === 0 ? (
                    <div className={styles.chatEmpty}>
                      💬 Chat with ☁️ gemini-2.5-flash<br />
                      <span className={styles.chatEmptySub}>Take a screenshot (Ctrl+H) for automatic analysis</span>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={`${styles.chatRow} ${msg.role === 'user' ? styles.chatRowUser : styles.chatRowGemini}`}>
                        <div className={`${styles.chatBubble} ${msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleGemini}`}>
                          <pre className={styles.chatBubbleText}>{msg.text}</pre>
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className={styles.chatRowGemini}>
                      <div className={styles.chatBubbleGemini}>
                        <span className={styles.typingDots}>
                          <span />
                          <span />
                          <span />
                        </span>
                        <span className={styles.typingText}>gemini-2.5-flash is replying...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat input — mirrors Queue.tsx form */}
                <form className={styles.chatForm} onSubmit={e => { e.preventDefault(); onSendChat() }}>
                  <input
                    className={styles.chatInput}
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    className={styles.chatSendBtn}
                    disabled={chatLoading || !chatInput.trim()}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Voice Tab ── */}
      {hudTab === 'voice' && (
        <div className={styles.hudContent}>
          <div className={styles.voiceControls}>
            <button
              className={`${styles.voiceBtn} ${isRecording ? styles.voiceBtnActive : ''}`}
              onClick={onVoice}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              {isRecording ? 'Stop Recording (Ctrl+Shift+V)' : 'Start Voice Recording (Ctrl+Shift+V)'}
            </button>
            {isRecording && (
              <motion.div
                className={styles.recIndicator}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <span className={styles.recDot} /> REC
              </motion.div>
            )}
          </div>

          {/* Voice result card — mirrors Queue.tsx audio container */}
          <AnimatePresence>
            {(audioLoading || audioResult) && (
              <motion.div
                className={styles.audioContainer}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.audioHeader}>
                  <span className={styles.audioHeaderText}>🎤 Voice Input Status</span>
                  {audioResult && !audioLoading && (
                    <button className={styles.audioClose} onClick={() => setAudioResult(null)}>✕ Close</button>
                  )}
                </div>
                {audioLoading ? (
                  <div className={styles.audioLoading}>
                    <span className={styles.typingDots}>
                      <span /><span /><span />
                    </span>
                    <span className={styles.audioLoadingText}>Processing voice recording & transcribing request...</span>
                  </div>
                ) : (
                  <div className={styles.audioResult}>
                    <pre className={styles.audioResultText}>{audioResult}</pre>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Ghost Writer Tab ── */}
      {hudTab === 'ghost' && (
        <div className={styles.hudContent}>
          <div className={styles.ghostInfo}>
            <p className={styles.ghostInfoP}>
              <strong>Ghost Writer</strong> — Press <kbd className={styles.kbdInline}>Ctrl+Alt+K</kbd> to type the latest AI response character-by-character into any active window (IDE, browser, text field) with smart auto-indentation to prevent VSCode formatting conflicts.
            </p>
            <p className={styles.ghostInfoP}>
              <strong>Ghost Keyboard</strong> — Press <kbd className={styles.kbdInline}>Ctrl+Alt+X</kbd> to silently mirror every keystroke you type in any other window directly into CorvusX's chat input via uIOhook.
            </p>
          </div>

          {/* Ghost preview window — looks like a real IDE with typing */}
          <div className={styles.ghostPreview}>
            <div className={styles.ghostPreviewBar}>
              <span className={styles.captureIdeDot} style={{ background: '#ff5f57' }} />
              <span className={styles.captureIdeDot} style={{ background: '#ffbd2e' }} />
              <span className={styles.captureIdeDot} style={{ background: '#28ca41' }} />
              <span className={styles.ghostPreviewTitle}>LeetCode Submit — Active Window</span>
            </div>
            <div className={`${styles.ghostPreviewBody} ${isGhostActive ? styles.ghostPreviewBodyActive : ''}`}>
              <pre className={styles.ghostPreviewCode}>{ghostText}</pre>
              <span className={styles.ghostCursor}>|</span>
            </div>
          </div>

          <button
            className={styles.ghostTypeBtn}
            onClick={onGhostType}
            disabled={ghostTyping}
          >
            {ghostTyping
              ? '⌨️ Typing into active window…'
              : '▶ Simulate Ghost Writer (Ctrl+Alt+K)'}
          </button>
        </div>
      )}
    </div>
  )
}
