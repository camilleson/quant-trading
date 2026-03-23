import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter, ComposedChart } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel" style={{ padding: '12px', border: '1px solid var(--panel-border)', minWidth: '150px' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.875rem' }}>{label}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
            Price: ${payload[0]?.value?.toFixed(2)}
          </p>
          {data.rsi && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              RSI: {data.rsi.toFixed(2)}
            </p>
          )}
          {data.ma5 && data.ma20 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              MA(5): ${data.ma5?.toFixed(2)} | MA(20): ${data.ma20?.toFixed(2)}
            </p>
          )}
          {data.signalType === 'BUY' && (
            <p style={{ color: 'var(--success-color)', fontWeight: 'bold', marginTop: '4px' }}>🟢 BUY SIGNAL</p>
          )}
          {data.signalType === 'SELL' && (
            <p style={{ color: 'var(--danger-color)', fontWeight: 'bold', marginTop: '4px' }}>🔴 SELL SIGNAL</p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const SignalShape = (props) => {
  const { cx, cy, payload } = props;
  
  if (!payload.signalType) return null;

  const isBuy = payload.signalType === 'BUY';
  const color = isBuy ? 'var(--success-color)' : 'var(--danger-color)';
  const icon = isBuy ? '▲' : '▼';
  const yOffset = isBuy ? 25 : -25;
  const filterId = isBuy ? 'glow-success' : 'glow-danger';
  
  return (
    <g>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={6} fill={color} stroke="var(--bg-color)" strokeWidth={2} filter={`url(#${filterId})`} />
      <text 
        x={cx} 
        y={cy + yOffset} 
        textAnchor="middle" 
        fill={color} 
        fontSize="18px" 
        fontWeight="bold"
        style={{ textShadow: `0 0 10px ${color}` }}
      >
        {icon}
      </text>
    </g>
  );
};

export default function TradingChart({ data }) {
  if (!data || data.length === 0) return null;
  
  const minPrice = Math.min(...data.map(d => d.close)) * 0.95;
  const maxPrice = Math.max(...data.map(d => d.close)) * 1.05;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
      >
        <defs>
          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="var(--bg-color)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="var(--text-muted)" 
          tickFormatter={(tick) => tick.substring(5)} 
          minTickGap={40}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        <YAxis 
          domain={[minPrice, maxPrice]} 
          axisLine={false}
          tickLine={false}
          tickFormatter={(val) => `$${val.toFixed(0)}`}
          stroke="var(--text-muted)"
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '5 5' }} />
        
        <Area 
          type="monotone" 
          dataKey="close" 
          stroke="var(--accent-color)" 
          fillOpacity={1} 
          fill="url(#colorClose)" 
          strokeWidth={3}
          activeDot={{ r: 6, fill: 'var(--accent-color)', stroke: 'var(--bg-color)', strokeWidth: 3 }}
        />
        
        <Scatter 
          dataKey="signal" 
          shape={<SignalShape />} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
