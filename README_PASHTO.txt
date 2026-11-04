MEXC Futures Bot v5.14.0 — Risk Controls Fixed

د ستراتيژۍ لنډيز:
- د 15m Pullback / Reclaim د داخلېدو اصلي سيګنال.
- 1H، 4H، 6H، 8H او 1D د Trend د تاييد لپاره.
- 5m د چټک مارکېټ سکين/تشخيص لپاره.
- LONG او SHORT دواړه.
- فعال USDT-M قراردادونه؛ د غير-USDT او غير فعال قراردادونو مخنيوی.

د خطر اصلاحات:
- تر 10x زيات Leverage نه مني.
- Isolated Margin (openType=1) او Hedge Mode (positionMode=2) غواړي.
- ثابت 2% Stop Loss او 3% لومړنی Take Profit؛ Adaptive TP تر 6% پورې.
- د هرې معاملې اټکلي Stop Loss خطر د USDT Equity تر 1% محدودوي.
- د ورځې د Equity تاوان 10% ته ورسېږي، نو نوې معاملې بندوي.
- په يو وخت کې تر 5 پرانيستو معاملاتو پورې.
- د هماغه Symbol پرانيستې معامله/Order/Plan وي، دويمه معامله نه پرانيزي.
- که TP/SL تایيد نه شي، حالت Critical ښيي او نوې معاملې بندوي؛ په MEXC کې بايد سمدستي لاسوند وکتل شي.

Railway نصب:
1. ZIP خلاص او ټول فايلونه Railway ته پورته کړئ يا GitHub ته Push کړئ.
2. Start command: npm start
3. د Railway Variables کې د .env.example ارزښتونه واچوئ.
4. لومړی REAL_TRADING_ENABLED=false او AUTO_TRADING_ENABLED=false وساتئ او Logs/Health وګورئ.
5. د Paper/Diagnostic ازموينې او د MEXC Hedge + Isolated حالت له تاييد وروسته، که خپله پرېکړه مو وي، دواړه متغيرونه true کړئ.
6. MEXC API Key يوازې Futures Trading permission ولري؛ Withdrawal permission مه ورکوئ.

Live Trading په دې ZIP کې په ډيفالټ ډول OFF دی. د Live فعالول د Railway Variables له لارې د کارونکي صريح اقدام غواړي.

مهم خطر:
د 1% محاسبه د اټکلي Stop Loss د رسېدو پر مهال ده؛ Slippage، Gap، Fees، Funding، د اېکسچېنج ځنډ يا د Stop امر رد کېدل واقعي تاوان زياتولای شي. د لږې اندازې سره پيل وکړئ او په دوامداره توګه Logs او MEXC Positions وګورئ.
