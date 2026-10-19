# MEXC Trend Following + Breakout Bot (v1.0)

Node.js starter project for MEXC USDT-margined futures. Strategy uses closed candles, 4H + 1H trend alignment, EMA 20/50/115, HMA 20, breakout level, retest, volume expansion, RSI, ATR, and liquidity sweep/reclaim + MSS confirmation.

## Important safety notes
- This project is not a promise of profit and has not been verified against your MEXC account or tested with live orders.
- `.env.example` deliberately defaults to `AUTO_TRADING_ENABLED=false` and `REAL_TRADING_ENABLED=false`. Test signal output and exchange compatibility first. Do not enable live trading until the exchange order and protective-order behavior is verified.
- The daily-loss setting is exposed as a configuration value, but a reliable daily-loss kill switch requires fetching and reconciling account equity/realized PnL; this starter does **not** yet enforce that limit. Do not treat the 10% setting as active protection.
- Exchange-specific stop-loss/take-profit parameters differ. The order calls here may be rejected by MEXC/CCXT depending on current API support. Confirm protective orders appear on the exchange before any live use. If protection is rejected, close or protect the position manually.
- API key must have only the required Futures permissions. Never grant withdrawal permission. Keep `.env` private and never commit it to GitHub.

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and add API keys only for private account access.
3. Run `npm install`, then `npm run check`, then `npm start`.
4. Visit `/health` and `/status` on the server to inspect mode and signals.
5. Initially keep both trading flags false. Verify candle retrieval and signals before considering live execution.

## Railway
Upload this project to a private GitHub repository, create a Railway service from it, and set environment variables in Railway's Variables panel. Do not upload `.env` to GitHub. Start command: `npm start`.

## Current limitations
- The strategy is a conservative rule-based signal engine, not a backtested profitable system.
- The `daily-loss` hard stop, realized-PnL reconciliation, order/position reconciliation after restart, exchange-native bracket-order verification, and robust symbol precision handling need additional exchange-specific testing before live deployment.
