// server.js - Domain ETF Backend Server
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Doma API Configuration
const DOMA_API_BASE = 'https://api-testnet.doma.xyz';
const DOMA_API_KEY = process.env.DOMA_API_KEY; // Your testnet API key
const SUPPORTED_CHAIN_ID = 'ethereum:11155111'; // Sepolia testnet

// In-memory storage (replace with database in production)
let portfolios = [];
let orders = [];
let users = {};
let competitions = [];

// Doma API Helper Functions
class DomaAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = DOMA_API_BASE;
    this.headers = {
      'Api-Key': apiKey,
      'Content-Type': 'application/json'
    };
  }

  async createListing(orderData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/orderbook/list`,
        orderData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating listing:', error.response?.data || error.message);
      throw error;
    }
  }

  async createOffer(offerData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/orderbook/offer`,
        offerData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating offer:', error.response?.data || error.message);
      throw error;
    }
  }

  async getListingFulfillment(orderId, buyer) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v1/orderbook/listing/${orderId}/${buyer}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting listing fulfillment:', error.response?.data || error.message);
      throw error;
    }
  }

  async getOrderbookFees(orderbook, chainId, contractAddress) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v1/orderbook/fee/${orderbook}/${chainId}/${contractAddress}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting orderbook fees:', error.response?.data || error.message);
      throw error;
    }
  }

  async getSupportedCurrencies(chainId, contractAddress, orderbook) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v1/orderbook/currencies/${chainId}/${contractAddress}/${orderbook}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting supported currencies:', error.response?.data || error.message);
      throw error;
    }
  }

  async cancelListing(orderId, signature) {
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/orderbook/listing/cancel`,
        { orderId, signature },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error canceling listing:', error.response?.data || error.message);
      throw error;
    }
  }
}

const domaAPI = new DomaAPI(DOMA_API_KEY);

// Portfolio Management Functions
class PortfolioManager {
  static generatePortfolioToken(portfolio) {
    // Generate ERC-20 like token representation
    return {
      name: `${portfolio.name} Portfolio Token`,
      symbol: portfolio.symbol,
      totalSupply: portfolio.shares || 1000,
      contractAddress: ethers.utils.getAddress(ethers.utils.hexZeroPad(ethers.utils.id(portfolio.name).slice(0, 42), 20))
    };
  }

  static calculatePortfolioValue(domains) {
    // Mock valuation - in production, integrate with actual domain pricing oracles
    const domainValues = {
      'crypto.eth': 50000,
      'defi.eth': 30000,
      'web3.eth': 25000,
      'nft.eth': 20000,
      'play.eth': 15000,
      'game.eth': 12000,
      'meta.eth': 18000,
      'vr.eth': 8000,
      'ar.eth': 7000,
      'finance.eth': 40000,
      'bank.eth': 35000,
      'money.eth': 30000,
      'invest.eth': 25000
    };

    return domains.reduce((total, domain) => {
      return total + (domainValues[domain] || Math.random() * 20000 + 5000);
    }, 0);
  }

  static calculateDayChange() {
    // Mock day change calculation
    return (Math.random() - 0.5) * 10; // -5% to +5%
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all portfolios
app.get('/api/portfolios', (req, res) => {
  try {
    const enrichedPortfolios = portfolios.map(portfolio => ({
      ...portfolio,
      totalValue: PortfolioManager.calculatePortfolioValue(portfolio.domains),
      dayChange: PortfolioManager.calculateDayChange(),
      pricePerShare: PortfolioManager.calculatePortfolioValue(portfolio.domains) / portfolio.shares
    }));
    
    res.json(enrichedPortfolios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new portfolio
app.post('/api/portfolios', async (req, res) => {
  try {
    const { name, symbol, description, domains, category, creator } = req.body;

    // Validate input
    if (!name || !symbol || !domains || domains.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const portfolioId = portfolios.length + 1;
    const totalValue = PortfolioManager.calculatePortfolioValue(domains);
    const shares = 1000; // Default shares

    const newPortfolio = {
      id: portfolioId,
      name,
      symbol,
      description,
      domains: domains.filter(d => d.trim() !== ''),
      category: category || 'General',
      totalValue,
      shares,
      pricePerShare: totalValue / shares,
      creator: creator || 'Anonymous',
      createdAt: new Date().toISOString(),
      dayChange: 0,
      badges: ['🆕 New'],
      risk: category === 'Conservative' ? 'Low' : category === 'Speculative' ? 'High' : 'Medium'
    };

    // Generate portfolio token
    const token = PortfolioManager.generatePortfolioToken(newPortfolio);
    newPortfolio.token = token;

    portfolios.push(newPortfolio);

    res.status(201).json(newPortfolio);
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buy portfolio shares
app.post('/api/portfolios/:id/buy', async (req, res) => {
  try {
    const portfolioId = parseInt(req.params.id);
    const { buyer, shares: requestedShares, paymentToken } = req.body;

    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const totalCost = requestedShares * portfolio.pricePerShare;

    // Create order data for Doma orderbook
    const orderData = {
      orderbook: 'doma',
      chainId: SUPPORTED_CHAIN_ID,
      parameters: {
        offerer: buyer,
        zone: '0x0000000000000000000000000000000000000000',
        orderType: 0, // Full open
        startTime: Math.floor(Date.now() / 1000).toString(),
        endTime: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000).toString(), // 30 days
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        salt: ethers.utils.randomBytes(32).toString(),
        offer: [{
          itemType: 1, // ERC20
          token: paymentToken || '0x0000000000000000000000000000000000000000', // ETH or specified token
          identifierOrCriteria: '0',
          startAmount: ethers.utils.parseEther(totalCost.toString()).toString(),
          endAmount: ethers.utils.parseEther(totalCost.toString()).toString()
        }],
        consideration: [{
          itemType: 1, // ERC20 (Portfolio tokens)
          token: portfolio.token.contractAddress,
          identifierOrCriteria: '0',
          startAmount: requestedShares.toString(),
          endAmount: requestedShares.toString(),
          recipient: buyer
        }],
        totalOriginalConsiderationItems: 1,
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
        counter: '0'
      },
      signature: '0x' + '0'.repeat(130) // Mock signature for demo
    };

    // In production, create actual order through Doma API
    // const domaResponse = await domaAPI.createOffer(orderData);

    // Mock successful transaction
    const transactionId = 'tx_' + Date.now();
    
    // Update user portfolio holdings
    if (!users[buyer]) {
      users[buyer] = { portfolios: [], balance: 10000 };
    }

    const existingHolding = users[buyer].portfolios.find(p => p.portfolioId === portfolioId);
    if (existingHolding) {
      existingHolding.shares += requestedShares;
      existingHolding.totalInvested += totalCost;
    } else {
      users[buyer].portfolios.push({
        portfolioId,
        shares: requestedShares,
        totalInvested: totalCost,
        purchaseDate: new Date().toISOString()
      });
    }

    users[buyer].balance -= totalCost;

    res.json({
      success: true,
      transactionId,
      portfolio: portfolio.name,
      shares: requestedShares,
      totalCost,
      // orderId: domaResponse?.orderId || 'mock_order_' + Date.now()
      orderId: 'mock_order_' + Date.now()
    });

  } catch (error) {
    console.error('Error buying shares:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user portfolio holdings
app.get('/api/users/:address/portfolios', (req, res) => {
  try {
    const userAddress = req.params.address;
    const user = users[userAddress] || { portfolios: [], balance: 0 };

    const holdings = user.portfolios.map(holding => {
      const portfolio = portfolios.find(p => p.id === holding.portfolioId);
      return {
        ...holding,
        portfolio,
        currentValue: holding.shares * (portfolio?.pricePerShare || 0),
        profitLoss: (holding.shares * (portfolio?.pricePerShare || 0)) - holding.totalInvested
      };
    });

    res.json({
      balance: user.balance,
      holdings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get competitions
app.get('/api/competitions', (req, res) => {
  try {
    const activeCompetitions = [
      {
        id: 1,
        name: 'Weekly ROI Challenge',
        description: 'Compete for the highest portfolio ROI this week',
        prize: '$5,000 USDC',
        participants: Math.floor(Math.random() * 50) + 20,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        timeLeft: '5 days',
        leader: 'CryptoDomainPro',
        leaderROI: 12.5
      },
      {
        id: 2,
        name: 'Best New Portfolio',
        description: 'Create the most innovative domain portfolio',
        prize: '$2,500 USDC',
        participants: Math.floor(Math.random() * 30) + 10,
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        timeLeft: '7 days',
        leader: 'DomainMaster',
        leaderROI: 8.3
      }
    ];

    res.json(activeCompetitions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    const sortedPortfolios = portfolios
      .map(portfolio => ({
        ...portfolio,
        totalValue: PortfolioManager.calculatePortfolioValue(portfolio.domains),
        dayChange: PortfolioManager.calculateDayChange()
      }))
      .sort((a, b) => b.dayChange - a.dayChange);

    res.json(sortedPortfolios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doma API endpoints
app.get('/api/doma/fees/:orderbook/:contractAddress', async (req, res) => {
  try {
    const { orderbook, contractAddress } = req.params;
    const fees = await domaAPI.getOrderbookFees(orderbook, SUPPORTED_CHAIN_ID, contractAddress);
    res.json(fees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doma/currencies/:contractAddress/:orderbook', async (req, res) => {
  try {
    const { contractAddress, orderbook } = req.params;
    const currencies = await domaAPI.getSupportedCurrencies(SUPPORTED_CHAIN_ID, contractAddress, orderbook);
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket for real-time updates (optional)
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Real-time price updates
setInterval(() => {
  const updatedPortfolios = portfolios.map(portfolio => ({
    ...portfolio,
    totalValue: PortfolioManager.calculatePortfolioValue(portfolio.domains),
    dayChange: PortfolioManager.calculateDayChange(),
    pricePerShare: PortfolioManager.calculatePortfolioValue(portfolio.domains) / portfolio.shares
  }));
  
  io.emit('portfolioUpdates', updatedPortfolios);
}, 10000); // Update every 10 seconds

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize with sample data
function initializeSampleData() {
  portfolios = [
    {
      id: 1,
      name: "Premium .eth Bundle",
      symbol: "PETH",
      description: "High-value Ethereum domains with proven track record",
      domains: ["crypto.eth", "defi.eth", "web3.eth", "nft.eth"],
      shares: 1000,
      creator: "0x1234...5678",
      badges: ["🏆 Top Performer", "⭐ Verified"],
      category: "Premium",
      risk: "Medium",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      name: "Gaming Domains Pro",
      symbol: "GAME",
      description: "Gaming and metaverse domain portfolio",
      domains: ["play.eth", "game.eth", "meta.eth", "vr.eth", "ar.eth"],
      shares: 500,
      creator: "0x9876...4321",
      badges: ["🎮 Gaming Focus"],
      category: "Thematic",
      risk: "High",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      name: "Blue Chip Domains",
      symbol: "BLUE",
      description: "Conservative portfolio of established domains",
      domains: ["finance.eth", "bank.eth", "money.eth", "invest.eth"],
      shares: 2000,
      creator: "0xabcd...efgh",
      badges: ["🛡️ Conservative", "💎 Stable"],
      category: "Conservative",
      risk: "Low",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

initializeSampleData();

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Domain ETF Backend running on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔑 Doma API Key: ${DOMA_API_KEY ? 'Configured' : 'Missing!'}`);
});

// Export for testing
module.exports = app;