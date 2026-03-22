import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase.js'
import { isDueToday, today } from './lib/utils.js'
import Sidebar from './components/Sidebar.jsx'
import Detail from './components/Detail.jsx'
import AIPanel from './components/AIPanel.jsx'
import Modal from './components/Modal.jsx'

export default function App() {
  const [leads, setLeads]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [cid, setCid]           = useState(null)
  const [modal, setModal]       = useState(null) // null | 'new' | 'edit' | 'paste'
  const [dark, setDark]         = useState(() => localStorage.getItem('tc_theme') === 'dark')

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('tc_theme', dark ? 'dark' : 'light')
  }, [dark])

  // Fetch leads from Supabase
  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('id', { ascending: false })
    if (!error) setLeads(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // CRUD helpers
  const createLead = async (values) => {
    const { data, error } = await supabase.from('leads').insert([values]).select().single()
    if (!error && data) {
      setLeads(prev => [data, ...prev])
      setCid(data.id)
    }
    return { data, error }
  }

  const updateLead = async (id, values) => {
    const { data, error } = await supabase.from('leads').update(values).eq('id', id).select().single()
    if (!error && data) setLeads(prev => prev.map(l => l.id === id ? data : l))
    return { data, error }
  }

  const deleteLead = async (id) => {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== id))
      if (cid === id) setCid(null)
    }
  }

  const currentLead = leads.find(l => l.id === cid) || null

  // Stats
  const active   = leads.filter(l => !l.outcome)
  const due      = active.filter(isDueToday)
  const won      = leads.filter(l => l.outcome === 'Won')
  const pipeline = active.reduce((s, l) => s + (Number(l.quote_amount) || 0), 0)

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr 356px', gridTemplateRows:'52px 1fr', height:'100vh' }}>
      {/* TOPBAR */}
      <div style={{
        gridColumn:'1/-1', background:'var(--surface)', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', padding:'0 16px', gap:'10px', zIndex:20
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
          <img src="/logo.png" alt="TechCare" style={{ width:30, height:30, objectFit:'contain' }} />
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', letterSpacing:'-0.3px' }}>
              <span style={{ background:'linear-gradient(135deg,#004aad,#00a79d)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>TechCare</span> Pipeline
            </div>
            <div style={{ fontSize:10, color:'var(--t3)' }}>Reliable Service, Exceptional Support</div>
          </div>
        </div>
        <div style={{ width:1, height:18, background:'var(--border2)', margin:'0 2px' }} />
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <Btn ghost onClick={() => setDark(d => !d)} title="Toggle theme">{dark ? '☀' : '☾'}</Btn>
          <Btn ghost onClick={() => setModal('new')}>+ Manual</Btn>
          <Btn onClick={() => setModal('paste')}>+ From FB Message</Btn>
        </div>
      </div>

      {/* SIDEBAR */}
      <Sidebar
        leads={leads}
        cid={cid}
        onSelect={setCid}
        stats={{ due: due.length, active: active.length, pipeline, won: won.length }}
      />

      {/* MAIN */}
      <div style={{ gridRow:2, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg)' }}>
        {loading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', fontSize:12 }}>
            Loading leads...
          </div>
        ) : !currentLead ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--t3)', gap:8, fontSize:12, textAlign:'center' }}>
            <div style={{ fontSize:32, opacity:0.3, marginBottom:6 }}>◈</div>
            <div>Select a lead to get started</div>
            <div style={{ fontSize:11, maxWidth:200, lineHeight:1.5 }}>
              or tap <span style={{ color:'var(--teal)' }}>+ From FB Message</span> to create one fast
            </div>
          </div>
        ) : (
          <Detail
            lead={currentLead}
            onUpdate={(vals) => updateLead(currentLead.id, vals)}
            onEdit={() => setModal('edit')}
          />
        )}
      </div>

      {/* AI PANEL */}
      <AIPanel lead={currentLead} />

      {/* MODAL */}
      {modal && (
        <Modal
          mode={modal}
          lead={modal === 'edit' ? currentLead : null}
          onSave={async (vals) => {
            if (modal === 'edit') {
              await updateLead(currentLead.id, vals)
            } else {
              await createLead({ ...vals, created_at: today() })
            }
            setModal(null)
          }}
          onDelete={async () => {
            if (currentLead) await deleteLead(currentLead.id)
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

// Small reusable button
export function Btn({ children, onClick, ghost, title, disabled, style = {} }) {
  const base = {
    border:'none', borderRadius:'var(--rs)', padding:'7px 14px', fontSize:12,
    fontWeight:500, cursor: disabled ? 'not-allowed' : 'pointer', transition:'opacity .15s',
    letterSpacing:'-0.1px', ...style
  }
  const themed = ghost
    ? { ...base, background:'transparent', color:'var(--t2)', border:'1px solid var(--border2)' }
    : { ...base, background:'linear-gradient(135deg,#004aad,#00a79d)', color:'#fff', boxShadow:'var(--glow-blue)' }
  return <button style={themed} onClick={onClick} title={title} disabled={disabled}>{children}</button>
}
