// stockapp/static/js/home.js

const searchInput = document.getElementById('companySearch');
const searchResults = document.getElementById('searchResults');
const clearButton = document.getElementById('clearSearch');
const searchLoader = document.getElementById('searchLoader');
const settingsBtn = document.getElementById('settingsBtn');
const settingsDropdown = document.getElementById('settingsDropdown');
const helpBtn = document.getElementById('helpBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');
const backToEmptyBtn = document.getElementById('backToEmptyBtn');
const noResults = document.getElementById('noResults');
const dashboardContent = document.getElementById('dashboardContent');
const sidebar = document.getElementById('sidebar');
const mobileNav = document.getElementById('mobileNav');

let currentFincode = null;

// ---------- THEME TOGGLE ----------
function updateThemeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (icon && label) {
        icon.textContent = isDark ? 'dark_mode' : 'light_mode';
        label.textContent = isDark ? 'Dark' : 'Light';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    updateThemeUI();
}

(function setInitialTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        document.documentElement.classList.add('dark');
    }
    updateThemeUI();
})();

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}

// ---------- SETTINGS DROPDOWN ----------
if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('open');
    });
}
document.addEventListener('click', () => settingsDropdown.classList.remove('open'));

if (helpBtn) helpBtn.addEventListener('click', () => window.location.href = '/help/');
if (logoutDropdownBtn) logoutDropdownBtn.addEventListener('click', () => window.location.href = '/logout/');

// ---------- SEARCH ----------
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    clearButton.style.display = query ? 'block' : 'none';
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => performSearch(), 500);
});

clearButton.addEventListener('click', () => {
    searchInput.value = '';
    clearButton.style.display = 'none';
    searchResults.classList.remove('visible');
    searchResults.innerHTML = '';
    searchInput.focus();
});

