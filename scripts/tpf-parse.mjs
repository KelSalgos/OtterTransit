// Factual identifiers and short incident summaries; no full notice prose.
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
// Extract a bounded headline from the flattened card, then reformulate known facts.
export function incidentSummary(block){
 const text=String(block).replace(/\s+/g,' ').trim();
 const m=text.match(/(?:^|\s)(?:En cours|À venir|A venir|Prochainement)\s+(.{1,220}?)\s+(?=La restriction\b|Les? lignes?\b|Dernière mise à jour\b)/i);
 let headline=m?.[1]?.trim();
 if(!headline)return null;
 headline=headline.replace(/\.$/,'').trim();
 if(headline.length>180||headline.split(/\s+/).length>24)return null;
 const moved=headline.match(/^L[’']arrêt\s+(.+?)\s+est\s+déplacé(?:\s+(?:en\s+)?direction\s+(.+))?$/i);
 if(moved)return 'Arrêt '+moved[1]+' déplacé'+(moved[2]?' · direction '+moved[2]:'');
 const missing=headline.match(/^L[’']arrêt\s+(.+?)\s+(?:n[’']est pas|n[’']est plus|ne sera pas|est non)\s+desservi(?:\s+(?:en\s+)?direction\s+(.+))?$/i);
 if(missing)return 'Arrêt '+missing[1]+' non desservi'+(missing[2]?' · direction '+missing[2]:'');
 const plural=headline.match(/^Les arrêts\s+(.+?)\s+(?:ne sont pas|ne sont plus|ne seront pas|sont non)\s+desservis(?:\s+(?:en\s+)?direction\s+(.+))?$/i);
 if(plural)return 'Arrêts non desservis : '+plural[1]+(plural[2]?' · direction '+plural[2]:'');
 const movedPlural=headline.match(/^Les arrêts\s+(.+?)\s+sont\s+déplacés$/i);
 if(movedPlural)return 'Arrêts déplacés : '+movedPlural[1];
 const diversion=headline.match(/^(?:La ligne|Les lignes)\s+(.+?)\s+(?:est déviée|sont déviées|est dévié|sont déviés)(.*)$/i);
 if(diversion)return 'Déviation · '+diversion[1]+(diversion[2]||'');
 if(/^(?:Déviation|Suppression|Interruption|Service restreint|Trafic perturbé|Arrêt déplacé|Arrêt non desservi|Circulation interrompue|Travaux|Retards|Bus de remplacement|Remplacement par bus)\b/i.test(headline)&&!/\b(?:veuillez|cliquez|consultez|merci)\b/i.test(headline))return headline;
 return null;
}

function notice(block,observedAt,i){
 const token='(?:[A-Z]{0,3}\\d{1,4})';
 const pattern=new RegExp('\\blignes?\\s*(?:n(?:°|º|o)\\s*)?('+token+'(?:(?:\\s*[,;/]\\s*|\\s+(?:et|ou)\\s+|[ \\t]+)'+token+')*)(?![\\w:])','gi');
 const groups=[...block.matchAll(pattern)].map(m=>m[1].split(/\s*[,;/]\s*|\s+(?:et|ou)\s+|[ \t]+/i).map(s=>s.toUpperCase()).filter(s=>/^[A-Z]{0,3}\d{1,4}$/.test(s)).sort());
 const distinct=new Set(groups.map(g=>JSON.stringify([...new Set(g)])));
 // Different scopes in an unseparated notice are ambiguous: show only a general warning.
 const lines=distinct.size===1?[...new Set(groups[0])].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true})):[];
 return {id:'tpf-current-'+i,lines,title:'Perturbation signalée sur le réseau TPF',summary:incidentSummary(block),...period(block,observedAt)};
}
function parseCurrent(text,observedAt=new Date().toISOString()){
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

const dateField='(\\d{2})[./](\\d{2})[./](\\d{4})\\s*[-–—,]\\s*(\\d{1,2})[:h](\\d{2})';
function field(m,at){return localIso({day:m[at],month:m[at+1],year:m[at+2]},+m[at+3],+m[at+4])}
function dayShift(p,n){const d=new Date(Date.UTC(+p.year,+p.month-1,+p.day+n));return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()}}
export function parsePlanned(text,observedAt){
 const now=Date.parse(observedAt),horizon=now+48.5*3600000;
 const section=String(text).split(/travaux et manifestations/i).at(-1);
 const details=section.match(/informations détaillées/i);
 if(!details||!Number.isFinite(now))return {plannedStatus:'unknown',planned:[]};
 const body=section.slice(details.index+details[0].length).split(/questions fréquemment posées/i)[0];
 const starts=[...body.matchAll(new RegExp('\\bDu\\s*:\\s*'+dateField,'gi'))];
 const found=new Map();let skipped=/OTTER_PARTIAL_COVERAGE/.test(body)?1:0;
 for(let i=0;i<starts.length;i++){
  const m=starts[i],block=body.slice(m.index,starts[i+1]?.index??body.length);
  const e=block.match(new RegExp('\\bAu\\s*:\\s*'+dateField,'i'));
  const start=field(m,1),end=e?field(e,1):null;
  if(!start||!end||Date.parse(end)<=Date.parse(start)){skipped++;continue}
  const a=Date.parse(start),b=Date.parse(end);
  if(b<=now||a>horizon)continue;
  const lines=notice(block,observedAt,i).lines;
  if(!lines.length)skipped++;
  const cause=/cause\s*:\s*(?:une\s+)?manifestation/i.test(block)?'Manifestation':/cause\s*:\s*(?:des\s+)?travaux/i.test(block)?'Travaux':'Perturbation annoncée';
  let windows=[],timing='unconfirmed';
  const repeat=block.match(/toujours\s+de\s+(\d{1,2})[:h](\d{2})\s*à\s*(\d{1,2})[:h](\d{2})/i);
  const restricted=/uniquement|sauf|les nuits|les lundis|les mardis|les mercredis|les jeudis|les vendredis|les samedis|les dimanches|jours ouvrables|week.end|du lundi|de lundi|chaque nuit|chaque jour/i.test(block);
  if(repeat&&!restricted){
   const h=+repeat[1],min=+repeat[2],eh=+repeat[3],em=+repeat[4];
   if(h<24&&eh<24&&min<60&&em<60&&h*60+min!==eh*60+em){
    const day=parts(new Date(Math.max(now,a)));
    for(let n=-1;n<=4;n++){
     const p=dayShift(day,n),q=dayShift(p,eh*60+em<h*60+min?1:0);
     const s=Date.parse(localIso(p,h,min)),t=Date.parse(localIso(q,eh,em));
     const lo=Math.max(a,s),hi=Math.min(b,t);
     if(Number.isFinite(lo)&&Number.isFinite(hi)&&hi>lo&&hi>now&&lo<=horizon)windows.push({start:new Date(lo).toISOString(),end:new Date(hi).toISOString()});
    }
    timing='daily';
   }
  }else if(!restricted&&!repeat){
   // Only assert a continuous interval when the prose explicitly confirms it,
   // or the two bounds are on the same Swiss calendar day.
   const pa=parts(new Date(a)),pb=parts(new Date(b));
   const sameDay=pa.year===pb.year&&pa.month===pb.month&&pa.day===pb.day;
   const continuous=/la restriction dure du\s+\d{2}[./]\d{2}[./]\d{4}\s*,\s*\d{1,2}:\d{2}\s+au\s+\d{2}[./]\d{2}[./]\d{4}\s*,\s*\d{1,2}:\d{2}\s*\./i.test(block);
   const until=block.match(/\bla restriction dure jusqu[’']au\s+(\d{2})[./](\d{2})[./](\d{4})\s*,\s*(\d{1,2}):(\d{2})\s*\./i);
   const confirmedEnd=until&&field(until,1)===end&&/\bEn cours\b/i.test(block)&&a<=now&&now<b;
   const otherTiming=/\b(?:de|entre)\s+\d{1,2}[:h]\d{2}\s*(?:à|et|–|-)\s*\d{1,2}[:h]\d{2}|\b(?:certains jours|par intermittence|en soirée|en journée|horaires variables)\b/i.test(block);
   if(sameDay||continuous||(confirmedEnd&&!otherTiming)){windows=[{start,end}];timing='continuous'}
  }
  if(timing==='daily'&&!windows.length)continue;
  const summary=incidentSummary(block);
  const key=JSON.stringify([lines,start,end,cause,timing,windows,summary]);
  found.set(key,{id:'tpf-planned-'+i,lines,start,end,cause,timing,windows,summary});
 }
 return {plannedStatus:starts.length?(skipped?'partial':'available'):'unknown',planned:[...found.values()].sort((a,b)=>Date.parse(a.start)-Date.parse(b.start))};
}
export function parseTpfText(text,observedAt=new Date().toISOString()){
 return {...parseCurrent(text,observedAt),...parsePlanned(text,observedAt),coverage:'current-and-planned-48h'};
}
