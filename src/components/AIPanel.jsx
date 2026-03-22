import { useState, useRef } from 'react'
import { TONES } from '../lib/constants.js'
import { copyToClipboard } from '../lib/utils.js'

export default function AIPanel({ lead }) {
  const [history, setHistory]           = useState([])
  const [customerMsg, setCustomerMsg]   = useState('')
  const [selTone, setSelTone]           = useState('short')
  const [customInst, setCustomInst]     = useState('')
  const [generating, setGenerating]     = useState(false)
  const [chatInput, setChatInput]       = useState('')
  const [warn, setWarn]                 = useState(null)      // { text, toneId, toneName }
  const [warnDismissed, setWarnDismissed] = useState(false)
  const detectTimer                     = useRef(null)
  const lastChecked                     = useRef('')
  const chatRef                         = useRef(null)

  const scrollChat = () => setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = 99999 }, 50)

  function buildSysPrompt() {
    const tone = TONES.find(t => t.id === selTone)
    const tp   = selTone === 'custom' ? (customInst || 'Write a helpful, natural reply.') : tone.p
    return `You are a sales assistant for TechCare IT Solutions, a BIR-registered IT services business in the Philippines (Castillejos, Zambales) specializing in Starlink, networking, CCTV, and IT support.

Your job: write or refine Facebook Messenger replies on behalf of TechCare.

Voice rules:
- Natural Taglish (Filipino + English the way Filipinos actually message on FB)
- Warm but confident — never pushy, never desperate
- Honest and practical. Emoji: 1–3 max, only where natural
- Never start with "Magandang araw po" or other generic openers
- Sign off as "— TechCare IT Solutions" only on longer replies

Lead context:
- Name: ${lead?.name || 'Unknown'}
- Location: ${lead?.location || 'Unknown'}
- Service: ${lead?.service || 'Unknown'}
- Use case: ${lead?.use_case || 'not specified'}
- Stage: ${lead?.stage || 'Unknown'}
- Notes: ${lead?.notes || 'none'}
- Quote: ${lead?.quote_amount ? '₱' + Number(lead.quote_amount).toLocaleString() : 'not quoted yet'}

TechCare selling points (weave in naturally, only when relevant):
- BIR registered, physical office in Castillejos, Zambales
- After-sales support halos 24/7
- Remote setup assistance via call/video call
- Starlink Gen 3: ₱35,000
- On-site installation available (separate charge, depends on location)

Tone guidance: ${tp}

Use this as a guide, but use your judgment based on the actual message. Reply with ONLY the message text — no preamble, no labels. When asked to refine, follow the instruction exactly.`
  }

  async function runDetect(msg) {
    if (warnDismissed || !msg || msg === lastChecked.current) return
    lastChecked.current = msg
    const TONE_DEFS = TONES.filter(t => t.id !== 'custom').map(t => `- ${t.id}: ${t.name} (${t.sub})`).join('\n')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 120,
          system: `You analyze Facebook messages sent to TechCare IT Solutions and determine the best reply tone.\n\nAvailable tones:\n${TONE_DEFS}\n\nRespond with ONLY a valid JSON object:\n{"toneId":"<id>","reason":"<1 sentence starting with This looks like>"}`,
          messages: [{ role: 'user', content: `Customer message: "${msg}"\n\nBest tone?` }]
        })
      })
      const data = await res.json()
      const raw  = data.content?.[0]?.text || '{}'
      let det = {}
      try { det = JSON.parse(raw.replace(/```json|```/g,'').trim()) } catch {}
      if (!det.toneId || det.toneId === selTone) { setWarn(null); return }
      const match = TONES.find(t => t.id === det.toneId)
      if (match) setWarn({ text: det.reason, toneId: det.toneId, toneName: match.name, preview: msg.slice(0,55) + (msg.length > 55 ? '...' : '') })
    } catch {}
  }

  function onMsgChange(val) {
    setCustomerMsg(val)
    setWarn(null)
    clearTimeout(detectTimer.current)
    if (val.trim()) detectTimer.current = setTimeout(() => runDetect(val.trim()), 800)
  }

  function onToneChange(id) {
    setSelTone(id)
    if (warn && warn.toneId === id) setWarn(null)
  }

  async function callClaude(messages) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, system: buildSysPrompt(), messages })
    })
    const data = await res.json()
    return data.content?.[0]?.text || 'Error — could not generate. Try again.'
  }

  async function generate() {
    if (!customerMsg.trim()) return
    const tone = TONES.find(t => t.id === selTone)
    setGenerating(true)
    setHistory([])
    const userMsg = `Customer message:\n"${customerMsg}"\n\nWrite the TechCare reply.`
    const newHistory = [{ role:'user', content: userMsg }]
    const thinking = { role:'ai', text:'Writing reply...', thinking:true, id: Date.now() }
    setHistory([{ role:'user', text:`Customer: "${customerMsg}"\nTone: ${tone.name}` }, thinking])
    scrollChat()
    try {
      const reply = await callClaude(newHistory)
      newHistory.push({ role:'assistant', content: reply })
      setHistory([{ role:'user', text:`Customer: "${customerMsg}"\nTone: ${tone.name}` }, { role:'ai', text: reply, id: Date.now() }])
      setHistory(h => {
        const updated = [...h]
        updated._apiHistory = newHistory
        return updated
      })
    } catch {
      setHistory(h => h.map(m => m.thinking ? { ...m, text:'Error. Try again.', thinking:false } : m))
    }
    setGenerating(false)
    scrollChat()
  }

  // Store API history separately
  const [apiHistory, setApiHistory] = useState([])
  async function generate2() {
    if (!customerMsg.trim()) return
    const tone = TONES.find(t => t.id === selTone)
    setGenerating(true)
    setApiHistory([])
    const userMsg = `Customer message:\n"${customerMsg}"\n\nWrite the TechCare reply.`
    const newApiHist = [{ role:'user', content: userMsg }]
    const chatEntries = [
      { role:'user', text:`Customer: "${customerMsg}"\nTone: ${tone.name}`, id: Date.now() },
      { role:'ai', text:'Writing reply...', thinking:true, id: Date.now()+1 }
    ]
    setHistory(chatEntries)
    scrollChat()
    try {
      const reply = await callClaude(newApiHist)
      newApiHist.push({ role:'assistant', content: reply })
      setApiHistory(newApiHist)
      setHistory([
        { role:'user', text:`Customer: "${customerMsg}"\nTone: ${tone.name}`, id: chatEntries[0].id },
        { role:'ai', text: reply, id: chatEntries[1].id }
      ])
    } catch {
      setHistory(h => h.map(m => m.thinking ? { ...m, text:'Error connecting. Try again.', thinking:false } : m))
    }
    setGenerating(false)
    scrollChat()
  }

  async function sendChat() {
    const txt = chatInput.trim()
    if (!txt || !apiHistory.length) return
    setChatInput('')
    setGenerating(true)
    const newApiHist = [...apiHistory, { role:'user', content: txt }]
    const thinking   = { role:'ai', text:'Thinking...', thinking:true, id: Date.now()+1 }
    setHistory(h => [...h, { role:'user', text: txt, id: Date.now() }, thinking])
    scrollChat()
    try {
      const reply = await callClaude(newApiHist)
      newApiHist.push({ role:'assistant', content: reply })
      setApiHistory(newApiHist)
      setHistory(h => h.map(m => m.thinking ? { ...m, text: reply, thinking:false } : m))
    } catch {
      setHistory(h => h.map(m => m.thinking ? { ...m, text:'Error. Try again.', thinking:false } : m))
    }
    setGenerating(false)
    scrollChat()
  }

  function reset() {
    setHistory([]); setApiHistory([]); setCustomerMsg(''); setWarn(null)
    setWarnDismissed(false); lastChecked.current = ''
  }

  if (!lead) {
    return (
      <div style={{ gridRow:2, borderLeft:'1px solid var(--border)', background:'var(--surface)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, fontWeight:600 }}>AI Reply Generator</span>
          <span style={{ fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'var(--teal-lt)', color:'var(--teal)', border:'1px solid var(--teal-md)', letterSpacing:'0.04em' }}>Claude</span>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:12, gap:5, textAlign:'center', padding:20 }}>
          <div style={{ fontSize:28, marginBottom:6 }}>🤖</div>
          <div>Select a lead first</div>
          <div style={{ fontSize:11, marginTop:3 }}>Claude will use their context to write replies</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ gridRow:2, borderLeft:'1px solid var(--border)', background:'var(--surface)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <span style={{ fontSize:12, fontWeight:600 }}>AI Reply Generator</span>
        <span style={{ fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'var(--teal-lt)', color:'var(--teal)', border:'1px solid var(--teal-md)', letterSpacing:'0.04em' }}>Claude</span>
        {history.length > 0 && <button onClick={reset} style={{ marginLeft:'auto', fontSize:10, color:'var(--t3)', background:'none', border:'none', cursor:'pointer' }}>Clear</button>}
      </div>

      {/* Setup area */}
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ fontSize:9, fontWeight:600, color:'var(--t3)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:5 }}>Customer's message</div>
        <textarea
          value={customerMsg}
          onChange={e => onMsgChange(e.target.value)}
          placeholder={`Paste what the customer sent to ${lead.name}...`}
          style={{ width:'100%', padding:'9px 10px', fontSize:12, border:'1px solid var(--border2)', borderRadius:'var(--rs)', background:'var(--s2)', color:'var(--text)', resize:'none', height:62, lineHeight:1.6, outline:'none' }}
        />

        {/* Tone conflict warning */}
        {warn && !warnDismissed && (
          <div style={{ background:'#f59e0b0e', border:'1px solid #f59e0b25', borderRadius:'var(--rs)', padding:'10px 12px', marginTop:8 }}>
            <div style={{ fontSize:11, color:'#f59e0bcc', lineHeight:1.5, marginBottom:5 }}>"{warn.preview}" — {warn.text}</div>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--amber)', marginBottom:7 }}>Recommended tone: {warn.toneName}</div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => { onToneChange(warn.toneId); setWarn(null); setWarnDismissed(true); setTimeout(()=>setWarnDismissed(false),6000) }}
                style={{ fontSize:10, padding:'4px 10px', borderRadius:20, background:'var(--amber)', color:'#000', border:'none', cursor:'pointer', fontWeight:600 }}>
                Switch to "{warn.toneName}"
              </button>
              <button onClick={() => { setWarn(null); setWarnDismissed(true); setTimeout(()=>setWarnDismissed(false),10000) }}
                style={{ fontSize:10, padding:'4px 10px', borderRadius:20, background:'transparent', color:'var(--t2)', border:'1px solid var(--border2)', cursor:'pointer' }}>
                Keep my selection
              </button>
            </div>
          </div>
        )}

        {/* Tone grid */}
        <div style={{ fontSize:9, fontWeight:600, color:'var(--t3)', letterSpacing:'.08em', textTransform:'uppercase', margin:'10px 0 6px' }}>Reply tone</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, marginBottom:8 }}>
          {TONES.map(t => (
            <button key={t.id} onClick={() => onToneChange(t.id)} style={{
              padding:'7px 8px', borderRadius:'var(--rs)', textAlign:'left', lineHeight:1.3, cursor:'pointer',
              border: selTone===t.id ? '1px solid var(--blue-md)' : '1px solid var(--border2)',
              background: selTone===t.id ? 'var(--blue-lt)' : 'var(--s2)',
              color: selTone===t.id ? '#4d9fff' : 'var(--t2)'
            }}>
              <span style={{ display:'block', fontSize:10, fontWeight: selTone===t.id ? 500 : 400, marginBottom:1 }}>{t.name}</span>
              <span style={{ fontSize:9, opacity:.65 }}>{t.sub}</span>
            </button>
          ))}
        </div>
        {selTone === 'custom' && (
          <textarea value={customInst} onChange={e => setCustomInst(e.target.value)}
            placeholder="Your instruction..." rows={2}
            style={{ width:'100%', padding:'8px 10px', fontSize:12, border:'1px solid var(--border2)', borderRadius:'var(--rs)', background:'var(--s2)', color:'var(--text)', resize:'none', marginBottom:8, outline:'none' }} />
        )}
        <button onClick={generate2} disabled={generating || !customerMsg.trim()}
          style={{ width:'100%', padding:9, background:'linear-gradient(135deg,#004aad,#00a79d)', color:'#fff', border:'none', borderRadius:'var(--rs)', fontSize:12, fontWeight:500, cursor: generating ? 'not-allowed' : 'pointer', opacity: !customerMsg.trim() ? 0.5 : 1 }}>
          {generating ? 'Generating...' : 'Generate Reply'}
        </button>
      </div>

      {/* Chat */}
      <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        {history.length === 0 && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:11, textAlign:'center', padding:20 }}>
            Generated replies will appear here.<br/>Use the chat below to refine.
          </div>
        )}
        {history.map((m, i) => (
          <ChatBubble key={m.id || i} msg={m} />
        ))}
      </div>

      {/* Chat input */}
      {apiHistory.length > 0 && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'10px 12px', display:'flex', gap:8, alignItems:'flex-end', flexShrink:0, background:'var(--surface)' }}>
          <textarea
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendChat() } }}
            placeholder="Refine... e.g. make it shorter, add bank details, more formal"
            rows={1}
            style={{ flex:1, padding:'8px 12px', fontSize:12, border:'1px solid var(--border2)', borderRadius:20, background:'var(--s2)', color:'var(--text)', outline:'none', resize:'none', lineHeight:1.5, minHeight:36, maxHeight:100 }}
          />
          <button onClick={sendChat} disabled={generating || !chatInput.trim()}
            style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#004aad,#00a79d)', border:'none', cursor: generating ? 'not-allowed' : 'pointer', color:'#fff', fontSize:13, flexShrink:0 }}>
            ▶
          </button>
        </div>
      )}
    </div>
  )
}

