"use strict";
const $=id=>document.getElementById(id);
const ids="structure control sez taxT vatT taxP vatP gmv proc tech procCost techCost procPay techPay capital payout".split(" ");
const original={};ids.forEach(x=>original[x]=$(x).value);
const N=id=>Math.max(0,Number($(id).value)||0);
const fmt=x=>(Number(x)||0).toLocaleString("ru-RU",{minimumFractionDigits:1,maximumFractionDigits:1});
const m=x=>fmt(x)+" млн ₽",pc=x=>fmt(x*100)+"%";
const source={sez:"https://www.consultant.ru/document/cons_doc_LAW_54599/c2659f37bc1799afc11854330bb5b7969e54df2f/",tax:"https://www.consultant.ru/document/cons_doc_LAW_28165/",vat:"https://www.nalog.gov.ru/new2026/",usn:"https://www.nalog.gov.ru/rn46/news/activities_fts/16636927/",acc:"https://www.consultant.ru/document/cons_doc_LAW_427955/",registry:"https://www.consultant.ru/document/cons_doc_LAW_61798/",bank:"https://www.consultant.ru/document/cons_doc_LAW_115625/",company:"https://www.consultant.ru/document/cons_doc_LAW_17819/",rnko:"https://www.cbr.ru/admissionfinmarket/navigator/nko/"};
const checks=[
["bank","Платёжная роль Technology в первый год","open","Закон № 161-ФЗ различает функции банка, платёжного агрегатора и технологического исполнителя.","Кто принимает деньги клиентов и на каком основании Technology получает комиссию?","Схема платежа, договор с банком, договор с мерчантом.","bank"],
["sez","ОЭЗ: профильная и иная деятельность","sez","Часть 5 статьи 10 № 116-ФЗ: доходы от разрешённой иной деятельности — не более 10% общего дохода и эта деятельность предусмотрена соглашением.","Будет ли процессинговый доход квалифицирован как иная деятельность?","Проект соглашения, бизнес-план, классификация договоров и доходов.","sez"],
["vat","НДС на процессинг с 2026 года","known","В 2026 году введено обложение НДС ряда процессинговых и информационно-технологических платёжных услуг по общим правилам.","Какие из комиссий действительно относятся к этим услугам, а какие к банковским операциям?","Договоры, тарифы, предмет услуг, платёжные схемы.","vat"],
["usn","УСН, НДС 5%, 7% и освобождение","known","Статьи 145, 164, 346.12–346.13 НК РФ; по закону № 228-ФЗ лимит освобождения от НДС в 2027 году — 20 млн ₽.","Доходы предшествующего года, пороги для 5%/7%, корпоративное участие.","Бухгалтерские показатели, ЕГРЮЛ, финансовый прогноз.","usn"],
["accreditation","ИТ-аккредитация","control","Подп. «ж» п. 4 ПП РФ № 1729 требует российский контроль более 50% в общем порядке, кроме установленного исключения по решению Правительства.","Возможна ли подлинная структура российского контроля?","Устав, доли, голоса, цепочка контроля.","acc"],
["registry","Реестр российского ПО","control","Статья 12.1 № 149-ФЗ предъявляет самостоятельные требования к контролю российского правообладателя и правам на ПО.","Кто владеет исключительными правами, есть ли выплаты зарубежному правообладателю?","Документы на ПО, договоры, технический профиль продукта.","registry"],
["insurance","Пониженные страховые взносы","open","Статья 427 НК РФ предусматривает льготные тарифы для отдельных ИТ-плательщиков и резидентов технико-внедренческой ОЭЗ.","Достигается ли 70% квалифицируемых доходов и выполнены ли остальные условия?","Расшифровка доходов, ФОТ, документы резидента.","tax"],
["daughter","Создание дочернего Processing","known","Пункт 2 статьи 7 № 14-ФЗ допускает учреждение ООО другим обществом с единственным участником.","Будет ли дочерняя организация или прямое владение и как это ограничивает УСН?","Схема участников, решение об учреждении, проверка ст. 346.12 НК РФ.","company"],
["licence","Лицензия на ПО против услуг","open","Подп. 26 п. 2 ст. 149 НК РФ предусматривает условия и исключения для лицензий российского ПО.","Есть ли реальная самостоятельная лицензия и не исключена ли финансовая функциональность?","Состав ПО, лицензия, реестр, описание функций.","tax"],
["funding","Капитал и займы из Узбекистана","open","Капитал, заём и платежи за услуги регулируются разными корпоративными, налоговыми и валютными правилами.","Каким банком и по какому основанию реально можно провести средства?","Инвестор, банк, договоры, документы валютного контроля.","company"],
["dividends","Дивиденды и обратные переводы","open","НК РФ и соглашение об избежании двойного налогообложения устанавливают условия налога у источника и подтверждения права на доход.","Кто фактический получатель и какие ставки действительно доступны?","Сертификат резидентства, права собственников, корпоративные решения.","tax"],
["skolkovo","Сколково и совместимость режимов","open","Статус участника «Сколково» предоставляется при самостоятельном выполнении установленных требований.","Может ли проект соответствовать критериям и как соотносятся режимы с ОЭЗ?","Продуктовый паспорт, НИОКР, состав проекта, сравнительный правовой анализ.","tax"],
["crossborder","Трансграничные маршруты денежных средств","open","Для инвестиций, займов, дивидендов, процентов и роялти действуют разные налоговые и валютные правила.","Какие маршруты Россия — Узбекистан реально доступны через банки?","Банковские условия, договоры, валютные документы, СИДН, фактические получатели.","tax"],
["rnko","Проектирование расчётной НКО (РНКО)","open","Банк России регулирует РНКО как отдельный вид небанковской кредитной организации с ограниченным перечнем операций.","Какие банковские операции планируются, каковы требования к капиталу, лицензии, руководителям и инфраструктуре?","Концепция банковских операций, источники капитала, регуляторный план, комплаенс и ИТ-контур.","rnko"]
];
let selected="bank";
function status(q,o){if(q[2]==="known")return"known";if(q[2]==="control")return o.control==="foreign"?"blocked":"open";if(q[2]==="sez"&&o.sez&&o.otherShare>.10)return"blocked";return"open"}
function evidence(o){
 const counts={known:0,open:0,blocked:0};checks.forEach(q=>counts[status(q,o)]++);
 $("knownCount").textContent=counts.known;$("openCount").textContent=counts.open;$("blockedCount").textContent=counts.blocked;
 const list=$("evidenceList");list.replaceChildren();
 checks.forEach((q,i)=>{let b=document.createElement("button");b.className="evidence-item"+(selected===q[0]?" active":"");b.type="button";
 let num=document.createElement("small");num.textContent=String(i+1).padStart(2,"0");let title=document.createElement("b");title.textContent=q[1];let dot=document.createElement("i");dot.className="dot "+status(q,o);b.append(num,title,dot);b.onclick=()=>{selected=q[0];evidence(o)};list.appendChild(b)});
 const q=checks.find(x=>x[0]===selected)||checks[0],s=status(q,o),detail=$("evidenceDetail");detail.replaceChildren();
 let heading=document.createElement("b");heading.textContent=q[1];detail.appendChild(heading);
 let badge=document.createElement("span");badge.className="pill "+(s==="blocked"?"alert":"neutral");badge.textContent=s==="known"?"НОРМА УСТАНОВЛЕНА":s==="blocked"?"ОГРАНИЧЕНИЕ":"ТРЕБУЕТ ПРОВЕРКИ";detail.appendChild(badge);
 for(let j=3;j<=5;j++){let p=document.createElement("p");let strong=document.createElement("strong");strong.textContent=["Норма: ","Неизвестно: ","Доказательства: "][j-3];p.append(strong,document.createTextNode(q[j]));detail.appendChild(p)}
 let a=document.createElement("a");a.href=source[q[6]];a.target="_blank";a.rel="noopener noreferrer";a.textContent="Нормативный источник";detail.appendChild(a);
}

