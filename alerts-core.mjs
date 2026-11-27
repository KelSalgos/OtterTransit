export const SOURCE='https://www.tpf.ch/fr/horaires-et-reseaux/perturbations-et-travaux/info-trafic';
export const MAX_AGE=30*60000;
export function isTPF(operator){return /^(?:tpf(?:\s|$|[-–])|transports publics fribourgeois(?:\s|$))/i.test(String(operator||'').trim())}
export function lineKey(line){return String(line||'').trim().toUpperCase().replace(/^(?:B|BUS|TRAM)\s+/, '').replace(/\s+/g,'')}
export function feedState(feed,now=Date.now()){const at=Date.parse(feed?.observedAt);if(!feed||feed.version!==1||!Array.isArray(feed.alerts)||!Number.isFinite(at)||at>now+60000)return 'unavailable';if(now-at>MAX_AGE)return 'stale';return ['active','clear','unknown'].includes(feed.status)?feed.status:'unavailable'}
function matchingCurrent(feed,{operator,line,start,end=start},now=Date.now()){if(feedState(feed,now)!=='active'||!isTPF(operator)||!Number.isFinite(start)||!Number.isFinite(end)||end<start)return [];const key=lineKey(line);return feed.alerts.filter(a=>{if(!key||!Array.isArray(a.lines)||!a.lines.some(l=>lineKey(l)===key))return false;const since=Date.parse(a.start),until=Date.parse(a.end);if(Number.isFinite(since)&&Number.isFinite(until)&&until>since)return start<until&&end>=since;if(Number.isFinite(until))return start<until&&end>=now;if(Number.isFinite(since))return end>=since&&start<=now+35*60000;return end>=now&&start<=now+35*60000})}

export const PLANNED_HORIZON=48*3600000;
export function plannedWithin(feed,now=Date.now()){
 if(['stale','unavailable'].includes(feedState(feed,now)))return [];
 return (Array.isArray(feed?.planned)?feed.planned:[]).filter(a=>{
  const ranges=a.timing==='unconfirmed'?[a]:a.windows||[];
  return ranges.some(w=>Date.parse(w.end)>now&&Date.parse(w.start)<=now+PLANNED_HORIZON);
 });
}
export function matchingPlanned(feed,{operator,line,start,end=start},now=Date.now()){
 if(!isTPF(operator)||!Number.isFinite(start)||!Number.isFinite(end)||end<start||end<now||start>now+PLANNED_HORIZON)return [];
 const key=lineKey(line);
 return plannedWithin(feed,now).filter(a=>a.timing!=='unconfirmed'&&a.lines?.some(l=>lineKey(l)===key)&&a.windows?.some(w=>start<Date.parse(w.end)&&end>=Date.parse(w.start)));
}

export function matchingAlerts(feed,trip,now=Date.now()){return [...matchingCurrent(feed,trip,now),...matchingPlanned(feed,trip,now)]}
