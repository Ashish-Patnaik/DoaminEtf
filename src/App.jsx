import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
    LayoutDashboard, TrendingUp, TrendingDown, Plus, Eye, Trophy, Star,
    DollarSign, BarChart3, Wallet, X, Search, Bell, ChevronDown, Menu, Users, Clock
} from 'lucide-react';

// CORRECTED & IMPROVED Animated Number Hook
const useAnimatedCounter = (endValue) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => {
        const isInteger = endValue % 1 === 0;
        return latest.toLocaleString(undefined, {
            minimumFractionDigits: isInteger ? 0 : 2,
            maximumFractionDigits: isInteger ? 0 : 2,
        });
    });

    useEffect(() => {
        const controls = animate(count, endValue, {
            duration: 1.2,
            ease: "easeOut",
        });
        return controls.stop;
    }, [endValue, count]);

    return rounded;
};


const App = () => {
    // STATE MANAGEMENT
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedPortfolio, setSelectedPortfolio] = useState(null);
    const [detailPortfolio, setDetailPortfolio] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [toasts, setToasts] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

    // DATA
    const [userBalance, setUserBalance] = useState(50000);
    const [userPortfolios, setUserPortfolios] = useState([
        {
            id: 1, name: "Premium .eth Bundle", symbol: "PETH", description: "High-value Ethereum domains with proven track record",
            domains: ["crypto.eth", "defi.eth", "web3.eth", "nft.eth", "wallet.eth", "dao.eth"], totalValue: 125000, dayChange: 5.2,
            shares: 1000, pricePerShare: 125, creator: "0x1234...5678",
            category: "Premium", risk: "Medium", sharesOwned: 10
        }
    ]);

    const [portfolios, setPortfolios] = useState([
        { id: 1, name: "Premium .eth Bundle", symbol: "PETH", description: "High-value Ethereum domains with proven track record", domains: ["crypto.eth", "defi.eth", "web3.eth", "nft.eth", "wallet.eth", "dao.eth"], totalValue: 125000, dayChange: 5.2, shares: 1000, pricePerShare: 125, creator: "0x1234...5678", category: "Premium", risk: "Medium" },
        { id: 2, name: "Gaming & Metaverse", symbol: "GAME", description: "A curated collection of top-tier gaming and metaverse domains.", domains: ["play.eth", "game.eth", "meta.eth", "vr.eth", "ar.eth"], totalValue: 75000, dayChange: -2.1, shares: 500, pricePerShare: 150, creator: "0x9876...4321", category: "Thematic", risk: "High" },
        { id: 3, name: "Blue Chip Domains", symbol: "BLUE", description: "Conservative portfolio of established, high-value domains.", domains: ["finance.eth", "bank.eth", "money.eth", "invest.eth"], totalValue: 200000, dayChange: 1.8, shares: 2000, pricePerShare: 100, creator: "0xabcd...efgh", category: "Conservative", risk: "Low" },
        { id: 4, name: "DeFi Innovators", symbol: "DFI", description: "Portfolio focused on the decentralized finance sector domains.", domains: ["yield.eth", "swap.eth", "lend.eth", "stake.eth"], totalValue: 95000, dayChange: 8.7, shares: 1500, pricePerShare: 63.33, creator: "0xdef1...2345", category: "Thematic", risk: "High" },
    ]);
    
    // NEW: Data for the competitions tab
    const [competitions, setCompetitions] = useState([
        { id: 1, title: "ETH Maxi Trading Contest", prizePool: 25000, participants: 1254, endsIn: "3d 14h", leader: "0xTradoor", leaderPnl: 45.7 },
        { id: 2, title: "Thematic Portfolio Battle", prizePool: 15000, participants: 832, endsIn: "6d 2h", leader: "0xAlphaSeeker", leaderPnl: 32.1 },
        { id: 3, title: "Low Cap Gems Challenge", prizePool: 50000, participants: 2109, endsIn: "12d 8h", leader: "0xGemHunter", leaderPnl: 88.3 },
    ]);
    
    const [newPortfolio, setNewPortfolio] = useState({ name: '', symbol: '', description: '', domains: [''], category: 'Thematic' });

    // MEMOIZED CALCULATIONS
    const totalPortfolioValue = useMemo(() => userPortfolios.reduce((sum, p) => sum + (p.sharesOwned * p.pricePerShare), 0), [userPortfolios]);
    const totalDayChange = useMemo(() => {
        const totalYesterdayValue = userPortfolios.reduce((sum, p) => sum + (p.sharesOwned * p.pricePerShare) / (1 + p.dayChange / 100), 0);
        return totalYesterdayValue === 0 ? 0 : (totalPortfolioValue - totalYesterdayValue);
    }, [userPortfolios, totalPortfolioValue]);
    
    // FILTERED DATA
    const filteredPortfolios = portfolios.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // HELPER FUNCTIONS
    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const handleCreatePortfolio = () => {
        if (!newPortfolio.name || !newPortfolio.symbol || newPortfolio.domains[0] === '') return;
        const portfolio = { id: portfolios.length + 1, ...newPortfolio, totalValue: 50000 + Math.random() * 100000, dayChange: (Math.random() - 0.5) * 10, shares: 1000, pricePerShare: 50 + Math.random() * 100, creator: "You (0xYour...Addr)", risk: "Medium" };
        setPortfolios([portfolio, ...portfolios]);
        setUserPortfolios(prev => [...prev, { ...portfolio, sharesOwned: 0 }]);
        setNewPortfolio({ name: '', symbol: '', description: '', domains: [''], category: 'Thematic' });
        setShowCreateModal(false);
        addToast(`Portfolio "${portfolio.name}" created!`);
    };

    const handleBuyShares = (portfolio, amount) => {
        const cost = amount * portfolio.pricePerShare;
        if (userBalance >= cost) {
            setUserBalance(prev => prev - cost);
            const existingHolding = userPortfolios.find(p => p.id === portfolio.id);
            if (existingHolding) {
                setUserPortfolios(userPortfolios.map(p => p.id === portfolio.id ? { ...p, sharesOwned: (p.sharesOwned || 0) + amount } : p));
            } else {
                setUserPortfolios(prev => [...prev, { ...portfolio, sharesOwned: amount }]);
            }
            addToast(`Successfully bought ${amount} share(s) of ${portfolio.symbol}`);
        } else {
            addToast('Insufficient balance', 'error');
        }
    };
    
    const handleTabClick = (tabKey) => {
        setActiveTab(tabKey);
        setIsSidebarOpen(false); // Close sidebar on navigation
    }

    const addDomainField = () => setNewPortfolio(prev => ({ ...prev, domains: [...prev.domains, ''] }));
    const updateDomain = (index, value) => setNewPortfolio(prev => ({ ...prev, domains: prev.domains.map((d, i) => i === index ? value : d) }));

    const navItems = [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'browse', label: 'Browse', icon: Search },
        { key: 'my-portfolios', label: 'My Portfolios', icon: Wallet },
        { key: 'competitions', label: 'Competitions', icon: Trophy },
        { key: 'leaderboard', label: 'Leaderboard', icon: Star }
    ];

    const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
    
    // SUB-COMPONENTS
    const Sidebar = ({ isOpen, onClose }) => (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
             <div className="sidebar-header">
                <BarChart3 size={32} className="logo-icon" />
                <h1 className="logo-text">DomainETF</h1>
                <button onClick={onClose} className="mobile-nav-close-button"><X size={24} /></button>
            </div>
            <nav className="sidebar-nav">
                {navItems.map(({ key, label, icon: Icon }) => (
                    <motion.button
                        key={key}
                        onClick={() => handleTabClick(key)}
                        className={`nav-button ${activeTab === key ? 'active' : ''}`}
                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                        {activeTab === key && <motion.div className="active-indicator" layoutId="activeIndicator" />}
                    </motion.button>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button className="create-button-sidebar" onClick={() => setShowCreateModal(true)}>
                    <Plus size={20} /> Create Portfolio
                </button>
            </div>
        </aside>
    );

    const Header = ({ onMenuClick }) => (
        <header className="header">
            <button onClick={onMenuClick} className="mobile-nav-toggle"><Menu size={24} /></button>
            <div className="search-container">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search portfolios by name or symbol..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                 {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="search-clear-button">
                        <X size={16} />
                    </button>
                )}
            </div>
            <div className="header-actions">
                <motion.button className="action-button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><Bell size={20} /></motion.button>
                <div className="balance-container"><Wallet size={20} /><span>${userBalance.toLocaleString()}</span></div>
                <div className="user-profile">
                    <img src={`https://i.pravatar.cc/40?u=user`} alt="User Avatar" className="avatar" />
                    <span className="user-address">0xAbC...123</span>
                    <ChevronDown size={16} />
                </div>
            </div>
        </header>
    );

    const MiniChart = ({ positive = true }) => ( <svg viewBox="0 0 100 30" className="mini-chart"><path d={positive ? "M0 25 Q 25 5, 50 15 T 100 5" : "M0 5 Q 25 25, 50 15 T 100 25"} stroke={positive ? 'var(--positive)' : 'var(--negative)'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>);
    
    const PortfolioCard = ({ portfolio, showBuyButton = true }) => (
        <motion.div className="portfolio-card card" variants={itemVariants} >
            <div className="card-header">
                <div><h3 className="card-title">{portfolio.name}</h3><p className="card-symbol">${portfolio.symbol}</p></div>
                <div className="card-chart"><MiniChart positive={portfolio.dayChange > 0} /></div>
            </div>
            <div className="card-stats">
                <div><p className="stat-label">Total Value</p><p className="stat-value">${portfolio.totalValue.toLocaleString()}</p></div>
                <div><p className="stat-label">24h Change</p><p className={`stat-value change ${portfolio.dayChange >= 0 ? 'change-up' : 'change-down'}`}>{portfolio.dayChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}{portfolio.dayChange.toFixed(1)}%</p></div>
                <div><p className="stat-label">Price/Share</p><p className="stat-value">${portfolio.pricePerShare.toFixed(2)}</p></div>
            </div>
            <div className="card-domains">
                {portfolio.domains.slice(0, 3).map((domain, i) => <span key={i} className="domain-tag">{domain}</span>)}
                {portfolio.domains.length > 3 && <span className="domain-tag-more">+{portfolio.domains.length - 3} more</span>}
            </div>
            {portfolio.sharesOwned > 0 && (<div className="your-holdings"><p className="stat-value">${(portfolio.sharesOwned * portfolio.pricePerShare).toLocaleString()}</p><p className="stat-label">{portfolio.sharesOwned} Shares Owned</p></div>)}
            <div className="card-actions">
                <motion.button className="action-button-secondary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDetailPortfolio(portfolio)}><Eye size={18} /> Details</motion.button>
                {showBuyButton && (<motion.button className="action-button-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPortfolio(portfolio)}><DollarSign size={18} /> Invest</motion.button>)}
            </div>
        </motion.div>
    );
    
    // NEW: Competition Card Component
    const CompetitionCard = ({ competition }) => (
        <motion.div className="competition-card card" variants={itemVariants}>
            <div className="competition-header">
                <h3 className="competition-title">{competition.title}</h3>
                <span className="domain-tag detail-icon-yellow">${competition.prizePool.toLocaleString()} Prize Pool</span>
            </div>
            <div className="competition-details">
                <div className="detail-item"><Users size={16} /><p>{competition.participants.toLocaleString()} Participants</p></div>
                <div className="detail-item"><Clock size={16} /><p>Ends in {competition.endsIn}</p></div>
            </div>
            <div className="competition-footer">
                <div className="leader-info">
                    <p className="leader-label">Current Leader</p>
                    <p className="leader-name">{competition.leader}</p>
                </div>
                <div className="leader-pnl">
                    <p className="stat-value change change-up"><TrendingUp size={16}/> +{competition.leaderPnl.toFixed(1)}%</p>
                </div>
            </div>
            <motion.button className="action-button-primary" style={{ marginTop: 'auto' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Join Competition
            </motion.button>
        </motion.div>
    );

    const Modal = ({ children, onClose }) => (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} onClick={(e) => e.stopPropagation()}>
                <motion.button className="modal-close-button" onClick={onClose} whileHover={{ scale: 1.2, rotate: 90 }}><X size={20} /></motion.button>
                {children}
            </motion.div>
        </motion.div>
    );

    const BuyModal = ({ portfolio, onClose }) => {
        const [shares, setShares] = useState(1);
        const totalCost = shares * portfolio.pricePerShare;
        return (<Modal onClose={onClose}><h3 className="modal-title">Invest in {portfolio.name}</h3><div className="form-group"><label className="form-label">Number of Shares</label><input type="number" min="1" value={shares} onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))} /></div><div className="summary-box"><div className="summary-row"><span>Price per Share:</span><span>${portfolio.pricePerShare.toFixed(2)}</span></div><div className="summary-row total-cost-row"><span>Total Cost:</span><span>${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div></div><p className={`balance-info ${totalCost > userBalance ? 'insufficient' : ''}`}>Your Balance: ${userBalance.toLocaleString()}</p><div className="modal-actions"><motion.button onClick={() => { handleBuyShares(portfolio, shares); onClose(); }} disabled={totalCost > userBalance} className="action-button-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Confirm Purchase</motion.button></div></Modal>);
    };

    const CreatePortfolioModal = ({ onClose }) => (<Modal onClose={onClose}><h3 className="modal-title">Create New Domain Portfolio</h3><div className="form-grid"><div><label className="form-label">Portfolio Name</label><input type="text" value={newPortfolio.name} onChange={(e) => setNewPortfolio(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Premium Gaming Domains"/></div><div><label className="form-label">Token Symbol</label><input type="text" value={newPortfolio.symbol} onChange={(e) => setNewPortfolio(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))} placeholder="e.g., PGAME"/></div></div><div className="form-group"><label className="form-label">Description</label><textarea value={newPortfolio.description} onChange={(e) => setNewPortfolio(prev => ({ ...prev, description: e.target.value }))} rows="2" placeholder="Describe your portfolio..."/></div><div className="form-group"><label className="form-label">Domains</label>{newPortfolio.domains.map((domain, index) => <input key={index} type="text" value={domain} onChange={(e) => updateDomain(index, e.target.value)} className="form-input-domain" placeholder={`Domain ${index + 1} (e.g., crypto.eth)`}/>)}<button onClick={addDomainField} className="add-domain-button"><Plus size={16} /> Add Domain</button></div><div className="modal-actions"><motion.button onClick={handleCreatePortfolio} className="action-button-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Create Portfolio</motion.button></div></Modal>);
    
    const PortfolioDetailModal = ({ portfolio, onClose }) => (<Modal onClose={onClose}><h3 className="modal-title">{portfolio.name} ({portfolio.symbol})</h3><p className="card-description">{portfolio.description}</p><div className="detail-chart-container"><BarChart3 size={100} className={portfolio.dayChange > 0 ? "change-up" : "change-down"}/><p>Large chart representation placeholder</p></div><div className="form-group"><label className="form-label">All Domains ({portfolio.domains.length})</label><div className="domain-list-modal">{portfolio.domains.map((domain, i) => <span key={i} className="domain-tag">{domain}</span>)}</div></div><p className="portfolio-creator-detail">Created by: {portfolio.creator}</p></Modal>);
    
    const Toast = ({ message, type }) => (<motion.div layout initial={{ opacity: 0, y: 50, scale: 0.3 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.5 }} className={`toast toast-${type}`}>{message}</motion.div>);
    
    const AnimatedStat = ({ value }) => { const animatedValue = useAnimatedCounter(value); return <motion.span>{animatedValue}</motion.span>; };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return (<motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><h2 className="section-title">Dashboard</h2><motion.div className="dashboard-stats-grid" variants={containerVariants} initial="hidden" animate="visible"><motion.div className="stat-card card" variants={itemVariants}><p className="stat-label">Total Portfolio Value</p><p className="stat-value large">$<AnimatedStat value={totalPortfolioValue} /></p></motion.div><motion.div className="stat-card card" variants={itemVariants}><p className="stat-label">24h Profit / Loss</p><p className={`stat-value large ${totalDayChange >= 0 ? 'change-up' : 'change-down'}`}>{totalDayChange >= 0 ? '+' : '-'}$<AnimatedStat value={Math.abs(totalDayChange)} /></p></motion.div><motion.div className="stat-card card" variants={itemVariants}><p className="stat-label">Portfolios Owned</p><p className="stat-value large">{userPortfolios.filter(p => p.sharesOwned > 0).length}</p></motion.div></motion.div><h2 className="section-title">Featured Portfolios</h2><motion.div className="card-grid" variants={containerVariants} initial="hidden" animate="visible">{portfolios.slice(0,3).map(p => <PortfolioCard key={p.id} portfolio={p} />)}</motion.div></motion.div>);
            case 'browse': return (<motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><h2 className="section-title">Available Portfolios</h2><motion.div className="card-grid" variants={containerVariants} initial="hidden" animate="visible">{filteredPortfolios.map(p => <PortfolioCard key={p.id} portfolio={p} />)}</motion.div></motion.div>);
            case 'my-portfolios': return (<motion.div key="my-portfolios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><h2 className="section-title">My Investments</h2>{userPortfolios.filter(p => p.sharesOwned > 0).length === 0 ? (<p>You don't own any portfolios yet.</p>) : (<motion.div className="card-grid" variants={containerVariants} initial="hidden" animate="visible">{userPortfolios.map(p => p.sharesOwned > 0 && <PortfolioCard key={p.id} portfolio={p} showBuyButton={true} />)}</motion.div>)}</motion.div>);
            case 'competitions': return (<motion.div key="competitions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><h2 className="section-title">Ongoing Competitions</h2><motion.div className="card-grid" variants={containerVariants} initial="hidden" animate="visible">{competitions.map(c => <CompetitionCard key={c.id} competition={c} />)}</motion.div></motion.div>);
            case 'leaderboard': return (<motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><h2 className="section-title">Top Performing Portfolios (24h)</h2><motion.div className="leaderboard-list" variants={containerVariants} initial="hidden" animate="visible">{[...portfolios].sort((a, b) => b.dayChange - a.dayChange).map((p, index) => (<motion.div key={p.id} className="leaderboard-item" variants={itemVariants}><div className="item-left"><span className={`rank-badge rank-${index+1}`}>{index+1}</span><div><p className="portfolio-name">{p.name}</p><p className="portfolio-creator">by {p.creator}</p></div></div><p className={`item-change ${p.dayChange >= 0 ? 'change-up' : 'change-down'}`}>{p.dayChange > 0 && '+'}{p.dayChange.toFixed(1)}%</p></motion.div>))}</motion.div></motion.div>);
            default: return null;
        }
    }

    return (
        <div className="app-shell">
            <AnimatePresence>
                {isSidebarOpen && <motion.div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
            </AnimatePresence>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="main-view">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="content-area">
                    <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
                </div>
            </main>
            <AnimatePresence>
                {selectedPortfolio && <BuyModal portfolio={selectedPortfolio} onClose={() => setSelectedPortfolio(null)} />}
                {showCreateModal && <CreatePortfolioModal onClose={() => setShowCreateModal(false)} />}
                {detailPortfolio && <PortfolioDetailModal portfolio={detailPortfolio} onClose={() => setDetailPortfolio(null)} />}
            </AnimatePresence>
            <div className="toast-container"><AnimatePresence>{toasts.map(toast => <Toast key={toast.id} {...toast} />)}</AnimatePresence></div>
        </div>
    );
};

export default App;