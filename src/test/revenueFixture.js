export function revenueFixture(from,to,granularity='day') {
  const zero={orderCount:0,liquidationCount:0,grossSales:0,discounts:0,salesAfterDiscount:0,refunds:0,salesNet:0,liquidationRevenue:0,totalNet:0,shippingFees:0};
  const summary={...zero,orderCount:1,liquidationCount:1,grossSales:200000,salesAfterDiscount:200000,refunds:50000,salesNet:150000,liquidationRevenue:10000,totalNet:160000};
  const days=[];for(let date=new Date(`${from}T12:00:00Z`);date.toISOString().slice(0,10)<=to;date.setUTCDate(date.getUTCDate()+1)){const day=date.toISOString().slice(0,10);days.push({from:day,to:day,amounts:days.length?{...zero}:{...summary}});}
  const periods=granularity==='day'?days:Array.from({length:Math.ceil(days.length/7)},(_,index)=>{const rows=days.slice(index*7,index*7+7);return {from:rows[0].from,to:rows.at(-1).to,amounts:index?{...zero}:{...summary}};});
  return {from,to,granularity,previousFrom:from,previousTo:to,summary,previousSummary:{...zero,totalNet:100000},growthPercent:60,periods,categories:[{id:'c',name:'Rau',grossSales:200000,discounts:0,refunds:50000,netRevenue:150000}],warnings:[],generatedAt:`${to}T12:00:00`,excludedOrderCount:0};
}
