import { addDays, fmt } from './utils.js'

export function getMsg(key, lead) {
  const n   = lead.name || '[Name]'
  const exp = lead.quote_date ? fmt(addDays(lead.quote_date, 15)) : '[expiry date]'
  const dp  = lead.dp_amount  ? '₱' + Number(lead.dp_amount).toLocaleString() : '[exact amount]'

  const M = {
    'First Contact': `👋 Hi! TechCare IT Solutions po ito — BIR-registered IT business with a physical office, nag-specialize sa Starlink at networking solutions.\n\nBago ang presyo, ito muna ang dapat ninyong malaman:\nMaraming nagbebenta ng Starlink online — benta lang, tapos wala na. Kami, iba po kami.\n\nKasama po sa bawat unit na binibili sa amin:\n✅ BIR Registered business with physical office\n✅ Remote setup assistance — guided installation via call or video call\n✅ After-sales support — halos 24/7 via FB page\n✅ Positibong feedback mula sa aming mga satisfied customers\n💡 Optional: Pre-activation at pre-configuration — plug-and-play agad pagdating.\n\n💰 Starlink Gen 3: ₱35,000\n(On-site installation available — separate charge depende sa location)\n\nPara makapag-advise kami ng tama — saan po gagamitin at para sa ano — bahay, negosyo, o remote area? 😊`,

    'Qualification': `Hi po! Para makapag-assist kami ng maayos, kailangan lang namin malaman: saan po kayo located at para saan ang setup — bahay, negosyo, o remote area? 😊 Pag may details na kayo, nandito kami!`,

    'Quotation-A': `Hi ${n}, thank you po for waiting!\n\nAttached na po ang quotation para sa inyong Starlink setup.\n\nPara sa home use po, kasama na sa kit ang Starlink dish, advanced WiFi router, cables, at power supply — straight out of the box, ready na po siya.\n\nKasama rin po ang aming remote setup assistance — guided namin kayo step by step via call or video call pag dumating na ang unit.\n\nPlease note po na this is based on our conversation. Pag may additional items na needed on-site, ipapaalam namin agad.\n\nFeel free po to reach out kung may questions kayo. Nandito lang kami! 😊\n\n— TechCare IT Solutions`,

    'Quotation-B': `Hi ${n}, thank you po for waiting!\n\nAttached na po ang quotation para sa inyong Starlink setup.\n\nSince malaki ang area ninyo, nagsama kami ng WiFi extender sa recommended setup para ma-cover ang buong bahay — hindi lang ang area malapit sa dish.\n\nKasama rin po ang aming remote setup assistance para guided ang installation ninyo.\n\nThis is an estimate po based on our conversation. Pag may adjustments needed on-site, ipapaalam namin agad.\n\nKung may tanong po kayo, nandito lang kami! 😊\n\n— TechCare IT Solutions`,

    'Quotation-C': `Hi ${n}, thank you po for waiting!\n\nAttached na po ang quotation para sa inyong Starlink business setup.\n\nSince multiple users kayo, nagsama kami ng managed gateway router at dedicated AP para:\n• Pantay ang distribution ng internet sa lahat ng users\n• Maiwasan ang slowdown dahil sa heavy users\n• May control at monitoring para sa stable at secure na network\n\nKung direct connection lang sa Starlink walang gateway — pag may heavy user, maaapektuhan ang buong network.\n\nThis is a ballpark estimate po. May possible adjustments on-site.\n\nKung may tanong po kayo, nandito lang kami! 😊\n\n— TechCare IT Solutions`,

    'Follow-Up-1': `Hi ${n}! Natanggap na po ba ang quotation namin? 😊 Kung may gustong i-clarify o may tanong, feel free lang po. Nandito kami!`,

    'Follow-Up-2': `Hi ${n}! Checking in lang po ulit — valid pa ang quotation hanggang ${exp}. Kung may concerns sa items or sa setup, okay lang kausapin namin. Gusto lang naming masigurado na okay kayo bago mag-decide. 😊`,

    'Follow-Up-3': `Hi ${n}! Last na lang po kami para hindi kayo ma-bother 😊 Kung ready na kayo or may tanong pa — nandito pa rin kami. And kung may ibang direction na kayo, okay lang din iyon. Salamat sa pagtatanong, TechCare po!`,

    'Closing-DP': `Hi ${n}! 😊 Para ma-confirm at ma-block na ang schedule natin, need lang po ng downpayment.\n\nDP Amount: ${dp} (50% of total)\n\nPayment details:\nBank: Union Bank of the Philippines\nAccount Name: TechCare IT Solutions\nAccount Number: 003030004270\n\nPag nakapagpadala na po kayo, send lang ng screenshot dito para ma-confirm namin agad. Once confirmed, locked na ang schedule natin! 😊`,

    'Closing-Confirm': `Hi ${n}! Natanggap na po namin ang DP — confirmed! 🎉\n\nLocked na ang schedule natin. Ipapaalam na rin namin pag papunta na kami / pag naka-ship na ang unit.\n\nSalamat sa tiwala sa TechCare! 😊`,

    'Post-Install-1': `Sir/Mam, maraming salamat po for trusting TechCare IT Solutions! Masaya kami na naka-set up na kayo at working na ang connection. 😊\n\nKung may questions or concerns kayo anytime, nandito lang kami sa FB page namin — halos 24/7 kami sumasagot.\n\nKung okay po sa inyo, malaking tulong po sa amin kung makakapag-iwan kayo ng review sa aming FB page.\n\n👉 [i-paste ang FB Page link dito]\n\nSalamat ulit po — TechCare!`,

    'Post-Install-2': `Hi ${n}! Hope okay pa rin ang connection ninyo! 😊 Kung hindi pa po kayo nakakapag-iwan ng review, okay lang — nandito lang ang link kung may time kayo. Salamat po talaga! 👉 [FB Page link]`,

    'Post-Install-30': `Hi ${n}! One month na po pala since na-set up ang inyong Starlink 😊 Okay pa ba ang connection? May concerns o gustong i-adjust? Nandito lang kami — TechCare po!`,

    'Mahal': `Totally get it po! 😊\n\nAlam na ninyo ang kasama — so ito na lang po ang honest na sasabihin namin:\n\nYung unit mismo? Pareho lang 'yan sa lahat ng sellers.\nYung difference namin — nandoon kami pagkatapos ng sale. Yung matatawagan ninyo, yung susuportahan kayo hanggang gumagana na nang maayos.\n\nKung 'yun ang importante sa inyo — nandito kami. 😊\nKung hindi pa po kayo ready — no hard feelings! Salamat sa pagtatanong, at feel free to reach out anytime. 👋`,
  }
  return M[key] || ''
}

