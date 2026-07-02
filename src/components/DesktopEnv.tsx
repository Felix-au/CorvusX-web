import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './DesktopEnv.module.css'
import DemoWizard from './DemoWizard'

type DemoStep = 'idle' | 'onboarding' | 'hud' | 'awaitEnter' | 'result' | 'ghosting' | 'done'

const BLOCKED_PATTERNS = [
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /WebSocket\s*\(/,
  /document\.cookie/,
  /localStorage/,
  /sessionStorage/,
  /window\.open\s*\(/,
  /window\.location/,
  /import\s*\(/,
]

const TEST_CASES = [
  { label: 'twoSum([2,7,11,15], 9)', expected: '[0,1]', call: 'JSON.stringify(twoSum([2,7,11,15], 9))' },
  { label: 'twoSum([3,2,4], 6)', expected: '[1,2]', call: 'JSON.stringify(twoSum([3,2,4], 6))' },
  { label: 'twoSum([3,3], 6)', expected: '[0,1]', call: 'JSON.stringify(twoSum([3,3], 6))' },
  { label: 'twoSum([1,2,3,4], 5)', expected: '[0,3]', call: 'JSON.stringify(twoSum([1,2,3,4], 5))' },
]

function runInSandbox(code: string): Promise<string[]> {
  return new Promise(resolve => {
    for (const pat of BLOCKED_PATTERNS) {
      if (pat.test(code)) { resolve(['Blocked: restricted API']); return }
    }
    const testCode = TEST_CASES.map(tc =>
      `__results.push({ label: ${JSON.stringify(tc.label)}, expected: ${JSON.stringify(tc.expected)}, got: (function(){ try { return ${tc.call} } catch(e){ return 'ERR: '+e.message } })() });`
    ).join('\n')

    const encoded = btoa(unescape(encodeURIComponent(code)))
    const srcdoc = `<!DOCTYPE html><html><body><script>
      const __logs=[];const __results=[];
      const __push=(...a)=>__logs.push(a.map(x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch{return '[Obj]'}}).join(' '));
      console.log=__push;console.warn=(...a)=>__push('[warn]',...a);console.error=(...a)=>__push('[error]',...a);
      const __t=setTimeout(()=>parent.postMessage({type:'timeout'},'*'),4000);
      try{
        const __decoded = decodeURIComponent(escape(atob('${encoded}')));
        eval(__decoded);
        ${testCode}
        clearTimeout(__t);
        parent.postMessage({type:'done',logs:__logs,results:__results},'*');
      } catch(e) {
        clearTimeout(__t);
        parent.postMessage({type:'error',msg:e.message},'*');
      }
    <\/script></body></html>`

    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)

    const killer = setTimeout(() => { cleanup(); resolve(['Timed out (5s)']) }, 5000)
    function cleanup() { clearTimeout(killer); window.removeEventListener('message', onMsg); iframe.remove() }
    function onMsg(e: MessageEvent) {
      if (e.source !== iframe.contentWindow) return
      cleanup()
      if (e.data.type === 'done') {
        const lines: string[] = []
        if (e.data.logs?.length) lines.push(...e.data.logs)
        if (e.data.results?.length) {
          lines.push('--- Test Cases ---')
          for (const r of e.data.results) {
            const pass = r.got === r.expected
            lines.push(`${pass ? 'PASS' : 'FAIL'} ${r.label} => ${r.got}${pass ? '' : ` (expected ${r.expected})`}`)
          }
        }
        resolve(lines.length ? lines : ['(no output)'])
      } else if (e.data.type === 'error') resolve([`ERROR: ${e.data.msg}`])
      else resolve(['Timed out'])
    }
    window.addEventListener('message', onMsg)
    iframe.srcdoc = srcdoc
  })
}


const HINTS: Record<DemoStep, { text: string; keys: string[] } | null> = {
  idle: { text: 'Launch CorvusX', keys: ['Ctrl', 'B'] },
  onboarding: { text: 'Launch CorvusX', keys: ['Ctrl', 'B'] },
  hud: { text: 'Analyse the problem', keys: ['Ctrl', 'H'] },
  awaitEnter: { text: 'Send screenshot', keys: ['Enter', '↵'] },
  result: { text: 'Hide CorvusX', keys: ['Ctrl', 'B'] },
  ghosting: null,
  done: { text: 'Test your solution — click', keys: ['Run'] },
}

function Taskbar({ step }: { step: DemoStep }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
      setDate(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const hint = HINTS[step]

  return (
    <div className={styles.taskbar}>
      <button className={styles.startBtn} title="Start">
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
          <path d="M0 0h7.5v7.5H0V0zm8.5 0H16v7.5H8.5V0zM0 8.5h7.5V16H0V8.5zm8.5 0H16V16H8.5V8.5z" />
        </svg>
      </button>
      <div className={styles.searchBar}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
          <circle cx="9" cy="9" r="6" /><path d="M15 15l-3.5-3.5" />
        </svg>
        <span>Search</span>
      </div>
      <div className={styles.pinnedApps}>
        <div className={styles.taskbarApp} title="File Explorer">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M2 5a2 2 0 012-2h3.172a2 2 0 011.414.586l1.828 1.828A2 2 0 0011.828 6H16a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" /></svg>
        </div>
        <div className={`${styles.taskbarApp} ${styles.taskbarAppActive}`} title="Browser">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" /></svg>
          <div className={styles.taskbarAppDot} />
        </div>
        <div className={styles.taskbarApp} title="Terminal">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      {hint && step !== 'result' && step !== 'awaitEnter' && (
        <div className={styles.taskbarHint}>
          <span className={styles.taskbarHintIcon}>💡</span>
          <span className={styles.taskbarHintText}>{hint.text}</span>
          {hint.keys.length > 0 && <span className={styles.taskbarHintPlus}> — </span>}
          <div className={styles.taskbarHintKeys}>
            {hint.keys.map((k, i) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <kbd className={styles.taskbarHintKey}>{k}</kbd>
                {i < hint.keys.length - 1 && <span className={styles.taskbarHintPlus}>+</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      {step === 'awaitEnter' && (
        <div className={styles.taskbarHint}>
          <span className={styles.taskbarHintIcon}>📷</span>
          <span className={styles.taskbarHintText}>Screenshot captured! Press</span>
          <div className={styles.taskbarHintKeys}>
            <kbd className={styles.taskbarHintKey}>Enter ↵</kbd>
          </div>
          <span className={styles.taskbarHintText}>to send</span>
        </div>
      )}
      {step === 'result' && (
        <div className={styles.taskbarDualHint}>
          <div className={styles.taskbarHint}>
            <span className={styles.taskbarHintIcon}>👁️</span>
            <span className={styles.taskbarHintText}>Hide CorvusX</span>
            <span className={styles.taskbarHintPlus}> — </span>
            <div className={styles.taskbarHintKeys}>
              <kbd className={styles.taskbarHintKey}>Ctrl</kbd>
              <span className={styles.taskbarHintPlus}>+</span>
              <kbd className={styles.taskbarHintKey}>B</kbd>
            </div>
          </div>
          <span className={styles.taskbarDualSep}>then</span>
          <div className={styles.taskbarHint}>
            <span className={styles.taskbarHintIcon}>👻</span>
            <span className={styles.taskbarHintText}>Ghost Writer</span>
            <span className={styles.taskbarHintPlus}> — </span>
            <div className={styles.taskbarHintKeys}>
              <kbd className={styles.taskbarHintKey}>Ctrl</kbd>
              <span className={styles.taskbarHintPlus}>+</span>
              <kbd className={styles.taskbarHintKey}>Alt</kbd>
              <span className={styles.taskbarHintPlus}>+</span>
              <kbd className={styles.taskbarHintKey}>K</kbd>
            </div>
          </div>
        </div>
      )}

      <div className={styles.sysTray}>
        <div className={styles.trayIcons}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" opacity={0.6}><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" opacity={0.6}><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" /></svg>
        </div>
        <div className={styles.clock}>
          <div className={styles.clockTime}>{time}</div>
          <div className={styles.clockDate}>{date}</div>
        </div>
      </div>
    </div>
  )
}

const STUB_CODE = 'var twoSum = function(nums, target) {\n    // Write your solution here\n\n};\n'

// Solution typed by ghost writer — matches GHOST_CODE in DemoWizard
const GHOST_SOLUTION = `var twoSum = function(nums, target) {\n    var seen = {};\n    for (var i = 0; i < nums.length; i++) {\n        var complement = target - nums[i];\n        if (complement in seen) return [seen[complement], i];\n        seen[nums[i]] = i;\n    }\n};`

interface CodexPageProps {
  externalCode?: string | null
  ghostTypedCode?: string | null  // driven char-by-char by the typing simulator
  locked?: boolean                // disables textarea during ghost typing
  onRunComplete?: () => void
}

function CodexPage({ externalCode, ghostTypedCode, locked, onRunComplete }: CodexPageProps) {
  const [code, setCode] = useState(STUB_CODE)
  const [output, setOutput] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [ran, setRan] = useState(false)

  // externalCode: final complete code set at once (copy-paste path)
  useEffect(() => { if (externalCode != null) setCode(externalCode) }, [externalCode])
  // ghostTypedCode: driven char-by-char; takes priority when present
  useEffect(() => { if (ghostTypedCode != null) setCode(ghostTypedCode) }, [ghostTypedCode])

  const handleRun = async () => {
    setRunning(true); setRan(false); setOutput([])
    const result = await runInSandbox(code)
    setOutput(result); setRunning(false); setRan(true)
    onRunComplete?.()
  }

  return (
    <div className={styles.codexLayout}>
      <div className={styles.problemPanel}>
        <div className={styles.problemHeader}>
          <div className={styles.problemTitleRow}>
            <span className={styles.problemNum}>1.</span>
            <span className={styles.problemName}>Two Sum</span>
            <span className={styles.diffBadge} style={{ color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.07)' }}>Easy</span>
          </div>
          <div className={styles.problemStats}>
            <span className={styles.problemStat}><b>Acceptance:</b> 53.4%</span>
            <span className={styles.problemStat}><b>Submissions:</b> 15.2M</span>
          </div>
        </div>
        <div className={styles.problemTabs}>
          <button className={`${styles.problemTab} ${styles.problemTabActive}`}>Description</button>
        </div>
        <div className={styles.problemContent}>
          <p className={styles.descSmall}>
            Given an array of integers <code className={styles.inlineCode}>nums</code> and an integer <code className={styles.inlineCode}>target</code>, return <em>indices of the two numbers</em> such that they add up to target.
          </p>
          <p className={styles.descSmall}>You may assume each input has <strong>exactly one solution</strong>. You may not use the same element twice.</p>
          <div className={styles.example}>
            <div className={styles.exLabel}>Example 1</div>
            <div className={styles.exBody}>
              <div><span className={styles.exKey}>Input:&nbsp;</span><span className={styles.exVal}>nums = [2,7,11,15], target = 9</span></div>
              <div><span className={styles.exKey}>Output:&nbsp;</span><span className={styles.exVal}>[0,1]</span></div>
            </div>
          </div>
          <div className={styles.example}>
            <div className={styles.exLabel}>Example 2</div>
            <div className={styles.exBody}>
              <div><span className={styles.exKey}>Input:&nbsp;</span><span className={styles.exVal}>nums = [3,2,4], target = 6</span></div>
              <div><span className={styles.exKey}>Output:&nbsp;</span><span className={styles.exVal}>[1,2]</span></div>
            </div>
          </div>
          <div className={styles.constraints}>
            <div className={styles.constraintLabel}>Constraints</div>
            <ul className={styles.constraintList}>
              <li><code className={styles.inlineCode}>2 &lt;= nums.length &lt;= 10^4</code></li>
              <li><code className={styles.inlineCode}>-10^9 &lt;= nums[i] &lt;= 10^9</code></li>
              <li>Only one valid answer exists.</li>
            </ul>
          </div>
          <div className={styles.tags}>
            {['Array', 'Hash Table'].map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
          </div>
        </div>
      </div>
      <div className={styles.resizeHandle} />
      <div className={styles.editorPanel}>
        <div className={styles.editorToolbar}>
          <div className={styles.langTabs}>
            <button className={`${styles.langTab} ${styles.langTabActive}`}>JavaScript</button>
          </div>
          <div style={{ flex: 1 }} />
          <div className={styles.editorTools}>
            <button className={styles.editorTool} title="Settings">⚙</button>
            <button className={styles.editorTool} title="Fullscreen">⤢</button>
          </div>
        </div>
        <textarea
          className={`${styles.editorTextarea} ${locked ? styles.editorTextareaLocked : ''}`}
          value={code}
          onChange={locked ? undefined : e => setCode(e.target.value)}
          readOnly={locked}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        <div className={styles.outputPanel}>
          <span className={styles.testcaseLabel}>
            {running ? 'Running...' : ran ? 'Output' : 'Output'}
          </span>
          <div className={styles.outputLines}>
            {output.length === 0 && !ran && (
              <span className={styles.outputPlaceholder}>Press Run to execute your code</span>
            )}
            {output.map((line, i) => (
              <div key={i} className={`${styles.outputLine} ${line.startsWith('ERROR') || line.startsWith('Blocked') || line.startsWith('Timed') ? styles.outputLineError : line.startsWith('PASS') ? styles.outputLinePass : line.startsWith('FAIL') ? styles.outputLineError : ''}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.editorFooter}>
          <div style={{ flex: 1 }} />
          <button className={styles.runBtn} onClick={handleRun} disabled={running}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            {running ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface BrowserWindowProps {
  ghostCode: string | null
  ghostTypedCode: string | null
  editorLocked: boolean
  onRunComplete: () => void
}

function BrowserWindow({ ghostCode, ghostTypedCode, editorLocked, onRunComplete }: BrowserWindowProps) {
  return (
    <div className={styles.browser}>
      <div className={styles.browserTitleBar}>
        <div className={styles.winControls}>
          <span className={styles.winBtn} style={{ background: '#ff5f57' }} />
          <span className={styles.winBtn} style={{ background: '#febc2e' }} />
          <span className={styles.winBtn} style={{ background: '#28c840' }} />
        </div>
        <div className={styles.tabStrip}>
          <div className={styles.browserTab}>
            <span className={styles.tabFavicon}>⚡</span>
            <span className={styles.tabTitle}>Two Sum - Codex</span>
            <button className={styles.tabClose}>x</button>
          </div>
          <button className={styles.newTabBtn} title="New tab">+</button>
        </div>
      </div>
      <div className={styles.pageContent}>
        <CodexPage
          externalCode={ghostCode}
          ghostTypedCode={ghostTypedCode}
          locked={editorLocked}
          onRunComplete={onRunComplete}
        />
      </div>
    </div>
  )
}

function DesktopIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <div className={styles.desktopIcon}>
      <span className={styles.desktopIconEmoji}>{icon}</span>
      <span className={styles.desktopIconLabel}>{label}</span>
    </div>
  )
}

export default function DesktopEnv() {
  const [demoStep, setDemoStep] = useState<DemoStep>('idle')
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [ghostCode, setGhostCode] = useState<string | null>(null)
  // Typing simulator state — drives CodexPage char-by-char
  const [ghostTypedCode, setGhostTypedCode] = useState<string | null>(null)
  const [editorLocked, setEditorLocked] = useState(false)
  const [externalTrigger, setExternalTrigger] = useState<'screenshot' | 'ghost' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const isVisibleRef = useRef(false)
  const demoStepRef = useRef<DemoStep>('idle')
  const typingCancelRef = useRef(false)
  useEffect(() => { demoStepRef.current = demoStep }, [demoStep])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisibleRef.current) return
    const ctrl = e.ctrlKey || e.metaKey
    const alt = e.altKey
    const step = demoStepRef.current

    if (ctrl && !alt && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      setOverlayVisible(v => {
        const next = !v
        if (next && step === 'idle') setDemoStep('onboarding')
        return next
      })
    }

    if (ctrl && !alt && e.key.toLowerCase() === 'h' && (step === 'hud' || step === 'result' || step === 'awaitEnter')) {
      e.preventDefault()
      setOverlayVisible(true)
      setExternalTrigger(null)
      requestAnimationFrame(() => setExternalTrigger('screenshot'))
      if (step === 'hud') setDemoStep('awaitEnter')
    }

    if (ctrl && alt && e.key.toLowerCase() === 'k' && (step === 'result' || step === 'awaitEnter')) {
      e.preventDefault()
      setOverlayVisible(false)
      setDemoStep('ghosting')
      // Run the async typing simulator via ref (handler has [] deps so uses ref)
      setTimeout(() => runGhostTypingRef.current?.(), 100)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Disable scroll-snap while overlay is open so Enter / form-submit
  // cannot snap the page to the next section.
  useEffect(() => {
    const html = document.documentElement
    if (overlayVisible) {
      html.classList.remove('scroll-snap')
    } else {
      // Only restore if the app originally had scroll-snap enabled
      html.classList.add('scroll-snap')
    }
    return () => html.classList.add('scroll-snap')
  }, [overlayVisible])

  useEffect(() => {
    if (!externalTrigger) return
    const t = setTimeout(() => setExternalTrigger(null), 300)
    return () => clearTimeout(t)
  }, [externalTrigger])

  // Ref so stable handleKeyDown can call the async typing simulator
  const runGhostTypingRef = useRef<(() => void) | null>(null)

  // ── Human-like async typing simulator — mirrors TypingSimulator.ts ──────────
  const runGhostTyping = useCallback(async (code: string) => {
    typingCancelRef.current = false
    setEditorLocked(true)
    setGhostTypedCode('')   // clear editor
    await new Promise(r => setTimeout(r, 80))  // brief pause before typing

    let typed = ''
    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

    for (const char of code) {
      if (typingCancelRef.current) break

      const isLetter = /^[a-zA-Z]$/.test(char)
      if (isLetter && Math.random() < 0.07) {
        // Simulate a typo: type wrong char, pause, backspace, type correct
        const letters = 'abcdefghijklmnopqrstuvwxyz'
        let typo = letters[Math.floor(Math.random() * letters.length)]
        if (typo === char.toLowerCase()) typo = typo === 'a' ? 'b' : 'a'
        if (char === char.toUpperCase()) typo = typo.toUpperCase()
        typed += typo
        setGhostTypedCode(typed)
        await sleep(Math.floor(Math.random() * 15) + 10)
        typed = typed.slice(0, -1)  // backspace
        setGhostTypedCode(typed)
        await sleep(Math.floor(Math.random() * 10) + 8)
      }

      typed += char
      setGhostTypedCode(typed)
      // Fast typist: 8–20ms per keystroke
      await sleep(Math.floor(Math.random() * 12) + 8)
    }

    if (!typingCancelRef.current) {
      setGhostCode(code)   // finalize
      setDemoStep('done')
    }
    setEditorLocked(false)
  }, [])

  const handleGhostComplete = useCallback((code: string) => {
    // Called from DemoWizard's ghost panel (not used in main typing path)
    setGhostCode(code)
    setDemoStep('done')
  }, [])

  const handleCopyCode = useCallback(() => {
    setDemoStep('result')
  }, [])

  // Stable callback references — MUST use useCallback so DemoWizard's
  // useEffect([phase, onPhaseChange]) doesn't re-fire on every render
  // and reset demoStep back to 'hud'.
  const handlePhaseChange = useCallback((phase: 'onboarding' | 'hud') => {
    if (phase === 'hud') setDemoStep('hud')
    else if (phase === 'onboarding') {
      setDemoStep('onboarding')
      setGhostCode(null)
      setGhostTypedCode(null)
    }
  }, [])

  // Wire the ghost typing ref to the async simulator
  useEffect(() => {
    runGhostTypingRef.current = () => runGhostTyping(GHOST_SOLUTION)
  }, [runGhostTyping])

  return (
    <>
      <div className={styles.desktop} ref={rootRef}>
        <div className={styles.wallpaper} />
        <div className={styles.desktopIcons}>
          <DesktopIcon icon="&#128465;&#65039;" label="Recycle Bin" />
          <DesktopIcon icon="&#128187;" label="This PC" />
          <DesktopIcon icon="&#9889;" label="Codex" />
        </div>
        {/* Arrival badge — dismiss on Ctrl+B */}

        <div className={styles.windowWrapper}>
          <BrowserWindow
            ghostCode={ghostCode}
            ghostTypedCode={ghostTypedCode}
            editorLocked={editorLocked}
            onRunComplete={() => setDemoStep('done')}
          />
          <div className={`${styles.overlayContainer} ${overlayVisible ? styles.overlayVisible : styles.overlayHidden}`}>
            <DemoWizard
              onPhaseChange={handlePhaseChange}
              onGhostComplete={handleGhostComplete}
              externalTrigger={externalTrigger}
              onCopyCode={handleCopyCode}
              onAwaitEnter={() => setDemoStep('awaitEnter')}
              onResultReady={() => setDemoStep('result')}
            />
          </div>
        </div>
        <Taskbar step={demoStep} />
      </div>
    </>
  )
}