async function performSearch() {
    const query = searchInput.value.trim();
    if (query.length < 1) {
        searchResults.classList.remove('visible');
        return;
    }
    try {
        searchResults.innerHTML = '<div class="search-result-item">Searching...</div>';
        searchResults.classList.add('visible');
        const response = await fetch(`/search/?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        searchResults.innerHTML = '';
        if (data.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No companies found</div>';
            return;
        }
        data.forEach(company => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `<div class="search-result-name">${company.compname}</div><div class="search-result-meta">${company.symbol || 'N/A'} • ${company.fincode}</div>`;
            item.onclick = () => {
                searchInput.value = company.compname;
                clearButton.style.display = 'block';
                selectCompany(company.fincode);
            };
            searchResults.appendChild(item);
        });
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="search-result-item">Unable to search</div>';
    }
}

// ---------- BACK TO EMPTY ----------
function resetToEmptyState() {
    dashboardContent.style.display = 'none';
    sidebar.style.display = 'none';
    noResults.style.display = 'flex';
    currentFincode = null;
    searchInput.value = '';
    clearButton.style.display = 'none';
    searchResults.classList.remove('visible');
}

backToEmptyBtn.addEventListener('click', resetToEmptyState);

// ---------- CHART TYPE SELECTOR ----------
let selectedChartType = 'advanced';

function switchChartType(type) {
    if (window.echartsInstance) {
        window.echartsInstance.dispose();
        window.echartsInstance = null;
    }
    if (window.lwChart) {
        const lwContainer = document.getElementById('lw-chart');
        if (lwContainer) lwContainer.innerHTML = '';
        window.lwChart = null;
    }
    if (priceChart) {
        priceChart.destroy();
        priceChart = null;
    }

    document.querySelectorAll('.chart-container').forEach(el => el.classList.remove('active'));
    document.getElementById('chart-' + type).classList.add('active');

    if (currentFincode) {
        if (type === 'line') {
            fetchChartData(document.getElementById('periodSelect').value, document.getElementById('intervalSelect').value);
        } else if (type === 'candlestick') {
            if (typeof initLightweightChart === 'function') {
                initLightweightChart(currentFincode);
            }
        } else if (type === 'advanced') {
            if (typeof initEChartsChart === 'function') {
                initEChartsChart(currentFincode);
            }
        }
    }
}

document.getElementById('chartTypeSelect').addEventListener('change', function() {
    switchChartType(this.value);
});

// ---------- SELECT COMPANY ----------
async function selectCompany(fincode) {
    currentFincode = fincode;
    noResults.style.display = 'none';
    dashboardContent.style.display = 'block';
    sidebar.style.display = 'flex';

    setActiveTab('overview');
    searchResults.classList.remove('visible');
    showLoadingPlaceholders();

    document.getElementById('companyName').textContent = 'Loading...';
    try {
        const companyResp = fetch(`/company/${fincode}/`);
        const marketResp = fetch(`/company-market/${fincode}/`);

        const [companyData, marketData] = await Promise.all([
            companyResp.then(r => r.json()),
            marketResp.then(r => r.json())
        ]);

        if (companyData.available !== false) {
            const c = companyData.data;
            document.getElementById('companyName').textContent = c.compname || 'N/A';
            document.getElementById('companySymbol').textContent = c.symbol || 'N/A';
            document.getElementById('companyIndustry').textContent = c.industry || 'N/A';
            document.getElementById('companyStatus').textContent = c.status || 'N/A';
            document.getElementById('companyISIN').textContent = c.isin || 'N/A';
            document.getElementById('companyFincode').textContent = c.fincode || 'N/A';
            document.getElementById('companyChairman').textContent = c.chairman || 'N/A';
            document.getElementById('companyMD').textContent = c.mdir || 'N/A';
            document.getElementById('companyCS').textContent = c.cosec || 'N/A';
        }
        if (marketData.available !== false) {
            const m = marketData.data;
            document.getElementById('marketOpen').textContent = '₹ ' + (m.open || '--');
            document.getElementById('marketHigh').textContent = '₹ ' + (m.high || '--');
            document.getElementById('marketLow').textContent = '₹ ' + (m.low || '--');
            document.getElementById('marketClose').textContent = '₹ ' + (m.close || '--');
            document.getElementById('marketVolume').textContent = m.volume || '--';
            document.getElementById('marketValue').textContent = '₹ ' + (m.value || '--');
        }

        const chartType = document.getElementById('chartTypeSelect').value;
        if (chartType === 'line') {
            fetchChartData(document.getElementById('periodSelect').value, document.getElementById('intervalSelect').value);
        } else if (chartType === 'candlestick') {
            if (typeof initLightweightChart === 'function') {
                initLightweightChart(fincode);
            }
        } else if (chartType === 'advanced') {
            if (typeof initEChartsChart === 'function') {
                initEChartsChart(fincode);
            }
        }

        // Background data
        fetch(`/company-shareholding/${fincode}/`).then(r => r.json()).then(data => {
            if (data.available === false) {
                ['holdingPromoter','holdingPublic','holdingMutualFund','holdingFPI',
                 'kpiPromoter','kpiPublic','kpiMutualFund','kpiFII'].forEach(id => {
                    document.getElementById(id).textContent = 'N/A';
                });
                return;
            }
            const d = data.data;
            ['holdingPromoter','holdingPublic','holdingMutualFund','holdingFPI',
             'kpiPromoter','kpiPublic','kpiMutualFund','kpiFII'].forEach(id => {
                let val;
                if (id.includes('Promoter')) val = d.promoter;
                else if (id.includes('Public')) val = d.public;
                else if (id.includes('MutualFund')) val = d.mutual_fund;
                else if (id.includes('FPI') || id.includes('FII')) val = d.fpi;
                document.getElementById(id).textContent = (val || '--') + '%';
            });
        }).catch(e => console.warn('shareholding error', e));

        fetch(`/company/${fincode}/financials/`).then(r => r.json()).then(data => {
            if (data.available === false) {
                ['kpiRevenue','kpiPAT','finYearEnd','finRevenue','finOperatingProfit',
                 'finPAT','finEPS','finDividend'].forEach(id => {
                    document.getElementById(id).textContent = 'N/A';
                });
                return;
            }
            const d = data.data;
            document.getElementById('kpiRevenue').textContent = formatNumber(d.net_sales);
            document.getElementById('kpiPAT').textContent = formatNumber(d.profit_after_tax);
            document.getElementById('finYearEnd').textContent = d.year_end || '--';
            document.getElementById('finRevenue').textContent = '₹ ' + formatNumber(d.net_sales);
            document.getElementById('finOperatingProfit').textContent = '₹ ' + formatNumber(d.operating_profit);
            document.getElementById('finPAT').textContent = '₹ ' + formatNumber(d.profit_after_tax);
            document.getElementById('finEPS').textContent = d.reported_eps || '--';
            document.getElementById('finDividend').textContent = (d.dividend_perc || '--') + '%';
        }).catch(e => console.warn('financials error', e));

        fetch(`/company/${fincode}/news/`).then(r => r.json()).then(data => {
            const container = document.getElementById('newsList');
            if (data.available === false || !data.data || data.data.length === 0) {
                container.innerHTML = '<div class="empty-state">No news available</div>';
                return;
            }
            const news = data.data;
            container.innerHTML = news.map(item => `<div class="news-item"><div class="item-title">${escapeHtml(item.heading || 'No title')}</div><div class="item-date">${item.date || ''}</div></div>`).join('');
        }).catch(e => console.warn('news error', e));

        fetch(`/company/${fincode}/announcements/`).then(r => r.json()).then(data => {
            const container = document.getElementById('announcementsList');
            if (data.available === false || !data.data || data.data.length === 0) {
                container.innerHTML = '<div class="empty-state">No announcements available</div>';
                return;
            }
            const announcements = data.data;
            container.innerHTML = announcements.map(item => `<div class="announcement-item"><div class="item-title">${escapeHtml(item.caption || 'No caption')}</div><div class="item-date">${item.datetime || ''}</div></div>`).join('');
        }).catch(e => console.warn('announcements error', e));

        fetch(`/company/${fincode}/corporate-actions/`).then(r => r.json()).then(data => {
            const container = document.getElementById('actionsList');
            if (data.available === false || !data.actions || data.actions.length === 0) {
                container.innerHTML = '<div class="empty-state">No corporate actions available</div>';
                return;
            }
            const actions = data.actions;
            container.innerHTML = actions.map(item => `<div class="action-item"><div class="item-title">${escapeHtml(item.details || 'No details')}</div><div class="item-date">${item.date || ''}</div></div>`).join('');
        }).catch(e => console.warn('actions error', e));

        fetch(`/company/${fincode}/yfinance/?period=1y&interval=1mo`).then(r => r.json()).then(data => {
            if (data.available === false || !data.data) return;
            const d = data.data;
            if (d.current_price) {
                document.getElementById('yfCurrentPrice').textContent = `₹ ${d.current_price}`;
                window.originalCurrentPrice = `₹ ${d.current_price}`;
            }
            if (d.pe_ratio) document.getElementById('yfPE').textContent = d.pe_ratio;
            if (d.fifty_two_week_high) document.getElementById('yfHigh').textContent = d.fifty_two_week_high;
            if (d.fifty_two_week_low) document.getElementById('yfLow').textContent = d.fifty_two_week_low;
            if (d.market_cap) document.getElementById('yfMarketCap').textContent = formatNumber(d.market_cap);
            if (d.volume) document.getElementById('yfVolume').textContent = formatNumber(d.volume);
        }).catch(e => console.warn('yfinance error', e));

        fetch(`/company/${fincode}/openai-summary/`).then(r => r.json()).then(data => {
            document.getElementById('aiSummaryContent').innerHTML = data.summary || 'No AI analysis available';
        }).catch(e => {
            console.warn('openai error', e);
            document.getElementById('aiSummaryContent').innerHTML = 'AI summary temporarily unavailable.';
        });

    } catch (error) {
        console.error('Critical data error:', error);
        showError('Unable to load company data');
    }
}

// ---------- CHART.JS ----------
let priceChart = null;
function renderPriceChart(chartData) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;
    if (priceChart) priceChart.destroy();
    if (!chartData || chartData.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    const dates = chartData.map(item => item.date);
    const prices = chartData.map(item => item.close);
    priceChart = new Chart(ctx, {
        type: 'line',
        data: { labels: dates, datasets: [{ label: 'Price', data: prices, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: '#f59e0b', pointBorderColor: '#ffffff' }] },
        options: { responsive: true, maintainAspectRatio: true, interaction: { mode: 'index', intersect: false, axis: 'x' }, plugins: { tooltip: { mode: 'index', intersect: false, callbacks: { label: (context) => `₹ ${context.raw.toFixed(2)}` }, backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#f59e0b', bodyColor: '#ffffff', borderColor: '#f59e0b', borderWidth: 1 }, legend: { display: false } }, scales: { x: { ticks: { autoSkip: true, maxTicksLimit: 6, color: '#cbd5e1' }, grid: { display: false } }, y: { ticks: { callback: (val) => '₹' + val.toFixed(0), color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.1)' } } } }
    });
    const canvas = document.getElementById('priceChart');
    const handleMouseMove = (e) => {
        if (!priceChart) return;
        const activePoints = priceChart.getElementsAtEvent(e);
        if (activePoints && activePoints.length > 0) {
            const dataIndex = activePoints[0].dataIndex;
            const price = prices[dataIndex];
            const date = dates[dataIndex];
            const yfCurrentPrice = document.getElementById('yfCurrentPrice');
            if (yfCurrentPrice) yfCurrentPrice.innerHTML = `₹ ${price.toFixed(2)} <span style="font-size: 10px; color: #94a3b8;">(${date})</span>`;
        } else {
            if (window.originalCurrentPrice && document.getElementById('yfCurrentPrice')) document.getElementById('yfCurrentPrice').textContent = window.originalCurrentPrice;
        }
    };
    const handleMouseLeave = () => { if (window.originalCurrentPrice && document.getElementById('yfCurrentPrice')) document.getElementById('yfCurrentPrice').textContent = window.originalCurrentPrice; };
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
}

async function fetchChartData(period, interval) {
    if (!currentFincode) return null;
    try {
        const response = await fetch(`/company/${currentFincode}/yfinance/?period=${period}&interval=${interval}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.available !== false && data.data && data.data.chart_data && data.data.chart_data.length) {
            renderPriceChart(data.data.chart_data);
            return data.data.chart_data;
        }
        return null;
    } catch (error) { console.error('Chart fetch error:', error); showError('Failed to load chart data'); return null; }
}

