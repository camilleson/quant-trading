export async function fetchRealData(symbol = 'TQQQ') {
  try {
    // We use the Vite proxy to bypass CORS
    const response = await fetch(`/api/yfinance/v8/finance/chart/${symbol}?interval=1d&range=2y`);
    
    if (!response.ok) {
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
    
    return formattedData;
  } catch (error) {
    console.error("Error fetching real data:", error);
    throw error;
  }
}
