import {amortize,money,duration,goalPlan} from './math.mjs';
export function mount(root) {
 const $=id=>root.querySelector('#'+id), parse=id=>Number($(id).value.replaceAll(',',''));
 let current=null;
 function update(){
  const principal=parse('principal'), years=parse('years'), annualRate=parse('rate');
  const config={principal,annualRate,months:years*12,monthlyExtra:$('monthly').checked,annualExtra:$('annual').checked,extraEmis:parse('extra-emis'),stepUp:$('step').checked,stepPercent:parse('step-percent'),lumpSum:$('lump').checked,lumpAmount:parse('lump-amount'),lumpMonth:parse('lump-month')};
  const errors=[];
  if(!Number.isFinite(principal)||principal<1000||principal>10000000000)errors.push('Enter a loan amount between ₹1,000 and ₹1,000 crore.');
  if(!Number.isInteger(years)||years<1||years>40)errors.push('Choose a whole-number tenure between 1 and 40 years.');
  if(!Number.isFinite(annualRate)||annualRate<0||annualRate>30||$('rate').value==='')errors.push('Enter an interest rate between 0% and 30%.');
  if(config.annualExtra&&(!Number.isInteger(config.extraEmis)||config.extraEmis<1||config.extraEmis>24))errors.push('Choose 1 to 24 extra EMIs per year.');
  if(config.stepUp&&(!Number.isFinite(config.stepPercent)||config.stepPercent<0||config.stepPercent>50||$('step-percent').value===''))errors.push('Choose a yearly increase between 0% and 50%.');
  if(config.lumpSum&&(!Number.isFinite(config.lumpAmount)||config.lumpAmount<=0))errors.push('Enter a positive lump sum.');
  if(config.lumpSum&&(!Number.isInteger(config.lumpMonth)||config.lumpMonth<1||config.lumpMonth>config.months))errors.push('Choose a payment number within your original loan tenure.');
  root.querySelectorAll('.strategy-card').forEach(card=>card.classList.toggle('is-active',$(card.dataset.strategy).checked));
  $('loan-error').hidden=!errors.length;$('loan-error').textContent=errors.join(' ');
  root.querySelector('.loan-results').classList.toggle('is-invalid',!!errors.length);
  root.querySelector('.loan-results').setAttribute('aria-hidden',errors.length?'true':'false');
  root.querySelector('.goal-plan').hidden=!!errors.length; if(errors.length){current=null;return;}
  const original=amortize({principal,annualRate,months:config.months}),result=amortize(config);
  current={config,original,result};
  const saved=Math.max(0,original.interest-result.interest), monthsSaved=original.months-result.months;
  const count=[config.monthlyExtra,config.annualExtra,config.stepUp,config.lumpSum].filter(Boolean).length;
  $('base-emi').textContent=money(original.emi);$('monthly-value').textContent='+ '+money(original.emi/12)+' / month';
  $('amount-hint').textContent=principal>=10000000?`${Number((principal/10000000).toFixed(2))} crore`:principal>=100000?`${Number((principal/100000).toFixed(2))} lakh`:money(principal);
  $('new-tenure').textContent=duration(result.months);$('old-tenure').textContent=duration(original.months);
  $('time-saved').textContent=monthsSaved?duration(monthsSaved)+' closer to debt-free':'Your original repayment timeline';
  $('active-count').textContent=count===0?'No strategies selected':`${count} ${count===1?'strategy':'strategies'} active`;
  $('interest-saved').textContent=money(saved);$('saved-percent').textContent=original.interest>0?`${(saved/original.interest*100).toFixed(1)}% less interest over the life of your loan`:'No interest to save at a 0% rate';
  $('old-interest').textContent=money(original.interest);$('new-interest').textContent=money(result.interest);
  let note=count>1?'Your strategies work together. Extras reduce the balance before next month\'s interest.':count?'Small amounts, paid consistently, add up.':'Choose a strategy to see what changes.';
  if(config.lumpSum&&config.lumpMonth>result.months)note+=' The loan is paid off before your lump sum is due; it is not applied.';
  $('combo-note').textContent=note;
  const left=45,right=468,top=12,bottom=206;
  const x=m=>left+(right-left)*m/original.months,y=b=>bottom-(bottom-top)*b/principal;
  const points=s=>s.map(p=>`${x(p.month).toFixed(2)},${y(p.balance).toFixed(2)}`).join(' ');
  let svg='';
  for(let f of [1,.5,0]){const yy=y(principal*f);svg+=`<line x1="${left}" x2="${right}" y1="${yy}" y2="${yy}" stroke="#e8ebe3"/><text x="0" y="${yy+4}" font-size="12" fill="#737c69">${f===0?'₹0':principal*f>=10000000?Number((principal*f/10000000).toFixed(1))+'Cr':principal*f>=100000?Number((principal*f/100000).toFixed(1))+'L':Math.round(principal*f/1000)+'K'}</text>`;}
  svg+=`<polygon points="${x(0)},${bottom} ${points(result.schedule)} ${x(result.months)},${bottom}" fill="#edf2e4"/><polyline points="${points(original.schedule)}" fill="none" stroke="#bac3af" stroke-width="2" stroke-dasharray="5 4"/><polyline points="${points(result.schedule)}" fill="none" stroke="#526322" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(result.months)}" cy="${bottom}" r="4" fill="#526322"/>`;
  for(let f of [0,.25,.5,.75,1])svg+=`<text x="${x(original.months*f)}" y="230" text-anchor="${f===0?'start':f===1?'end':'middle'}" font-size="12" fill="#737c69">${Number((original.months*f/12).toFixed(1))}y</text>`;

  const targetYears=parse('goal-years');
  const goalValid=Number.isInteger(targetYears)&&targetYears>=1&&targetYears<=40;
  $('goal-error').hidden=goalValid;
  $('goal-error').textContent=goalValid?'':'Choose a whole-number target between 1 and 40 years.';
  root.querySelector('.goal-plan').hidden=!goalValid;
  if(goalValid){const g=goalPlan({principal,annualRate,months:config.months,targetMonths:targetYears*12});
   $('goal-bonus').textContent=money(g.bonus);$('goal-emi').textContent=money(original.emi)+' / month';
   $('goal-extra-emi').textContent=money(original.emi);$('goal-total').textContent=money(g.annualPayment);
   $('goal-payoff').textContent='Paid off in '+duration(g.plan.months);
   $('goal-interest-paid').textContent=money(g.plan.interest);$('goal-interest').textContent=money(Math.max(0,original.interest-g.plan.interest))+' interest saved';
   $('goal-zero-note').hidden=g.bonus!==0;
  }
  $('balance-chart').innerHTML=svg;
  $('balance-chart').setAttribute('aria-label',`Loan balance: original payoff in ${duration(original.months)}, with strategies in ${duration(result.months)}. Interest saved ${money(saved)}.`);
 }
 function onInput(e){if(e.target.matches('input'))update();}
 function onBlur(e){if(['principal','lump-amount'].includes(e.target.id)){const v=Number(e.target.value.replaceAll(',',''));if(Number.isFinite(v)&&v>0)e.target.value=v.toLocaleString('en-IN',{maximumFractionDigits:0});}}
 function onClick(e){if(e.target.closest('.reset-strategies')){for(let id of ['monthly','annual','step','lump'])$(id).checked=false;update();}
  if(e.target.closest('#download-schedule')&&current){const rows=['Month,Opening balance,Interest,Payment,Extra prepayment,Closing balance'];let opening=current.config.principal;
   for(const row of current.result.schedule.slice(1)){rows.push([row.month,opening,row.interest,row.payment,row.extra,row.balance].map((v,i)=>i===0?v:v.toFixed(2)).join(','));opening=row.balance;}
   const blob=new Blob([rows.join('\n')],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='home-loan-prepayment-schedule.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
 }
 root.addEventListener('input',onInput);root.addEventListener('change',onInput);root.addEventListener('focusout',onBlur);root.addEventListener('click',onClick);update();
 return ()=>{root.removeEventListener('input',onInput);root.removeEventListener('change',onInput);root.removeEventListener('focusout',onBlur);root.removeEventListener('click',onClick);};
}
