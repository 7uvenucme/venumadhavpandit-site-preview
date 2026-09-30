export function emi(principal, annualRate, months) {
  const r = annualRate / 1200;
  return r === 0 ? principal / months : principal * r / -Math.expm1(-months * Math.log1p(r));
}
export function amortize({principal, annualRate, months, monthlyExtra=false, annualExtra=false, extraEmis=1, stepUp=false, stepPercent=9, lumpSum=false, lumpAmount=500000, lumpMonth=12, annualBonus=0}) {
  const baseEmi = emi(principal, annualRate, months), r = annualRate / 1200;
  let balance=principal, interest=0, paid=0, extraPaid=0;
  const schedule=[{month:0,balance,interest:0,payment:0,extra:0}];
  for(let month=1; month<=months && balance>0; month++) {
    const charge=balance*r;
    const regular=baseEmi * (stepUp ? (1+stepPercent/100)**Math.floor((month-1)/12) : 1);
    const plannedExtra=(monthlyExtra?baseEmi/12:0)+(annualExtra&&month%12===0?baseEmi*extraEmis+annualBonus:0)+(lumpSum&&month===lumpMonth?lumpAmount:0);
    const due=balance+charge;
    const regularPaid=Math.min(regular,due), extra=Math.min(plannedExtra,Math.max(0,due-regularPaid));
    const payment=regularPaid+extra;
    balance=Math.max(0,due-payment);
    if(balance<0.000001) balance=0;
    interest+=charge; paid+=payment; extraPaid+=extra;
    schedule.push({month,balance,interest:charge,payment,extra});
  }
  return {emi:baseEmi,months:schedule.length-1,interest,paid,extraPaid,schedule};
}
export const money = n => '₹'+Math.round(n).toLocaleString('en-IN');
export function duration(n) {const y=Math.floor(n/12),m=n%12;return [y?`${y} ${y===1?'year':'years'}`:'',m?`${m} ${m===1?'month':'months'}`:''].filter(Boolean).join(' ')||'0 months';}
// Fixed yearly principal top-up, in addition to one original EMI, paid at loan-year end.
export function goalPlan({principal,annualRate,months,targetMonths}){
 const base=emi(principal,annualRate,months),r=annualRate/1200;
 function residual(bonus){let balance=principal;for(let m=1;m<=targetMonths;m++){balance=Math.max(0,balance*(1+r)-base-(m%12===0?base+bonus:0));if(balance===0)break;}return balance;}
 let low=0,high=principal;
 if(residual(0)>0){for(let i=0;i<80;i++){const mid=(low+high)/2;if(residual(mid)>0)low=mid;else high=mid;}}else high=0;
 const bonus=Math.ceil(high); // Round up to rupees so the plan meets, rather than misses, the goal.
 const plan=amortize({principal,annualRate,months,annualExtra:true,extraEmis:1,annualBonus:bonus});
 return {bonus,annualPayment:base+bonus,plan,targetMonths};
}
