import { useState, useEffect, useMemo } from 'react';
import { Activity, Settings, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import './App.css';
import TradingChart from './components/TradingChart';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { fetchRealData } from './api/realData';
import { calculateRSI, generateRSISignals, calculateADX } from './strategies/rsi';
import { generate3GSignals } from './strategies/breakout3g';
import { calculateBacktestMetrics, getActionSummary } from './utils/backtest';

const defaultConfigs = {
  LEVERAGE: { rsiBuy: 30, rsiSell: 70, shortMA: 5, longMA: 20 },
  COMMON: { rsiBuy: 40, rsiSell: 65, shortMA: 20, longMA: 60 }
};

function App() {
  const [strategy, setStrategy] = useState('RSI');
  const [assetType, setAssetType] = useState('LEVERAGE');
  const [chartMode, setChartMode] = useState('BACKTEST'); // 'REALTIME' or 'BACKTEST'

  // RSI 설정
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [rsiOverbought, setRsiOverbought] = useState(70);
  const [adxThreshold, setAdxThreshold] = useState(0); // ADX 필터 기본 끄기 (시그널을 더 자주 보기 위해)

  // 3G 설정
  const [maShort, setMaShort] = useState(5);
  const [maLong, setMaLong] = useState(20);
  const [useMA200Filter, setUseMA200Filter] = useState(true); // 200일선 필터 여부

  const [symbol, setSymbol] = useState('TQQQ');
  const [inputSymbol, setInputSymbol] = useState('TQQQ');
  const [baseData, setBaseData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (ticker) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchRealData(ticker);
      setBaseData(data);
    } catch (err) {
      setError(err.message);
      setBaseData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 자산 타입 변경 시 처리
  useEffect(() => {
    const config = defaultConfigs[assetType];
    setRsiOversold(config.rsiBuy);
    setRsiOverbought(config.rsiSell);
    setMaShort(config.shortMA);
    setMaLong(config.longMA);
  }, [assetType]);

  useEffect(() => {
    loadData(symbol);
  }, [symbol]);

  const chartData = useMemo(() => {
    if (baseData.length === 0) return [];

    if (strategy === 'RSI') {
      const withRSI = calculateRSI(baseData, rsiPeriod);
      const withADX = calculateADX(withRSI, 14);
      return generateRSISignals(withADX, rsiOversold, rsiOverbought, adxThreshold);
    } else {
      return generate3GSignals(baseData, maShort, maLong, useMA200Filter);
    }
  }, [baseData, strategy, rsiPeriod, rsiOversold, rsiOverbought, maShort, maLong, adxThreshold, useMA200Filter]);

  const backtest = useMemo(() => {
    return calculateBacktestMetrics(chartData);
  }, [chartData]);

  const latestData = chartData[chartData.length - 1] || {};
  const prevData = chartData[chartData.length - 2] || {};

  const currentPrice = latestData.close || 0;
  const prevPrice = prevData.close || 0;
  const changePct = prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;
  const isPositive = changePct >= 0;

  const signals = chartData.filter(d => d.signalType).slice(-5).reverse();
  const latestSignal = signals.length > 0 ? signals[0].signalType : '대기(HOLD)';

  const isBullMarket = latestData.ma200 ? latestData.close > latestData.ma200 : true;
  const actionSummary = getActionSummary(latestData, strategy);

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-title">
          <TrendingUp size={32} className="text-accent" />
          <h1>Son's Quant Dash </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && setSymbol(inputSymbol)}
            placeholder="티커 입력 (예: TQQQ)"
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.1)', color: 'white' }}
          />
          <button className="btn" onClick={() => setSymbol(inputSymbol)} disabled={isLoading}>
            {isLoading ? '로딩 중...' : '데이터 불러오기'}
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        <div className="main-chart-area">
          {/* 시장 상황 배너 */}
          {!isBullMarket && (
            <div className="market-banner danger">
              <Activity size={20} />
              <span>⚠️ <strong>시장 경고:</strong> 현재 지수가 200일 이평선 아래에 있습니다. 공격적인 매수보다는 보수적인 관망을 추천합니다.</span>
            </div>
          )}

          <div className="action-summary-container glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)', flexShrink: 0 }}>
              <Activity size={16} />
              <strong style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>오늘의 투자 액션 요약</strong>
            </div>
            <div style={{ width: '1px', height: '14px', background: 'var(--panel-border)', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>{actionSummary}</p>
          </div>

          <div className="metrics-grid">
            <div className="glass-panel metric-card">
              <span className="metric-title">현재 가격</span>
              <span className="metric-value">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="glass-panel metric-card">
              <span className="metric-title">전략 총 수익률</span>
              <span className={`metric-value ${backtest.totalReturn >= 0 ? 'text-success' : 'text-danger'}`}>
                {backtest.totalReturn > 0 ? '+' : ''}{backtest.totalReturn.toFixed(2)}%
              </span>
            </div>
            <div className="glass-panel metric-card">
              <span className="metric-title">최대 낙폭 (MDD)</span>
              <span className="metric-value text-danger">
                -{backtest.mdd.toFixed(2)}%
              </span>
            </div>
            <div className="glass-panel metric-card">
              <span className="metric-title">전일 대비</span>
              <span className={`metric-value ${isPositive ? 'text-success' : 'text-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                {changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%
              </span>
            </div>
            <div className="glass-panel metric-card">
              <span className="metric-title">현재 시그널</span>
              <span className={`metric-value ${latestSignal === 'BUY' ? 'text-success' : latestSignal === 'SELL' ? 'text-danger' : 'text-muted'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {latestSignal === 'BUY' && <TrendingUp size={24} />}
                {latestSignal === 'SELL' && <TrendingDown size={24} />}
                {latestSignal === '대기(HOLD)' && <Minus size={24} />}
                {latestSignal === 'BUY' ? '매수' : latestSignal === 'SELL' ? '매도' : latestSignal}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              className="btn"
              onClick={() => setChartMode('BACKTEST')}
              style={{ flex: 1, fontWeight: 'bold', background: chartMode === 'BACKTEST' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: chartMode === 'BACKTEST' ? '#fff' : 'var(--text-muted)' }}
            >
              분석 & 시그널 차트
            </button>
            <button
              className="btn"
              onClick={() => setChartMode('REALTIME')}
              style={{ flex: 1, fontWeight: 'bold', background: chartMode === 'REALTIME' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: chartMode === 'REALTIME' ? '#fff' : 'var(--text-muted)' }}
            >
              실시간 차트
            </button>

          </div>

          <div className="glass-panel chart-container-panel" style={{ padding: '1.5rem', position: 'relative' }}>
            {chartMode === 'REALTIME' ? (
              <AdvancedRealTimeChart symbol={symbol} theme="dark" autosize={true} hide_side_toolbar={false} allow_symbol_change={true} timezone="Asia/Seoul" />
            ) : isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                {symbol}의 실시간 시장 데이터를 가져오는 중...
              </div>
            ) : error ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger-color)' }}>
                {error}
              </div>
            ) : chartData.length > 0 ? (
              <TradingChart data={chartData} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                데이터가 없습니다.
              </div>
            )}
          </div>

        </div>

        <aside className="sidebar">
          <div className="glass-panel strategy-panel">
            <h2 className="strategy-title">
              <Settings size={20} />
              전략 설정
            </h2>

            <div className="strategy-controls">
              <div className="control-group">
                <label>자산 유형</label>
                <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                  <option value="COMMON">일반 주식 (1배수)</option>
                  <option value="LEVERAGE">레버리지 ETF (3배수)</option>
                </select>
              </div>

              <div className="control-group">
                <label>활성 전략</label>
                <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                  <option value="RSI">RSI 역추세</option>
                  <option value="3G">3G 이평선 돌파</option>
                </select>
              </div>

              <div className="strategy-info">
                <div className="info-box">
                  <span className="info-text">
                    <span className="info-label">{strategy === 'RSI' ? 'RSI 역추세:' : '3G 돌파:'}</span>
                    {strategy === 'RSI'
                      ? '과매수/과매도 구간에서 반등을 노리는 전략입니다.'
                      : '단기 이동평균선이 장기를 돌파할 때 추세를 따라가는 전략입니다.'}
                  </span>
                </div>
              </div>

              {strategy === 'RSI' && (
                <>
                  <div className="control-group">
                    <label>RSI 기간: {rsiPeriod}</label>
                    <input type="range" min="7" max="21" value={rsiPeriod} onChange={(e) => setRsiPeriod(Number(e.target.value))} />
                  </div>
                  <div className="control-group">
                    <label>과매도 (매수): {rsiOversold}</label>
                    <input type="range" min="10" max="40" value={rsiOversold} onChange={(e) => setRsiOversold(Number(e.target.value))} />
                  </div>
                  <div className="control-group">
                    <label>과매수 (매도): {rsiOverbought}</label>
                    <input type="range" min="60" max="90" value={rsiOverbought} onChange={(e) => setRsiOverbought(Number(e.target.value))} />
                  </div>
                  <div className="control-group" style={{ marginTop: '10px', borderTop: '1px solid var(--panel-border)', paddingTop: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                      <Activity size={16} /> ADX 추세 필터: {adxThreshold === 0 ? '꺼짐' : adxThreshold}
                    </label>
                    <input type="range" min="0" max="50" value={adxThreshold} onChange={(e) => setAdxThreshold(Number(e.target.value))} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ADX가 높을 때만 진입합니다. (25 이상 권장)
                    </span>
                  </div>
                </>
              )}

              {strategy === '3G' && (
                <>
                  <div className="control-group">
                    <label>단기 이평선: {maShort}</label>
                    <input type="range" min="3" max="20" value={maShort} onChange={(e) => setMaShort(Number(e.target.value))} />
                  </div>
                  <div className="control-group">
                    <label>장기 이평선: {maLong}</label>
                    <input type="range" min="10" max="60" value={maLong} onChange={(e) => setMaLong(Number(e.target.value))} />
                  </div>
                  <div className="control-group" style={{ marginTop: '10px', borderTop: '1px solid var(--panel-border)', paddingTop: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={useMA200Filter}
                        onChange={(e) => setUseMA200Filter(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>200일 이평선 필터</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '26px' }}>
                      가격이 200일선 위에 있을 때만(상승장) 매수합니다.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="glass-panel strategy-panel">
            <h2 className="strategy-title">
              <Activity size={20} />
              최근 시그널
            </h2>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {signals.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>아직 시그널이 없습니다.</div>
              )}
              {signals.map((sig, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${sig.signalType === 'BUY' ? 'var(--success-color)' : 'var(--danger-color)'}`
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: sig.signalType === 'BUY' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                      {sig.signalType === 'BUY' ? '매수 (BUY)' : '매도 (SELL)'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sig.date}</div>
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    ${sig.close.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;

