import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';

export default function TradingChart({ data }) {
  const chartContainerRef = useRef();
  
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Create the lightweight chart instance
    const chartOptions = {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.8)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);

    // Create Candlestick series (v5 syntax)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', // success color
      downColor: '#ef5350', // danger color
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    
    // Prepare data
    const uniqueDates = new Set();
    const candleData = [];
    const validMarkers = [];
    
    // lightweight-charts는 반드시 시간 오름차순, 중복없는 데이터를 요구합니다.
    const sortedData = [...data]
      .filter(d => d && d.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedData.forEach(d => {
      // 시간 형식 오류 방지를 위해 명확한 형태(YYYY-MM-DD)인지 확인하거나, 
      // yfinance의 경우 1d interval이면 "2024-03-24" 형태로 넘어옴.
      if (!uniqueDates.has(d.date)) {
        uniqueDates.add(d.date);
        candleData.push({
          time: d.date,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        });

        if (d.signalType === 'BUY') {
          validMarkers.push({
            time: d.date,
            position: 'belowBar',
            color: '#26a69a',
            shape: 'arrowUp',
            text: 'BUY',
            size: 2, // 마커 크기 2배 확대
          });
        } else if (d.signalType === 'SELL') {
          validMarkers.push({
            time: d.date,
            position: 'aboveBar',
            color: '#ef5350',
            shape: 'arrowDown',
            text: 'SELL',
            size: 2, // 마커 크기 2배 확대
          });
        }
      }
    });
    
    try {
      candlestickSeries.setData(candleData);
      if (validMarkers.length > 0) {
        createSeriesMarkers(candlestickSeries, validMarkers);
      }
    } catch (err) {
      console.error('Lightweight Charts Error:', err);
    }

    // === 툴팁 (Tooltip) 생성 로직 ===
    const toolTip = document.createElement('div');
    toolTip.className = 'glass-panel';
    toolTip.style = `
      width: 150px;
      position: absolute;
      display: none;
      padding: 12px;
      box-sizing: border-box;
      font-size: 14px;
      text-align: left;
      z-index: 1000;
      top: 12px;
      left: 12px;
      pointer-events: none;
      border: 1px solid var(--panel-border);
      border-radius: 6px;
      color: var(--text-primary);
    `;
    chartContainerRef.current.appendChild(toolTip);

    // 날짜별 시그널을 빠르게 찾기 위한 Map 생성
    const signalMap = new Map();
    sortedData.forEach(d => {
      if (d.signalType) {
        signalMap.set(d.date, d.signalType);
      }
    });

    chart.subscribeCrosshairMove(param => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current.clientHeight
      ) {
        toolTip.style.display = 'none';
      } else {
        const dateStr = param.time;
        const dataPoint = param.seriesData.get(candlestickSeries);
        
        if (dataPoint) {
          toolTip.style.display = 'block';
          const signalInfo = signalMap.get(dateStr);
          let signalHtml = '';
          
          if (signalInfo === 'BUY') {
            signalHtml = `<div style="color: var(--success-color); font-weight: bold; margin-top: 8px;">🟢 BUY SIGNAL</div>`;
          } else if (signalInfo === 'SELL') {
            signalHtml = `<div style="color: var(--danger-color); font-weight: bold; margin-top: 8px;">🔴 SELL SIGNAL</div>`;
          }

          toolTip.innerHTML = `
            <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 6px;">${dateStr}</div>
            <div style="display: flex; justify-content: space-between;"><span>시가:</span> <span>$${dataPoint.open.toFixed(2)}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>고가:</span> <span>$${dataPoint.high.toFixed(2)}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>저가:</span> <span>$${dataPoint.low.toFixed(2)}</span></div>
            <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>종가:</span> <span>$${dataPoint.close.toFixed(2)}</span></div>
            ${signalHtml}
          `;

          // 마우스/터치 포인터 옆으로 툴팁 위치 조정 (모바일 화면 밖으로 나가지 않게 방어)
          const tooltipWidth = 150;
          const tooltipHeight = 160;
          const chartWidth = chartContainerRef.current.clientWidth;
          const chartHeight = chartContainerRef.current.clientHeight;

          let left = param.point.x + 15;
          // 오른쪽 화면 밖으로 넘어가면 포인터 왼쪽으로 배치
          if (left + tooltipWidth > chartWidth) {
            left = Math.max(0, param.point.x - tooltipWidth - 15);
          }

          let top = param.point.y + 15;
          // 아래 화면 밖으로 넘어가면 포인터 위쪽으로 배치
          if (top + tooltipHeight > chartHeight) {
            top = Math.max(0, param.point.y - tooltipHeight - 15);
          }
          
          toolTip.style.left = left + 'px';
          toolTip.style.top = top + 'px';
        }
      }
    });

    // Fit chart content
    const dataLen = candleData.length;
    if (dataLen > 100) {
      chart.timeScale().setVisibleLogicalRange({
        from: dataLen - 100,
        to: dataLen + 5,
      });
    } else {
      chart.timeScale().fitContent();
    }

    // Auto-resize logic
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      if (chartContainerRef.current && toolTip.parentNode === chartContainerRef.current) {
        chartContainerRef.current.removeChild(toolTip);
      }
    };
  }, [data]);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative' }} 
    />
  );
}
