import {SOURCE,feedState,matchingAlerts} from './alerts-core.mjs';
const DATA='https://raw.githubusercontent.com/KelSalgos/OtterTransit/traffic-data/alerts.json';
let feed=null,loading=false,failed=false;
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e};
const when=x=>new Intl.DateTimeFormat('fr-CH',{timeZone:'Europe/Zurich',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(x));
export function alertsFor(trip){return matchingAlerts(feed,trip)}
export function appendAlert(node,trip){if(alertsFor(trip).length)node.append(el('div','⚠ Perturbation signalée sur la ligne · voir Trafic','traffic-badge'))}
function paint(){const state=feedState(feed),root=$('trafficAlerts'),status=$('trafficStatus'),brief=$('trafficBrief');root.replaceChildren();let message=state==='active'?'Perturbation en cours annoncée par les TPF.':state==='clear'?'Aucune perturbation en cours annoncée lors de la collecte.':state==='stale'?'Données trop anciennes : associations désactivées.':state==='unknown'?'Source consultée mais informations non interprétables.':'Collecte TPF non disponible.';
if(loading&&!feed)message='Chargement des infos TPF…';
if(failed)message+=' Dernière actualisation impossible.';
status.textContent=message+(feed?.observedAt&&Number.isFinite(Date.parse(feed.observedAt))?' · Collecte '+when(feed.observedAt):'');
brief.textContent=state==='active'?'⚠ Info trafic TPF':state==='clear'?'Info TPF : aucune perturbation en cours annoncée':state==='stale'?'Info TPF : données anciennes':'Info TPF : état non confirmé';
brief.classList.toggle('traffic-active',state==='active');
if(state==='active')for(const a of feed.alerts){const card=el('article','', 'traffic-card');card.append(el('strong','Perturbation en cours — TPF'),el('p',a.lines?.length?'Lignes explicitement citées : '+a.lines.join(', '):'Lignes non identifiées automatiquement.','meta'),el('p','Consulte l’annonce officielle pour les directions, arrêts et heures de fin.','meta'));root.append(card)}
}
export async function refreshAlerts(){if(loading||document.hidden)return;loading=true;paint();const c=new AbortController(),timer=setTimeout(()=>c.abort(),10000);try{const r=await fetch(DATA,{cache:'no-store',signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();if(feedState(d)==='unavailable')throw Error('Format');feed=d;failed=false}catch{failed=true}finally{clearTimeout(timer);loading=false;paint();document.dispatchEvent(new CustomEvent('otter:alerts'))}}
$('trafficRefresh').onclick=refreshAlerts;
$('trafficBrief').onclick=()=>$('tabTraffic').click();
paint();refreshAlerts();
setInterval(()=>{if(!document.hidden)refreshAlerts()},120000);
let last=feedState(feed);
setInterval(()=>{const state=feedState(feed);if(state!==last){last=state;paint();document.dispatchEvent(new CustomEvent('otter:alerts'))}},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAlerts()});
