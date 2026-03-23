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

export function generate3GSignals(data, shortPeriod = 5, longPeriod = 20, useMA200Filter = false) {
  let result = calculateMA(data, shortPeriod);
  result = calculateMA(result, longPeriod);
  result = calculateMA(result, 200); // 200일선 추가
  
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
      
      const priceAboveMA200 = !useMA200Filter || (d.ma200 && d.close > d.ma200);

      // BUY: 골든크로스 + (필터 활성화 시 가격이 200일선 위에 있어야 함)
      if (prevShort <= prevLong && currShort > currLong && priceAboveMA200) {
        if (position === 0) {
          signal = d.close;
          signalType = 'BUY';
          position = 1;
        }
      } 
      // SELL: 데드크로스 (매도는 필터와 상관없이 탈출)
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

