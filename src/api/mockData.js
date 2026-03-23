import { addDays } from 'date-fns';

export function generateDailyData(startDate = new Date(2023, 0, 1), days = 200, startPrice = 100) {
  let data = [];
  let currentPrice = startPrice;
  let currentDate = startDate;

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * 3;
    currentPrice = Math.max(1, currentPrice + change);
    
    const open = currentPrice - (Math.random() - 0.5) * 2;
    const high = Math.max(open, currentPrice) + Math.random() * 2;
    const low = Math.min(open, currentPrice) - Math.random() * 2;

    data.push({
      date: currentDate.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 500000,
    });
    
    currentDate = addDays(currentDate, 1);
  }
  return data;
}
