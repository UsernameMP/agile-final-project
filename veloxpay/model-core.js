"use strict";
const IDLIST="year structure parent techOwn techUz procOwn procUz sez accredited registry taxT vatT taxP vatP priceMode overCap capital capitalShare loanT loanP loanRate loanReturn gmv fee market bank payP costP inputP dev license support qual payT costT inputT licenseExempt interco adminExtra royalty foreignSvc payout divWht otherWht uzTax".split(" ");
const $=id=>document.getElementById(id);
const initial={};function gather(){let o={};IDLIST.forEach(k=>{o[k]=$(k).value});return o}
const val=(o,id)=>Math.max(0,Number(o[id])||0);
const frac=(o,id)=>Math.min(100,val(o,id))/100;
const rub=n=>Number(n||0).toLocaleString("ru-RU",{maximumFractionDigits:2,minimumFractionDigits:1});
const positive=v=>Math.max(0,v),sum=a=>a.reduce((p,v)=>p+v,0);
const LINK={
 tax:"https://www.consultant.ru/document/cons_doc_LAW_28165/",
 sez:"https://www.consultant.ru/document/cons_doc_LAW_54599/",
 vat:"https://www.nalog.gov.ru/rn77/taxation/taxes/nds/16601302/",
 usn:"https://base.garant.ru/414502711/",
 acc:"https://www.consultant.ru/document/cons_doc_LAW_427955/",
 registry:"https://www.consultant.ru/document/cons_doc_LAW_61798/",
 payout:"https://www.consultant.ru/document/cons_doc_LAW_19671/",
 payments:"https://www.consultant.ru/document/cons_doc_LAW_115625/"
};
function rule(o){
 let issues=[];
 function add(state,title,description,source){issues.push({state,title,description,source:LINK[source]||null})}
 let two=o.structure==="two",sub=two&&o.parent==="subsidiary";
 let foreignT=o.techOwn==="foreign",foreignP=o.procOwn==="foreign";
 if(sub&&o.procOwn!==o.techOwn)add("BLOCKED","Контроль дочерней Processing","100% дочерняя компания не может иметь самостоятельный тип контроля, отличный от единственного материнского общества.","tax");
 if(o.accredited==="yes"&&foreignT)add("BLOCKED","ИТ-аккредитация","Стандартный порядок по подп. «ж» п. 4 ПП №1729 требует российского контроля; индивидуальные исключения оцениваются отдельно.","acc");
 if(o.registry==="yes"&&foreignT)add("BLOCKED","Реестр российского ПО","В обычном порядке правообладатель под иностранным контролем не удовлетворяет критерию контроля для российского реестра.","registry");
 if(two&&sub&&o.taxP!=="osno")add("BLOCKED","УСН дочернего ООО","При корпоративном участии свыше 25% УСН в общем случае не применяется, подп. 14 п.3 ст.346.12 НК РФ.","tax");
 if(!two&&o.sez==="yes"&&o.taxT!=="osno")add("CONDITIONAL","ОЭЗ и УСН","Ставка по налогу на прибыль ОЭЗ не снижает налог УСН; право резидентства и применимость режима проверяются отдельно.","sez");
 if(two&&o.sez==="yes"&&o.taxT!=="osno")add("CONDITIONAL","Ставка ОЭЗ при УСН","Пониженный налог на прибыль не действует при применении УСН.","tax");
 if(two&&sub)add("CONDITIONAL","Промежуточные дивиденды","Дивиденды дочерней Processing в пользу материнской Technology имеют самостоятельный режим; модель использует 13% удержания как сценарный параметр, возможные освобождения требуют подтверждения.","tax");
 if(o.techOwn==="russian"&&val(o,"capital")>0)add("CONDITIONAL","Происхождение средств капитала","При российском большинстве вклад только узбекской стороны не соответствует автоматически структуре долей; необходимы вклады других участников или иное финансирование.","tax");
 if(o.sez==="yes")add("CONDITIONAL","Деятельность и инвестиции ОЭЗ","Требуются соглашение резидента, фактическая ТВД, раздельный учёт; с четвёртого календарного года подлежит проверке ст. 56.1 НК РФ.","sez");
 if(o.techOwn==="russian"||o.procOwn==="russian")add("CONDITIONAL","Реальный российский контроль","Участие, голоса, управление и экономические права должны соответствовать действительному контролю; номинальное владение не допускается.","acc");
 if(o.registry==="yes")add("UNVERIFIED","Право на реестровую льготу","Наличие российской доли недостаточно: права на ПО, выплаты иностранным правообладателям и функциональные исключения требуют проверки.","registry");
 if(val(o,"interco")>0&&two)add("CONDITIONAL","Внутригрупповые услуги","Встречный платёж принимается только за реально выполненную разработку, лицензирование либо поддержку по экономически обоснованным условиям.","tax");
 if(val(o,"royalty")+val(o,"foreignSvc")>0)add("UNVERIFIED","Выплаты за рубеж","Действительные права и услуги, рыночность цен, налог у источника, международное соглашение и валютный контроль требуют документального подтверждения.","payout");
 if(o.licenseExempt==="yes"&&(o.registry!=="yes"||foreignT))add("BLOCKED","Освобождение лицензии от НДС","Заявлено освобождение НДС для реестровой лицензии без подтверждённой допустимой реестровой структуры.","registry");
 if(o.licenseExempt==="yes")add("UNVERIFIED","Раздельный НДС на ПО","Вычеты по общим расходам при сочетании облагаемых и освобождённых лицензионных услуг требуют раздельного учёта; прогноз использует упрощение.","vat");
 if(o.licenseExempt==="yes")add("UNVERIFIED","Исключения из НДС-льготы ПО","Платёжная функциональность ПО может подпадать под исключения из подп.26 п.2 ст.149 НК РФ. Применение льготы требует оценки функционала.","vat");
 if(Number(o.year)>=2030&&o.sez==="yes")add("UNVERIFIED","Ст. 56.1 НК РФ","В модели отсутствуют накопленные показатели инвестиций, НИОКР и налоговой экономии для проверки права на льготу.","tax");
 if(o.priceMode==="inclusive")add("CONDITIONAL","Цены включают НДС","Модель уменьшает базовую выручку на рассчитанный НДС. При разных ставках меняются собственные доходы и прибыль каждой компании.","vat");
 if(val(o,"interco")>0&&!two)add("CONDITIONAL","Внутри одного ООО","Внутренние услуги между направлениями одного ООО не являются выручкой/расходом между налогоплательщиками; введённая сумма не применяется.","tax");
 if(val(o,"gmv")>0)add("CONDITIONAL","Законность процессинга","Обычное ООО не является оператором перевода денег. Платёжные функции определяются договором с банком, статусом агрегатора и №161-ФЗ.","payments");
 return {issues,add,two,sub,foreignT,foreignP};
}
function result(o){
 let r=rule(o),add=r.add,two=r.two,sub=r.sub;
 let year=Number(o.year),tTax=o.taxT,pTax=two?o.taxP:null;
 const techExt=val(o,"dev")+val(o,"license")+val(o,"support");
 const procExt=val(o,"gmv")*val(o,"fee")/100+val(o,"market");
 const inter=two?val(o,"interco"):0;
 const thresh=year<=2029?20:year===2030?15:10;
 function validateTax(tax,vat,sales,name){
   if(tax==="osno"&&vat!=="22")add("BLOCKED",name+": НДС и ОСНО","На ОСНО невозможно использовать освобождение УСН либо специальные ставки НДС 5%/7%.","tax");
   if(tax!=="osno"&&vat==="exempt"&&sales>thresh)add("BLOCKED",name+": освобождение от НДС","Годовая выручка превышает "+thresh+" млн ₽. Для прогноза применено консервативное отсечение годового освобождения; в реальности важны и доходы предыдущего года.","usn");
   if(tax!=="osno"&&vat==="exempt")add("UNVERIFIED",name+": предшествующий год","Для освобождения УСН от НДС необходимо отдельно проверить доходы предшествующего года.","usn");
   if(tax!=="osno"&&(vat==="5"||vat==="7"))add("UNVERIFIED",name+": спецставка НДС","Допустимость выбранных 5%/7% зависит от установленных порогов выручки, периода применения и ограничений.","usn");
   if(tax!=="osno"&&sales>450)add("UNVERIFIED",name+": лимит УСН","Выручка превышает 450 млн ₽; применимый индексируемый лимит на выбранный год должен быть рассчитан дополнительно.","tax");
 }
 validateTax(tTax,o.vatT,techExt+inter+(two?0:procExt),"Technology");
 if(two)validateTax(pTax,o.vatP,procExt,"Processing");
 const vatRate=mode=>mode==="22"?.22:mode==="5"?.05:mode==="7"?.07:0;
 const vdT=vatRate(o.vatT),vdP=two?vatRate(o.vatP):vdT;
 const exemptLicense=o.registry==="yes"&&o.licenseExempt==="yes";
 const eligibleTechLicense=exemptLicense?val(o,"license"):0;
 let netTech,netProcessing,techExternalGross=techExt,procExternalGross=procExt;
 if(o.priceMode==="inclusive"){
  netTech=(techExt-eligibleTechLicense)/(1+vdT)+eligibleTechLicense;
  netProcessing=procExt/(1+(two?vdP:vdT));
 }else{netTech=techExt;netProcessing=procExt}
 const techSales=netTech+inter,procSales=two?netProcessing:0;
 const totalSales=netTech+netProcessing;
 const taxableT=(techExt-eligibleTechLicense)/(o.priceMode==="inclusive"?1+vdT:1)+inter+(two?0:netProcessing);
 const taxableP=two?netProcessing:0;
 let outVatT=taxableT*vdT,outVatP=taxableP*vdP;
 const vatInter=two?inter*vdT:0;
 const cvT=val(o,"costT")*frac(o,"inputT")*.22;
 const cvP=val(o,"costP")*frac(o,"inputP")*.22;
 const deductT=o.vatT==="22", deductP=two?o.vatP==="22":deductT;
 const inputVatT=deductT?cvT+(two?0:cvP):0;
 const inputVatP=two&&deductP?cvP+vatInter:0;
 const nonRecT=deductT?0:cvT+(two?0:cvP);
 const nonRecP=two?(deductP?0:cvP+vatInter):0;
 const vatT=outVatT-inputVatT,vatP=two?outVatP-inputVatP:0;
 const socialQualRevenue=frac(o,"qual")*(netTech+inter);
 const qualRatio=two?socialQualRevenue/Math.max(1e-9,techSales):socialQualRevenue/Math.max(1e-9,totalSales);
 const sezRatio=two?1:netTech/Math.max(1e-9,totalSales);
 if(o.sez==="yes"&&!two&&1-sezRatio>0.1000001)add("BLOCKED","ОЭЗ: предел иной деятельности","Доля Processing/маркетплейса "+rub((1-sezRatio)*100)+"% превышает предел 10% доходов резидента (ст. 10 №116-ФЗ).","sez");
 const canItRate=(o.sez==="yes"||(o.accredited==="yes"&&!r.foreignT))&&qualRatio>=.70;
 if((o.sez==="yes"||o.accredited==="yes")&&qualRatio<.70)add("CONDITIONAL","70% по ст. 427","Доля квалифицируемой выручки "+rub(qualRatio*100)+"% ниже 70%; пониженный тариф взносов не применяется.","tax");
 const high=frac(o,"overCap");
 function social(fot,preferred){return fot*((1-high)*(preferred?.15:.30)+high*(preferred?.076:.151))}
 const payrollT=val(o,"payT"),payrollP=val(o,"payP");
 const contribT=two?social(payrollT,canItRate):social(payrollT+payrollP,canItRate);
 const contribP=two?social(payrollP,false):0;
 const interestT=val(o,"loanT")*val(o,"loanRate")/100;
 const interestP=two?val(o,"loanP")*val(o,"loanRate")/100:0;
 const royalties=val(o,"royalty"),foreignServices=val(o,"foreignSvc");
 const costsT=val(o,"costT")+(two?0:val(o,"bank")+val(o,"costP"))+(two?0:0)+nonRecT;
 const costsP=two?val(o,"bank")+val(o,"costP")+val(o,"adminExtra")+nonRecP:0;
 const expT=two?payrollT:payrollT+payrollP;
 const profitT=(two?techSales:totalSales)-costsT-expT-contribT-interestT-royalties-foreignServices;
 const profitP=two?procSales-inter-costsP-payrollP-contribP-interestP:0;
 function profitTax(regime,pbt,revenue,insurance,profile,accredited){
  if(regime==="usn6")return Math.max(revenue*.06*0.5,revenue*.06-Math.min(revenue*.06*.5,insurance));
  if(regime==="usn15")return Math.max(revenue*.01,positive(pbt)*.15);
  let rate=.25;
  if(profile&&o.sez==="yes")return positive(pbt)*(.02*profile+.25*(1-profile));
  if(accredited&&year<=2030&&qualRatio>=.70)return positive(pbt)*.05;
  if(accredited&&year>=2031)add("UNVERIFIED","ИТ-ставка на 2031","Специальная ставка по ИТ налогу на прибыль установлена до 2030 года; для 2031 использована общая ставка 25%.","tax");
  return positive(pbt)*rate;
 }
 const itAcc=o.accredited==="yes"&&!r.foreignT;
 const profitTaxT=profitTax(tTax,profitT,two?techSales:totalSales,contribT,two?1:sezRatio,itAcc);
 const profitTaxP=two?profitTax(pTax,profitP,procSales,contribP,0,false):0;
 let netT=profitT-profitTaxT,netP=profitP-profitTaxP;
 // Conditions of foreign remittances and withholding are separately adjustable.
 const otherRate=frac(o,"otherWht"),divRate=frac(o,"divWht"),uzRate=frac(o,"uzTax");
 const taxInterest=(interestT+interestP)*otherRate,taxRoyalty=royalties*otherRate;
 if(foreignServices>0)add("UNVERIFIED","Налог у источника на иностранные услуги","Требуются проверка места реализации, ст. 309 НК РФ, СИДН и НДС налогового агента. В итоговом налоге удержание по услугам не начислено автоматически.","tax");
 if(val(o,"loanT")+val(o,"loanP")>0)add("CONDITIONAL","Иностранные займы","Займы требуют валютного контроля, проверки процентной ставки, допустимости процентов и тонкой капитализации.","tax");
 const loanBackT=Math.min(val(o,"loanT"),val(o,"loanT")*frac(o,"loanReturn"));
 const loanBackP=two?Math.min(val(o,"loanP"),val(o,"loanP")*frac(o,"loanReturn")):0;
 const ownUzT=r.foreignT?1:Math.min(.4999,frac(o,"techUz"));
 const ownUzP=sub?0:(r.foreignP?1:Math.min(.4999,frac(o,"procUz")));
 const capital=val(o,"capital"),capT=two?capital*frac(o,"capitalShare"):capital,capP=two?capital-capT:0;
 // Dividend capacity uses net profit plus initial financing as a liquidity guard; financed dividends still require corporate law checks.
 const payout=frac(o,"payout");
 const divP=two?positive(netP)*payout:0;
 const russianHoldTax=sub?divP*.13:0; // conservative holding assumption, not automatic 0% participation exemption.
 const divT=positive(netT+(sub?divP-russianHoldTax:0))*payout;
 const ownerDiv=divT*ownUzT+(sub?0:divP*ownUzP);
 const whtDividend=ownerDiv*divRate;
 const foreignIncome=ownerDiv-whtDividend+interestT+interestP-taxInterest+royalties-taxRoyalty;
 const uzIncomeTax=positive(foreignIncome)*uzRate;
 const loanReturn=loanBackT+loanBackP;
 const receivedUz=foreignIncome-uzIncomeTax+loanReturn; // no automatic Uz tax on return of principal
 const taxRf=profitTaxT+profitTaxP+vatT+vatP+contribT+contribP+whtDividend+taxInterest+taxRoyalty+russianHoldTax;
 const taxAll=taxRf+uzIncomeTax;
 const availableT=capT+val(o,"loanT")+netT-loanBackT-divT+(sub?divP-russianHoldTax:0);
 const availableP=two?capP+val(o,"loanP")+netP-loanBackP-divP:0;
 const cashGroup=availableT+availableP;
 if(availableT<0||availableP<0)add("CONDITIONAL","Отрицательный денежный остаток","По нормализованному расчёту одной из компаний не хватает финансирования после расходов, налогов и распределения. Нужна проверка cash flow и очередности платежей.","tax");
 if(vatT<0||vatP<0)add("UNVERIFIED","Возмещение НДС","Отрицательный НДС учтён как возврат/зачёт в том же году; реальные сроки возмещения могут создавать кассовый разрыв.","vat");
 if(o.sez==="yes"&&tTax==="osno")add("CONDITIONAL","Срок льготной ставки ОЭЗ","Ставка 2% предполагает первые пять прибыльных лет резидента. Фактическая дата первого прибыльного года требует проверки.","sez");
 let blocked=r.issues.some(x=>x.state==="BLOCKED");
 // approximate monthly cash flow, accrual taxes normalized /12, dividends and principal in December
 let cashT=capT+val(o,"loanT"),cashP=two?capP+val(o,"loanP"):0,months=[];
 const annualFlowT=netT+(sub?divP-russianHoldTax:0),annualFlowP=two?netP-divP*(sub?0:1):0;
 for(let i=1;i<=12;i++){
  cashT+=netT/12;
  if(two)cashP+=netP/12;
  if(i===12){
   if(two&&sub){cashP-=divP;cashT+=divP-russianHoldTax}
   if(two&&!sub)cashP-=divP;
   cashT-=divT;
   cashT-=loanBackT;if(two)cashP-=loanBackP;
  }
  months.push({month:i,T:cashT,P:two?cashP:0,group:cashT+(two?cashP:0)});
 }
 return {
  ...r,blocked,year,techExt,procExt,techSales,procSales,totalSales,inter,vatT,vatP,outVatT,outVatP,inputVatT,inputVatP,nonRecT,nonRecP,
  contribT,contribP,interestT,interestP,costsT,costsP,profitT,profitP,profitTaxT,profitTaxP,netT,netP,
  russianHoldTax,divT,divP,ownerDiv,whtDividend,taxInterest,taxRoyalty,uzIncomeTax,loanReturn,receivedUz,
  taxRf,taxAll,availableT,availableP,cashGroup,capT,capP,ownUzT,ownUzP,qualRatio,sezRatio,canItRate,months,thresh
 };
}