export function getQuoteKey(useCase = '') {
  if (useCase.includes('Large')) return 'Quotation-B'
  if (useCase.includes('Business') || useCase.includes('Office')) return 'Quotation-C'
  return 'Quotation-A'
}

export function getNextAction(lead) {
  if (lead.outcome) return null
  const da  = lead.quote_date ? Math.floor((new Date() - new Date(lead.quote_date)) / 86400000) : 0
  const fu  = lead.fu_count || 0
  const qk  = getQuoteKey(lead.use_case)

  const map = {
    'First Contact': { title: 'Send auto-reply', desc: 'Copy the first contact message and send via FB Messenger.', mk: 'First Contact' },
    'Qualification': { title: 'Run give-and-take test', desc: 'Ask for location and use case. Tick signals in the Info tab. If they still ignore after re-engage — mark Cold.', mk: 'Qualification' },
    'Quotation':     { title: 'Send quote + companion message', desc: 'Build Zoho quote first, then copy the companion message.', mk: qk },
    'Follow-Up':     fu === 0 ? { title: 'Send Follow-Up 1', desc: `Day ${da} since quote. Send soft check-in now.`, mk: 'Follow-Up-1' }
                   : fu === 1 ? { title: 'Send Follow-Up 2', desc: `Day ${da} since quote. Send value reminder + expiry nudge.`, mk: 'Follow-Up-2' }
                   : fu === 2 ? { title: 'Send Follow-Up 3', desc: `Day ${da} since quote. Final follow-up. Mark Cold if no reply after this.`, mk: 'Follow-Up-3' }
                   :            { title: 'All follow-ups done', desc: 'Mark outcome below — Won, Lost, or Cold.', mk: null },
    'Closing':       { title: 'Send DP request', desc: 'Check stock first. Then copy the downpayment message.', mk: 'Closing-DP' },
    'Post-Install':  { title: 'Send closing + review request', desc: 'Installation complete. Send thank-you with FB review link.', mk: 'Post-Install-1' },
  }
  return map[lead.stage] || { title: 'No action', desc: '', mk: null }
}
