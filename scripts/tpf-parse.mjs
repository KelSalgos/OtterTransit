// Factual line and time identifiers only; no original notice prose is republished.
const zone='Europe/Zurich';
function parts(date){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]))}
function localIso(date,h,m){
 if(h>23||m>59)return null;
 const utc=Date.UTC(+date.year,+date.month-1,+date.day,h,m);
 // Match a real Swiss local time; reject ambiguous/nonexistent DST times.
 const hits=[utc-3600000,utc-7200000].filter(t=>{const p=parts(new Date(t));return +p.year===+date.year&&+p.month===+date.month&&+p.day===+date.day&&+p.hour===h&&+p.minute===m});
 return hits.length===1?new Date(hits[0]).toISOString():null;
}
function period(block,observedAt){
 const d=parts(new Date(observedAt));
 const update=block.match(/dernière mise à jour\s*:\s*(\d{2})[./](\d{2})[./](\d{4})/i);
 // Relative clock-only notices are interpreted for the Swiss day of the collection.
 // If an older update is explicit, the referenced day is ambiguous; don't invent dates.
 if(update&&(+update[1]!==+d.day||+update[2]!==+d.month||+update[3]!==+d.year))return {start:null,end:null,approximate:false};
 const time='(\\d{1,2})\\s*[:h]\\s*(\\d{2})';
 const ranges=[...block.matchAll(new RegExp('(?:\\bde\\s+)?'+time+'\\s*(?:à|–|—|-)\\s*'+time,'gi'))];
 const until=[...block.matchAll(new RegExp('jusqu[’\\x27]?(?:à|a)\\s*'+time,'gi'))];
 if(ranges.length===1&&until.length===0){
  const r=ranges[0],start=localIso(d,+r[1],+r[2]),end=localIso(d,+r[3],+r[4]);
  if(start&&end&&Date.parse(end)>Date.parse(start))return {start,end,approximate:/environ|estimé/i.test(block)};
 }
 if(ranges.length===0&&until.length===1){
  const r=until[0],end=localIso(d,+r[1],+r[2]);
  if(end)return {start:null,end,approximate:/environ|estimé/i.test(block)};
 }
 return {start:null,end:null,approximate:false};
}
function notice(block,observedAt,i){
 const token='(?:[A-Z]{0,3}\\d{1,3})';
 const pattern=new RegExp('\\blignes?\\s*(?:n(?:°|º|o)\\s*)?('+token+'(?:(?:\\s*[,;/]\\s*|\\s+(?:et|ou)\\s+|[ \\t]+)'+token+')*)(?![\\w:])','gi');
 const groups=[...block.matchAll(pattern)].map(m=>m[1].split(/\s*[,;/]\s*|\s+(?:et|ou)\s+|[ \t]+/i).map(s=>s.toUpperCase()).filter(s=>/^[A-Z]{0,3}\d{1,3}$/.test(s)).sort());
 const distinct=new Set(groups.map(g=>JSON.stringify([...new Set(g)])));
 // Different scopes in an unseparated notice are ambiguous: show only a general warning.
 const lines=distinct.size===1?[...new Set(groups[0])].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true})):[];
 return {id:'tpf-current-'+i,lines,title:'Perturbation signalée sur le réseau TPF',...period(block,observedAt)};
}
export function parseTpfText(text,observedAt=new Date().toISOString()){
 const clean=String(text).split(/\r?\n/).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean);
 const begin=clean.findIndex(s=>/^info trafic$/i.test(s));
 const finish=clean.findIndex((s,i)=>i>begin&&/^travaux et manifestations$/i.test(s));
 const base={version:1,observedAt,status:'unknown',alerts:[],coverage:'current-only'};
 if(begin<0||finish<0||!Number.isFinite(Date.parse(observedAt)))return base;
 const section=clean.slice(begin+1,finish).join('\n');
 const no=/aucune perturbation sur le réseau TPF/i.test(section);
 const active=/perturbations en cours sur le réseau TPF/i.test(section);
 if(no&&!active)return {...base,status:'clear'};
 if(!active)return base;
 // Each actual TPF notice in the observed examples ends with its update timestamp.
 const blocks=[];let offset=0;
 for(const m of section.matchAll(/dernière mise à jour\s*:\s*\d{2}[./]\d{2}[./]\d{4}\s+\d{2}:\d{2}(?::\d{2})?/gi)){
  const end=m.index+m[0].length;blocks.push(section.slice(offset,end));offset=end;
 }
 const rest=section.slice(offset).trim();if(rest)blocks.push(rest);
 return {...base,status:'active',alerts:(blocks.length?blocks:[section]).map((b,i)=>notice(b,observedAt,i))};
}
