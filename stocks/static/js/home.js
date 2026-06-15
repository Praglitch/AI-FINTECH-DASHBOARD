const searchInput = document.getElementById('companySearch');
const searchResults = document.getElementById('searchResults');
const noResults = document.getElementById('noResults');
const dashboardContent = document.getElementById('dashboardContent');
const clearButton = document.getElementById('clearSearch');
const searchLoader = document.getElementById('searchLoader');
const askAIButton = document.getElementById('askAIButton');
const aiQuestion = document.getElementById('aiQuestion');
const chatMessages = document.getElementById('chatMessages');

let selectedFincode = null;
let currentFincode = null;
let conversationHistory = [];

// -------- BACK ARROW & SETTINGS ----------
const backToEmptyBtn = document.getElementById('backToEmptyBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsDropdown = document.getElementById('settingsDropdown');
const helpBtn = document.getElementById('helpBtn');
const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');

if (backToEmptyBtn) backToEmptyBtn.style.display = 'none';

function resetToEmptyState() {
    dashboardContent.classList.remove('active');
    noResults.style.display = 'block';
    dashboardContent.style.display = 'none';
    currentFincode = null;
    selectedFincode = null;
    resetAITab();
    searchInput.value = '';
    searchResults.classList.remove('visible');
    searchResults.innerHTML = '';
    if (backToEmptyBtn) backToEmptyBtn.style.display = 'none';
}

if (backToEmptyBtn) backToEmptyBtn.addEventListener('click', resetToEmptyState);

if (settingsBtn && settingsDropdown) {
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.style.display = settingsDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => { settingsDropdown.style.display = 'none'; });
}
if (helpBtn) helpBtn.addEventListener('click', () => window.location.href = '/help/');
if (logoutDropdownBtn) logoutDropdownBtn.addEventListener('click', () => window.location.href = '/logout/');

// -------- SKELETON PLACEHOLDERS ----------
function showLoadingPlaceholders() {
    const ids = ['kpiRevenue','kpiPAT','kpiPromoter','kpiPublic','kpiMutualFund','kpiFII',
                 'holdingPromoter','holdingPublic','holdingMutualFund','holdingFPI',
                 'finYearEnd','finRevenue','finOperatingProfit','finPAT','finEPS','finDividend',
                 'yfCurrentPrice','yfPE','yfHigh','yfLow','yfMarketCap','yfVolume'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div class="skeleton" style="width: 80%;"></div>`;
    });
    const newsList = document.getElementById('newsList');
    if (newsList) newsList.innerHTML = '<div class="placeholder">Loading news...</div>';
    const announcementsList = document.getElementById('announcementsList');
    if (announcementsList) announcementsList.innerHTML = '<div class="placeholder">Loading announcements...</div>';
    const actionsList = document.getElementById('actionsList');
    if (actionsList) actionsList.innerHTML = '<div class="placeholder">Loading corporate actions...</div>';
    const aiOverview = document.getElementById('aiOverview');
    if (aiOverview) aiOverview.innerHTML = '<div class="loading-placeholder"><span class="spinner"></span> Loading AI analysis...</div>';
}

function resetAITab() {
    const aiOverview = document.getElementById('aiOverview');
    if (aiOverview) aiOverview.innerHTML = '<div class="loading-placeholder"><span class="spinner"></span> Loading AI analysis...</div>';
    if (aiQuestion) aiQuestion.value = '';
    if (chatMessages) {
        chatMessages.innerHTML = `<div class="chat-welcome"><div class="chat-bot-message">👋 Hello! I'm your AI research assistant. Ask me about financials, announcements, shareholding, market data, or anything else about this company.</div></div>`;
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
    try {
        const response = await fetch(`/company/${currentFincode}/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, history: conversationHistory.slice(-4) })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
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

// ---------- SEARCH ----------
async function performSearch() {
    const query = searchInput.value.trim();
    if (query.length > 0) clearButton.style.display = 'block';
    else clearButton.style.display = 'none';
    if (query.length < 1) {
        searchResults.classList.remove('visible');
        return;
    }
    try {
        searchResults.innerHTML = `<div class="search-result-item">Searching...</div>`;
        searchResults.classList.add('visible');
        const response = await fetch(`/search/?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        searchResults.innerHTML = '';
        if (data.length === 0) {
            searchResults.innerHTML = `<div class="search-result-item">No companies found</div>`;
            return;
        }
        data.forEach(company => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `<div class="search-result-name">${company.compname}</div><div class="search-result-meta">${company.symbol || 'N/A'} • ${company.fincode}</div>`;
            item.onclick = () => {
                searchInput.value = company.compname;
                selectCompany(company.fincode);
            };
            searchResults.appendChild(item);
        });
    } catch(error) {
        console.error(error);
        searchResults.innerHTML = `<div class="search-result-item">Unable to search companies</div>`;
        searchResults.classList.add('visible');
    }
}

let searchTimeout;
searchInput.addEventListener('input', () => {
    clearButton.style.display = searchInput.value.trim() ? 'block' : 'none';
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { performSearch(); }, 100);
});

