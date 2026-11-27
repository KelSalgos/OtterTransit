import {SOURCE,feedState,matchingAlerts,plannedWithin} from './alerts-core.mjs';
const DATA='https://raw.githubusercontent.com/KelSalgos/OtterTransit/traffic-data/alerts.json';
let feed=null,loading=false,failed=false;
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e};
const when=x=>new Intl.DateTimeFormat('fr-CH',{timeZone:'Europe/Zurich',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(x));
export function alertsFor(trip){return matchingAlerts(feed,trip)}
function periodLabel(a){const start=Number.isFinite(Date.parse(a.start)),end=Number.isFinite(Date.parse(a.end));return start&&end?when(a.start)+' – '+when(a.end)+(a.approximate?' (estimé)':''):end?'Jusqu’à '+when(a.end)+(a.approximate?' environ':''):'Période non déterminée automatiquement'}
export function appendAlert(node,trip){const alerts=alertsFor(trip);if(alerts.length)node.append(el('div','⚠ Perturbation signalée sur la ligne · '+alerts.map(a=>a.timing==='daily'?a.windows.filter(w=>trip.start<Date.parse(w.end)&&(trip.end??trip.start)>=Date.parse(w.start)).map(periodLabel).join(' / '):periodLabel(a)).join(' / ')+' · voir Trafic','traffic-badge'))}
function paint(){const state=feedState(feed),planned=plannedWithin(feed),root=$('trafficAlerts'),status=$('trafficStatus'),brief=$('trafficBrief');root.replaceChildren();let message=state==='active'?'Perturbation en cours annoncée par les TPF.':state==='clear'?'Aucune perturbation en cours annoncée lors de la collecte.':state==='stale'?'Données trop anciennes : associations désactivées.':state==='unknown'?'Source consultée mais informations non interprétables.':'Collecte TPF non disponible.';
if(loading&&!feed)message='Chargement des infos TPF…';
if(failed)message+=' Dernière actualisation impossible.';
status.textContent=message+(feed?.observedAt&&Number.isFinite(Date.parse(feed.observedAt))?' · Collecte '+when(feed.observedAt):'');
brief.textContent=state==='active'?'⚠ Info trafic TPF':state==='clear'?'Info TPF : aucune perturbation en cours annoncée':state==='stale'?'Info TPF : données anciennes':'Info TPF : état non confirmé';
if(planned.length)brief.textContent+=' · '+planned.length+' annonce(s) sur 48 h';brief.classList.toggle('traffic-active',state==='active'||planned.length>0);
if(state==='active')for(const a of feed.alerts){const card=el('article','', 'traffic-card');card.append(el('strong','Perturbation en cours — TPF'),el('p',a.lines?.length?'Lignes explicitement citées : '+a.lines.join(', '):'Lignes non identifiées automatiquement.','meta'),el('p',periodLabel(a),'meta'),el('p','Consulte l’annonce officielle pour confirmer la période, les directions et les arrêts.','meta'));root.append(card)}
root.append(el('h3','Travaux et manifestations · 48 prochaines heures'));if(['stale','unavailable'].includes(state)||!['available','partial'].includes(feed?.plannedStatus))root.append(el('p','Collecte des annonces planifiées non confirmée. Consulte le site TPF.','meta'));else if(feed.plannedStatus==='partial')root.append(el('p','Collecte partielle : certaines annonces restent à vérifier.','meta'));if(!planned.length&&feed?.plannedStatus==='available'&&!['stale','unavailable'].includes(state))root.append(el('p','Aucune annonce identifiée dans les prochaines 48 heures.','meta'));for(const a of planned){const card=el('article','','traffic-card');card.append(el('strong',a.cause),el('p',a.lines?.length?'Lignes : '+a.lines.join(', '):'Lignes non identifiées','meta'),el('p',periodLabel(a),'meta'));if(a.timing==='daily')for(const w of a.windows.filter(w=>Date.parse(w.end)>Date.now()&&Date.parse(w.start)<=Date.now()+48*3600000))card.append(el('p',when(w.start)+' – '+when(w.end),'meta'));if(a.timing==='unconfirmed')card.append(el('p','Jours ou plages exactes à confirmer sur le site officiel. Pas d’association automatique.','meta'));root.append(card)}
}
export async function refreshAlerts(){if(loading||document.hidden)return;loading=true;paint();const c=new AbortController(),timer=setTimeout(()=>c.abort(),10000);try{const r=await fetch(DATA,{cache:'no-store',signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();if(feedState(d)==='unavailable')throw Error('Format');feed=d;failed=false}catch{failed=true}finally{clearTimeout(timer);loading=false;paint();document.dispatchEvent(new CustomEvent('otter:alerts'))}}
$('trafficRefresh').onclick=refreshAlerts;
$('trafficBrief').onclick=()=>$('tabTraffic').click();
paint();refreshAlerts();
setInterval(()=>{if(!document.hidden)refreshAlerts()},120000);
let last=feedState(feed);
setInterval(()=>{const state=feedState(feed);if(state!==last){last=state;paint();document.dispatchEvent(new CustomEvent('otter:alerts'))}else if(!document.hidden)paint()},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAlerts()});
