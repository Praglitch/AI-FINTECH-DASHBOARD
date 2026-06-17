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
const askAIButton = document.getElementById('askAIButton');
const aiQuestion = document.getElementById('aiQuestion');
const chatMessages = document.getElementById('chatMessages');

let currentFincode = null;
let conversationHistory = [];

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

// Set initial theme
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
    window.searchTimeout = setTimeout(() => performSearch(), 300);
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
    resetAITab();
    searchInput.value = '';
    clearButton.style.display = 'none';
    searchResults.classList.remove('visible');
}

backToEmptyBtn.addEventListener('click', resetToEmptyState);

// ---------- SELECT COMPANY ----------
async function selectCompany(fincode) {
    currentFincode = fincode;
    noResults.style.display = 'none';
    dashboardContent.style.display = 'block';
    sidebar.style.display = 'flex';

    resetAITab();
    searchResults.classList.remove('visible');
    showLoadingPlaceholders();

    document.getElementById('companyName').textContent = 'Loading...';
    try {
        const [company, market] = await Promise.all([
            fetch(`/company/${fincode}/`).then(r => r.json()),
            fetch(`/company-market/${fincode}/`).then(r => r.json())
        ]);

        const updateCritical = () => {
            document.getElementById('companyName').textContent = company.compname;
            document.getElementById('companySymbol').textContent = company.symbol || 'N/A';
            document.getElementById('companyIndustry').textContent = company.industry || 'N/A';
            document.getElementById('companyStatus').textContent = company.status || 'N/A';
            document.getElementById('companyISIN').textContent = company.isin || 'N/A';
            document.getElementById('companyFincode').textContent = company.fincode;
            document.getElementById('companyChairman').textContent = company.chairman || 'N/A';
            document.getElementById('companyMD').textContent = company.mdir || 'N/A';
            document.getElementById('companyCS').textContent = company.cosec || 'N/A';
            document.getElementById('marketOpen').textContent = '₹ ' + (market.open || '--');
            document.getElementById('marketHigh').textContent = '₹ ' + (market.high || '--');
            document.getElementById('marketLow').textContent = '₹ ' + (market.low || '--');
            document.getElementById('marketClose').textContent = '₹ ' + (market.close || '--');
            document.getElementById('marketVolume').textContent = market.volume || '--';
            document.getElementById('marketValue').textContent = '₹ ' + (market.value || '--');
        };
        updateCritical();

        // Background data (incremental)
        fetch(`/company-shareholding/${fincode}/`).then(r => r.json()).then(data => {
            ['holdingPromoter','holdingPublic','holdingMutualFund','holdingFPI',
             'kpiPromoter','kpiPublic','kpiMutualFund','kpiFII'].forEach(id => {
                let val;
                if (id.includes('Promoter')) val = data.promoter;
                else if (id.includes('Public')) val = data.public;
                else if (id.includes('MutualFund')) val = data.mutual_fund;
                else if (id.includes('FPI') || id.includes('FII')) val = data.fpi;
                if (val !== undefined) document.getElementById(id).textContent = (val || '--') + '%';
            });
        }).catch(e => console.warn('shareholding error', e));

        fetch(`/company/${fincode}/financials/`).then(r => r.json()).then(data => {
            const set = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };
            set('kpiRevenue', formatNumber(data.net_sales));
            set('kpiPAT', formatNumber(data.profit_after_tax));
            set('finYearEnd', data.year_end || '--');
            set('finRevenue', '₹ ' + formatNumber(data.net_sales));
            set('finOperatingProfit', '₹ ' + formatNumber(data.operating_profit));
            set('finPAT', '₹ ' + formatNumber(data.profit_after_tax));
            set('finEPS', data.reported_eps || '--');
            set('finDividend', (data.dividend_perc || '--') + '%');
        }).catch(e => console.warn('financials error', e));

        fetch(`/company/${fincode}/news/`).then(r => r.json()).then(data => {
            const container = document.getElementById('newsList');
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="empty-state">No news available</div>';
            } else {
                container.innerHTML = data.map(item => `<div class="news-item"><div class="item-title">${escapeHtml(item.heading || 'No title')}</div><div class="item-date">${item.date || ''}</div></div>`).join('');
            }
        }).catch(e => console.warn('news error', e));

        fetch(`/company/${fincode}/announcements/`).then(r => r.json()).then(data => {
            const container = document.getElementById('announcementsList');
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="empty-state">No announcements available</div>';
            } else {
                container.innerHTML = data.map(item => `<div class="announcement-item"><div class="item-title">${escapeHtml(item.caption || 'No caption')}</div><div class="item-date">${item.datetime || ''}</div></div>`).join('');
            }
        }).catch(e => console.warn('announcements error', e));

        fetch(`/company/${fincode}/corporate-actions/`).then(r => r.json()).then(data => {
            const container = document.getElementById('actionsList');
            const actionsArray = data.actions || [];
            if (!actionsArray.length) {
                container.innerHTML = '<div class="empty-state">No corporate actions available</div>';
            } else {
                container.innerHTML = actionsArray.map(item => `<div class="action-item"><div class="item-title">${escapeHtml(item.details || 'No details')}</div><div class="item-date">${item.date || ''}</div></div>`).join('');
            }
        }).catch(e => console.warn('actions error', e));

        fetch(`/company/${fincode}/yfinance/?period=1y&interval=1mo`).then(r => r.json()).then(data => {
            if (data.chart_data && data.chart_data.length) renderPriceChart(data.chart_data);
            document.getElementById('yfCurrentPrice').textContent = (data.current_price ?? '--') !== '--' ? `₹ ${data.current_price}` : '--';
            window.originalCurrentPrice = document.getElementById('yfCurrentPrice').textContent;
            document.getElementById('yfPE').textContent = data.pe_ratio ?? '--';
            document.getElementById('yfHigh').textContent = data.fifty_two_week_high ?? '--';
            document.getElementById('yfLow').textContent = data.fifty_two_week_low ?? '--';
            document.getElementById('yfMarketCap').textContent = formatNumber(data.market_cap);
            document.getElementById('yfVolume').textContent = formatNumber(data.volume);
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

// ---------- RESET AI TAB ----------
function resetAITab() {
    const aiSummary = document.getElementById('aiSummaryContent');
    if (aiSummary) aiSummary.innerHTML = '<div class="loading-placeholder"><span class="spinner"></span> Loading AI analysis...</div>';
    if (aiQuestion) aiQuestion.value = '';
    if (chatMessages) {
        chatMessages.innerHTML = `<div class="chat-welcome bg-surface-container-high p-4 rounded-xl"><p class="text-body text-on-surface-variant">👋 Hello! I'm your AI research assistant. Ask me about financials, announcements, shareholding, market data, or anything else about this company.</p></div>`;
    }
    conversationHistory = [];
    const ollamaChip = document.getElementById('ollamaChip');
    const openaiChip = document.getElementById('openaiChip');
    if (ollamaChip && openaiChip) {
        ollamaChip.classList.remove('active');
        openaiChip.classList.add('active');
    }
}

// ---------- CHAT UI ----------
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

function addMessageToChat(role, content, isError = false, originalQuestion = null) {
    if (!chatMessages) return;
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
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
    metaDiv.appendChild(timeSpan);
    if (role === 'bot') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.innerHTML = '⎘';
        copyBtn.title = 'Copy answer';
        copyBtn.onclick = () => copyToClipboard(content);
        metaDiv.appendChild(copyBtn);
        const regenBtn = document.createElement('button');
        regenBtn.className = 'action-btn regen-btn';
        regenBtn.innerHTML = '⟳';
        regenBtn.title = 'Regenerate answer';
        regenBtn.onclick = () => { if (originalQuestion) sendMessage(originalQuestion); else showError('Cannot regenerate: original question missing'); };
        metaDiv.appendChild(regenBtn);
        const likeBtn = document.createElement('button');
        likeBtn.className = 'action-btn like-btn';
        likeBtn.innerHTML = '👍';
        likeBtn.title = 'Like this answer';
        likeBtn.onclick = () => { console.log('Liked answer:', content); showError('Thanks for your feedback!'); };
        metaDiv.appendChild(likeBtn);
        const dislikeBtn = document.createElement('button');
        dislikeBtn.className = 'action-btn dislike-btn';
        dislikeBtn.innerHTML = '👎';
        dislikeBtn.title = 'Dislike this answer';
        dislikeBtn.onclick = () => { console.log('Disliked answer:', content); showError('Thanks for your feedback!'); };
        metaDiv.appendChild(dislikeBtn);
    }
    messageDiv.appendChild(bubble);
    messageDiv.appendChild(metaDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    if (!chatMessages) return;
    const existing = document.getElementById('typingIndicator');
    if (existing) existing.remove();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

async function sendMessage(overrideQuestion = null) {
    if (!currentFincode) {
        addMessageToChat('bot', 'Please select a company first.', true);
        return;
    }
    const question = (overrideQuestion !== null) ? overrideQuestion : aiQuestion.value.trim();
    if (!question) return;
    askAIButton.disabled = true;
    aiQuestion.disabled = true;
    addMessageToChat('user', question);
    if (overrideQuestion === null) aiQuestion.value = '';

    showTypingIndicator();
    chatMessages.scrollTop = chatMessages.scrollHeight;
    await new Promise(r => requestAnimationFrame(r));

    try {
        const response = await fetch(`/company/${currentFincode}/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, history: conversationHistory.slice(-4) })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        await new Promise(r => setTimeout(r, 150));
        removeTypingIndicator();
        addMessageToChat('bot', data.answer, false, question);
        conversationHistory.push({ role: 'user', content: question });
        conversationHistory.push({ role: 'assistant', content: data.answer });
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator();
        addMessageToChat('bot', 'Sorry, I encountered an error. Please try again.', true);
    } finally {
        askAIButton.disabled = false;
        aiQuestion.disabled = false;
        aiQuestion.focus();
    }
}

if (askAIButton) askAIButton.addEventListener('click', () => sendMessage());
if (aiQuestion) aiQuestion.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ---------- AI CHIPS ----------
const ollamaChip = document.getElementById('ollamaChip');
const openaiChip = document.getElementById('openaiChip');

if (ollamaChip) {
    ollamaChip.addEventListener('click', async () => {
        if (!currentFincode) return;
        ollamaChip.classList.add('active');
        if (openaiChip) openaiChip.classList.remove('active');
        document.getElementById('aiSummaryContent').innerHTML = '<div class="loading-placeholder"><span class="spinner"></span> Loading Ollama analysis...</div>';
        try {
            const response = await fetch(`/company/${currentFincode}/ai-summary/`);
            const data = await response.json();
            document.getElementById('aiSummaryContent').innerHTML = data.summary || 'No response from Ollama.';
        } catch (error) {
            console.error('Ollama error:', error);
            document.getElementById('aiSummaryContent').innerHTML = 'Ollama is not installed or not responding. Please use OpenAI.';
        }
    });
}
if (openaiChip) {
    openaiChip.addEventListener('click', async () => {
        if (!currentFincode) return;
        openaiChip.classList.add('active');
        if (ollamaChip) ollamaChip.classList.remove('active');
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

// ---------- CHART ----------
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
        return data.chart_data;
    } catch (error) { console.error('Chart fetch error:', error); showError('Failed to load chart data'); return null; }
}

async function refreshChart() {
    const period = document.getElementById('periodSelect').value;
    const interval = document.getElementById('intervalSelect').value;
    const chartData = await fetchChartData(period, interval);
    if (chartData && chartData.length > 0) renderPriceChart(chartData);
    else { const ctx = document.getElementById('priceChart')?.getContext('2d'); if (ctx) ctx.clearRect(0, 0, ctx.width, ctx.height); showError('No data for this period/interval. Try a larger period or daily interval.'); }
}

document.getElementById('refreshChartBtn').addEventListener('click', refreshChart);
document.getElementById('periodSelect').addEventListener('change', refreshChart);
document.getElementById('intervalSelect').addEventListener('change', refreshChart);

// ---------- TABS ----------
function setActiveTab(tabName) {
    // Sidebar buttons (desktop)
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
    // Bottom nav buttons (mobile only)
    document.querySelectorAll('#mobileNav .tab-button').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        btn.classList.toggle('text-primary', isActive);
        btn.classList.toggle('text-on-surface-variant', !isActive);
    });
    // Tab content
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(tabName + 'Tab');
    if (target) target.classList.add('active');
    localStorage.setItem('lastActiveTab', tabName);
}

// Attach click listeners to all tab buttons (sidebar + mobile)
document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const tabName = this.dataset.tab;
        if (tabName) setActiveTab(tabName);
    });
});

// Restore last active tab – default Overview
const lastTab = localStorage.getItem('lastActiveTab');
if (lastTab && ['overview', 'financials', 'news', 'analysis'].includes(lastTab)) {
    setActiveTab(lastTab);
} else {
    setActiveTab('overview');
}

// ---------- SUGGESTED PROMPTS ----------
function attachPromptListeners() {
    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.removeEventListener('click', chip._listener);
        const handler = () => { aiQuestion.value = chip.textContent; aiQuestion.focus(); };
        chip.addEventListener('click', handler);
        chip._listener = handler;
    });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachPromptListeners);
else attachPromptListeners();

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