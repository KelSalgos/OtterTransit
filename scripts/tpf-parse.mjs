// Extract only factual line identifiers from the current-traffic section.
// Planned work is not asserted to be covered. Never infer line IDs from route descriptions.
export function parseTpfText(text,observedAt=new Date().toISOString()){
 const clean=String(text).split(/\r?\n/).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean);
 const begin=clean.findIndex(s=>/^info trafic$/i.test(s));
 const finish=clean.findIndex((s,i)=>i>begin&&/^travaux et manifestations$/i.test(s));
 const base={version:1,observedAt,status:'unknown',alerts:[],coverage:'current-only'};
 if(begin<0||finish<0)return base;
 const section=clean.slice(begin+1,finish).join('\n');
 const no=/aucune perturbation sur le réseau TPF/i.test(section);
 const active=/perturbations en cours sur le réseau TPF/i.test(section);
 if(no&&!active)return {...base,status:'clear'};
 if(!active)return base;
 const linePattern=/\blignes?\s*(?:n(?:°|º|o)\s*)?((?:[A-Z]{0,3}\s?\d{1,3})(?:(?:\s*[,;/]\s*|\s+(?:et|ou)\s+)(?:[A-Z]{0,3}\s?\d{1,3}))*)/gi;
 const lines=new Set();
 for(const m of section.matchAll(linePattern)){
  for(const part of m[1].split(/\s*[,;/]\s*|\s+(?:et|ou)\s+/i)){
   const key=part.replace(/\s/g,'').toUpperCase();
   if(/^(?:[A-Z]{0,3})\d{1,3}$/.test(key))lines.add(key);
  }
 }
 return {...base,status:'active',alerts:[{id:'tpf-current',lines:[...lines].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true})),title:'Perturbation signalée sur le réseau TPF',start:null,end:null}]};
}