async function refreshChart() {
    const period = document.getElementById('periodSelect').value;
    const interval = document.getElementById('intervalSelect').value;
    await fetchChartData(period, interval);
}

document.getElementById('refreshChartBtn').addEventListener('click', refreshChart);
document.getElementById('periodSelect').addEventListener('change', refreshChart);
document.getElementById('intervalSelect').addEventListener('change', refreshChart);

// ---------- LOADING PLACEHOLDERS ----------
function showLoadingPlaceholders() {
    const ids = ['kpiRevenue','kpiPAT','kpiPromoter','kpiPublic','kpiMutualFund','kpiFII',
                 'holdingPromoter','holdingPublic','holdingMutualFund','holdingFPI',
                 'finYearEnd','finRevenue','finOperatingProfit','finPAT','finEPS','finDividend',
                 'yfCurrentPrice','yfPE','yfHigh','yfLow','yfMarketCap','yfVolume'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div class="skeleton" style="width: 80%;"></div>`;
    });
    ['newsList','announcementsList','actionsList'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="placeholder">Loading...</div>';
    });
    const aiSummary = document.getElementById('aiSummaryContent');
    if (aiSummary) aiSummary.innerHTML = '<div class="loading-placeholder"><span class="spinner"></span> Loading AI analysis...</div>';
}

// ---------- STOCKSBOT (Unrestricted Chat) ----------
let stocksbotHistory = [];
let stocksbotCurrentQuestion = null;
const stocksbotMessages = document.getElementById('stocksbotMessages');
const stocksbotQuestion = document.getElementById('stocksbotQuestion');
const stocksbotSendBtn = document.getElementById('stocksbotSendBtn');

function formatBotMessage(text) {
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
    html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    return html;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showError('Copied to clipboard!')).catch(err => console.error('Copy failed:', err));
}

function addStocksbotMessage(role, content, isError = false) {
    if (!stocksbotMessages) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'bot-message'}`;
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    if (isError) bubble.style.backgroundColor = '#dc2626';
    if (role === 'bot') bubble.innerHTML = formatBotMessage(content);
    else bubble.textContent = content;
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    metaDiv.appendChild(timeSpan);
    if (role === 'bot') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.innerHTML = '⎘';
        copyBtn.title = 'Copy answer';
        copyBtn.onclick = () => copyToClipboard(content);
        metaDiv.appendChild(copyBtn);
    }
    messageDiv.appendChild(bubble);
    messageDiv.appendChild(metaDiv);
    stocksbotMessages.appendChild(messageDiv);
    stocksbotMessages.scrollTop = stocksbotMessages.scrollHeight;
    return messageDiv;
}

