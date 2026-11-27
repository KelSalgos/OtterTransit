import assert from 'node:assert/strict';import {normalize,visible,countdown,timestamp} from './core.mjs';
const t='2026-11-26T17:35:00+0100',ms=Date.parse('2026-11-26T16:35:00Z');assert.equal(timestamp(t),ms);
const a=normalize({number:'1',to:'Marly',stop:{departure:t,delay:null,platform:'B'}});assert.equal(a.live,false);assert.equal(a.effective,ms);
const b=normalize({number:'2',to:'Gare',stop:{departure:t,delay:3,platform:'A',prognosis:{platform:'C'}}});assert.equal(b.effective,ms+180000);assert.equal(b.platformChanged,true);assert.equal(b.delay,3);
const c=normalize({cancelled:true,stop:{departure:t,prognosis:{departure:'2026-11-26T17:37:00+01:00'}}});assert.equal(c.cancelled,true);assert.equal(c.delay,2);
assert.deepEqual(visible([b,a],'1',ms-1000),[a]);assert.equal(visible([a],'',ms+61000).length,0);assert.equal(countdown(ms,ms-61000),'2 min');assert.equal(normalize({}).effective,null);console.log('Tests core OK');

import {routeOptions,routeVisible,routeKey,migrateFavorites,selectionsFromRoute,toggleLine,setDirection} from './core.mjs';
const routes=[{...a,line:'2',to:'Schönberg',effective:ms+180000},{...a,line:'2',to:'Villars'},{...a,line:'10',to:'Gare',effective:ms+60000},{...a,line:'10',to:'Autre'},{...a,line:'3',to:'Gare'}];
let selection=toggleLine([],'2');selection=setDirection(selection,'2','Schönberg');selection=toggleLine(selection,'10');selection=setDirection(selection,'10','Gare');
assert.deepEqual(routeOptions(routes,selection).lines,['2','3','10']);
assert.deepEqual(routeOptions(routes,selection).destinations('2'),['Schönberg','Villars']);
assert.deepEqual(routeVisible(routes,selection,ms-1000),[routes[2],routes[0]]);
assert.deepEqual(routeOptions([],selection).destinations('10'),['Gare']);
assert.deepEqual(routeVisible(routes,toggleLine(selection,'2'),ms-1000),[routes[2]]);
assert.equal(routeVisible(routes,toggleLine(selection,''),ms-1000).length,5);
assert.deepEqual(routeVisible(routes,setDirection([],'','Gare'),ms-1000),[routes[4],routes[2]]);
assert.equal(routeKey({id:'1',selections:selection}),routeKey({id:'1',selections:[...selection].reverse()}));
assert.equal(routeKey({id:'1',line:'2',direction:'Villars'}),routeKey({id:'1',selections:[{line:'2',direction:'Villars'}]}));
assert.notEqual(routeKey({id:'1',line:'2',direction:'Villars'}),routeKey({id:'1',line:'2',direction:'Schönberg'}));
assert.deepEqual(migrateFavorites([{id:1,name:'Gare'}]),[{id:'1',name:'Gare',mode:'bus',selections:[],label:''}]);
assert.deepEqual(migrateFavorites([{id:1,name:'Gare',line:'2',direction:'Villars',label:'Soir'}])[0].selections,[{line:'2',direction:'Villars'}]);
assert.deepEqual(selectionsFromRoute({direction:'Gare'}),[{line:'',direction:'Gare'}]);
assert.deepEqual(selectionsFromRoute({line:'2',direction:'Gare'}),[{line:'2',direction:'Gare'}]);
console.log('Tests multi-lignes OK');

// Horizon uses estimated departure, inclusive at 35 minutes, and hides past departures.
const windowRows=[-1,0,30,35,35.01,367].map(m=>({...a,effective:ms+m*60000}));
assert.deepEqual(routeVisible(windowRows,[],ms),windowRows.slice(1,4));
assert.equal(routeVisible([{...b,effective:ms+36*60000}],[],ms).length,0);
assert.equal(routeVisible([{...b,effective:ms+35*60000}],[],ms).length,1);
assert.deepEqual(routeOptions([{...a,line:'42',effective:ms+367*60000}],[]).lines,['42']);
console.log('Tests horizon 35 min OK');
