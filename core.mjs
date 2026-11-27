export const timeFormat = new Intl.DateTimeFormat('fr-CH',{timeZone:'Europe/Zurich',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function timestamp(value){if(typeof value!=='string'||!value)return null;const n=Date.parse(value.replace(/([+-]\d{2})(\d{2})$/,'$1:$2'));return Number.isFinite(n)?n:null;}
export function normalize(j){const s=j.stop??{},p=s.prognosis??{};const planned=timestamp(s.departure)??(Number.isFinite(s.departureTimestamp)?s.departureTimestamp*1000:null);const forecast=timestamp(p.departure);const delay=Number.isFinite(s.delay)?s.delay:forecast!==null&&planned!==null?Math.round((forecast-planned)/60000):null;const effective=forecast??(planned!==null&&delay!==null?planned+delay*60000:planned);return {line:String(j.number??j.name??'?'),to:String(j.to??'Destination inconnue'),operator:j.operator??'',planned,effective,delay,live:forecast!==null||delay!==null,platform:p.platform||s.platform||null,platformChanged:!!(p.platform&&s.platform&&String(p.platform)!==String(s.platform)),cancelled:j.cancelled===true||s.cancelled===true};}
export function visible(rows,filter,now){const q=filter.trim().toLocaleLowerCase('fr');return rows.filter(r=>r.effective!==null&&r.effective>=now-60000&&(!q||r.line.toLocaleLowerCase('fr')===q||r.to.toLocaleLowerCase('fr').includes(q)||r.operator.toLocaleLowerCase('fr').includes(q))).sort((a,b)=>a.effective-b.effective);}
export function countdown(ms,now){const n=Math.ceil((ms-now)/60000);return n<0?'Parti':n===0?'Maint.':`${n} min`;}

const sortText=(a,b)=>a.localeCompare(b,'fr',{numeric:true,sensitivity:'base'})||a.localeCompare(b);
export function normalizeSelections(value){
  const source=Array.isArray(value)?value:[];
  const unique=new Map();
  for(const r of source){if(!r||typeof r.line!=='string')continue;const line=r.line;const direction=typeof r.direction==='string'?r.direction:'';if(line||direction)unique.set(line,{line,direction});}
  if([...unique.keys()].some(Boolean))unique.delete('');
  return [...unique.values()].sort((a,b)=>sortText(a.line,b.line));
}
export function selectionsFromRoute(r={}){return normalizeSelections(Array.isArray(r.selections)?r.selections:[{line:String(r.line||''),direction:String(r.direction||'')}]);}
export function routeOptions(rows,selections=[]){
  const selected=normalizeSelections(selections);
  const lines=[...new Set([...rows.map(r=>r.line),...selected.map(r=>r.line)].filter(Boolean))].sort(sortText);
  const destinations=line=>[...new Set([...rows.filter(r=>!line||r.line===line).map(r=>r.to),...selected.filter(r=>r.line===line).map(r=>r.direction)].filter(Boolean))].sort(sortText);
  return {lines,destinations};
}
export const BOARD_HORIZON_MINUTES=35;
export function routeVisible(rows,selections,now){const selected=normalizeSelections(selections);return visible(rows,'',now).filter(r=>r.effective>=now&&r.effective<=now+BOARD_HORIZON_MINUTES*60000&&(!selected.length||selected.some(s=>(!s.line||r.line===s.line)&&(!s.direction||r.to===s.direction))));}
export function toggleLine(selections,line){const selected=normalizeSelections(selections);if(!line)return [];const explicit=selected.filter(s=>s.line);return normalizeSelections(explicit.some(s=>s.line===line)?explicit.filter(s=>s.line!==line):[...explicit,{line,direction:''}]);}
export function setDirection(selections,line,direction){return normalizeSelections([...normalizeSelections(selections).filter(s=>s.line!==line),{line,direction}]);}
export function routeKey(r){return JSON.stringify([String(r.id),r.mode||'bus',selectionsFromRoute(r)]);}
export function migrateFavorites(items){return Array.isArray(items)?items.filter(r=>r&&r.id&&r.name).map(r=>({id:String(r.id),name:String(r.name),mode:['bus','all','train','tram'].includes(r.mode)?r.mode:'bus',selections:selectionsFromRoute(r),label:String(r.label||'')})):[];}
