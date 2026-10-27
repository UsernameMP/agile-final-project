
"use strict";
const source={
acc:"https://www.consultant.ru/document/cons_doc_LAW_427955/42c42ffc697636ca1815956dc3ef70fd63c4defc/",
registry:"https://www.consultant.ru/document/cons_doc_LAW_61798/",
sez:"https://www.consultant.ru/document/cons_doc_LAW_54599/c2659f37bc1799afc11854330bb5b7969e54df2f/",
social:"https://www.consultant.ru/document/cons_doc_LAW_28165/c5c16c86f95c5db63601047b1c0a5942bd77c824/",
usn:"https://www.consultant.ru/document/cons_doc_LAW_28165/a1d86f7078e645869b02fde85e8c972193557dee/",
vat:"https://www.nalog.gov.ru/rn77/taxation/taxes/nds/16601302/",
bank:"https://www.consultant.ru/document/cons_doc_LAW_115625/",
tax:"https://www.consultant.ru/document/cons_doc_LAW_28165/",
corporate:"https://www.consultant.ru/document/cons_doc_LAW_17819/"
};
const questions=[
{id:"bank",name:"Правовая роль Processing и банк-партнёр",type:"open",rule:"161-ФЗ: право осуществлять переводы денежных средств и функции платёжного агрегатора зависит от регулируемой роли.",proof:"Договоры с банками, схема маршрута платежа, распределение функций, обязанности по идентификации и хранению данных.",why:"Может изменить всю структуру выручки и обязанности по лицензированию.",src:"bank"},
{id:"vat",name:"НДС на процессинговые комиссии с 2026 года",type:"known",rule:"Освобождение для определённых услуг карточного процессинга и информационно-технологического взаимодействия отменено с 01.01.2026.",proof:"Карта продуктов OSON, предмет каждого договора, получатель комиссии и характер услуги.",why:"Прямое воздействие на маржу и цену договоров.",src:"vat"},
{id:"sez",name:"Профильная деятельность резидента ОЭЗ",type:"known",rule:"116-ФЗ, ст. 10: доход от иной деятельности не более 10% общего объёма доходов резидента, с дополнительными условиями.",proof:"Соглашение об осуществлении ТВД, план работ, расходы на разработку, классификация доходов, учёт.",why:"Определяет допустимость совмещения функций в одном ООО.",src:"sez"},
{id:"acc",name:"ИТ-аккредитация и иностранный контроль",type:"dynamic",rule:"ПП № 1729, п. 4 подп. «ж»: обычная процедура требует российского контроля более 50% для непубличной организации; отдельно существуют исключения.",proof:"ЕГРЮЛ, цепочка участников, контроль голосов, права управления, документы об исключении.",why:"Аккредитация сама по себе не равна праву на каждую льготу.",src:"acc"},
{id:"registry",name:"Реестр российского ПО",type:"dynamic",rule:"149-ФЗ, ст. 12.1: предусмотрены контроль российского коммерческого правообладателя, требования к исключительным правам и иностранным платежам.",proof:"Правообладатель ПО, исходный код, цепочка прав, иностранные платежи, описание финансовых функций.",why:"Возможность отдельных НДС-преференций, но не всей структуры.",src:"registry"},
{id:"social",name:"Пониженные взносы: 70% ИТ-доходов",type:"known",rule:"НК РФ, п. 5 ст. 427: подтверждённое резидентство ТВД ОЭЗ может использоваться как альтернатива ИТ-аккредитации при выполнении иных условий.",proof:"Подтверждение статуса ОЭЗ; раздельный реестр ИТ-доходов; состав проектов и ФОТ.",why:"Существенная чувствительность к численности команды.",src:"social"},
{id:"usn",name:"УСН и корпоративное участие более 25%",type:"known",rule:"НК РФ, подп.14 п.3 ст.346.12: корпоративное участие более 25% обычно закрывает УСН для дочерней компании.",proof:"Корпоративный план и таблица долей Processing и Technology.",why:"Исключает ряд налоговых комбинаций.",src:"usn"},
{id:"services",name:"Реальность услуг между двумя ООО",type:"open",rule:"Ст.252 и 54.1 НК РФ требуют экономической обоснованности затрат и недопустимости искажения операций.",proof:"Технические задания, штат, трудозатраты, акты, права на код, методика цены, договор.",why:"Платёж нельзя произвольно устанавливать ради переноса прибыли.",src:"tax"},
{id:"licence",name:"Лицензионный доход и НДС",type:"open",rule:"НК РФ, ст.149: для отдельных лицензий на российское ПО предусмотрены условия и исключения, включая отдельные финансовые функции.",proof:"Предмет лицензии, реестр ПО, функции продукта, договоры, фактический правообладатель.",why:"Может быть критичен для структуры Technology.",src:"tax"},
{id:"invest",name:"Финансирование из Узбекистана",type:"open",rule:"Вклад в УК, заём и оплата реальных услуг имеют разные юридические и валютные основания.",proof:"Иностранный отправитель, корпоративные документы, банковское подтверждение маршрута, валютные разрешения.",why:"Можно иметь прибыльную модель, но не провести инвестицию.",src:"corporate"},
{id:"dividends",name:"Дивиденды, займы и возврат денег",type:"open",rule:"Для дивидендов и процентов действуют разные правила налога у источника, соглашения об избежании двойного налогообложения и фактического права на доход.",proof:"Цепочка собственников, налоговое резидентство, подтверждение фактического получателя, график займов.",why:"Влияет на фактическую сумму денег у бенефициара.",src:"tax"},
{id:"pricing",name:"НДС и цена договора с мерчантом",type:"open",rule:"Комиссия, включающая НДС, и комиссия без НДС дают разную экономику при неизменных продажах.",proof:"Тарифы, договоры и коммерческие условия с банками/мерчантами.",why:"Иногда эффект НДС выше эффекта ставки налога на прибыль.",src:"vat"},
{id:"terms",name:"Инвестиционные и операционные обязательства ОЭЗ",type:"open",rule:"Статус резидента не переносится автоматически на другие компании; нужны соглашение, проект и соблюдение обязательств.",proof:"Бизнес-план, соглашение, смета инвестиций, адрес, профиль команды.",why:"Влияет на стоимость и сроки проекта.",src:"sez"},
{id:"sens",name:"Математическая оптимизация и чувствительность",type:"open",rule:"Результат модели зависит от реальных расходов, функций, рисков, численности, цены услуг, НДС и доступности льгот.",proof:"Прогноз продаж, маржинальность продуктов, банк-комиссии, расходы по штатам, ставки и соглашения.",why:"В финальной версии — поиск границ эффективности, а не фиксированная схема.",src:"tax"}
];
const ids=["structure","control","sez","gmv","proc","tech","procCost","techCost","procPay","techPay","inter","capital","payout"];
const el=id=>document.getElementById(id);
const initial={};ids.forEach(id=>initial[id]=el(id).value);
const v=id=>Math.max(0,Number(el(id).value)||0);
const m=n=>Number(n||0).toLocaleString("ru-RU",{minimumFractionDigits:1,maximumFractionDigits:1})+" млн ₽";
function compute(){
 const two=el("structure").value==="two";
 const sez=el("sez").value==="yes";
 const control=el("control").value;
 const P=v("proc"),T=v("tech"),Fp=v("procPay"),Ft=v("techPay"),Cp=v("procCost"),Ct=v("techCost"),I=two?v("inter"):0;
 const profile=T/(P+T||1),other=1-profile;
 // The effect case is conditional: two entities + separate Technology + assumed real T/VD + hypothetical lower rates.
 const eligible=two&&sez;
 function scenario(relief){
   let socT=Ft*(relief?.15:.30),socP=Fp*.30;
   let pbtT=T+I-Ct-Ft-socT,pbtP=two?P-Cp-Fp-socP-I:0;
   if(!two){pbtT=P+T-Cp-Ct-Fp-Ft-socP-socT}
   let taxT=Math.max(0,pbtT)*(relief?.02:.25),taxP=Math.max(0,pbtP)*.25;
   let net=pbtT+pbtP-taxT-taxP;
   let directShare=control==="foreign"?1:.49;
   let dividends=Math.max(0,net)*v("payout")/100;
   let dividendWht=dividends*directShare*.15; // scenario assumption: no DTT benefit.
   let toOwner=dividends*directShare-dividendWht;
   // VAT 22% on taxable service revenue; simplified input VAT: proc costs 35%, tech costs 45%, no exempt service assumed.
   let vat=Math.max(0,.22*(P+T-.35*Cp-.45*Ct));
   return {socT,socP,pbtT,pbtP,taxT,taxP,vat,net,toOwner,dividendWht,dividends,taxes:taxT+taxP+vat+socT+socP+dividendWht};
 }
 return {two,sez,control,eligible,profile,other,base:scenario(false),opt:scenario(eligible)};
}
function situation(q,r){
 if(q.type!=="dynamic")return q.type;
 return r.control==="foreign"?"blocked":"open";
}
function renderEvidence(r){
 const known=questions.filter(q=>q.type==="known").length;
 const blocked=questions.filter(q=>situation(q,r)==="blocked").length+(r.sez&&!r.two&&r.other>.10?1:0);
 el("all-count").textContent=questions.length+" юридических узлов";
 el("n-known").textContent=known;el("n-open").textContent=questions.length-known-questions.filter(q=>situation(q,r)==="blocked").length;el("n-blocked").textContent=blocked;
 let list=el("evidence");list.replaceChildren();
 questions.forEach((q,i)=>{
  const state=situation(q,r);
  const btn=document.createElement("button");btn.type="button";
  const number=document.createElement("span");number.textContent=String(i+1).padStart(2,"0");
  const text=document.createElement("strong");text.textContent=q.name;
  const dot=document.createElement("span");dot.className="dot "+(state==="known"?"known":state==="blocked"?"blocked":"");
  btn.append(number,text,dot);
  btn.onclick=()=>showDetail(q,r,btn);
  list.appendChild(btn);
 });
 if(!list.querySelector(".selected"))list.querySelector("button")?.click();
}
function showDetail(q,r,btn){
 el("evidence").querySelectorAll("button").forEach(x=>x.classList.toggle("selected",x===btn));
 const state=situation(q,r),box=el("detail");box.replaceChildren();
 const title=document.createElement("b");title.textContent=q.name;box.appendChild(title);
 const status=document.createElement("div");status.className="tag "+(state==="known"?"green":state==="blocked"?"red":"amber");
 status.textContent=state==="known"?"НОРМА УСТАНОВЛЕНА · ПРИМЕНИМОСТЬ НЕ ПРОВЕРЕНА":state==="blocked"?"ОБЫЧНАЯ ПРОЦЕДУРА НЕДОСТУПНА":"ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ";
 box.appendChild(status);
 const p=document.createElement("p");p.textContent=q.rule;box.appendChild(p);
 const h=document.createElement("b");h.textContent="Какие доказательства нужны";box.appendChild(h);
 const proof=document.createElement("p");proof.textContent=q.proof;box.appendChild(proof);
 const effect=document.createElement("p");effect.textContent="Экономическое значение: "+q.why;box.appendChild(effect);
 if(source[q.src]){const a=document.createElement("a");a.href=source[q.src];a.target="_blank";a.rel="noopener";a.textContent="Открыть нормативный источник ↗";box.appendChild(a)}
}
function render(){
 const r=compute(),o=r.opt,b=r.base;
 el("take-rate").textContent="Эффективная собственная комиссия: "+(v("gmv")? (100*v("proc")/v("gmv")).toFixed(3).replace(".",",")+"% GMV":"GMV не задан");
 el("invest").textContent=m(v("capital"));
 el("model-label").textContent=r.two?"2 ООО · ОСНО":"1 ООО · ОСНО";
 el("technology").querySelector("small").textContent=r.two?"TECHNOLOGY · ОЭЗ: "+(r.sez?"гипотеза":"нет"):"ОДНО ООО · PROCESSING + TECHNOLOGY";
 el("tech-title").textContent=r.two?"VeloxPay Technology":"VeloxPay (совмещённый бизнес)";
 el("companies").classList.toggle("single",!r.two);
 el("processing").hidden=!r.two;
 el("bridge").hidden=!r.two;
 el("revT").textContent=m(v("tech")+(r.two?v("inter"):v("proc")));
 el("profitT").textContent=m(o.pbtT);
 el("taxT").textContent=m(o.taxT+o.socT);
 el("revP").textContent=m(v("proc"));
 el("profitP").textContent=m(o.pbtP);
 el("taxP").textContent=m(o.taxP+o.socP);
 el("amountInter").textContent=m(r.two?v("inter"):0);
 el("externalT").textContent=m(v("tech"));
 el("externalP").textContent=m(v("proc"))+" · GMV "+m(v("gmv"));
 el("base").textContent=m(b.toOwner);
 el("optim").textContent=m(o.toOwner);
 const difference=o.toOwner-b.toOwner;
 el("delta").textContent=(difference>=0?"+":"")+m(difference);
 el("result-status").textContent=(!r.two&&r.sez&&r.other>.10)?"РИСК: ДОЛЯ ИНОЙ ДЕЯТЕЛЬНОСТИ "+Math.round(r.other*100)+"%":r.eligible?"ГИПОТЕЗА · НЕ ВЕРИФИЦИРОВАНО":"ЛЬГОТНАЯ ВЕТВЬ НЕ ВЫБРАНА";
 el("owner-assumption").textContent=r.control==="foreign"?"Выплаты рассчитаны для условных 100% узбекского участия, удержание дивидендов 15% — модельное допущение, не применение СИДН.":"При российском контроле для иллюстрации принята узбекская доля 49%; её фактический размер и права на доход нужно согласовать отдельно. Удержание 15% — допущение.";
 el("profit-tax").textContent=m(o.taxT+o.taxP);
 el("vat-tax").textContent=m(o.vat);
 el("social-tax").textContent=m(o.socT+o.socP);
 el("div-tax").textContent=m(o.dividendWht);
 renderEvidence(r);
 if(!r.two&&r.sez&&r.other>.10){
   const box=el("detail");
   const p=document.createElement("p");p.style.color="#a43344";p.textContent="Существенный риск: в едином ООО доля непрофильной деятельности в гипотезе "+Math.round(r.other*100)+"%, что выше установленного для иной деятельности предела 10%.";
   box.appendChild(p);
 }
}
ids.forEach(id=>{el(id).addEventListener("input",render);el(id).addEventListener("change",render)});
el("reset").onclick=()=>{ids.forEach(id=>el(id).value=initial[id]);render()};
render();
