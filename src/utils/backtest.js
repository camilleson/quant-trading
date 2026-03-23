/**
 * 백테스팅 결과를 계산하는 유틸리티
 */
export function calculateBacktestMetrics(data) {
  if (!data || data.length === 0) return { 
    totalReturn: 0, 
    mdd: 0, 
    tradeLog: [], 
    winRate: 0 
  };

  let tradeLog = [];
  let currentTrade = null;
  let cumulativeReturn = 1; // 1 = 100% (원금)
  let equityCurve = [1];
  let peak = 1;
  let maxDrawdown = 0;

  data.forEach((d) => {
    if (d.signalType === 'BUY' && !currentTrade) {
      currentTrade = { entryDate: d.date, entryPrice: d.close };
    } else if (d.signalType === 'SELL' && currentTrade) {
      const profitPct = (d.close - currentTrade.entryPrice) / currentTrade.entryPrice;
      const tradeReturn = 1 + profitPct;
      
      cumulativeReturn *= tradeReturn;
      
      tradeLog.push({
        entryDate: currentTrade.entryDate,
        entryPrice: currentTrade.entryPrice,
        exitDate: d.date,
        exitPrice: d.close,
        profitPct: profitPct * 100
      });
      
      currentTrade = null;
    }
    
    // MDD 계산을 위한 중간 경로 (현재 거래 중인 손익 반영)
    let currentEquity = cumulativeReturn;
    if (currentTrade) {
      const unrealizedProfit = (d.close - currentTrade.entryPrice) / currentTrade.entryPrice;
      currentEquity *= (1 + unrealizedProfit);
    }
    
    peak = Math.max(peak, currentEquity);
    const drawdown = (peak - currentEquity) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    equityCurve.push(currentEquity);
  });

  const winRate = tradeLog.length > 0 
    ? (tradeLog.filter(t => t.profitPct > 0).length / tradeLog.length) * 100 
    : 0;

  return {
    totalReturn: (cumulativeReturn - 1) * 100,
    mdd: maxDrawdown * 100,
    tradeLog: tradeLog.reverse(), // 최신 거래가 위로 오게
    winRate
  };
}

/**
 * 오늘의 액션 설명 생성
 */
export function getActionSummary(lastData, strategy, prevSignal) {
  if (!lastData) return "데이터 로딩 중...";
  
  const signal = lastData.signalType;
  
  if (strategy === 'RSI') {
    if (signal === 'BUY') return "현재 RSI가 과매도 구간입니다. 분할 매수를 시작하기 좋은 시점입니다.";
    if (signal === 'SELL') return "현재 RSI가 과매수 구간입니다. 익절을 고려하거나 비중을 줄이세요.";
    if (lastData.rsi < 40) return "RSI가 30(과매도)을 향해 내려가고 있습니다. 추가 매수 기회를 노리세요.";
    if (lastData.rsi > 60) return "RSI가 70(과매수)을 향해 올라가고 있습니다. 과열을 경계하세요.";
    return "현재 특이 신호가 없습니다. 기존 포지션을 유지하며 관망하세요.";
  } else {
    if (signal === 'BUY') return "단기 이평선이 장기를 돌파했습니다! 강력한 매수 신호입니다.";
    if (signal === 'SELL') return "추세가 꺾였습니다. 리스크 관리를 위해 매도 또는 현금화를 권장합니다.";
    return "현재 추세가 유지되고 있습니다. 평단가 근처라면 계속 보유하세요.";
  }
}
