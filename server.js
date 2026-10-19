require('dotenv').config();
const ccxt = require('ccxt');
const http = require('http');

const cfg = {
  auto: process.env.AUTO_TRADING_ENABLED === 'true', real: process.env.REAL_TRADING_ENABLED === 'true',
  symbols: (process.env.SYMBOLS || 'BTC/USDT:USDT,ETH/USDT:USDT,SOL/USDT:USDT').split(',').map(s=>s.trim()).filter(Boolean),
  entryTf: process.env.ENTRY_TIMEFRAME || '15m', trendTf: process.env.TREND_TIMEFRAME || '1h', biasTf: process.env.BIAS_TIMEFRAME || '4h',
  leverage: Number(process.env.LEVERAGE || 10), amount: Number(process.env.TRADE_AMOUNT_USDT || 5),
  maxPositions: Number(process.env.MAX_OPEN_POSITIONS || 3), maxDirection: Number(process.env.MAX_SAME_DIRECTION_POSITIONS || 2),
  dailyLossPct: Number(process.env.DAILY_LOSS_LIMIT_PCT || 10), maxTrades: Number(process.env.MAX_TRADES_PER_DAY || 6),
  lossCooldown: Number(process.env.LOSS_COOLDOWN_MINUTES || 60)*60000, entryCooldown: Number(process.env.ENTRY_COOLDOWN_MINUTES || 30)*60000,
  lookback: Number(process.env.BREAKOUT_LOOKBACK || 20), atrPeriod: Number(process.env.ATR_PERIOD || 14), minRR: Number(process.env.MIN_RR || 2),
  stopAtr: Number(process.env.STOP_ATR_MULTIPLIER || 1.5), tpR: Number(process.env.TAKE_PROFIT_R || 2.5), interval: Number(process.env.SCAN_INTERVAL_SECONDS || 60)*1000,
  port: Number(process.env.PORT || 3000)
};
const state = { startedAt:new Date().toISOString(), lastScan:null, signals:[], tradesToday:0, day:new Date().toISOString().slice(0,10), dayStartEquity:null, cooldownUntil:0, lastEntry:{}, errors:[], mode: cfg.real&&cfg.auto?'LIVE':cfg.auto?'PAPER-AUTO':'SIGNALS-ONLY' };
const exchange = new ccxt.mexc({ apiKey:process.env.MEXC_ACCESS_KEY, secret:process.env.MEXC_SECRET_KEY, enableRateLimit:true, options:{defaultType:'swap'} });
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const num = x => Number.isFinite(Number(x)) ? Number(x) : 0;
function ema(values, period){ if(values.length<period)return null; const k=2/(period+1); let e=values.slice(0,period).reduce((a,b)=>a+b,0)/period; for(let i=period;i<values.length;i++)e=values[i]*k+e*(1-k); return e; }
function wma(v,p){ if(v.length<p)return null; let s=0,w=0; for(let i=0;i<p;i++){s+=v[v.length-p+i]*(i+1);w+=i+1;}return s/w; }
function hma(v,p=20){ if(v.length<p+Math.floor(Math.sqrt(p)))return null; const half=Math.floor(p/2), root=Math.floor(Math.sqrt(p)), raw=[]; for(let i=0;i<v.length;i++){const a=wma(v.slice(0,i+1),half),b=wma(v.slice(0,i+1),p);if(a!==null&&b!==null)raw.push(2*a-b);} return wma(raw,root); }
function rsi(v,p=14){ if(v.length<p+1)return null; let g=0,l=0;for(let i=v.length-p;i<v.length;i++){const d=v[i]-v[i-1];if(d>0)g+=d;else l-=d;}if(l===0)return 100;return 100-100/(1+(g/p)/(l/p)); }
function atr(c,p=14){ if(c.length<p+1)return null;let s=0;for(let i=c.length-p;i<c.length;i++){const prev=c[i-1][4];s+=Math.max(c[i][2]-c[i][3],Math.abs(c[i][2]-prev),Math.abs(c[i][3]-prev));}return s/p; }
function trend(c){const close=c.map(x=>x[4]);const e20=ema(close,20),e50=ema(close,50),e115=ema(close,115),h=hma(close,20);const last=close.at(-1);if([e20,e50,e115,h].some(x=>x===null))return 'UNKNOWN';if(last>e20&&e20>e50&&e50>e115&&h>h*0.999)return 'LONG';if(last<e20&&e20<e50&&e50<e115&&h<h*1.001)return 'SHORT';return 'FLAT';}
function analyze(symbol, entry, trendCandles, biasCandles){
  // Ignore the currently-forming candle: use only closed candles.
  const e=entry.slice(0,-1), tc=trendCandles.slice(0,-1), bc=biasCandles.slice(0,-1);
  if(e.length<Math.max(cfg.lookback+3,120)||tc.length<120||bc.length<120) return {symbol,signal:'WAIT',reason:'Insufficient closed candle history'};
  const closes=e.map(x=>x[4]), last=e.at(-1), prev=e.at(-2), atrVal=atr(e,cfg.atrPeriod), t=trend(tc), b=trend(bc);
  if(!atrVal||atrVal<=0)return {symbol,signal:'WAIT',reason:'ATR unavailable'};
  const recent=e.slice(-(cfg.lookback+1),-1), high=Math.max(...recent.map(x=>x[2])), low=Math.min(...recent.map(x=>x[3]));
  const volBase=e.slice(-21,-1).reduce((s,x)=>s+x[5],0)/20, volOk=last[5]>=volBase*1.25;
  const prior=e.slice(-15,-2), swingHigh=Math.max(...prior.map(x=>x[2])), swingLow=Math.min(...prior.map(x=>x[3]));
  const longBreak=last[4]>high && prev[4]<=high, shortBreak=last[4]<low && prev[4]>=low;
  // Retest-confirmation: breakout level must have been touched/retested in recent closed candles and close back in breakout direction.
  const recent3=e.slice(-4,-1); const longRetest=recent3.some(x=>x[3]<=high+atrVal*.15&&x[4]>=high) && last[4]>high;
  const shortRetest=recent3.some(x=>x[2]>=low-atrVal*.15&&x[4]<=low) && last[4]<low;
  // Sweep + reclaim + MSS: sweep prior swing, close back inside, then close through local structure.
  const sweepLow=last[3]<swingLow&&last[4]>swingLow, sweepHigh=last[2]>swingHigh&&last[4]<swingHigh;
  const mssLong=last[4]>Math.max(...e.slice(-5,-1).map(x=>x[2])), mssShort=last[4]<Math.min(...e.slice(-5,-1).map(x=>x[3]));
  const mom=rsi(closes,14); const risk=atrVal*cfg.stopAtr; let side=null,entryPrice=last[4],stop=null,tp=null,reason='';
  // Strict gate: multi-timeframe alignment + volume expansion + closed-candle breakout and retest, or sweep/reclaim + MSS.
  if(t==='LONG'&&b==='LONG'&&(longBreak&&longRetest||sweepLow&&mssLong)&&volOk&&mom!==null&&mom>=52&&mom<=75){side='long';stop=entryPrice-risk;tp=entryPrice+risk*cfg.tpR;reason=longBreak?'Trend + breakout/retest + volume':'Trend + liquidity sweep/reclaim + MSS';}
  if(t==='SHORT'&&b==='SHORT'&&(shortBreak&&shortRetest||sweepHigh&&mssShort)&&volOk&&mom!==null&&mom<=48&&mom>=25){side='short';stop=entryPrice+risk;tp=entryPrice-risk*cfg.tpR;reason=shortBreak?'Trend + breakout/retest + volume':'Trend + liquidity sweep/reclaim + MSS';}
  if(!side)return {symbol,signal:'NO TRADE',reason:`Strict filters not aligned (entry trend ${t}, higher trend ${b}, volume ${volOk?'ok':'weak'}, RSI ${mom===null?'n/a':mom.toFixed(1)})`,price:last[4],atr:atrVal};
  const rr=Math.abs(tp-entryPrice)/Math.abs(entryPrice-stop); if(rr<cfg.minRR)return {symbol,signal:'NO TRADE',reason:'Risk/reward below configured minimum'};
  return {symbol,signal:side.toUpperCase(),reason,price:entryPrice,stopLoss:stop,takeProfit:tp,riskReward:Number(rr.toFixed(2)),atr:atrVal,rsi:Number(mom.toFixed(1)),volumeConfirmed:volOk,trend1h:t,trend4h:b,candleTime:new Date(last[0]).toISOString()};
}
async function getCandles(symbol,tf,limit=180){return exchange.fetchOHLCV(symbol,tf,undefined,limit);}
async function positions(){try{return await exchange.fetchPositions(cfg.symbols);}catch(e){state.errors.push(`${new Date().toISOString()} positions: ${e.message}`);state.errors=state.errors.slice(-10);return []}}
async function executeSignal(s){
  if(!cfg.auto||!s||!['LONG','SHORT'].includes(s.signal))return;
  if(Date.now()<state.cooldownUntil)return;
  if(state.tradesToday>=cfg.maxTrades)return;
  if(Date.now()-(state.lastEntry[s.symbol]||0)<cfg.entryCooldown)return;
  if(!cfg.real){s.execution='PAPER ONLY (REAL_TRADING_ENABLED=false)';return;}
  if(!exchange.apiKey||!exchange.secret){s.execution='BLOCKED: API keys missing';return;}
  try{
    const pos=await positions(); const active=pos.filter(p=>Math.abs(num(p.contracts||p.contractSize))>0);
    if(active.length>=cfg.maxPositions){s.execution='BLOCKED: max open positions';return;}
    const same=active.filter(p=>String(p.side||'').toLowerCase()===(s.signal==='LONG'?'long':'short'));
    if(same.length>=cfg.maxDirection){s.execution='BLOCKED: max same-direction positions';return;}
    // Size in USDT notional, adjusted to price. Exchange contract sizing varies by market; fail closed if market metadata is unclear.
    await exchange.loadMarkets(); const market=exchange.market(s.symbol); if(!market||!market.contractSize) {s.execution='BLOCKED: contract size metadata unavailable';return;}
    const contracts=Number(exchange.amountToPrecision(s.symbol,(cfg.amount*cfg.leverage/s.price)/market.contractSize));
    if(!Number.isFinite(contracts)||contracts<=0){s.execution='BLOCKED: computed order size is zero';return;}
    try{await exchange.setLeverage(cfg.leverage,s.symbol);}catch(e){s.execution=`BLOCKED: leverage setup failed: ${e.message}`;return;}
    const side=s.signal==='LONG'?'buy':'sell';
    const order=await exchange.createOrder(s.symbol,'market',side,contracts,undefined,{reduceOnly:false});
    // Protective orders are attempted immediately after entry; if either fails, report loudly for manual intervention.
    let slOk=false,tpOk=false; try{await exchange.createOrder(s.symbol,'market',s.signal==='LONG'?'sell':'buy',contracts,undefined,{stopLossPrice:s.stopLoss,reduceOnly:true});slOk=true;}catch(e){s.stopLossError=e.message;}
    try{await exchange.createOrder(s.symbol,'market',s.signal==='LONG'?'sell':'buy',contracts,undefined,{takeProfitPrice:s.takeProfit,reduceOnly:true});tpOk=true;}catch(e){s.takeProfitError=e.message;}
    s.execution=`ORDER SENT id=${order.id||'unknown'}; SL submitted=${slOk}; TP submitted=${tpOk}`; state.lastEntry[s.symbol]=Date.now();state.tradesToday++;
  }catch(e){s.execution=`ORDER FAILED: ${e.message}`;state.errors.push(`${new Date().toISOString()} order ${s.symbol}: ${e.message}`);state.errors=state.errors.slice(-10);}
}
async function scan(){
  const today=new Date().toISOString().slice(0,10);if(today!==state.day){state.day=today;state.tradesToday=0;state.dayStartEquity=null;}
  state.lastScan=new Date().toISOString();const out=[];
  for(const symbol of cfg.symbols){try{const [e,t,b]=await Promise.all([getCandles(symbol,cfg.entryTf,180),getCandles(symbol,cfg.trendTf,180),getCandles(symbol,cfg.biasTf,180)]);const s=analyze(symbol,e,t,b);out.push(s);await executeSignal(s);}catch(err){out.push({symbol,signal:'ERROR',reason:err.message});state.errors.push(`${new Date().toISOString()} ${symbol}: ${err.message}`);state.errors=state.errors.slice(-10);}await sleep(250);}
  state.signals=out;
}
const server=http.createServer((req,res)=>{res.setHeader('content-type','application/json; charset=utf-8');if(req.url==='/health'){res.end(JSON.stringify({ok:true,mode:state.mode,startedAt:state.startedAt,lastScan:state.lastScan}));return;}if(req.url==='/status'){res.end(JSON.stringify({mode:state.mode,autoTrading:cfg.auto,realTrading:cfg.real,settings:{symbols:cfg.symbols,leverage:cfg.leverage,tradeAmountUSDT:cfg.amount,maxOpenPositions:cfg.maxPositions,maxSameDirection:cfg.maxDirection,dailyLossLimitPct:cfg.dailyLossPct,maxTradesPerDay:cfg.maxTrades},...state},null,2));return;}res.statusCode=404;res.end(JSON.stringify({error:'Use /health or /status'}));});
server.listen(cfg.port,()=>console.log(`MEXC Trend+Breakout bot on ${cfg.port}; mode=${state.mode}; symbols=${cfg.symbols.join(',')}`));
(async()=>{while(true){try{await scan();}catch(e){state.errors.push(`${new Date().toISOString()} scan: ${e.message}`);state.errors=state.errors.slice(-10);}await sleep(cfg.interval);}})();
