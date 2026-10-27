
/* VeloxPay interactive DAG; client-side only; references current()/calc() in index.html */
(function(){
"use strict";
const ns="http://www.w3.org/2000/svg";
const palette={VALID:{fill:"#e3f6ed",stroke:"#13936d",ink:"#136f55"},CONDITIONAL:{fill:"#fff3d4",stroke:"#c58c2b",ink:"#865b17"},BLOCKED:{fill:"#fde7e8",stroke:"#bd4954",ink:"#a12f40"},UNVERIFIED:{fill:"#e8eff7",stroke:"#889bb4",ink:"#52657c"},OFF:{fill:"#f7f9fc",stroke:"#d5deea",ink:"#8fa0b3"}};
let view="rules";
const $=id=>document.getElementById(id);
function svgEl(tag,attrs={},parent){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(parent)parent.appendChild(e);return e}
function txt(p,x,y,value,cls,more={}){let e=svgEl("text",{x,y,class:cls,...more},p);e.textContent=value;return e}
function rounded(p,x,y,w,h,label,sub,state,active,click,description){
const col=palette[state]||palette.UNVERIFIED;
const g=svgEl("g",{"class":"node"+(state==="BLOCKED"?" locked":""),tabindex:"0",role:"button","aria-label":label+": "+state},p);
svgEl("rect",{x,y,width:w,height:h,rx:9,fill:col.fill,stroke:col.stroke,class:"node-rect"},g);
svgEl("circle",{cx:x+11,cy:y+15,r:3.6,fill:col.stroke},g);
if(active)svgEl("rect",{x:x+5,y:y+5,width:w-10,height:h-10,rx:7,fill:"none",stroke:col.stroke,"stroke-width":1,"stroke-dasharray":"3 4"},g);
txt(g,x+21,y+19,label,"graph-label",{fill:col.ink});
txt(g,x+13,y+39,sub,"graph-detail",{fill:col.ink});
if(click)g.addEventListener("click",click);
if(click)g.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();click()}});
g.addEventListener("mouseenter",()=>explain(description,label,state));
g.addEventListener("focus",()=>explain(description,label,state));
return g;
}
function explain(d,label,status){const el=$("graphExplanation");if(!el)return;el.innerHTML="";const b=document.createElement("b");b.textContent=label+" · "+status;el.appendChild(b);const p=document.createElement("p");p.textContent=d.text;el.appendChild(p);if(d.link){const a=document.createElement("a");a.href=d.link;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Нормативное основание";el.appendChild(a)}}
function set(id,val){const node=$(id);if(!node)return;node.value=val;node.dispatchEvent(new Event("change",{bubbles:true}));draw()}
function s(id){return $(id).value}
function n(id){return Number(s(id))||0}
function fmt(v){return Number(v||0).toLocaleString("ru-RU",{maximumFractionDigits:1,minimumFractionDigits:1})}
function stageData(o,r){
 const foreign=o.techOwn==="foreign",two=o.structure==="two",sub=two&&o.parent==="subsidiary";
 function opt(label,subtext,v,status,description){return {label,sub:subtext,value:v,status,description}}
 const company=[opt("Одно ООО","Processing + Tech","one","VALID",{text:"Оба направления учитываются в одном ООО: для резидента ОЭЗ действует ограничение на иную деятельность. Налоги считаются одним налогоплательщиком.",link:"https://www.consultant.ru/document/cons_doc_LAW_54599/"}),opt("Два ООО","Функции разделены","two","VALID",{text:"У каждого ООО собственные налоговый режим, выручка, расходы и обязательства. Услуги между ними допустимы при реальном исполнении.",link:"https://www.consultant.ru/document/cons_doc_LAW_19671/"})];
 const own=[opt("Узбекистан","100% иностранный контроль","foreign","VALID",{text:"Российское ООО с иностранным участником допустимо. ИТ-аккредитация и реестр ПО проверяются отдельно.",link:"https://www.consultant.ru/document/cons_doc_LAW_17819/"}),opt("Россия >50%","Реальное управление","russian","CONDITIONAL",{text:"Российский контроль должен быть действительным, а не номинальным. Само большинство не гарантирует аккредитацию, реестр или льготы.",link:"https://www.consultant.ru/document/cons_doc_LAW_427955/"})];
 const acc=[opt("Без аккредитации","ОЭЗ возможна","no","VALID",{text:"Отсутствие ИТ-аккредитации не препятствует резидентству технико-внедренческой ОЭЗ и не закрывает автоматически взносы по ст. 427.",link:"https://www.consultant.ru/document/cons_doc_LAW_28165/"}),opt("ИТ-аккредитация","ПП №1729, п.4 «ж»","yes",foreign?"BLOCKED":"CONDITIONAL",{text:foreign?"Общая процедура ИТ-аккредитации при иностранном контроле более 50% недоступна, кроме установленных исключений.":"Для аккредитации необходимо подтвердить российский контроль и остальные требования ПП №1729, включая вид деятельности.",link:"https://www.consultant.ru/document/cons_doc_LAW_427955/"})];
 const reg=[opt("Без реестра ПО","Льготы ОЭЗ отдельно","no","VALID",{text:"Реестр российского ПО не является обязательным условием любого резидентства ОЭЗ.",link:"https://www.consultant.ru/document/cons_doc_LAW_54599/"}),opt("Реестр ПО","Ст.12.1 №149-ФЗ","yes",foreign?"BLOCKED":"UNVERIFIED",{text:foreign?"Иностранный контроль российского коммерческого правообладателя блокирует обычную процедуру включения ПО в реестр.":"Даже при российском контроле необходимы проверка прав, иностранного вознаграждения и технических характеристик ПО.",link:"https://www.consultant.ru/document/cons_doc_LAW_61798/"})];
 const sez=[opt("Резидент ОЭЗ","Иннополис, ТВД","yes","CONDITIONAL",{text:"Резидентство требует соглашения, профильной технико-внедренческой деятельности, соблюдения лимита иной деятельности и обязательств. Ставка по налогу на прибыль применяется отдельно.",link:"https://www.consultant.ru/document/cons_doc_LAW_54599/"}),opt("Без ОЭЗ","Обычные режимы","no","VALID",{text:"Без резидентства ОЭЗ не возникает право на льготную ставку прибыли резидента. ИТ-аккредитация и реестр ПО при этом независимы.",link:"https://www.consultant.ru/document/cons_doc_LAW_28165/"})];
 const taxes=[opt("ОСНО","Налог на прибыль / НДС","osno","VALID",{text:"Для прибыли от деятельности по соглашению ОЭЗ может применяться специальная ставка при исполнении условий. Необходимо учитывать НДС и вычеты.",link:"https://www.consultant.ru/document/cons_doc_LAW_28165/"}),opt("УСН · доходы","6%, НДС отдельно","usn6","CONDITIONAL",{text:"Требуются соблюдение лимитов УСН и отдельная проверка НДС. Ставка резидента ОЭЗ по налогу на прибыль здесь не применяется.",link:"https://www.consultant.ru/document/cons_doc_LAW_28165/"}),opt("УСН · разница","15%, НДС отдельно","usn15","CONDITIONAL",{text:"Применяются ограничения УСН, подтверждение расходов и самостоятельный режим НДС. Налог на прибыль по статье 284 не рассчитывается.",link:"https://www.consultant.ru/document/cons_doc_LAW_28165/"})];
 const proc=two?[opt("ОСНО Processing","Общий режим","osno","VALID",{text:"Операционная компания самостоятельно учитывает процессинговую комиссию, банковские и технологические расходы, НДС и прибыль.",link:"https://www.consultant.ru/document/cons_doc_LAW_28165/"}),opt("УСН · доходы","Processing 6%","usn6",sub?"BLOCKED":"CONDITIONAL",{text:sub?"При 100% корпоративном участии Technology дочернее ООО в общем случае не вправе применять УСН.":"Условия УСН и НДС проверяются по отдельному налогоплательщику.",link:"https://www.consultant.ru/document/cons_doc_LAW_28165/"}),opt("УСН · разница","Processing 15%","usn15",sub?"BLOCKED":"CONDITIONAL",{text:sub?"Корпоративное владение более 25% в общем случае исключает УСН дочернего ООО.":"Возможность УСН проверяется по доходам, участникам, численности и другим ограничениям.",link:"https://www.consultant.ru/document/cons_doc_LAW_28165/"})]:[opt("Единое ООО","Отдельного режима нет","single","VALID",{text:"Processing и Technology относятся к одному налогоплательщику; отдельная система налогообложения для процессинга невозможна."})];
 const end=[opt("ДОПУСТИМО","Проверка пройдена","VALID","VALID",{text:"Только формальные проверки пройдены. Регуляторные и договорные условия необходимо подтвердить."}),opt("УСЛОВНО","Нужны документы","CONDITIONAL","CONDITIONAL",{text:"Прямых выявленных противоречий нет, но соглашение ОЭЗ, лицензирование и реальные сделки остаются условиями."}),opt("ЗАКРЫТО","Нарушен запрет","BLOCKED","BLOCKED",{text:r.blocks.map(x=>x.short+": "+x.text).join("; ")||"Обнаружено несовместимое ограничение."})];
 return [
 {letter:"A",name:"Число ООО",field:"structure",selected:o.structure,options:company},
 {letter:"B",name:"Контроль Technology",field:"techOwn",selected:o.techOwn,options:own},
 {letter:"C",name:"ИТ-аккредитация",field:"accredited",selected:o.accredited,options:acc},
 {letter:"D",name:"Реестр ПО",field:"registry",selected:o.registry,options:reg},
 {letter:"E",name:"Резидент ОЭЗ",field:"sez",selected:o.sez,options:sez},
 {letter:"F",name:"Налог Technology",field:"techTax",selected:o.techTax,options:taxes},
 {letter:"G",name:"Налог Processing",field:two?"procTax":null,selected:two?o.procTax:"single",options:proc},
 {letter:"H",name:"Правовой итог",field:null,selected:r.valid?(r.issues.length?"CONDITIONAL":"VALID"):"BLOCKED",options:end}
 ];}
function drawRules(){
 let o=current(),r=calc(o),stages=stageData(o,r);
 const w=1760,h=530,boxW=169,boxH=53,shift=217;
 const root=svgEl("svg",{xmlns:ns,viewBox:"0 0 "+w+" "+h,class:"graph-svg",role:"img","aria-label":"Интерактивный направленный граф решений VeloxPay от числа юридических лиц до проверки юридической допустимости"});
 root.appendChild(svgEl("rect",{width:w,height:h,fill:"transparent"}));
 function ylist(total){return total===1?[249]:total===2?[174,325]:[108,249,390]}
 const positions=stages.map((stage,i)=>({x:13+i*shift,items:stage.options.map((opt,j)=>({...opt,y:ylist(stage.options.length)[j],chosen:opt.value===stage.selected}))}));
 const defs=svgEl("defs",{},root);let arrow=svgEl("marker",{id:"veloxArrow",markerWidth:8,markerHeight:8,refX:7,refY:4,orient:"auto"},defs);svgEl("path",{d:"M0 0 L8 4 L0 8 Z",fill:"#159575"},arrow);
 positions.forEach((col,i)=>{if(i===positions.length-1)return;const next=positions[i+1],chosen=col.items.find(x=>x.chosen),chosenNext=next.items.find(x=>x.chosen);if(!chosen||!chosenNext)return;
 const fromX=col.x+boxW,toX=next.x;function curve(a,b,cls){let mid=(fromX+toX)/2;svgEl("path",{d:"M"+fromX+" "+(a.y+boxH/2)+" C"+mid+" "+(a.y+boxH/2)+","+mid+" "+(b.y+boxH/2)+","+toX+" "+(b.y+boxH/2),class:"graph-edge "+cls,...(cls==="active"?{"marker-end":"url(#veloxArrow)"}:{})},root)}
 col.items.filter(x=>!x.chosen).forEach(x=>curve(x,chosenNext,x.status==="BLOCKED"?"blocked":""));
 next.items.filter(x=>!x.chosen).forEach(x=>curve(chosen,x,x.status==="BLOCKED"?"blocked":""));
 curve(chosen,chosenNext,"active");
 });
 positions.forEach((col,i)=>{let stage=stages[i];txt(root,col.x+3,47,stage.letter+" · "+stage.name,"graph-stage-name");txt(root,col.x+3,65,i===stages.length-1?"Терминальный узел":"Нажмите для выбора ветви","graph-stage-sub");
 col.items.forEach(opt=>{
 const state=opt.chosen?opt.status:(opt.status==="BLOCKED"?"BLOCKED":"OFF");
 let click=stage.field?()=>set(stage.field,opt.value):()=>explain(opt.description,opt.label,state);
 rounded(root,col.x,opt.y,boxW,boxH,opt.label,opt.sub,state,opt.chosen,click,opt.description);
 });
 });
 const final=positions[positions.length-1].items.find(x=>x.chosen);if(final)explain(final.description,final.label,final.status);
 const holder=$("graphHolder");holder.replaceChildren(root);
 $("graphNotes").innerHTML=[
 "Выбранная траектория: <b>"+stages.slice(0,-1).map(s=>s.letter+s.options.find(x=>x.value===s.selected).label).join(" → ")+"</b>",
 "Итог: "+(r.valid?"нет автоматической блокировки":"выявлены блокирующие условия")+"; "+r.blocks.length+" BLOCKED, "+r.issues.length+" условных или непроверенных правил."
 ].map(v=>"<span>"+v+"</span>").join("");
 $("graphExport").onclick=()=>download("veloxpay-decision-graph.mmd","text/plain;charset=utf-8",mermaid(stages));
 $("graphSvgExport").onclick=()=>download("veloxpay-decision-graph.svg","image/svg+xml;charset=utf-8",new XMLSerializer().serializeToString(root));
}
function mermaid(stages){
let lines=["flowchart LR","classDef valid fill:#e3f6ed,stroke:#13936d,color:#136f55;","classDef conditional fill:#fff3d4,stroke:#c58c2b,color:#865b17;","classDef blocked fill:#fde7e8,stroke:#bd4954,color:#a12f40;","classDef inactive fill:#f7f9fc,stroke:#d5deea,color:#8393a8;"];
stages.forEach((s,i)=>s.options.forEach((v,j)=>{const id=s.letter+j;const name=(s.letter+": "+v.label).replace(/"/g,"'");lines.push(id+'["'+name+'"]');lines.push("class "+id+" "+(v.chosen?v.status.toLowerCase():(v.status==="BLOCKED"?"blocked":"inactive"))+";")}));
for(let i=0;i<stages.length-1;i++){let a=stages[i],b=stages[i+1],ia=a.options.findIndex(x=>x.value===a.selected),ib=b.options.findIndex(x=>x.value===b.selected);lines.push(a.letter+ia+" ==> "+b.letter+ib);b.options.forEach((v,j)=>{if(j!==ib)lines.push(a.letter+ia+" -.-> "+b.letter+j)})}
return lines.join("\n");
}
function download(name,type,content){const a=document.createElement("a");const url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
function moneyNode(svg,x,y,w,h,title,subtitle,type){const c=palette[type||"UNVERIFIED"];svgEl("rect",{x,y,width:w,height:h,rx:12,fill:c.fill,stroke:c.stroke,"stroke-width":1.5},svg);txt(svg,x+14,y+25,title,"graph-label",{fill:c.ink});txt(svg,x+14,y+45,subtitle,"graph-detail",{fill:c.ink})}
function moneyLine(svg,x1,y1,x2,y2,label,value,cl){const c=palette[cl]||palette.VALID;svgEl("path",{d:"M"+x1+" "+y1+" L"+x2+" "+y2,fill:"none",stroke:c.stroke,"stroke-width":2.8,"marker-end":"url(#moneyarrow)"},svg);if(label)txt(svg,(x1+x2)/2,(y1+y2)/2-17,label,"graph-detail",{fill:c.ink,"text-anchor":"middle"});if(value!==undefined)txt(svg,(x1+x2)/2,(y1+y2)/2-4,fmt(value)+" млн ₽","graph-detail",{fill:c.ink,"text-anchor":"middle","font-weight":700})}
function drawMoney(){
 let o=current(),r=calc(o),two=r.two;
 const root=svgEl("svg",{xmlns:ns,viewBox:"0 0 980 560",class:"graph-svg money",role:"img","aria-label":"Схема движения денежных средств между узбекскими учредителями, технологической, процессинговой компанией и бюджетом России"});
 const defs=svgEl("defs",{},root);const marker=svgEl("marker",{id:"moneyarrow",markerWidth:8,markerHeight:8,refX:7,refY:4,orient:"auto"},defs);svgEl("path",{d:"M0 0 L8 4 L0 8 Z",fill:"#298578"},marker);
 moneyNode(root,30,45,236,65,"Инвесторы / Узбекистан","Вклад "+fmt(n("capital"))+" млн ₽","CONDITIONAL");
 moneyNode(root,30,345,236,67,"Внешние клиенты","Technology: "+fmt(n("techSales"))+" млн ₽","UNVERIFIED");
 moneyNode(root,375,160,250,72,two?"VeloxPay Technology":"VeloxPay — единое ООО","ОЭЗ: "+(o.sez==="yes"?"да":"нет")+" · "+o.techTax,"VALID");
 if(two)moneyNode(root,375,352,250,72,"Processing","Комиссии + marketplace: "+fmt(r.rp),"CONDITIONAL");
 moneyNode(root,747,155,211,73,"Бюджет / РФ","Налоги + взносы","UNVERIFIED");
 moneyNode(root,747,354,211,73,"Собственники / Узб.","Условные выплаты: "+fmt(r.uz),"CONDITIONAL");
 moneyLine(root,266,85,375,196,"Капитал",two?r.capT:n("capital"),"VALID");
 if(two)moneyLine(root,266,99,375,385,"Капитал Processing",r.capP,"CONDITIONAL");
 moneyLine(root,266,376,two?375:375,two?384:207,two?"GMV не выручка":"Выручка",two?r.rp:n("techSales"),"VALID");
 if(two){moneyLine(root,500,350,500,233,"Услуги Technology",r.inter,"CONDITIONAL");moneyLine(root,625,384,748,384,"Налоговый результат",r.taxP+r.cP+(Number.isFinite(r.pv)?r.pv:0),"CONDITIONAL")}
 moneyLine(root,625,196,748,196,"Налоговый результат",r.taxT+r.cT+(Number.isFinite(r.tv)?r.tv:0),"CONDITIONAL");
 moneyLine(root,625,220,748,374,"Дивиденды",r.distT,"CONDITIONAL");
 txt(root,33,494,"GMV = "+fmt(n("gmv"))+" млн ₽: оборот клиентов не признаётся выручкой автоматически.","graph-detail",{fill:"#52667f"});
 txt(root,33,515,"Внутригрупповые платежи — только за подтверждённые услуги, права и результаты.","graph-detail",{fill:"#52667f"});
 $("graphHolder").replaceChildren(root);$("graphNotes").innerHTML="<span>Выручка группы: <b>"+fmt(r.externalRevenue)+" млн ₽</b></span><span>Налоги и взносы: <b>"+fmt(r.taxes)+" млн ₽</b></span><span>Чистая прибыль: <b>"+fmt(r.groupNet)+" млн ₽</b></span>";
 $("graphExport").onclick=()=>download("veloxpay-scenario.json","application/json",JSON.stringify({inputs:o,calc:r},null,2));
 $("graphSvgExport").onclick=()=>download("veloxpay-money-flow.svg","image/svg+xml;charset=utf-8",new XMLSerializer().serializeToString(root));
 explain({text:"Все величины зависят от сценарных вводных. При фактическом иностранном контроле и прямом владении доли узбекских собственников в дивидендах отличаются от ситуации с российским большинством."},"Финансовые потоки","CONDITIONAL")
}
function draw(){if(!$("graphHolder")||typeof current!=="function"||typeof calc!=="function")return;if(view==="money")drawMoney();else drawRules();}
function init(){let main=document.querySelector("main"),old=$("path");if(!main||!old)return;const anchor=old.closest("section");const section=document.createElement("section");section.className="card";section.innerHTML='<div class="graph-toolbar"><div><h2 style="margin:0 0 3px">Граф решений VeloxPay</h2><div class="micro">Интерактивная карта условий A–H и денежных потоков</div></div><div class="graph-tabs" role="tablist"><button type="button" id="graphRules" role="tab" aria-selected="true">Юридический DAG</button><button type="button" id="graphMoney" role="tab" aria-selected="false">Денежные потоки</button></div></div><div class="graph-legend"><span><i class="graph-key" style="background:#13936d"></i>VALID</span><span><i class="graph-key" style="background:#c58c2b"></i>CONDITIONAL</span><span><i class="graph-key" style="background:#bd4954"></i>BLOCKED</span><span><i class="graph-key" style="background:#889bb4"></i>UNVERIFIED / не выбрано</span></div><div class="graph-scroller" id="graphHolder"></div><div class="graph-flags" id="graphNotes"></div><div class="graph-explanation" id="graphExplanation"></div><div class="actions"><button class="graph-export" id="graphExport" type="button">Скачать Mermaid / JSON</button><button class="graph-export" id="graphSvgExport" type="button">Скачать SVG</button></div><p class="graph-help">Выберите узел на графе — соответствующий параметр слева изменится, а налоги пересчитаются. Красные альтернативы остаются видимыми. Для подграфов финансирования и трансграничных выплат представлен сценарный расчёт, не формальное юридическое разрешение.</p>';
 main.insertBefore(section,anchor);
 $("graphRules").onclick=()=>{view="rules";$("graphRules").setAttribute("aria-selected","true");$("graphMoney").setAttribute("aria-selected","false");draw()};
 $("graphMoney").onclick=()=>{view="money";$("graphRules").setAttribute("aria-selected","false");$("graphMoney").setAttribute("aria-selected","true");draw()};
 document.querySelectorAll("aside input,aside select").forEach(el=>{el.addEventListener("input",draw);el.addEventListener("change",draw)});
 $("reset").addEventListener("click",draw);
 draw();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
