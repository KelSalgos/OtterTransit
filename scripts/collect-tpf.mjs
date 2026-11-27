import {readFileSync,writeFileSync} from 'node:fs';
import {parseTpfText} from './tpf-parse.mjs';
const text=readFileSync(0,'utf8');
const result=parseTpfText(text);
writeFileSync(process.argv[2]||'alerts.json',JSON.stringify(result,null,2)+'\n');
console.log('TPF traffic collection:',result.status,'explicit line count:',result.alerts.flatMap(x=>x.lines).length);
