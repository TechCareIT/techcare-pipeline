export const STAGES = ['First Contact','Qualification','Quotation','Follow-Up','Closing','Post-Install']

export const USE_CASES = [
  'Residential - Basic',
  'Residential - Large Home',
  'Business / Office',
  'Remote - Personal',
  'Remote - Public/Shared'
]

export const SERVICES = ['Starlink','Networking','CCTV','CCTV + Networking','IT Support']

export const QUAL_CHECKS = [
  'Answered location question',
  'Shared use case (home / business / remote)',
  'Responded to at least one follow-up',
  'Not just asking price with no details'
]

export const TONES = [
  { id:'short',    name:'Short & direct',    sub:'2–4 sentences max',          p:'Keep the reply short and direct. Maximum 3-4 sentences. No fluff.' },
  { id:'warm',     name:'Warm & detailed',   sub:'Full friendly explanation',   p:'Write a warm, friendly, and detailed reply. Explain clearly and reassure the customer.' },
  { id:'objection',name:'Handle objection',  sub:'Price, hesitation, mahal',    p:'The customer has an objection or hesitation. Address it confidently, honestly, without pressure. Leave the door open.' },
  { id:'qualify',  name:'Qualify them',      sub:'Ask location & use case',     p:'Ask the customer for more details: their location and what they will use it for. Keep it natural and brief.' },
  { id:'followup', name:'Follow-up nudge',   sub:'Light, no pressure check-in', p:'This is a follow-up after no response. Be light and friendly. No pressure at all.' },
  { id:'custom',   name:'Custom',            sub:'Type your own instruction',   p:'' },
]

export const EMPTY_LEAD = {
  name: '', phone: '', email: '', location: '',
  use_case: 'Residential - Basic', service: 'Starlink',
  stage: 'First Contact', quote_date: null,
  quote_amount: null, dp_amount: null, fu_count: 0,
  notes: '', outcome: null, assignee: 'Noriel',
  source: 'Facebook', qual_checks: [false,false,false,false]
}