function showStocksbotTyping() {
    if (!stocksbotMessages) return;
    const existing = document.getElementById('stocksbotTyping');
    if (existing) existing.remove();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message';
    typingDiv.id = 'stocksbotTyping';
    typingDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    stocksbotMessages.appendChild(typingDiv);
    stocksbotMessages.scrollTop = stocksbotMessages.scrollHeight;
}

function removeStocksbotTyping() {
    const indicator = document.getElementById('stocksbotTyping');
    if (indicator) indicator.remove();
}

async function sendStocksbotMessageWithFincode(fincode, question) {
    stocksbotSendBtn.disabled = true;
    stocksbotQuestion.disabled = true;

    showStocksbotTyping();

    try {
        const response = await fetch('/stocksbot/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, history: stocksbotHistory.slice(-4), fincode })
        });
        const data = await response.json();
        removeStocksbotTyping();

        if (data.error) {
            addStocksbotMessage('bot', `Error: ${data.error}`, true);
        } else {
            addStocksbotMessage('bot', data.answer, false);
            stocksbotHistory.push({ role: 'user', content: question });
            stocksbotHistory.push({ role: 'assistant', content: data.answer });
            if (data.resolved_company) {
                console.log(`StocksBot resolved: ${data.resolved_company}`);
            }
        }
    } catch (error) {
        removeStocksbotTyping();
        addStocksbotMessage('bot', 'Network error. Please try again.', true);
    } finally {
        stocksbotSendBtn.disabled = false;
        stocksbotQuestion.disabled = false;
        stocksbotQuestion.focus();
    }
}