const VAT_FREE_2027=20, VAT_FIVE_2027=250*1.153, VAT_USN_MAX_2027=450*1.153;
// Коэффициент 1.153 опубликован как проект, не утвержденный норматив.
function vatFor(reg,selected,revenue){
 if(reg==="osno")return {rate:"22",label:"НДС 22% с вычетами — ОСНО",status:"normal"};
 if(revenue<=VAT_FREE_2027)return {rate:"exempt",label:"До 20 млн ₽: освобождение от НДС при УСН при соблюдении условий предшествующего года",status:"conditional"};
 if(selected==="22")return {rate:"22",label:"НДС 22% с вычетами выбран вместо специальной ставки УСН",status:"conditional"};
 if(revenue<=VAT_FIVE_2027)return {rate:"5",label:"НДС 5% без вычетов: до ≈288,25 млн ₽ (порог по проекту дефлятора 2027)",status:"project"};
 if(revenue<=VAT_USN_MAX_2027)return {rate:"7",label:"НДС 7% без вычетов: до ≈518,85 млн ₽ (порог по проекту дефлятора 2027)",status:"project"};
 return {rate:"22",label:"Порог УСН ≈518,85 млн ₽ (проект) превышен; режим УСН недоступен, необходима проверка перехода на ОСНО",status:"blocked"};
}
function allowed(){
 const revenue=N("proc")+N("tech");
 if($("taxT").value==="osno")$("vatT").value="22";
 if($("taxT").value!=="osno"&&revenue<=VAT_FREE_2027)$("vatT").value="auto";
 if($("taxP").value==="osno")$("vatP").value="22";
 $("processingControls").hidden=$("structure").value==="one";
 document.querySelectorAll(".choices").forEach(group=>{
  let field=group.dataset.for,selected=$(field).value,vat=field.startsWith("vat");
  const taxReg=field==="vatT"?$("taxT").value:$("taxP").value;
  group.querySelectorAll("button").forEach(btn=>{
   btn.setAttribute("aria-pressed",String(btn.dataset.val===selected));
   btn.disabled=vat&&taxReg==="osno"&&btn.dataset.val==="auto";
  });
 });
}
function calculate(){
 const rev=N("proc")+N("tech"),operating=N("procCost")+N("techCost"),payroll=N("procPay")+N("techPay");
 const insurance=payroll*.30,taxReg=$("taxT").value,vatRule=vatFor(taxReg,$("vatT").value,rev),rate=vatRule.rate;
 const inputVat=.22*(N("procCost")*.35+N("techCost")*.45);
 const recovered=rate==="22"?inputVat:0,unrecovered=rate==="22"?0:inputVat;
 const before=rev-operating-payroll-insurance-unrecovered;
 const profitTax=taxReg==="osno"?Math.max(0,before)*.25:taxReg==="usn6"?Math.max(rev*.03,rev*.06-Math.min(rev*.03,insurance)):Math.max(rev*.01,Math.max(0,before)*.15);
 const vat=rate==="exempt"?0:rev*Number(rate)/100-recovered;
 const net=before-profitTax, payout=Math.max(0,net)*Math.min(100,N("payout"))/100,uzPart=$("control").value==="foreign"?1:.49;
 const dividendTax=payout*uzPart*.15,owner=payout*uzPart-dividendTax,other=payout*(1-uzPart),retained=net-payout;
 return {rev,operating,payroll,insurance,inputVat,unrecovered,before,profitTax,vat,net,owner,retained,dividendTax,other,payout,vatRule};
}
function render(){
 allowed();const r=calculate(),two=$("structure").value==="two",sez=$("sez").value==="yes",otherShare=N("proc")/Math.max(.00001,r.rev);
 const o={two,sez,control:$("control").value,otherShare};
 $("financingAmount").textContent=m(N("capital"));$("excludedCapital").textContent=m(N("capital"));$("ownerAmount").textContent=m(r.owner);
 $("revenueTech").textContent=m(r.rev);$("taxTech").textContent=m(r.profitTax+r.insurance);$("netTech").textContent=m(r.net);
 const names={osno:"ОСНО",usn6:"УСН 6%",usn15:"УСН 15%"};
 $("techMode").textContent=names[$("taxT").value]+" · "+(r.vatRule.rate==="exempt"?"без НДС":"НДС "+r.vatRule.rate+"%");
 $("vatExplanationT").textContent=r.vatRule.label;
 const processingVat=vatFor($("taxP").value,$("vatP").value,N("proc"));
 $("procMode").textContent=names[$("taxP").value]+" · "+(processingVat.rate==="exempt"?"без НДС":"НДС "+processingVat.rate+"%")+"*";
 $("vatExplanationP").textContent=processingVat.label+". На 2028 год необходимо отдельно подтвердить дефлятор и план продаж.";

 $("bothModes").textContent=two?("2027 · ООО "+names[$("taxT").value]+" + 2028 · ООО "+names[$("taxP").value]):("2027 · ООО "+names[$("taxT").value]+" · без выделения Processing");
 $("futureCompany").hidden=!two;$("transferArrow").hidden=!two;
 let sezWarn=$("sezWarning");sezWarn.className="legal-inline";
 if(sez&&otherShare>.10){sezWarn.classList.add("critical");sezWarn.textContent="Критическая проверка ОЭЗ: если процессинговые комиссии относятся к иной деятельности, их доля "+pc(otherShare)+" превышает лимит 10% по ст. 10 № 116-ФЗ. Требуется правовая квалификация операций."}
 else sezWarn.textContent=sez?"Льготы ОЭЗ здесь не применены автоматически: необходимо подтвердить статус резидента и квалификацию доходов.":"Льготы ОЭЗ в первом году не применяются.";
 $("revenueExplain").textContent=m(N("proc"))+" от процессинга + "+m(N("tech"))+" за разработку = "+m(r.rev)+" операционной выручки; "+m(N("capital"))+" финансирования и "+m(N("gmv"))+" оборота платежей в выручку не входят.";
 $("externalRevenue").textContent=m(r.rev);$("ownerPercent").textContent=pc(r.owner/Math.max(.00001,r.rev));
 $("retainedPercent").textContent=pc(r.retained/Math.max(.00001,r.rev));
 $("profitTax").textContent=m(r.profitTax);$("socialTax").textContent=m(r.insurance);$("vatTax").textContent=m(r.vat);$("divTax").textContent=m(r.dividendTax);
 const segments=[["Расходы, ФОТ и взносы",r.operating+r.payroll+r.insurance+r.unrecovered,"#8192a6"],["Налог на прибыль / УСН",r.profitTax,"#b78938"],["Налог на дивиденды",r.dividendTax,"#c65e67"],["Собственнику в Узбекистан",r.owner,"#118b74"],["Реинвестирование",r.retained,"#4b79bf"],["Другим собственникам",r.other,"#a8b7c9"]];
 const stack=$("stack"),legend=$("stackLegend");stack.replaceChildren();legend.replaceChildren();
 for(const [title,value,color] of segments){if(value<=0)continue;
  let item=document.createElement("span");item.style.width=(value/Math.max(.00001,r.rev)*100)+"%";item.style.background=color;item.title=title+": "+pc(value/Math.max(.00001,r.rev));stack.appendChild(item);
  let row=document.createElement("div"),dot=document.createElement("i"),name=document.createElement("span"),percent=document.createElement("b");dot.style.background=color;name.textContent=title;percent.textContent=pc(value/Math.max(.00001,r.rev));row.append(dot,name,percent);legend.appendChild(row);
 }
 let notes=[];
 if(sez&&otherShare>.10)notes.push("ОЭЗ: процессинговая доля "+pc(otherShare)+" должна быть квалифицирована до применения льгот.");
 if($("taxT").value!=="osno")notes.push(r.vatRule.label+".");
 if(r.vatRule.status==="blocked")notes.push("Выбранная налоговая конфигурация недоступна при указанной выручке.");
 if($("taxT").value!=="osno")notes.push("Право на УСН зависит также от состава участников, ограничений по доходам и других условий.");
 if(r.vatRule.status==="project")notes.push("Порог 2027 года основан на проекте дефлятора 1,153 и не является окончательным нормативом.");
 const msg=$("statusMessage");msg.className="status-message"+(sez&&otherShare>.10?" blocked":notes.length?" pending":"");
 msg.textContent=notes.length?notes.join(" ")+" Налоговый результат является предварительным расчётом.":"Налоговый результат предварительный: действительные договоры, расходы, банковские полномочия и условия налоговых режимов требуют проверки.";
 evidence(o);
}
ids.forEach(id=>{$(id).addEventListener("input",render);$(id).addEventListener("change",render)});
document.querySelectorAll(".choices").forEach(group=>group.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{if(b.disabled)return;const field=group.dataset.for;$(field).value=b.dataset.val;if(field==="taxT")$("vatT").value=b.dataset.val==="osno"?"22":"auto";if(field==="taxP")$("vatP").value=b.dataset.val==="osno"?"22":"auto";render()})));
$("reset").onclick=()=>{ids.forEach(id=>$(id).value=original[id]);selected="bank";render()};
render();