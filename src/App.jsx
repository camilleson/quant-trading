import { useState, useEffect, useMemo } from 'react';
import { Activity, Settings, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './App.css';
import TradingChart from './components/TradingChart';
import { generateDailyData } from './api/mockData';
import { calculateRSI, generateRSISignals } from './strategies/rsi';
import { generate3GSignals } from './strategies/breakout3g';

function App() {
  const [strategy, setStrategy] = useState('RSI');
  
  // RSI Settings
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [rsiOverbought, setRsiOverbought] = useState(70);

  // 3G Settings
  const [maShort, setMaShort] = useState(5);
  const [maLong, setMaLong] = useState(20);

  const [baseData, setBaseData] = useState([]);

  useEffect(() => {
    // Load initial mock data once on mount
    setBaseData(generateDailyData());
  }, []);

  const chartData = useMemo(() => {
    if (baseData.length === 0) return [];
    
    if (strategy === 'RSI') {
      const withRSI = calculateRSI(baseData, rsiPeriod);
      return generateRSISignals(withRSI, rsiOversold, rsiOverbought);
    } else {
      return generate3GSignals(baseData, maShort, maLong);
    }
  }, [baseData, strategy, rsiPeriod, rsiOversold, rsiOverbought, maShort, maLong]);

  const latestData = chartData[chartData.length - 1] || {};
  const prevData = chartData[chartData.length - 2] || {};
  
  const currentPrice = latestData.close || 0;
  const prevPrice = prevData.close || 0;
  const changePct = prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;
  const isPositive = changePct >= 0;

  const signals = chartData.filter(d => d.signalType).slice(-5).reverse();
  const latestSignal = signals.length > 0 ? signals[0].signalType : 'HOLD';

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <TrendingUp size={32} className="text-accent" />
          <h1>QuantDash Next</h1>
        </div>
        <button className="btn" onClick={() => setBaseData(generateDailyData())}>
          Regenerate Data
        </button>
      </header>

      <main className="dashboard-grid">
        <div className="main-chart-area">
          <div className="metrics-grid">
            <div className="glass-panel metric-card">
              <span className="metric-title">Current Price</span>
              <span className="metric-value">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="glass-panel metric-card">
              <span className="metric-title">24h Change</span>
              <span className={`metric-value ${isPositive ? 'text-success' : 'text-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                {changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%
              </span>
            </div>
            <div className="glass-panel metric-card">
              <span className="metric-title">Current Signal</span>
              <span className={`metric-value ${latestSignal === 'BUY' ? 'text-success' : latestSignal === 'SELL' ? 'text-danger' : 'text-muted'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {latestSignal === 'BUY' && <TrendingUp size={24} />}
                {latestSignal === 'SELL' && <TrendingDown size={24} />}
                {latestSignal === 'HOLD' && <Minus size={24} />}
                {latestSignal}
              </span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', height: '500px' }}>
            {chartData.length > 0 ? (
              <TradingChart data={chartData} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Loading chart...
              </div>
            )}
          </div>
        </div>

        <aside className="sidebar">
          <div className="glass-panel strategy-panel">
            <h2 className="strategy-title">
              <Settings size={20} />
              Strategy Config
            </h2>
            
            <div className="strategy-controls">
              <div className="control-group">
                <label>Active Strategy</label>
                <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                  <option value="RSI">RSI Reversion</option>
                  <option value="3G">MA Breakout (3G)</option>
                </select>
              </div>

              {strategy === 'RSI' && (
                <>
                  <div className="control-group">
                    <label>RSI Period: {rsiPeriod}</label>
                    <input type="range" min="7" max="21" value={rsiPeriod} onChange={(e) => setRsiPeriod(Number(e.target.value))} />
                  </div>
                  <div className="control-group">
                    <label>Oversold (Buy): {rsiOversold}</label>
                    <input type="range" min="10" max="40" value={rsiOversold} onChange={(e) => setRsiOversold(Number(e.target.value))} />
                  </div>
                  <div className="control-group">
                    <label>Overbought (Sell): {rsiOverbought}</label>
                    <input type="range" min="60" max="90" value={rsiOverbought} onChange={(e) => setRsiOverbought(Number(e.target.value))} />
                  </div>
                </>
              )}

              {strategy === '3G' && (
                <>
                  <div className="control-group">
                    <label>Short MA: {maShort}</label>
                    <input type="range" min="3" max="20" value={maShort} onChange={(e) => setMaShort(Number(e.target.value))} />
                  </div>
                  <div className="control-group">
                    <label>Long MA: {maLong}</label>
                    <input type="range" min="10" max="60" value={maLong} onChange={(e) => setMaLong(Number(e.target.value))} />
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="glass-panel strategy-panel">
            <h2 className="strategy-title">
              <Activity size={20} />
              Recent Signals
            </h2>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {signals.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No signals yet</div>
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
                      {sig.signalType}
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
