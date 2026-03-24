export async function fetchRealData(symbol = 'TQQQ') {
  const cacheKey = `stock_data_${symbol}`;
  const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

  try {
    // Check if we have cached data first
    const cachedItem = sessionStorage.getItem(cacheKey);
    if (cachedItem) {
      const { timestamp, data } = JSON.parse(cachedItem);
      // Data is valid for 1 hour
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        console.log(`Using cached data for ${symbol}`);
        return data;
      }
    }

    // We use the Vite proxy to bypass CORS
    const response = await fetch(`/api/yfinance/v8/finance/chart/${symbol}?interval=1d&range=2y`);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('API 호출 횟수가 초과되었습니다 (Too Many Requests). 잠시 후 다시 시도해주세요.');
      }
      throw new Error(`Failed to fetch data for ${symbol}`);
    }
    
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error(`No data found for ${symbol}`);
    }
    
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    
    // Parse into standard format
    const formattedData = timestamps.map((ts, index) => {
      const date = new Date(ts * 1000).toISOString().split('T')[0];
      return {
        date,
        open: Number((quote.open[index] || 0).toFixed(2)),
        high: Number((quote.high[index] || 0).toFixed(2)),
        low: Number((quote.low[index] || 0).toFixed(2)),
        close: Number((quote.close[index] || 0).toFixed(2)),
        volume: quote.volume[index] || 0,
      };
    }).filter(d => d.close > 0); // Remove any empty/null quotes
    
    // Save to cache
    sessionStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: formattedData
    }));

    return formattedData;
  } catch (error) {
    console.error("Error fetching real data:", error);
    
    // Error fallback: If 429 happens, try to load any expired cache just to show something
    const cachedItemFallback = sessionStorage.getItem(cacheKey);
    if (cachedItemFallback) {
      console.warn("API Error: Using expired cached data as fallback.");
      return JSON.parse(cachedItemFallback).data;
    }
    
    throw error;
  }
}