async function sendStocksbotMessage() {
    const question = stocksbotQuestion.value.trim();
    if (!question) return;

    stocksbotSendBtn.disabled = true;
    stocksbotQuestion.disabled = true;
    addStocksbotMessage('user', question);
    stocksbotQuestion.value = '';

    showStocksbotTyping();

    try {
        const response = await fetch('/stocksbot/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, history: stocksbotHistory.slice(-4) })
        });
        const data = await response.json();
        removeStocksbotTyping();

        if (data.error) {
            addStocksbotMessage('bot', `Error: ${data.error}`, true);
        } else if (data.needs_clarification) {
            const msgDiv = addStocksbotMessage('bot', data.message, false);
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'flex flex-wrap gap-2 mt-2';
            data.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'bg-surface-container-high border border-outline-variant px-3 py-1 rounded-full hover:border-primary hover:text-primary transition text-xs';
                btn.textContent = `${opt.name} (${opt.symbol})`;
                btn.onclick = () => {
                    sendStocksbotMessageWithFincode(opt.fincode, question);
                };
                optionsDiv.appendChild(btn);
            });
            if (msgDiv) {
                msgDiv.querySelector('.message-bubble').after(optionsDiv);
            } else {
                stocksbotMessages.appendChild(optionsDiv);
            }
            stocksbotMessages.scrollTop = stocksbotMessages.scrollHeight;
        } else {
            addStocksbotMessage('bot', data.answer, false);
            stocksbotHistory.push({ role: 'user', content: question });
            stocksbotHistory.push({ role: 'assistant', content: data.answer });
            if (data.resolved_company) {
                console.log(`StocksBot resolved: ${data.resolved_company}`);
            }
        }
    } catch (error) {
        removeStocksbotTyping();
        addStocksbotMessage('bot', 'Network error. Please try again.', true);
    } finally {
        stocksbotSendBtn.disabled = false;
        stocksbotQuestion.disabled = false;
        stocksbotQuestion.focus();
    }
}

