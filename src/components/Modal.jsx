import { useState } from 'react'
import { SERVICES, USE_CASES, EMPTY_LEAD } from '../lib/constants.js'

export default function Modal({ mode, lead, onSave, onDelete, onClose }) {
  const isEdit  = mode === 'edit'
  const isPaste = mode === 'paste'

  const [form, setForm] = useState(() => {
    if (isEdit && lead) return {
      name: lead.name||'', phone: lead.phone||'', email: lead.email||'',
      location: lead.location||'', use_case: lead.use_case||'Residential - Basic',
      service: lead.service||'Starlink', quote_amount: lead.quote_amount||'',
      dp_amount: lead.dp_amount||'', assignee: lead.assignee||'Noriel',
      quote_date: lead.quote_date||'', notes: lead.notes||''
    }
    return { ...EMPTY_LEAD, name:'', phone:'', email:'', location:'', quote_amount:'', dp_amount:'', quote_date:'', notes:'' }
  })
  const [pasteMsg, setPasteMsg]     = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted]   = useState(false)
  const [error, setError]           = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleExtract = async () => {
    if (!pasteMsg.trim()) return
    setExtracting(true); setError('')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: `Extract lead info from this customer Facebook message to TechCare IT Solutions (Starlink/networking/CCTV company in Philippines).
Return ONLY a valid JSON object, no markdown, no explanation:
{"name":"","phone":"","email":"","location":"","service":"Starlink|Networking|CCTV|CCTV + Networking|IT Support","use_case":"Residential - Basic|Residential - Large Home|Business / Office|Remote - Personal|Remote - Public/Shared","notes":""}
Rules: empty string if not found. service default=Starlink. use_case: bahay/home=Residential - Basic, malaki/2 floors=Residential - Large Home, negosyo/office=Business / Office, farm/bukid/remote=Remote - Personal.`,
          messages: [{ role: 'user', content: pasteMsg }]
        })
      })
      const data = await res.json()
      const raw  = data.content?.[0]?.text || '{}'
      let ex = {}
      try { ex = JSON.parse(raw.replace(/```json|```/g, '').trim()) } catch {}
      setForm(f => ({ ...f, ...ex }))
      setExtracted(true)
    } catch {
      setError('Error extracting. Check connection and try again.')
    }
    setExtracting(false)
  }

  const handleSave = () => {
    if (!form.name?.trim()) { setError('Name is required.'); return }
    if (!form.location?.trim()) { setError('Location is required.'); return }
    const vals = {
      ...form,
      quote_amount: form.quote_amount ? Number(form.quote_amount) : null,
      dp_amount:    form.dp_amount    ? Number(form.dp_amount)    : null,
      quote_date:   form.quote_date   || null,
    }
    if (!isEdit) {
      vals.stage         = 'First Contact'
      vals.fu_count      = 0
      vals.outcome       = null
      vals.qual_checks   = [false,false,false,false]
    }
    onSave(vals)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:'var(--r)', padding:22, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px #000000aa' }}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:16, color:'var(--text)' }}>
          {isPaste ? 'Create Lead from FB Message' : isEdit ? 'Edit Lead' : 'New Lead'}
        </div>

        {/* PASTE mode — extraction step */}
        {isPaste && !extracted && (
          <div style={{ background:'var(--blue-lt)', border:'1.5px dashed var(--blue-md)', borderRadius:'var(--r)', padding:14, marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:600, color:'var(--teal)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6 }}>Paste the customer's Facebook message</div>
            <textarea
              value={pasteMsg}
              onChange={e => setPasteMsg(e.target.value)}
              rows={5}
              placeholder="e.g. Hello po, magkano ang Starlink? Para sa bahay namin sa San Antonio, Zambales..."
              style={{ width:'100%', padding:'9px 10px', fontSize:12, border:'1px solid var(--blue-md)', borderRadius:'var(--rs)', background:'var(--s3)', color:'var(--text)', resize:'vertical', lineHeight:1.6, outline:'none' }}
            />
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
              <button onClick={handleExtract} disabled={extracting || !pasteMsg.trim()}
                style={{ padding:'7px 16px', background:'linear-gradient(135deg,#004aad,#00a79d)', color:'#fff', border:'none', borderRadius:'var(--rs)', fontSize:11, fontWeight:500, cursor: extracting ? 'not-allowed' : 'pointer' }}>
                {extracting ? 'Extracting...' : 'Extract Lead Info'}
              </button>
              {extracting && <span style={{ fontSize:11, color:'var(--teal)' }}>Reading message with Claude...</span>}
            </div>
          </div>
        )}

        {/* Show form once extracted or if manual/edit */}
        {(!isPaste || extracted) && (
          <>
            {extracted && <div style={{ fontSize:11, color:'var(--green)', marginBottom:12, padding:'8px 12px', background:'var(--green-lt)', borderRadius:'var(--rs)' }}>✓ Info extracted — review and fill in any missing fields</div>}
            <FormField label="Customer name *"><input value={form.name||''} onChange={e => set('name',e.target.value)} placeholder="Full name" /></FormField>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <FormField label="Phone"><input value={form.phone||''} onChange={e => set('phone',e.target.value)} placeholder="09xxxxxxxxx" /></FormField>
              <FormField label="Email"><input value={form.email||''} onChange={e => set('email',e.target.value)} placeholder="optional" /></FormField>
            </div>
            <FormField label="Location *"><input value={form.location||''} onChange={e => set('location',e.target.value)} placeholder="City / Municipality, Province" /></FormField>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <FormField label="Service">
                <select value={form.service||'Starlink'} onChange={e => set('service',e.target.value)}>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Use case">
                <select value={form.use_case||'Residential - Basic'} onChange={e => set('use_case',e.target.value)}>
                  {USE_CASES.map(u => <option key={u}>{u}</option>)}
                </select>
              </FormField>
              <FormField label="Quote (₱)"><input type="number" value={form.quote_amount||''} onChange={e => set('quote_amount',e.target.value)} placeholder="0" /></FormField>
              <FormField label="DP (₱)"><input type="number" value={form.dp_amount||''} onChange={e => set('dp_amount',e.target.value)} placeholder="0" /></FormField>
              <FormField label="Assignee">
                <select value={form.assignee||'Noriel'} onChange={e => set('assignee',e.target.value)}>
                  <option>Noriel</option><option>Cheenee</option>
                </select>
              </FormField>
              <FormField label="Quote sent date"><input type="date" value={form.quote_date||''} onChange={e => set('quote_date',e.target.value)} /></FormField>
            </div>
            <FormField label="Notes"><textarea value={form.notes||''} onChange={e => set('notes',e.target.value)} rows={3} /></FormField>
          </>
        )}

        {error && <div style={{ fontSize:11, color:'var(--red)', marginBottom:10 }}>{error}</div>}

        <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap', alignItems:'center' }}>
          {(!isPaste || extracted) && (
            <button onClick={handleSave} style={{ padding:'8px 20px', background:'linear-gradient(135deg,#004aad,#00a79d)', color:'#fff', border:'none', borderRadius:'var(--rs)', fontSize:12, fontWeight:500, cursor:'pointer' }}>
              Save Lead
            </button>
          )}
          <button onClick={onClose} style={{ padding:'8px 16px', background:'transparent', color:'var(--t2)', border:'1px solid var(--border2)', borderRadius:'var(--rs)', fontSize:12, cursor:'pointer' }}>
            Cancel
          </button>
          {isEdit && (
            <button onClick={() => { if (confirm('Delete this lead?')) onDelete() }}
              style={{ padding:'8px 16px', background:'var(--red-lt)', color:'var(--red)', border:'1px solid #f43f5e35', borderRadius:'var(--rs)', fontSize:12, fontWeight:500, cursor:'pointer', marginLeft:'auto' }}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
      <label style={{ fontSize:10, fontWeight:600, color:'var(--t2)', letterSpacing:'.05em', textTransform:'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}
