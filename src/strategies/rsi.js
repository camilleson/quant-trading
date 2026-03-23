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

export function calculateADX(data, period = 14) {
  if (data.length <= period * 2) return data;

  let result = [...data];
  let tr = [];
  let plusDM = [];
  let minusDM = [];

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    const prevHigh = data[i - 1].high;
    const prevLow = data[i - 1].low;

    const trVal = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    tr.push(trVal);

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  let smoothTR = tr.slice(0, period).reduce((a, b) => a + b) / period;
  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b) / period;
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b) / period;

  const dxValues = [];

  for (let i = period; i < tr.length; i++) {
    smoothTR = (smoothTR * (period - 1) + tr[i]) / period;
    smoothPlusDM = (smoothPlusDM * (period - 1) + plusDM[i]) / period;
    smoothMinusDM = (smoothMinusDM * (period - 1) + minusDM[i]) / period;

    const plusDI = (smoothPlusDM / smoothTR) * 100;
    const minusDI = (smoothMinusDM / smoothTR) * 100;
    const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    dxValues.push(dx);

    if (dxValues.length >= period) {
      const adx = dxValues.slice(-period).reduce((a, b) => a + b) / period;
      result[i + 1] = { ...result[i + 1], adx: Number(adx.toFixed(2)) };
    }
  }

  return result;
}

export function generateRSISignals(data, oversold = 30, overbought = 70, adxThreshold = 0) {
  return data.map((d) => {
    let signal = null;
    let signalType = null;
    
    // ADX 필터: ADX가 설정값보다 클 때만 추세가 강하다고 판단하여 진입 (반대매매인 RSI 특성상 낮을때가 유리할수도 있으나 요청에 따라 ADX 높은 구간 필터링 가능)
    // 일반적으로 RSI 역추세는 ADX가 너무 높으면(강한 추세) 위험할 수 있습니다.
    // 하지만 사용자 요청대로 "ADX 수치가 높을 때만 진입"하도록 세팅을 열어둡니다.
    const isTrendStrong = adxThreshold === 0 || (d.adx && d.adx >= adxThreshold);

    if (d.rsi) {
      if (d.rsi <= oversold && isTrendStrong) {
        signal = d.close;
        signalType = 'BUY';
      } else if (d.rsi >= overbought && isTrendStrong) {
        signal = d.close;
        signalType = 'SELL';
      }
    }
    return { ...d, signal, signalType };
  });
}

