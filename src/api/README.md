# Free Stock Data REST APIs for Frontend

When you are ready to replace the `mockData.js` generator with real data, you can use these free APIs.

> **Note on CORS:** Many financial APIs do not allow direct requests from a web browser (CORS). You might need to use a proxy, or use APIs explicitly supporting frontend requests.

### 1. Alpha Vantage
- **URL:** `https://www.alphavantage.co/`
- **Limits:** 25 requests per day for free tier.
- **Pros:** Excellent for daily, weekly, and monthly data. Very reliable format.
- **Example Usage (fetch):**
  ```js
  const url = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=TQQQ&apikey=YOUR_API_KEY';
  const response = await fetch(url);
  const data = await response.json();
  ```

### 2. Yahoo Finance (via unofficial API or proxy)
- **URL:** No official open API, but very popular via `yfinance` in Python. In JS, you can use a RapidAPI wrapper like `Yahoo Finance API`.
- **Limits:** Usually generous on RapidAPI depending on the tier.
- **Pros:** Real-time data and historical data are very accurate.

### 3. CoinGecko (For Crypto)
- **URL:** `https://api.coingecko.com/api/v3/`
- **Limits:** No API key required for the public free tier (rate limited).
- **Pros:** Excellent CORS support, you can call it directly from the browser! Perfect for practicing RSI and 3G breakout on Bitcoin or Ethereum.

### 4. Finnhub
- **URL:** `https://finnhub.io/`
- **Limits:** 60 API calls per minute.
- **Pros:** Real-time WebSocket support for trades. Good amount of free historical data.

### 5. FMP (Financial Modeling Prep)
- **URL:** `https://financialmodelingprep.com/`
- **Limits:** 250 requests per day (free tier).
- **Pros:** Very clean JSON structure, supports a massive amount of technical indicators out of the box.
