import { useState } from 'react'
import { isDueToday, stageLabel, stageBadgeClass } from '../lib/utils.js'

export default function Sidebar({ leads, cid, onSelect, stats }) {
  const [search, setSearch] = useState('')

  const filtered = leads
    .filter(l => !search || (l.name + l.location + l.service + l.stage).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (isDueToday(a) && !isDueToday(b)) return -1
      if (!isDueToday(a) && isDueToday(b)) return 1
      return b.id - a.id
    })

  return (
    <div style={{ gridRow:2, borderRight:'1px solid var(--border)', background:'var(--surface)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)', borderBottom:'1px solid var(--border)' }}>
        <StatCard n={stats.due}    label="Due today"  accent={stats.due > 0 ? 'var(--amber)' : null} />
        <StatCard n={stats.active} label="Active"     accent="var(--blue)" />
        <StatCard n={`₱${Math.round(stats.pipeline).toLocaleString()}`} label="Pipeline" small />
        <StatCard n={stats.won}    label="Won"        accent="var(--green)" />
      </div>

      {/* Search */}
      <div style={{ padding:'9px 12px', borderBottom:'1px solid var(--border)' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search leads..."
          style={{ width:'100%', padding:'7px 10px', border:'1px solid var(--border2)', borderRadius:'var(--rs)', fontSize:12, background:'var(--s2)', color:'var(--text)', outline:'none' }}
        />
      </div>

      {/* Lead list */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding:'32px 16px', textAlign:'center', fontSize:12, color:'var(--t3)' }}>
            {leads.length === 0 ? 'No leads yet. Create your first one.' : 'No results.'}
          </div>
        )}
        {filtered.map(l => (
          <LeadRow key={l.id} lead={l} selected={l.id === cid} onClick={() => onSelect(l.id)} />
        ))}
      </div>
    </div>
  )
}

function StatCard({ n, label, accent, small }) {
  return (
    <div style={{ background:'var(--surface)', padding:'12px 14px', position:'relative', overflow:'hidden' }}>
      <div style={{ fontSize: small ? 14 : 20, fontWeight:600, color: accent || 'var(--text)', letterSpacing:'-0.5px', marginTop: small ? 3 : 0 }}>{n}</div>
      <div style={{ fontSize:9, color:'var(--t3)', marginTop:4, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
    </div>
  )
}

function LeadRow({ lead, selected, onClick }) {
  const due = isDueToday(lead)
  return (
    <div
      onClick={onClick}
      style={{
        padding:'10px 12px', borderBottom:'1px solid var(--border)', cursor:'pointer',
        background: selected ? 'var(--blue-lt)' : 'var(--surface)',
        borderLeft: selected ? '2px solid var(--blue)' : due ? '2px solid var(--amber)' : '2px solid transparent',
        transition:'background .1s'
      }}
    >
      <div style={{ fontSize:12, fontWeight:500, marginBottom:2, color:'var(--text)' }}>{lead.name}</div>
      <div style={{ fontSize:10, color:'var(--t3)', marginBottom:6 }}>
        {lead.location} · {lead.service}
        {lead.quote_amount ? ` · ₱${Number(lead.quote_amount).toLocaleString()}` : ''}
      </div>
      <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
        <Badge cls={stageBadgeClass(lead)}>{stageLabel(lead)}</Badge>
        {due && <Badge cls="bd">FU due</Badge>}
        <span style={{ fontSize:10, color:'var(--t3)', marginLeft:'auto' }}>{lead.assignee}</span>
      </div>
    </div>
  )
}

export function Badge({ cls, children }) {
  const colors = {
    bs: { bg:'var(--blue-lt)',  color:'#4d9fff',      border:'var(--blue-md)'  },
    bd: { bg:'var(--amber-lt)', color:'var(--amber)',  border:'#f59e0b35'       },
    bw: { bg:'var(--green-lt)', color:'var(--green)',  border:'#10b98135'       },
    bl: { bg:'var(--red-lt)',   color:'var(--red)',    border:'#f43f5e35'       },
    bc: { bg:'var(--gray-lt)',  color:'var(--t2)',     border:'var(--border2)'  },
  }
  const c = colors[cls] || colors.bs
  return (
    <span style={{ fontSize:10, fontWeight:500, padding:'2px 7px', borderRadius:20, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>
      {children}
    </span>
  )
}