if (stocksbotSendBtn) {
    stocksbotSendBtn.addEventListener('click', sendStocksbotMessage);
}
if (stocksbotQuestion) {
    stocksbotQuestion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendStocksbotMessage();
        }
    });
}

document.querySelectorAll('.stocksbot-prompt-chip').forEach(chip => {
    chip.addEventListener('click', function() {
        stocksbotQuestion.value = this.textContent;
        sendStocksbotMessage();
    });
});

// ---------- AI CHIPS (OpenAI only) ----------
const openaiChip = document.getElementById('openaiChip');

if (openaiChip) {
    openaiChip.addEventListener('click', async () => {
        if (!currentFincode) return;
        openaiChip.classList.add('active');
        document.getElementById('aiSummaryContent').innerHTML = '<div class="loading-placeholder"><span class="spinner"></span> Loading OpenAI analysis...</div>';
        try {
            const response = await fetch(`/company/${currentFincode}/openai-summary/`);
            const data = await response.json();
            document.getElementById('aiSummaryContent').innerHTML = data.summary || 'No response from OpenAI.';
        } catch (error) {
            console.error('OpenAI error:', error);
            document.getElementById('aiSummaryContent').innerHTML = 'OpenAI error. Please try again.';
        }
    });
}

// ---------- TABS ----------
function setActiveTab(tabName) {
    document.querySelectorAll('#sidebar .tab-button').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        if (isActive) {
            btn.classList.add('bg-secondary-container', 'text-on-secondary-container');
            btn.classList.remove('text-on-surface-variant', 'hover:bg-surface-container-high');
        } else {
            btn.classList.remove('bg-secondary-container', 'text-on-secondary-container');
            btn.classList.add('text-on-surface-variant', 'hover:bg-surface-container-high');
        }
    });
    document.querySelectorAll('#mobileNav .tab-button').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        btn.classList.toggle('text-primary', isActive);
        btn.classList.toggle('text-on-surface-variant', !isActive);
    });
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(tabName + 'Tab');
    if (target) target.classList.add('active');
    localStorage.setItem('lastActiveTab', tabName);
}

document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const tabName = this.dataset.tab;
        if (tabName) setActiveTab(tabName);
    });
});

const lastTab = localStorage.getItem('lastActiveTab');
if (lastTab && ['overview', 'financials', 'news', 'analysis', 'stocksbot'].includes(lastTab)) {
    setActiveTab(lastTab);
} else {
    setActiveTab('overview');
}

// ---------- UTILITY ----------
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function formatNumber(num) {
    if (!num || num === 'N/A' || num === '--') return num;
    const number = parseFloat(num.toString().replace(/,/g, ''));
    if (isNaN(number)) return num;
    if (number >= 1e9) return (number / 1e9).toFixed(2) + 'B';
    if (number >= 1e7) return (number / 1e7).toFixed(2) + 'Cr';
    if (number >= 1e5) return (number / 1e5).toFixed(2) + 'L';
    return number.toLocaleString('en-IN');
}

function showError(message) {
    const toast = document.getElementById('errorToast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}