import { useState } from 'react'
import { Badge } from './Sidebar.jsx'
import { stageBadgeClass, stageLabel, fmt, addDays, getFuDates, copyToClipboard } from '../lib/utils.js'
import { getMsg, getNextAction, getQuoteKey } from '../lib/messages.js'
import { STAGES, QUAL_CHECKS } from '../lib/constants.js'

const TABS = [
  { id:'action',   label:'Next Action' },
  { id:'messages', label:'Messages' },
  { id:'followup', label:'Follow-Up' },
  { id:'info',     label:'Info' },
]

export default function Detail({ lead, onUpdate, onEdit }) {
  const [tab, setTab] = useState('action')

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'14px 18px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:5, color:'var(--text)', letterSpacing:'-0.4px' }}>{lead.name}</div>
            <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', fontSize:11, color:'var(--t2)' }}>
              <span>{lead.location}</span><span>·</span><span>{lead.service}</span>
              <Badge cls={stageBadgeClass(lead)}>{stageLabel(lead)}</Badge>
              {lead.phone && <><span>·</span><span>{lead.phone}</span></>}
            </div>
          </div>
          <button onClick={onEdit} style={{ padding:'6px 12px', fontSize:12, background:'transparent', color:'var(--t2)', border:'1px solid var(--border2)', borderRadius:'var(--rs)', cursor:'pointer', flexShrink:0 }}>
            Edit
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'11px 14px', fontSize:10, fontWeight: tab===t.id ? 600 : 500,
            color: tab===t.id ? 'var(--teal)' : 'var(--t3)',
            border:'none', background:'none', cursor:'pointer',
            borderBottom: tab===t.id ? '2px solid var(--teal)' : '2px solid transparent',
            textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
        {tab === 'action'   && <ActionTab   lead={lead} onUpdate={onUpdate} />}
        {tab === 'messages' && <MessagesTab lead={lead} />}
        {tab === 'followup' && <FollowUpTab lead={lead} onUpdate={onUpdate} />}
        {tab === 'info'     && <InfoTab     lead={lead} onUpdate={onUpdate} />}
      </div>
    </div>
  )
}