// -------- HELPER: FORCE REPAINT ----------
function forceRepaint() {
    void document.body.offsetHeight;
}

// -------- SELECT COMPANY (INCREMENTAL) ----------
async function selectCompany(fincode) {
    currentFincode = fincode;
    selectedFincode = fincode;
    resetAITab();
    searchResults.classList.remove('visible');
    searchLoader.style.display = 'block';
    clearButton.style.display = 'none';
    noResults.style.display = 'none';
    dashboardContent.style.display = 'block';
    dashboardContent.classList.add('active');
    showLoadingPlaceholders();
    forceRepaint();

    document.getElementById('companyName').textContent = 'Loading...';
    try {
        const [company, market] = await Promise.all([
            fetch(`/company/${fincode}/`).then(r => r.json()),
            fetch(`/company-market/${fincode}/`).then(r => r.json())
        ]);

        // Critical data update
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
            forceRepaint();
        };
        updateCritical();
        dashboardContent.classList.remove('loading-blur');
        searchLoader.style.display = 'none';
        if (backToEmptyBtn) backToEmptyBtn.style.display = 'inline-block';
        searchInput.value = company.compname;
        if (searchInput.value.trim()) clearButton.style.display = 'block';

        // ---- Background data - each updates instantly ----
        // Shareholding
        fetch(`/company-shareholding/${fincode}/`).then(r => r.json()).then(data => {
            const fields = ['holdingPromoter','holdingPublic','holdingMutualFund','holdingFPI',
                            'kpiPromoter','kpiPublic','kpiMutualFund','kpiFII'];
            fields.forEach(f => {
                let val;
                if (f.includes('Promoter')) val = data.promoter;
                else if (f.includes('Public')) val = data.public;
                else if (f.includes('MutualFund')) val = data.mutual_fund;
                else if (f.includes('FPI') || f.includes('FII')) val = data.fpi;
                if (val !== undefined) document.getElementById(f).textContent = (val || '--') + '%';
            });
            forceRepaint();
        }).catch(e => console.warn('shareholding error', e));

        // Financials
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
            forceRepaint();
        }).catch(e => console.warn('financials error', e));

        // News
        fetch(`/company/${fincode}/news/`).then(r => r.json()).then(data => {
            const container = document.getElementById('newsList');
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="empty-state">No news available</div>';
            } else {
                container.innerHTML = data.map(item => `<div class="news-item"><div class="item-title">${escapeHtml(item.heading || 'No title')}</div><div class="item-date">${item.date || ''}</div></div>`).join('');
            }
            forceRepaint();
        }).catch(e => console.warn('news error', e));

        // Announcements
        fetch(`/company/${fincode}/announcements/`).then(r => r.json()).then(data => {
            const container = document.getElementById('announcementsList');
            if (!data || !Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="empty-state">No announcements available</div>';
            } else {
                container.innerHTML = data.map(item => `<div class="announcement-item"><div class="item-title">${escapeHtml(item.caption || 'No caption')}</div><div class="item-date">${item.datetime || ''}</div></div>`).join('');
            }
            forceRepaint();
        }).catch(e => console.warn('announcements error', e));

        // Corporate actions
        fetch(`/company/${fincode}/corporate-actions/`).then(r => r.json()).then(data => {
            const container = document.getElementById('actionsList');
            const actionsArray = data.actions || [];
            if (!actionsArray.length) {
                container.innerHTML = '<div class="empty-state">No corporate actions available</div>';
            } else {
                container.innerHTML = actionsArray.map(item => `<div class="action-item"><div class="item-title">${escapeHtml(item.details || 'No details')}</div><div class="item-date">${item.date || ''}</div></div>`).join('');
            }
            forceRepaint();
        }).catch(e => console.warn('actions error', e));

        // Yahoo Finance
        fetch(`/company/${fincode}/yfinance/?period=1y&interval=1mo`).then(r => r.json()).then(data => {
            if (data.chart_data && data.chart_data.length) renderPriceChart(data.chart_data);
            document.getElementById('yfCurrentPrice').textContent = (data.current_price ?? '--') !== '--' ? `₹ ${data.current_price}` : '--';
            window.originalCurrentPrice = document.getElementById('yfCurrentPrice').textContent;
            document.getElementById('yfPE').textContent = data.pe_ratio ?? '--';
            document.getElementById('yfHigh').textContent = data.fifty_two_week_high ?? '--';
            document.getElementById('yfLow').textContent = data.fifty_two_week_low ?? '--';
            document.getElementById('yfMarketCap').textContent = formatNumber(data.market_cap);
            document.getElementById('yfVolume').textContent = formatNumber(data.volume);
            forceRepaint();
        }).catch(e => console.warn('yfinance error', e));

        // OpenAI summary
        fetch(`/company/${fincode}/openai-summary/`).then(r => r.json()).then(data => {
            document.getElementById('aiOverview').innerHTML = data.summary;
            forceRepaint();
        }).catch(e => {
            console.warn('openai error', e);
            document.getElementById('aiOverview').innerHTML = 'AI summary temporarily unavailable.';
        });
    } catch(error) {
        dashboardContent.classList.remove('loading-blur');
        searchLoader.style.display = 'none';
        console.error('Critical data error:', error);
        showError('Unable to load company data');
        if (backToEmptyBtn) backToEmptyBtn.style.display = 'none';
    }
}

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
        options: { responsive: true, maintainAspectRatio: true, interaction: { mode: 'index', intersect: false, axis: 'x' }, plugins: { tooltip: { mode: 'index', intersect: false, callbacks: { label: (context) => `₹ ${context.raw.toFixed(2)}` }, backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#f59e0b', bodyColor: '#ffffff', borderColor: '#f59e0b', borderWidth: 1 }, legend: { display: false } }, scales: { x: { title: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 6, color: '#cbd5e1' }, grid: { display: false } }, y: { title: { display: false }, ticks: { callback: (val) => '₹' + val.toFixed(0), color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.1)' } } } }
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

// ---------- TAB SYSTEM ----------
const tabButtons = document.querySelectorAll('.tab-button');
const tabs = ['overview', 'financials', 'news', 'analysis'];
function setActiveTab(tabName) {
    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) { btn.classList.add('active'); document.getElementById(tabName + 'Tab').classList.add('active'); }
        else { btn.classList.remove('active'); document.getElementById(btn.getAttribute('data-tab') + 'Tab').classList.remove('active'); }
    });
    localStorage.setItem('lastActiveTab', tabName);
}
tabButtons.forEach(btn => {
    btn.removeEventListener('click', () => {});
    btn.addEventListener('click', (e) => { const tabName = btn.getAttribute('data-tab'); setActiveTab(tabName); });
});
const lastTab = localStorage.getItem('lastActiveTab');
if (lastTab && tabs.includes(lastTab)) setActiveTab(lastTab);
else setActiveTab('overview');

