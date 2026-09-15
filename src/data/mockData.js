// Sparkline generator
export function generateSparkline(trend = 'random', points = 30) {
  const data = [];
  let val = 50 + Math.random() * 20;
  for (let i = 0; i < points; i++) {
    if (trend === 'up') val += (Math.random() - 0.3) * 8;
    else if (trend === 'down') val += (Math.random() - 0.7) * 8;
    else val += (Math.random() - 0.5) * 10;
    val = Math.max(5, Math.min(95, val));
    data.push(val);
  }
  return data;
}

export const TOKENS = [
  { id: 1, symbol: '$Nasduck', name: 'Nasduck', badge: 'Legacy', fdv: '$662.00K', pays: 'QQQx', paysIcon: '🔷', trend: 'down', change: -2.1 },
  { id: 2, symbol: '$Pumpcat', name: 'Pump Cat', badge: 'Legacy', fdv: '$110.80K', pays: 'PUMP', paysIcon: '🟢', trend: 'down', change: -5.4 },
  { id: 3, symbol: '$CTO', name: 'CTO', badge: 'Legacy', fdv: '$78.01K', pays: 'OTC', paysIcon: '⬛', trend: 'up', change: 3.2 },
  { id: 4, symbol: '$OTC', name: 'Own this Cat', badge: 'Legacy', fdv: '$54.17K', pays: 'OTC', paysIcon: '⬛', trend: 'down', change: -1.8 },
  { id: 5, symbol: '$Anonymouse', name: 'Anonymouse', badge: 'Legacy', fdv: '$53.32K', pays: 'ZEC', paysIcon: '🟡', trend: 'down', change: -3.3 },
  { id: 6, symbol: '$NSB', name: 'No Second Best', badge: 'Legacy', fdv: '$49.84K', pays: 'MSTRx', paysIcon: '🟠', trend: 'up', change: 8.1 },
  { id: 7, symbol: '$HaWG', name: 'HaWG', badge: 'Legacy', fdv: '$47.86K', pays: 'etORE', paysIcon: '🔶', extraBadge: 'CUSTOM', trend: 'up', change: 4.5 },
  { id: 8, symbol: '$bill', name: 'bill', badge: 'Legacy', fdv: '$46.66K', pays: 'MSFTx', paysIcon: '🟦', trend: 'down', change: -0.9 },
  { id: 9, symbol: '$GPRO', name: 'GPRO', badge: 'Legacy', fdv: '$42.70K', pays: 'GPRO', paysIcon: '🔵', trend: 'down', change: -6.2 },
  { id: 10, symbol: '$CRIMECAT', name: 'Crime Cat', badge: 'Legacy', fdv: '$40.60K', pays: 'XMR', paysIcon: '🔴', trend: 'down', change: -2.7 },
  { id: 11, symbol: '$CatGPT', name: 'CatGPT', badge: 'Legacy', fdv: '$36.70K', pays: 'OPENAI', paysIcon: '🟢', trend: 'down', change: -4.1 },
  { id: 12, symbol: '$Lucia', name: 'Lucia', badge: 'Legacy', fdv: '$30.82K', pays: 'TTWO', paysIcon: '🟣', trend: 'up', change: 2.8 },
];

export const DESKS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  name: `OTC Desk #${i}`,
  earned: Math.max(0, (1626.15 - i * 33)).toFixed(2),
}));

export const REWARDS_STATS = {
  totalDistributed: '$1.82M',
  distributions: '307,263',
  payingTokens: '17,452',
  holderPayouts: '3,245,807',
};

