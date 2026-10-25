'use strict';
/* DOM-free browser-UI smoke test. Exercises initial render, diameter filtering and full recalculation
   with a lightweight fake canvas; catches undefined render globals such as PI. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
require('./model.js');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const match=html.match(/<script src="model\.js"><\/script><script>([\s\S]*?)<\/script>/);
assert.ok(match,'inline app script exists');
const values={dMax:'100',hMax:'100',bMin:'10',eMax:'8',rfMode:'all',
 scenario:'nominal',feedFactor:'1',conductivity:'.004',lossTangent:'.030',xi:'.46',T2star:'2'};
const timers=[],els=new Map();
const ctx=new Proxy({}, {get(t,p){return p in t?t[p]:(()=>{});},set(t,p,v){t[p]=v;return true;}});
function element(id){
 if(els.has(id))return els.get(id);
 const el={id,value:values[id]??'',textContent:'',innerHTML:'',disabled:false,
  width:0,height:0,clientWidth:650,clientHeight:420,handlers:{},
  addEventListener(ev,fn){this.handlers[ev]=fn;},
  querySelectorAll(){return [];},getContext(){return ctx;},
  setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:650,height:420};}};
 els.set(id,el);return el;
}
global.window=globalThis;global.window.devicePixelRatio=1;
global.window.addEventListener=()=>{};
global.document={getElementById:element};
global.alert=(msg)=>{throw Error('Unexpected alert: '+msg)};
global.setTimeout=(f)=>{timers.push(f);return timers.length};
vm.runInThisContext(match[1],{filename:'v4/index-inline.js'});
assert.equal(timers.length,1,'recalc scheduled');
timers.shift()();
assert.match(element('status').textContent,/^Готово:/,'initial 5000 model and canvas redraw');
assert.ok(Number(element('count').textContent.replace(/[^0-9]/g,''))>0,'results visible');
assert.notEqual(element('besterror').textContent,'—');
element('dMax').value='90';
element('dMax').handlers.input();
assert.ok(Number(element('count').textContent.replace(/[^0-9]/g,''))>0,'diameter filtering works');
element('rebuild').onclick();
assert.equal(timers.length,1,'rebuild scheduled');
timers.shift()();
assert.match(element('status').textContent,/^Готово:/,'full recalculation after diameter update');
assert.ok(element('chosen').innerHTML.includes('Среднее насыщение ESR'),'physics diagnostics displayed');
console.log(JSON.stringify({result:'PASS',diameter:90,filtered:Number(element('count').textContent.replace(/[^0-9]/g,'')),status:element('status').textContent}));
