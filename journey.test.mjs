import assert from 'node:assert/strict';import {checkpoint,normalizeConnection,transferMargin,queryParams,swissDateTime,favoriteKey,normalizeJourneyLines,journeyLineOptions,filterJourneyLines} from './journey-core.mjs';
const stop=(name,kind,time,delay=null)=>({station:{name},[kind]:`2026-11-26T${time}:00+0100`,delay});
const a=stop('A','departure','18:00',2),b=stop('B','arrival','18:10',2),d=stop('B','departure','18:15',0),e=stop('C','arrival','18:30');
const c=normalizeConnection({from:a,to:e,transfers:1,sections:[{departure:a,arrival:b,journey:{category:'B',number:'2',to:'B'}},{departure:d,arrival:e,journey:{category:'B',number:'6',to:'C'}}]});assert.equal(c.duration,28);assert.equal(c.transfers,1);assert.equal(transferMargin(...c.sections),3);assert.equal(c.sections[0].line,'B 2');assert.equal(c.to.live,false);assert.equal(checkpoint({...a,prognosis:{departure:'2026-11-26T18:05:00+0100'}}).delay,5);assert.equal(normalizeConnection({sections:[{walk:{duration:61}}]}).sections[0].walk,2);assert.equal(normalizeConnection({sections:[{journey:{cancelled:true}}]}).cancelled,true);assert.equal(transferMargin({},{}),null);const q={from:{id:'1'},to:{id:'2'},when:'arrival',date:'2026-11-27',time:'08:00',mode:'bus',margin:'5'};let p=queryParams(q);assert.equal(p.get('isArrivalTime'),'1');assert.equal(p.get('transportations[]'),'bus');assert.equal(p.get('minTransferTime'),'5');assert.equal(queryParams({...q,when:'now'}).has('date'),false);assert.equal(swissDateTime(new Date('2026-11-26T23:15:00Z')).date,'2026-11-27');assert.notEqual(favoriteKey(q),favoriteKey({...q,from:q.to,to:q.from}));console.log('Journey tests OK');

const ride=line=>({type:'ride',line}),walk={type:'walk',line:''};
const routes=[{sections:[ride('B 2'),walk,ride('B 8')]},{sections:[ride('B 6'),ride('B 11')]},{sections:[ride('B 2'),ride('B 3')]},{sections:[ride('B 8')]},{sections:[ride('B 1'),ride('B 6')]},{sections:[walk]}];
const allowed=['B 2','B 6','B 8','B 11'];
assert.deepEqual(filterJourneyLines(routes,allowed),[routes[0],routes[1],routes[3],routes[5]]);
assert.deepEqual(filterJourneyLines(routes,[]),routes);
assert.deepEqual(journeyLineOptions(routes,['B 99']),['B 1','B 2','B 3','B 6','B 8','B 11','B 99']);
assert.deepEqual(normalizeJourneyLines(['B 6','B 2','B 6',null,'']),['B 2','B 6']);
assert.equal(favoriteKey(q),favoriteKey({...q,lines:[]}));
assert.equal(favoriteKey({...q,lines:['B 2','B 6']}),favoriteKey({...q,lines:['B 6','B 2','B 6']}));
assert.notEqual(favoriteKey(q),favoriteKey({...q,lines:['B 2']}));
assert.equal(queryParams(q).get('limit'),'16');assert.equal(queryParams({...q,lines:allowed}).has('lines'),false);
console.log('Journey line filters OK');