function ChatBubble({ msg }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        padding:'9px 12px', borderRadius:10, fontSize:12, lineHeight:1.75, wordBreak:'break-word', whiteSpace:'pre-wrap', maxWidth:'92%',
        background: isUser ? 'linear-gradient(135deg,#004aad,#00a79d)' : 'var(--s2)',
        color: isUser ? '#fff' : 'var(--text)',
        border: isUser ? 'none' : '1px solid var(--border)',
        borderBottomRightRadius: isUser ? 3 : 10,
        borderBottomLeftRadius:  isUser ? 10 : 3,
        opacity: msg.thinking ? 0.5 : 1,
        animation: msg.thinking ? 'pulse 1.4s infinite' : 'none',
      }}>
        {msg.text}
      </div>
      {!isUser && !msg.thinking && (
        <button onClick={async () => { await copyToClipboard(msg.text); setCopied(true); setTimeout(()=>setCopied(false),2200) }}
          style={{ fontSize:10, fontWeight:500, padding:'3px 10px', borderRadius:20, cursor:'pointer', alignSelf:'flex-start', marginTop:2,
            background: copied ? 'var(--green-lt)' : 'var(--teal-lt)',
            color:      copied ? 'var(--green)'    : 'var(--teal)',
            border:     copied ? '1px solid #10b98135' : '1px solid var(--teal-md)' }}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
    </div>
  )
}
