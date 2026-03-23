export function calculateMA(data, period) {
  let result = [...data];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result[i] = { ...result[i], [`ma${period}`]: Number((sum / period).toFixed(2)) };
  }
  return result;
}

export function generate3GSignals(data, shortPeriod = 5, longPeriod = 20) {
  let result = calculateMA(data, shortPeriod);
  result = calculateMA(result, longPeriod);
  
  let position = 0; // 0: no position, 1: long

  return result.map((d, i) => {
    let signal = null;
    let signalType = null;

    if (i > 0 && d[`ma${shortPeriod}`] && d[`ma${longPeriod}`]) {
      const prev = result[i - 1];
      const prevShort = prev[`ma${shortPeriod}`];
      const prevLong = prev[`ma${longPeriod}`];
      const currShort = d[`ma${shortPeriod}`];
      const currLong = d[`ma${longPeriod}`];

      if (prevShort <= prevLong && currShort > currLong) {
        if (position === 0) {
          signal = d.close;
          signalType = 'BUY';
          position = 1;
        }
      } 
      else if (prevShort >= prevLong && currShort < currLong) {
        if (position === 1) {
          signal = d.close;
          signalType = 'SELL';
          position = 0;
        }
      }
    }
    
    return { ...d, signal, signalType };
  });
}