export const TOP_DISTRIBUTIONS = [
  { rank: 1, name: 'Nasduck', symbol: '$Nasduck', pays: 'QQQx', payCount: '1,805,415', total: '$132,740', mcap: '$715,844' },
  { rank: 2, name: 'GPRO', symbol: '$GPRO', pays: 'GPRO', payCount: '94,990', total: '$128,652', mcap: '$42,897' },
  { rank: 3, name: 'Pump Cat', symbol: '$Pumpcat', pays: 'PUMP', payCount: '298,865', total: '$99,189', mcap: '$109,539' },
  { rank: 4, name: 'Crime Cat', symbol: '$CRIMECAT', pays: 'XMR', payCount: '252,127', total: '$59,612', mcap: '$41,172' },
  { rank: 5, name: 'CatGPT', symbol: '$CatGPT', pays: 'OPENAI', payCount: '132,958', total: '$45,161', mcap: '$36,897' },
  { rank: 6, name: 'Mooncoin', symbol: '$Mooncoin', pays: 'SPCXx', payCount: '14,358', total: '$24,754', mcap: '$14,247' },
  { rank: 7, name: 'Sock And Pussy 500', symbol: '$SNP500', pays: 'SPYx', payCount: '1,259', total: '$24,644', mcap: '$8,413' },
  { rank: 8, name: 'The AI Bubble', symbol: '$AIBUBBLE', pays: 'NVDAx', payCount: '4,201', total: '$21,701', mcap: '$21,540' },
];

export const RECENT_DISTRIBUTIONS = [
  { symbol: '$Hypnotize', holders: 18, time: '19s ago', amount: '$1.27', token: '0.0126 SOL' },
  { symbol: '$Hypnotize', holders: 18, time: '1m ago', amount: '$2.75', token: '0.0273 SOL' },
  { symbol: '$Anonymouse', holders: 12, time: '2m ago', amount: '$1.36', token: '0.00119 ZEC' },
  { symbol: '$Anonymouse', holders: 12, time: '2m ago', amount: '$0.70', token: '0.000609 ZEC' },
  { symbol: '$Anonymouse', holders: 11, time: '2m ago', amount: '$0.29', token: '0.000235 ZEC' },
  { symbol: '$Anonymouse', holders: 12, time: '2m ago', amount: '$1.01', token: '0.000882 ZEC' },
  { symbol: '$Anonymouse', holders: 12, time: '2m ago', amount: '$0.66', token: '0.000581 ZEC' },
  { symbol: '$Anonymouse', holders: 11, time: '3m ago', amount: '$0.67', token: '0.000591 ZEC' },
];

export const ANALYTICS_STATS = {
  paidToHolders: '18,061.81',
  feesClaimed: '26,605.81',
  volumeAllTime: '593.43M',
  lockedPreStocks: '29.54',
};

export const STOCK_ASSETS = [
  { symbol: 'AAPLx', name: 'Apple' },
  { symbol: 'AMC', name: 'AMC Entertainment' },
  { symbol: 'AMZNx', name: 'Amazon' },
  { symbol: 'AVGOx', name: 'Broadcom' },
  { symbol: 'BA', name: 'Boeing' },
  { symbol: 'BABA', name: 'Alibaba Group Holding' },
  { symbol: 'BOT', name: 'RoboStrategy' },
  { symbol: 'BRKBx', name: 'Berkshire Hathaway' },
  { symbol: 'BULL', name: 'Webull' },
  { symbol: 'COINx', name: 'Coinbase' },
  { symbol: 'COST', name: 'Costco Wholesale' },
  { symbol: 'CRCLx', name: 'Circle' },
  { symbol: 'DELL', name: 'Dell Technologies' },
  { symbol: 'DFDVx', name: 'DFDV' },
  { symbol: 'DJT', name: 'Trump Media & Technology Group' },
  { symbol: 'GOOGLx', name: 'Alphabet' },
  { symbol: 'METAx', name: 'Meta Platforms' },
  { symbol: 'MSFTx', name: 'Microsoft' },
  { symbol: 'NVDAx', name: 'NVIDIA' },
  { symbol: 'TSLAx', name: 'Tesla' },
];

export function generateBarData(points = 30) {
  const data = [];
  for (let i = 0; i < points; i++) {
    data.push(Math.random() * 80 + 5);
  }
  return data;
}
