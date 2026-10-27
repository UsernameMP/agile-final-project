"use strict";
const SVG_NS="http://www.w3.org/2000/svg";
let selectedFlow="interco";
const el=(name,attrs,parent)=>{let node=document.createElementNS(SVG_NS,name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));if(parent)parent.appendChild(node);return node};
function label(parent,x,y,string,opts={}){
 const t=el("text",{x,y,fill:opts.color||"#304761","font-size":opts.size||12,"font-weight":opts.bold?750:550,"text-anchor":opts.anchor||"middle"},parent);t.textContent=string;return t
}
function box(svg,x,y,w,h,head,detail,tone="blue",handle=null){
 const colors={blue:["#edf5ff","#2b68b6"],mint:["#ecf9f5","#118d79"],amber:["#fff7e7","#aa792b"],gray:["#f2f6fa","#7087a2"],red:["#fff0f0","#b14350"]};
 const [bg,stroke]=colors[tone];
 let g=el("g",{"role":"button","tabindex":"0","aria-label":head,"style":"cursor:pointer"},svg);
 el("rect",{x,y,width:w,height:h,rx:11,fill:bg,stroke,"stroke-width":1.7},g);
 label(g,x+w/2,y+27,head,{size:14,bold:true,color:"#213a56"});
 label(g,x+w/2,y+48,detail,{size:11,color:"#536d85"});
 if(handle){g.addEventListener("click",()=>activate(handle));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate(handle)}})}
 return g
}
function connection(svg,d,title,sub,x,y,handle,kind="main"){
 let col=kind==="main"?"#0b9781":kind==="foreign"?"#4d78ad":"#bd8b42";
 let g=el("g",{"role":"button","tabindex":"0","aria-label":title,"style":"cursor:pointer"},svg);
 el("path",{d,stroke:col,fill:"none","stroke-width":kind==="main"?2.8:2.1,"marker-end":"url(#ar"+kind+")"},g);
 el("rect",{x:x-90,y:y-18,width:180,height:36,rx:7,fill:"#fff",stroke:"#dfe8f1"},g);
 label(g,x,y-2,title,{size:11,bold:true,color:"#1e4263"});
 label(g,x,y+11,sub,{size:10,color:"#63809a"});
 if(handle){g.addEventListener("click",()=>activate(handle));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate(handle)}})}
 return g
}
function activate(id){
 selectedFlow=id;const input=$(id);
 if(!input)return;
 document.querySelectorAll("#flow .active").forEach(x=>x.classList.remove("active"));
 input.scrollIntoView({behavior:"smooth",block:"center"});
 input.focus({preventScroll:true});
 const labelElement=document.querySelector('label[for="'+id+'"]');
 const text=input.closest(".field")?.querySelector("label")?.textContent||id;
 const panel=$("flowEditor");panel.replaceChildren();
 let lbl=document.createElement("label");lbl.textContent=text;lbl.htmlFor="flowProxy";panel.appendChild(lbl);
 let proxy=document.createElement("input");proxy.id="flowProxy";proxy.type="number";proxy.min=input.min||0;proxy.max=input.max||"";proxy.step=input.step||"any";proxy.value=input.value;
 proxy.oninput=()=>{input.value=proxy.value;input.dispatchEvent(new Event("input",{bubbles:true}))};panel.appendChild(proxy);
 let hint=document.createElement("span");hint.className="micro";hint.textContent="Параметр связан с моделью";panel.appendChild(hint);
}
function drawFlow(o,r){
 const s=$("flow");s.replaceChildren();const defs=el("defs",{},s);
 [["main","#0b9781"],["foreign","#4d78ad"],["minor","#bd8b42"]].forEach(([id,c])=>{let m=el("marker",{id:"ar"+id,viewBox:"0 0 10 10",refX:9,refY:5,markerWidth:7,markerHeight:7,orient:"auto"},defs);el("path",{d:"M0 0 L10 5 L0 10Z",fill:c},m)});
 const two=r.two;
 // nodes
 box(s,390,10,285,57,"Узбекистан / инвесторы","Вклад: "+rub(val(o,"capital"))+" · займы: "+rub(val(o,"loanT")+val(o,"loanP")),"gray","capital");
 box(s,22,201,260,70,"Заказчики Technology","Разработка • лицензии • поддержка","gray","dev");
 box(s,22,342,260,77,"Клиенты / банк-партнёр","GMV: "+rub(val(o,"gmv"))+" млн ₽","blue","gmv");
 box(s,385,157,300,85,two?"VeloxPay Technology":"VeloxPay · единое ООО","Выручка извне: "+rub(r.techExt)+" млн ₽",r.blocked?"amber":"mint","dev");
 if(two)box(s,385,334,300,87,"Processing · операционное ООО","Собственная комиссия: "+rub(r.procExt)+" млн ₽","blue","fee");
 box(s,810,156,218,82,"Бюджет РФ","Налоги: "+rub(r.taxRf)+" млн ₽","gray","taxT");
 box(s,810,343,218,86,"Узбекские собственники","На руки: "+rub(r.receivedUz)+" млн ₽","amber","payout");
 connection(s,"M532 67 L532 157","Капитал / займ",rub(r.capT+val(o,"loanT"))+" млн ₽",540,112,"capital","foreign");
 if(two)connection(s,"M650 67 Q735 80 700 340 L681 368","Капитал Processing",rub(r.capP+val(o,"loanP"))+" млн ₽",784,92,"capitalShare","foreign");
 connection(s,"M282 235 L385 205","Внешняя выручка",rub(r.techExt)+" млн ₽",332,182,"dev","main");
 if(two){
 connection(s,"M282 379 L385 378","Комиссии/сервисы",rub(r.procExt)+" млн ₽",333,354,"fee","main");
 connection(s,"M530 334 L530 242","Услуги и лицензии",rub(r.inter)+" млн ₽",622,289,"interco","main");
 connection(s,"M685 378 Q790 380 810 380","Налоги Processing",rub(r.profitTaxP+r.vatP+r.contribP)+" млн ₽",785,460,"taxP","minor");
 }else{
 connection(s,"M282 380 Q338 381 399 242","Процессинг внутри ООО",rub(r.procExt)+" млн ₽",347,314,"fee","main");
 }
 connection(s,"M685 195 L810 195","Налоги Technology",rub(r.profitTaxT+r.vatT+r.contribT)+" млн ₽",750,139,"vatT","minor");
 connection(s,"M685 218 Q747 276 810 367","Дивиденды / займы",rub(r.receivedUz)+" млн ₽",758,304,"payout","foreign");
 if(val(o,"royalty")+val(o,"foreignSvc")>0)connection(s,"M610 157 Q715 102 675 67","Трансграничные услуги",rub(val(o,"royalty")+val(o,"foreignSvc"))+" млн ₽",777,54,"royalty","foreign");
 label(s,21,475,"GMV ≠ выручка: в расчёт включены только собственные комиссионные и технологические доходы.",{size:11,anchor:"start",color:"#617894"});
}
function metric(name,number,desc,accent=false,negative=false){return '<div class="metric '+(accent?"accent ":"")+(negative?"negative":"")+'"><small>'+name+'</small><strong>'+rub(number)+'</strong><em>'+desc+'</em></div>'}
function cell(v){return Number.isFinite(v)?rub(v):"—"}
function tr(label,T,P,G,kind=""){return '<tr class="'+kind+'"><td>'+label+'</td><td>'+cell(T)+'</td><td>'+cell(P)+'</td><td>'+cell(G)+'</td></tr>'}
function resultsTable(o,r){
 let html="";
 html+=tr("Внешняя выручка",r.two?r.techSales-r.inter:r.totalSales,r.two?r.procSales:0,r.totalSales,"subtotal");
 html+=tr("Внутренние продажи / покупки",r.two?r.inter:0,r.two?-r.inter:0,0);
 html+=tr("Операционные расходы (без ФОТ)",r.costsT,r.costsP,r.costsT+r.costsP);
 html+=tr("Заработная плата",r.two?val(o,"payT"):val(o,"payT")+val(o,"payP"),r.two?val(o,"payP"):0,val(o,"payT")+val(o,"payP"));
 html+=tr("Страховые взносы",r.contribT,r.contribP,r.contribT+r.contribP);
 html+=tr("Проценты + роялти + иностранные услуги",r.interestT+val(o,"royalty")+val(o,"foreignSvc"),r.interestP,r.interestT+r.interestP+val(o,"royalty")+val(o,"foreignSvc"));
 html+=tr("Прибыль до налога",r.profitT,r.profitP,r.profitT+r.profitP,"subtotal");
 html+=tr("Налог на прибыль / УСН",r.profitTaxT,r.profitTaxP,r.profitTaxT+r.profitTaxP);
 html+=tr("НДС начисленный",r.outVatT,r.outVatP,r.outVatT+r.outVatP);
 html+=tr("НДС к вычету",r.inputVatT,r.inputVatP,r.inputVatT+r.inputVatP);
 html+=tr("НДС к уплате / (возмещению)",r.vatT,r.vatP,r.vatT+r.vatP);
 html+=tr("Чистая прибыль",r.netT,r.netP,r.netT+r.netP,"total");
 html+=tr("Вклад + займы",r.capT+val(o,"loanT"),r.capP+(r.two?val(o,"loanP"):0),val(o,"capital")+val(o,"loanT")+(r.two?val(o,"loanP"):0));
 html+=tr("Остаток после распределения",r.availableT,r.availableP,r.cashGroup,"subtotal");
 html+=tr("Налог РФ с дивидендов узбекских участников",r.whtDividend,0,r.whtDividend);
 html+=tr("Другие удержания с выплат",r.taxInterest+r.taxRoyalty+r.russianHoldTax,0,r.taxInterest+r.taxRoyalty+r.russianHoldTax);
 html+=tr("Налог Узбекистана — допущение",r.uzIncomeTax,0,r.uzIncomeTax);
 html+=tr("НАЛОГИ РФ + УЗБЕКИСТАН, включая НДС",r.taxAll,0,r.taxAll,"total");
 html+=tr("Деньги узбекским собственникам",r.receivedUz,0,r.receivedUz,"total");
 $("taxTable").querySelector("tbody").innerHTML=html;
}
function bars(r){
 let data=[["Налог на прибыль / УСН",r.profitTaxT+r.profitTaxP,"#4278d0"],["НДС к уплате",r.vatT+r.vatP,"#159b8f"],["Страховые взносы",r.contribT+r.contribP,"#d3a347"],["Удержания / иностранный налог",r.whtDividend+r.taxInterest+r.taxRoyalty+r.uzIncomeTax+r.russianHoldTax,"#9178b9"]];
 let max=Math.max(1,...data.map(x=>Math.max(0,x[1])));
 $("bars").innerHTML=data.map(a=>'<div class="tax-bar"><label>'+a[0]+'</label><strong>'+rub(a[1])+' млн ₽</strong><div class="bar-track"><div class="bar-fill" style="background:'+a[2]+';width:'+Math.min(100,positive(a[1])/max*100)+'%"></div></div></div>').join("");
}
function cash(o,r){
 const months=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
 const values=r.months.map(m=>m.group),max=Math.max(1,...values.map(v=>Math.abs(v)));
 $("cashChart").innerHTML=r.months.map((m,i)=>'<div class="cash-month '+(m.group<0?"negative":"")+'" title="'+months[i]+": "+rub(m.group)+' млн ₽"><div style="height:'+Math.max(3,Math.abs(m.group)/max*124)+'px"></div><span>'+months[i]+'</span></div>').join("");
 $("cashTable").querySelector("tbody").innerHTML=r.months.map((m,i)=>tr(months[i],m.T,m.P,m.group,i===11?"total":"")).join("");
 const worst=Math.min(...values);
 $("cashInfo").className="state "+(worst<0?"bad":"good");$("cashInfo").textContent=worst<0?"Дефицит: "+rub(worst)+" млн ₽":"Мин. остаток: "+rub(worst)+" млн ₽";
}
function legal(o,r){
 const stateLabel={VALID:"VALID",CONDITIONAL:"CONDITIONAL",BLOCKED:"BLOCKED",UNVERIFIED:"UNVERIFIED"};
 let checks=r.issues.concat([{state:"VALID",title:"Участие иностранного собственника",description:"Иностранный участник вправе владеть обычным российским ООО; аккредитация и реестр ПО имеют отдельные критерии.",source:LINK.tax}]);
 checks.sort((a,b)=>({BLOCKED:0,CONDITIONAL:1,UNVERIFIED:2,VALID:3})[a.state]-({BLOCKED:0,CONDITIONAL:1,UNVERIFIED:2,VALID:3})[b.state]);
 $("legalChecks").innerHTML=checks.map(c=>'<div class="check '+c.state.toLowerCase()+'"><b>'+stateLabel[c.state]+' · '+c.title+'</b><p>'+c.description+'</p>'+(c.source?'<a href="'+c.source+'" target="_blank" rel="noopener">Нормативное основание</a>':"")+'</div>').join("");
 let blockers=checks.filter(x=>x.state==="BLOCKED");
 $("overallStatus").className="state "+(blockers.length?"bad":"warn");
 $("overallStatus").textContent=blockers.length?"BLOCKED · "+blockers.length:"CONDITIONAL";
 $("warnings").innerHTML=blockers.length?blockers.map(x=>'<div class="warning error">'+x.title+": "+x.description+"</div>").join(""):'<div class="warning info">Правовые запреты из реализованных проверок не сработали. Это не подтверждение банковского допуска и всех льгот.</div>';
}
function comparison(o,r){
 let scenarios=[
 {title:"Выбранная конфигурация",o:{...o}},
 {title:"Два ООО · ОСНО / ОЭЗ",o:{...o,structure:"two",parent:"direct",sez:"yes",taxT:"osno",taxP:"osno",vatT:"22",vatP:"22",accredited:"no",registry:"no",licenseExempt:"no"}},
 {title:"Одно ООО · ОСНО / ОЭЗ",o:{...o,structure:"one",sez:"yes",taxT:"osno",vatT:"22",accredited:"no",registry:"no",licenseExempt:"no"}}
 ];
 $("alternatives").innerHTML=scenarios.map((s,i)=>{
 const q=result(s.o);
 return '<div class="alt '+(q.blocked?"blocked":"")+'"><h3>'+s.title+'</h3><span class="state '+(q.blocked?"bad":"warn")+'">'+(q.blocked?"BLOCKED":"CONDITIONAL")+'</span><div class="row"><span>Налоги группы</span><b>'+rub(q.taxAll)+'</b></div><div class="row"><span>Узбекским владельцам</span><b>'+rub(q.receivedUz)+'</b></div><div class="row"><span>Проблемы</span><b>'+q.issues.filter(x=>x.state==="BLOCKED").length+'</b></div><div class="muted">'+(q.blocked?"Экономика не входит в рейтинг допустимых вариантов.":"Сценарная оценка, нужна юридическая проверка.")+'</div>'+(i?'<button type="button" data-alt="'+i+'">Выбрать и пересчитать</button>':"")+'</div>';
 }).join("");
 document.querySelectorAll("[data-alt]").forEach(button=>button.onclick=()=>{
 const sc=scenarios[Number(button.dataset.alt)].o;
 IDLIST.forEach(key=>{if(sc[key]!==undefined&&$(key))$(key).value=sc[key]});
 render();
 window.scrollTo({top:0,behavior:"smooth"});
 });
}
function render(){
 let o=gather(),r=result(o);
 $("metrics").innerHTML=metric("GMV клиентских операций",val(o,"gmv"),"млн ₽ · не выручка")+metric("Собственная выручка",r.totalSales,"млн ₽ · без внутреннего оборота")+metric("Налоги в РФ",r.taxRf,"млн ₽ · в т.ч. НДС")+metric("Налоговая нагрузка РФ + Узб.",r.taxAll,"млн ₽ · по допущениям")+metric("Узбекским собственникам",r.receivedUz,"млн ₽ · включая возврат займа",true,r.receivedUz<0);
 drawFlow(o,r);resultsTable(o,r);bars(r);cash(o,r);legal(o,r);comparison(o,r);
 $("procOwn").disabled=o.parent==="subsidiary"&&o.structure==="two";
 $("procUz").disabled=o.parent==="subsidiary"&&o.structure==="two"||o.procOwn==="foreign"||o.structure==="one";
 $("techUz").disabled=o.techOwn==="foreign";
 $("parent").disabled=o.structure==="one";
 $("taxP").disabled=o.structure==="one";$("vatP").disabled=o.structure==="one";
}
IDLIST.forEach(k=>initial[k]=$(k).value);
IDLIST.forEach(k=>{$(k).addEventListener("input",render);$(k).addEventListener("change",render)});
$("reset").onclick=()=>{IDLIST.forEach(k=>$(k).value=initial[k]);render()};
$("download").onclick=()=>{let payload={version:"2.0",asOf:"2026-10-27",inputs:gather(),output:result(gather())};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});let url=URL.createObjectURL(blob);let a=document.createElement("a");a.href=url;a.download="veloxpay-scenario-"+gather().year+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
render();