// ── ACTION TAB ──
function ActionTab({ lead, onUpdate }) {
  if (lead.outcome) {
    return (
      <div>
        <OkBox title={`Closed — ${lead.outcome}`} sub="No further action needed." />
        {lead.outcome === 'Won' && <>
          <SecLabel>Post-install messages</SecLabel>
          <MsgBox msgKey="Post-Install-1" lead={lead} />
          <MsgBox msgKey="Post-Install-2" lead={lead} />
          <MsgBox msgKey="Post-Install-30" lead={lead} />
        </>}
      </div>
    )
  }

  const act = getNextAction(lead)
  const fu  = lead.fu_count || 0

  return (
    <div>
      <div style={{ background:'var(--blue-lt)', border:'1px solid var(--blue-md)', borderRadius:'var(--r)', padding:14, marginBottom:10, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background:'linear-gradient(180deg,#004aad,#00a79d)' }} />
        <div style={{ fontSize:9, fontWeight:600, color:'var(--teal)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:5 }}>Next action</div>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:4 }}>{act?.title}</div>
        {act?.desc && <div style={{ fontSize:11, color:'var(--t2)', lineHeight:1.6 }}>{act.desc}</div>}
      </div>

      {act?.mk && <>
        <SecLabel>Message to send</SecLabel>
        <MsgBox msgKey={act.mk} lead={lead} />
      </>}

      <SecLabel style={{ marginTop:4 }}>Move to stage</SecLabel>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
        {STAGES.map(s => (
          <button key={s} onClick={() => {
            const vals = { stage: s }
            if (s === 'Quotation' && !lead.quote_date) vals.quote_date = new Date().toISOString().split('T')[0]
            onUpdate(vals)
          }} style={{
            fontSize:11, padding:'4px 10px', borderRadius:20, cursor:'pointer',
            border: lead.stage === s ? '1px solid var(--blue-md)' : '1px solid var(--border2)',
            background: lead.stage === s ? 'var(--blue-lt)' : 'transparent',
            color: lead.stage === s ? '#4d9fff' : 'var(--t2)', fontWeight: lead.stage === s ? 500 : 400
          }}>{s}</button>
        ))}
      </div>

      {lead.stage === 'Follow-Up' && <>
        <SecLabel>Follow-ups sent</SecLabel>
        <FUCounter fu={fu} onChange={n => onUpdate({ fu_count: n })} />
        {fu >= 3 && <WarnBox>All 3 follow-ups sent. Mark outcome below.</WarnBox>}
      </>}

      <SecLabel>Mark outcome</SecLabel>
      <div style={{ display:'flex', gap:6, marginBottom:10 }}>
        {[['Won','var(--green)','#10b98135'],['Lost','var(--red)','#f43f5e35'],['Cold','var(--t2)','var(--border2)']].map(([o,c,bc]) => (
          <button key={o} onClick={() => onUpdate({ outcome: o })} style={{
            flex:1, padding:'8px', borderRadius:'var(--rs)', border:`1px solid ${bc}`,
            background:'transparent', color:c, fontSize:11, fontWeight:500, cursor:'pointer'
          }}>{o === 'Won' ? '✓ ' : ''}{o}</button>
        ))}
      </div>
    </div>
  )
}

// ── MESSAGES TAB ──
function MessagesTab({ lead }) {
  const qk = getQuoteKey(lead.use_case)
  const ql = { 'Quotation-A':'Template A — Residential Basic', 'Quotation-B':'Template B — Residential Large', 'Quotation-C':'Template C — Business / Office' }[qk]
  const list = [
    ['First Contact',   'First Contact auto-reply'],
    ['Qualification',   'Qualification re-engage'],
    [qk,                `Quote companion (${ql})`],
    ['Mahal',           '"Mahal" objection reply'],
    ['Follow-Up-1',     'Follow-Up 1 — Day 2–3'],
    ['Follow-Up-2',     'Follow-Up 2 — Day 5–7'],
    ['Follow-Up-3',     'Follow-Up 3 — Day 10–14'],
    ['Closing-DP',      'DP Request'],
    ['Closing-Confirm', 'Payment Confirmed'],
    ['Post-Install-1',  'Post-Install + Review Ask'],
    ['Post-Install-2',  'Review Follow-Up (24hr)'],
    ['Post-Install-30', '30-Day Check-In'],
  ]
  return (
    <div>
      {list.map(([key, label]) => (
        <div key={key}>
          <SecLabel>{label}</SecLabel>
          <MsgBox msgKey={key} lead={lead} />
        </div>
      ))}
    </div>
  )
}

// ── FOLLOWUP TAB ──
function FollowUpTab({ lead, onUpdate }) {
  const fu    = lead.fu_count || 0
  const dates = getFuDates(lead)
  return (
    <div>
      <SecLabel>Follow-ups sent</SecLabel>
      <FUCounter fu={fu} onChange={n => onUpdate({ fu_count: n })} />
      <p style={{ fontSize:11, color:'var(--t3)', marginBottom:12 }}>Click + after sending each follow-up</p>

      {dates ? (
        <>
          <SecLabel>Auto-calculated dates</SecLabel>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:10 }}>
            {[['Quote sent', lead.quote_date, false],['FU1 — Day 2', dates.fu1, fu<1],['FU2 — Day 5', dates.fu2, fu<2&&fu>=1],['FU3 — Day 10', dates.fu3, fu<3&&fu>=2]].map(([lbl,d,due]) => (
              <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:11, color:'var(--t2)' }}>{lbl}</span>
                <span style={{ fontSize:11, fontWeight:600, color: due ? 'var(--amber)' : 'var(--text)' }}>{fmt(d)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <WarnBox>No quote date set. Add it via Edit after sending the quote.</WarnBox>
      )}
      {fu >= 3 && !lead.outcome && <WarnBox>All 3 follow-ups sent. Go to Next Action to close this lead.</WarnBox>}
    </div>
  )
}

// ── INFO TAB ──
function InfoTab({ lead, onUpdate }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const fields = [
    ['Phone', lead.phone||'—'], ['Email', lead.email||'—'], ['Assignee', lead.assignee],
    ['Use case', lead.use_case||'—'], ['Quote', lead.quote_amount ? '₱'+Number(lead.quote_amount).toLocaleString() : '—'],
    ['DP', lead.dp_amount ? '₱'+Number(lead.dp_amount).toLocaleString() : '—'],
    ['Source', lead.source||'Facebook'], ['Created', fmt(lead.created_at)], ['Quote date', fmt(lead.quote_date)],
  ]
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
        {fields.map(([lbl, val]) => (
          <div key={lbl} style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:'var(--rs)', padding:'9px 11px' }}>
            <div style={{ fontSize:9, color:'var(--t3)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:4 }}>{lbl}</div>
            <div style={{ fontSize:12, color:'var(--text)' }}>{val}</div>
          </div>
        ))}
      </div>

      <SecLabel>Qualification checklist</SecLabel>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'4px 14px', marginBottom:10 }}>
        {QUAL_CHECKS.map((q, i) => {
          const checked = (lead.qual_checks || [])[i]
          return (
            <div key={i} onClick={() => {
              const qc = [...(lead.qual_checks || [false,false,false,false])]
              qc[i] = !qc[i]
              onUpdate({ qual_checks: qc })
            }} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', cursor:'pointer' }}>
              <div style={{ width:18, height:18, borderRadius:5, border: checked ? 'none' : '1.5px solid var(--border2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, background: checked ? 'linear-gradient(135deg,#004aad,#00a79d)' : 'var(--s2)', color:'#fff', marginTop:1 }}>
                {checked ? '✓' : ''}
              </div>
              <div style={{ fontSize:12, color: checked ? 'var(--t3)' : 'var(--text)', textDecoration: checked ? 'line-through' : 'none', lineHeight:1.5 }}>{q}</div>
            </div>
          )
        })}
      </div>

      <SecLabel>Notes</SecLabel>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        onBlur={() => onUpdate({ notes })}
        rows={4}
        style={{ width:'100%', marginBottom:8, padding:'8px 11px', fontSize:12, border:'1px solid var(--border2)', borderRadius:'var(--rs)', background:'var(--s2)', color:'var(--text)', resize:'vertical', lineHeight:1.5, outline:'none' }}
      />
    </div>
  )
}

// ── SHARED COMPONENTS ──
function MsgBox({ msgKey, lead }) {
  const [copied, setCopied] = useState(false)
  const text = getMsg(msgKey, lead)
  return (
    <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:'var(--rs)', padding:12, marginBottom:8 }}>
      <div style={{ fontSize:11, color:'var(--t2)', lineHeight:1.8, whiteSpace:'pre-wrap', wordBreak:'break-word', fontFamily:'JetBrains Mono,monospace' }}>{text}</div>
      <button onClick={async () => { await copyToClipboard(text); setCopied(true); setTimeout(() => setCopied(false), 2200) }}
        style={{ marginTop:9, padding:'5px 12px', background: copied ? 'var(--green-lt)' : 'var(--teal-lt)', color: copied ? 'var(--green)' : 'var(--teal)', border:`1px solid ${copied ? '#10b98135' : 'var(--teal-md)'}`, borderRadius:'var(--rs)', fontSize:11, fontWeight:500, cursor:'pointer' }}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function FUCounter({ fu, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', background:'var(--s2)', border:'1px solid var(--border)', borderRadius:'var(--rs)', overflow:'hidden', width:160, marginBottom:10 }}>
      <button onClick={() => onChange(Math.max(0, fu-1))} style={{ width:40, height:36, background:'var(--s3)', border:'none', fontSize:16, cursor:'pointer', color:'var(--t2)' }}>−</button>
      <div style={{ flex:1, textAlign:'center', fontSize:14, fontWeight:600, color:'var(--text)', borderLeft:'1px solid var(--border)', borderRight:'1px solid var(--border)' }}>FU{fu}/3</div>
      <button onClick={() => onChange(Math.min(3, fu+1))} style={{ width:40, height:36, background:'var(--s3)', border:'none', fontSize:16, cursor:'pointer', color:'var(--t2)' }}>+</button>
    </div>
  )
}

function SecLabel({ children, style = {} }) {
  return <div style={{ fontSize:9, fontWeight:600, color:'var(--t3)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:7, marginTop:2, ...style }}>{children}</div>
}

function WarnBox({ children }) {
  return <div style={{ background:'var(--amber-lt)', border:'1px solid #f59e0b28', borderRadius:'var(--rs)', padding:'10px 12px', marginBottom:10, fontSize:11, color:'var(--amber)', lineHeight:1.6 }}>{children}</div>
}

function OkBox({ title, sub }) {
  return (
    <div style={{ background:'var(--green-lt)', border:'1px solid #10b98128', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:10 }}>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--green)' }}>{title}</div>
      <div style={{ fontSize:11, color:'var(--green)', opacity:0.7, marginTop:2 }}>{sub}</div>
    </div>
  )
}
