import assert from 'node:assert/strict';import {normalize,visible,countdown,timestamp} from './core.mjs';
const t='2026-11-26T17:35:00+0100',ms=Date.parse('2026-11-26T16:35:00Z');assert.equal(timestamp(t),ms);
const a=normalize({number:'1',to:'Marly',stop:{departure:t,delay:null,platform:'B'}});assert.equal(a.live,false);assert.equal(a.effective,ms);
const b=normalize({number:'2',to:'Gare',stop:{departure:t,delay:3,platform:'A',prognosis:{platform:'C'}}});assert.equal(b.effective,ms+180000);assert.equal(b.platformChanged,true);assert.equal(b.delay,3);
const c=normalize({cancelled:true,stop:{departure:t,prognosis:{departure:'2026-11-26T17:37:00+01:00'}}});assert.equal(c.cancelled,true);assert.equal(c.delay,2);
assert.deepEqual(visible([b,a],'1',ms-1000),[a]);assert.equal(visible([a],'',ms+61000).length,0);assert.equal(countdown(ms,ms-61000),'2 min');assert.equal(normalize({}).effective,null);console.log('Tests core OK');
