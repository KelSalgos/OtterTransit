import {timestamp} from './core.mjs';
export function checkpoint(s={},kind='departure'){
  s=s||{};const p=s.prognosis||{};
  const planned=timestamp(s[kind])??(Number.isFinite(s[kind+'Timestamp'])?s[kind+'Timestamp']*1000:null);
  const predicted=timestamp(p[kind]);
  const delay=predicted!==null&&planned!==null?Math.round((predicted-planned)/60000):Number.isFinite(s.delay)?s.delay:null;
  return {name:s.station?.name||s.location?.name||'Arrêt non communiqué',planned,effective:predicted??(planned!==null&&delay!==null?planned+delay*60000:planned),delay,live:predicted!==null||delay!==null,platform:p.platform||s.platform||null,platformChanged:!!(p.platform&&s.platform&&String(p.platform)!==String(s.platform)),cancelled:s.cancelled===true};
}
export function normalizeConnection(c){
  const from=checkpoint(c.from),to=checkpoint(c.to,'arrival');
  const sections=(Array.isArray(c.sections)?c.sections:[]).map(s=>{const j=s.journey;return {from:checkpoint(s.departure),to:checkpoint(s.arrival,'arrival'),type:j?'ride':s.walk?'walk':'other',line:j?[j.category,j.number].filter(Boolean).join(' ')||j.name||'Transport':'',destination:j?.to||'',operator:j?.operator||'',walk:Number.isFinite(s.walk?.duration)?Math.ceil(s.walk.duration/60):null,cancelled:s.cancelled===true||j?.cancelled===true,stops:Array.isArray(j?.passList)?j.passList.map(p=>({arrival:checkpoint(p,'arrival'),departure:checkpoint(p)})):[]}});
  const rides=sections.filter(s=>s.type==='ride');
  const duration=from.effective!==null&&to.effective!==null&&to.effective>=from.effective?Math.round((to.effective-from.effective)/60000):null;
  const transfers=Number.isFinite(c.transfers)?c.transfers:Math.max(0,rides.length-1);
  return {from,to,sections,duration,transfers,cancelled:c.cancelled===true||from.cancelled||to.cancelled||sections.some(s=>s.cancelled||s.from.cancelled||s.to.cancelled)};
}
export function transferMargin(a,b){return a?.to?.effective!=null&&b?.from?.effective!=null?Math.floor((b.from.effective-a.to.effective)/60000):null;}
export function queryParams(q){const p=new URLSearchParams({from:String(q.from.id),to:String(q.to.id),limit:'16'});if(q.when!=='now'){p.set('date',q.date);p.set('time',q.time);if(q.when==='arrival')p.set('isArrivalTime','1');}if(q.mode!=='all')p.append('transportations[]',q.mode);if(Number(q.margin)>0)p.set('minTransferTime',String(q.margin));return p;}
export function swissDateTime(now=new Date()){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};}
export function favoriteKey(q){return JSON.stringify([String(q.from.id),String(q.to.id),q.mode||'all',String(q.margin||'0'),normalizeJourneyLines(q.lines)]);}

export function normalizeJourneyLines(lines){return Array.isArray(lines)?[...new Set(lines.filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean))].sort():[];}
export function journeyLineOptions(connections,selected=[]){return normalizeJourneyLines([...normalizeJourneyLines(selected),...connections.flatMap(c=>c.sections.filter(s=>s.type==='ride').map(s=>s.line))]).sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));}
export function filterJourneyLines(connections,selected=[]){const allowed=new Set(normalizeJourneyLines(selected));if(!allowed.size)return connections;return connections.filter(c=>c.sections.length>0&&c.sections.every(s=>s.type==='walk'||(s.type==='ride'&&allowed.has(s.line))));}
