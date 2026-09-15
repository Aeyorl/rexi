import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

const INITIAL_DATA = {
  stocks: [
    { symbol: 'AAPLx', name: 'Apple Inc. Tokenized', price: 228.40, change24h: '+1.85%', dividendYield: '0.52%' },
    { symbol: 'TSLAx', name: 'Tesla Inc. Tokenized', price: 214.20, change24h: '+3.42%', dividendYield: '0.00%' },
    { symbol: 'NVDAx', name: 'NVIDIA Corp. Tokenized', price: 128.50, change24h: '+2.15%', dividendYield: '0.08%' },
    { symbol: 'HOODx', name: 'Robinhood Markets', price: 24.80, change24h: '+4.10%', dividendYield: '0.00%' },
    { symbol: 'SPACEX', name: 'SpaceX Pre-IPO Equity', price: 920.00, change24h: '+0.50%', dividendYield: '0.00%' },
    { symbol: 'NEURALINK', name: 'Neuralink Pre-IPO', price: 450.00, change24h: '+1.20%', dividendYield: '0.00%' }
  ],
  tokens: [
    {
      id: '1',
      symbol: '$APPLE',
      name: 'Tim Cook Apple Coin',
      badge: 'p/1',
      fdv: '$4.2M',
      fdvNum: 4200000,
      pays: 'AAPLx',
      paysIcon: '🍎',
      volume24h: 384000,
      createdAt: Date.now() - 3600000 * 24,
      trend: [20, 24, 22, 28, 35, 30, 42, 48, 55]
    },
    {
      id: '2',
      symbol: '$CYBER',
      name: 'CyberTruck Wheels',
      badge: 'p/1',
      extraBadge: 'SPL',
      fdv: '$1.8M',
      fdvNum: 1800000,
      pays: 'TSLAx',
      paysIcon: '⚡',
      volume24h: 210000,
      createdAt: Date.now() - 3600000 * 18,
      trend: [15, 12, 18, 25, 22, 30, 28, 38, 42]
    },
    {
      id: '3',
      symbol: '$CHIP',
      name: 'Blackwell GPU Cult',
      badge: 'p/1',
      fdv: '$8.6M',
      fdvNum: 8600000,
      pays: 'NVDAx',
      paysIcon: '🟢',
      volume24h: 920000,
      createdAt: Date.now() - 3600000 * 12,
      trend: [30, 35, 32, 45, 52, 60, 58, 75, 88]
    },
    {
      id: '4',
      symbol: '$STARSHIP',
      name: 'Flight 6 Raptor',
      badge: 'p/1',
      extraBadge: 'PRE-IPO',
      fdv: '$12.4M',
      fdvNum: 12400000,
      pays: 'SPACEX',
      paysIcon: '🚀',
      volume24h: 1450000,
      createdAt: Date.now() - 3600000 * 8,
      trend: [40, 45, 50, 65, 70, 85, 90, 110, 125]
    },
    {
      id: '5',
      symbol: '$FEATHER',
      name: 'Green Arrow Robinhood',
      badge: 'p/1',
      fdv: '$950K',
      fdvNum: 950000,
      pays: 'HOODx',
      paysIcon: '🏹',
      volume24h: 115000,
      createdAt: Date.now() - 3600000 * 4,
      trend: [10, 14, 12, 18, 16, 22, 25, 28, 32]
    }
  ],
  robinhood: {
    accountNumber: 'RH-8492-1084',
    walletName: 'Robinhood Wallet',
    buyingPower: 10000.00,
    holdings: [
      { symbol: 'AAPLx', name: 'Apple Inc. Tokenized', shares: 12.5, price: 228.40, total: 2855.00 },
      { symbol: 'TSLAx', name: 'Tesla Inc. Tokenized', shares: 8.0, price: 214.20, total: 1713.60 },
      { symbol: 'NVDAx', name: 'NVIDIA Corp. Tokenized', shares: 15.0, price: 128.50, total: 1927.50 },
      { symbol: 'HOODx', name: 'Robinhood Markets', shares: 150.0, price: 24.80, total: 3720.00 },
      { symbol: 'SPACEX', name: 'SpaceX Pre-IPO', shares: 5.0, price: 920.00, total: 4600.00 }
    ],
    orders: []
  },
  desks: {
    minted: 2245,
    maxMint: 5000,
    liveDesks: 2245,
    burned: 248800000,
    nextTarget: 'NEURALINK',
    paidToHolders: 466989.38
  },
  analytics: {
    totalVolume: '$148,290,400',
    rewardsDistributed: '$1,740,250',
    feesGenerated: '$2,510,800',
    buybacksExecuted: '$133,400',
    feesByDay: [
      { day: 'Mon', fees: 42100 },
      { day: 'Tue', fees: 58400 },
      { day: 'Wed', fees: 61200 },
      { day: 'Thu', fees: 79500 },
      { day: 'Fri', fees: 94800 },
      { day: 'Sat', fees: 82300 },
      { day: 'Sun', fees: 110400 }
    ]
  }
};

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.save();
      }
    } catch (e) {
      console.warn('Error loading db file, re-initializing', e);
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db file', e);
    }
  }
}

export const db = new Database();
