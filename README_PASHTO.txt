MEXC Futures Auto Trading Bot v34.4.5 — NO PULLBACK QUALITY MODE

دا نسخه د Pullback/Retest اجباري شرط لرې کوي.

اصلي بدلونونه:
- Pullback/Retest د Entry لپاره REQUIRED نه دی.
- 5m CLOSED candle trend + momentum signal کولای شي Entry جوړ کړي.
- LONG: Close > EMA9 > EMA21 >= EMA50 + bullish candle + volume/body quality.
- SHORT: Close < EMA9 < EMA21 <= EMA50 + bearish candle + volume/body quality.
- د ډېر ناوخته Entry مخنیوي لپاره EMA21 distance، extension، volatility، HTF alignment، score، RR او structure protection لا هم فعال دي.
- LONG/SHORT direction invariant ساتل شوی؛ signal باید د order direction سره عین وي.
- Real trading د deploy په وخت کې د .env له لارې کنټرولېږي. د ازموینې لپاره REAL_TRADING_ENABLED=false او AUTO_TRADING_ENABLED=false وساتئ.

یادونه: دا نسخه د Pullback شرط لرې کوي، خو د کیفیت ټول فلټرونه نه لرې کوي. هدف دا دی چې WAIT کم شي، خو خراب/ډېر ناوخته Entry هم ونه منل شي.


v34.4.5 اصلاحات: د fast scanner صفر-candidate ستونزه اصلاح شوه؛ د discovery او final entry شرطونه جلا شول؛ د API/scan خطاګانې اوس په status کې ښکاره کېږي؛ Pullback او Breakout اجباري نه دي.


v34.4.5 HOTFIX:
- د REQUIRE_BREAKOUT_RETEST د JavaScript comment کې پټ پاتې کېدل اصلاح شول.
- REQUIRE_BREAKOUT_RETEST اوس په کوډ کې په ښکاره ډول false دی.
- REQUIRE_PULLBACK_ENTRY هم hard-disabled دی، څو پخوانی Railway .env د Signal مخه ونه نیسي.
- Quality filters، breakout confirmation، HTF alignment، anti-chase، RR او protection checks لا هم فعال دي.


v34.5 — د غټو Timeframeونو نوې ستراتیژي
- اصلي تحلیل: 1D + 8H + 6H + 4H.
- 1H د Trend confirmation لپاره کارېږي.
- 15m د Entry trigger دی.
- 5m نور د Signal لپاره نه کارېږي.
- LONG یوازې هغه وخت چې د غټو Timeframeونو اکثریت LONG وي او 1H/15m تایید وکړي.
- SHORT هم همداسې برعکس؛ د Signal او Order direction سخت lock دی.
- لومړنی TP شاوخوا 3.5٪ دی، خو که 4H/1H/15m حرکت قوي پاتې شي، TP په 2٪-2٪ مرحلو کې تر 15٪ پورې غځېږي.
- Trailing stop تر 6٪ ګټې وروسته فعالېږي، څو قوي حرکت ډېر ژر بند نه کړي.
- د SL protection سیستم هم فعاله پاتې دی.
- هدف: د کوچنیو 5m شورونو پر ځای د غټو حرکتونو نیول.


v34.6 — STRICT PULLBACK + WICK ENTRY
- 1D + 8H + 6H + 4H د اصلي جهت لپاره؛ لږ تر لږه 3 له 4 څخه باید یو جهت تایید کړي.
- 1H باید د Entry له جهت سره مخالف نه وي.
- 15m اصلي Entry timeframe دی.
- د Breakout په هماغه کندل کې Entry نه کېږي. لومړی Breakout، بیا Pullback/Retest، بیا Reclaim غواړي.
- د LONG لپاره د 15m کندل lower wick د upper wick سره مقایسه کېږي؛ د SHORT لپاره upper wick د lower wick سره مقایسه کېږي.
- د عمودي Pump په سر کې LONG او د Dump په ښکته کې SHORT نه اخلي.
- SL د Pullback/Retest د swing له شا + ATR buffer څخه جوړېږي؛ که structure ډېر لرې وي، Entry رد کېږي.
- 5m یوازې diagnostic دی او د 15m صحیح Entry په خپله نه بندوي.
- مصنوعي Entry cooldown = 0؛ معتبر setup په وخت کې د cooldown له امله نه بندېږي.
- Score تر 100 پورې رسېږي، خو 100٪ ګټه/بریا هېڅ سیستم تضمینولی نه شي.
- TP adaptive پاتې دی او قوي حرکت کې غځېږي.


v34.8.1 — اصلاحات مهم:
- د MAX_OPEN_POSITIONS پخوانی default=1 لرې شو؛ POSITION_LIMIT_ENABLED=false په default کې دی.
- څو مختلفو کوینونو کې پوزیشنونه هممهاله خلاصولی شي.
- د هماغه symbol موجود position/order لا هم د duplicate entry مخه نیسي.
- د final preflight لپاره د قوي candidates شمېر تر 15 پورې لوړ شو؛ که لومړی قوي signal د manual position، balance، spread، news یا exchange preflight له امله بند شي، راتلونکی قوي signal هم ازمویل کېږي.
- Pullback/Breakout flags نور د پخواني Railway env له امله په پټه سخت gate نه جوړوي.
- بوټ د هر scan لپاره ټول active USDT universe لټوي او د موجودو معتبره setupونو له منځه تر ټولو قوي trade هڅوي؛ خو د بازار د نشتوالي په صورت کې مصنوعي/جبري trade نه جوړوي.
