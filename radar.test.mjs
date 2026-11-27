import assert from 'node:assert/strict';
import {decode,prepare,position,matches,activeSegments} from './radar-core.mjs';
const s=prepare({trip:'a',name:'B 2',mode:'BUS',from:{lat:46,lon:7},to:{lat:48,lon:7},departure:'2026-11-27T08:00:00Z',arrival:'2026-11-27T08:10:00Z'});
assert.deepEqual(position(s,s.start+300000),[47,7]);
assert.equal(matches(s,'bus','2, 6'),true);assert.equal(matches(s,'bus','12'),false);assert.equal(matches(s,'train','2'),false);
assert.equal(activeSegments([s,s],s.start,'all','').length,1);assert.equal(activeSegments([s],s.end+1,'all','').length,0);
assert.deepEqual(decode('~'),[]);assert.equal(prepare({trip:'x'}),null);
assert.equal(decode('_p~iF~ps|U_ulLnnqC_mqNvxq`@').length,3);
console.log('Radar core OK');
