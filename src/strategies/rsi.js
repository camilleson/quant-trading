export function calculateRSI(data, period = 14) {
  if (data.length <= period) return data;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let result = [...data];
  
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = { ...result[period], rsi: 100 - (100 / (1 + rs)) };

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const currentGain = Math.max(0, diff);
    const currentLoss = Math.max(0, -diff);

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result[i] = { ...result[i], rsi: Number(rsi.toFixed(2)) };
  }

  return result;
}

export function generateRSISignals(data, oversold = 30, overbought = 70) {
  return data.map((d) => {
    let signal = null;
    let signalType = null;
    
    if (d.rsi) {
      if (d.rsi <= oversold) {
        signal = d.close;
        signalType = 'BUY';
      } else if (d.rsi >= overbought) {
        signal = d.close;
        signalType = 'SELL';
      }
    }
    return { ...d, signal, signalType };
  });
}