// ---------- SUGGESTED PROMPTS ----------
function attachPromptListeners() {
    const chips = document.querySelectorAll('.prompt-chip');
    chips.forEach(chip => {
        chip.removeEventListener('click', chip._listener);
        const handler = () => { aiQuestion.value = chip.textContent; aiQuestion.focus(); };
        chip.addEventListener('click', handler);
        chip._listener = handler;
    });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachPromptListeners);
else attachPromptListeners();

// ---------- EVENT LISTENERS ----------
document.addEventListener('click', (e) => {
    const clickedExampleCompany = e.target.closest('.example-company');
    if (e.target !== searchInput && !searchResults.contains(e.target) && !clickedExampleCompany) searchResults.classList.remove('visible');
});
function showError(message) {
    const toast = document.getElementById('errorToast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
clearButton.addEventListener('click', () => {
    searchInput.value = '';
    searchResults.classList.remove('visible');
    clearButton.style.display = 'none';
    searchInput.focus();
});
const exampleCompanies = document.querySelectorAll('.example-company');
exampleCompanies.forEach(company => {
    company.addEventListener('click', () => {
        searchInput.value = company.textContent.trim();
        clearButton.style.display = 'block';
        performSearch();
        searchInput.focus();
    });
});

// Ollama chip (friendly message)
const ollamaChip = document.getElementById('ollamaChip');
const openaiChip = document.getElementById('openaiChip');
if (ollamaChip) {
    ollamaChip.addEventListener('click', () => {
        if (!currentFincode) return;
        ollamaChip.classList.add('active');
        if (openaiChip) openaiChip.classList.remove('active');
        document.getElementById('aiOverview').innerHTML = '<div class="loading-placeholder">Ollama is not installed on this server. Please use OpenAI.</div>';
    });
}
if (openaiChip) {
    openaiChip.addEventListener('click', async () => {
        if (!currentFincode) return;
        openaiChip.classList.add('active');
        if (ollamaChip) ollamaChip.classList.remove('active');
        document.getElementById('aiOverview').innerHTML = '<div class="loading-placeholder"><span class="spinner"></span><span>Loading OpenAI analysis...</span></div>';
        const response = await fetch(`/company/${currentFincode}/openai-summary/`);
        const data = await response.json();
        document.getElementById('aiOverview').innerHTML = data.summary;
    });
}

const periodSelect = document.getElementById('periodSelect');
const intervalSelect = document.getElementById('intervalSelect');
const refreshBtn = document.getElementById('refreshChartBtn');
if (periodSelect && intervalSelect && refreshBtn) {
    refreshBtn.addEventListener('click', refreshChart);
    periodSelect.addEventListener('change', refreshChart);
    intervalSelect.addEventListener('change', refreshChart);
}
if (askAIButton) askAIButton.addEventListener('click', () => sendMessage());
if (aiQuestion) aiQuestion.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});