const searchInput = document.getElementById('companySearch');
const searchResults = document.getElementById('searchResults');
const noResults = document.getElementById('noResults');
const dashboardContent = document.getElementById('dashboardContent');
const clearButton = document.getElementById('clearSearch');
const searchLoader = document.getElementById('searchLoader');
const mainContent = document.querySelector('.main-content');
const askAIButton = document.getElementById('askAIButton');
const aiQuestion = document.getElementById('aiQuestion');
const chatMessages = document.getElementById('chatMessages');

let selectedFincode = null;
let currentFincode = null;
let conversationHistory = [];

// ---------- HELPER FUNCTIONS ----------
function showLoadingPlaceholders() {
    const spinnerHtml = '<span class="spinner"></span><span>Loading...</span>';
    function setLoading(id) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div class="loading-placeholder">${spinnerHtml}</div>`;
    }
    setLoading('kpiRevenue');
    setLoading('kpiPAT');
    setLoading('kpiPromoter');
    setLoading('kpiPublic');
    setLoading('kpiMutualFund');
    setLoading('kpiFII');
    setLoading('holdingPromoter');
    setLoading('holdingPublic');
    setLoading('holdingMutualFund');
    setLoading('holdingFPI');
    setLoading('finYearEnd');
    setLoading('finRevenue');
    setLoading('finOperatingProfit');
    setLoading('finPAT');
    setLoading('finEPS');
    setLoading('finDividend');
    setLoading('yfCurrentPrice');
    setLoading('yfPE');
    setLoading('yfHigh');
    setLoading('yfLow');
    setLoading('yfMarketCap');
    setLoading('yfVolume');
    
    const newsList = document.getElementById('newsList');
    if (newsList) newsList.innerHTML = `<div class="placeholder"><div class="loading-placeholder">${spinnerHtml}</div></div>`;
    const announcementsList = document.getElementById('announcementsList');
    if (announcementsList) announcementsList.innerHTML = `<div class="placeholder"><div class="loading-placeholder">${spinnerHtml}</div></div>`;
    const actionsList = document.getElementById('actionsList');
    if (actionsList) actionsList.innerHTML = `<div class="placeholder"><div class="loading-placeholder">${spinnerHtml}</div></div>`;
    
    const aiOverview = document.getElementById('aiOverview');
    if (aiOverview) aiOverview.innerHTML = `<div class="loading-placeholder">${spinnerHtml}</div>`;
}

function resetAITab() {
    const aiOverview = document.getElementById('aiOverview');
    if (aiOverview) aiOverview.innerHTML = `<div class="loading-placeholder"><span class="spinner"></span><span>Loading AI analysis...</span></div>`;
    if (aiQuestion) aiQuestion.value = '';
    // Reset chat UI
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="chat-welcome">
                <div class="chat-bot-message">
                    👋 Hello! I'm your AI research assistant. Ask me about financials, announcements, shareholding, market data, or anything else about this company.
                </div>
            </div>
        `;
    }
    conversationHistory = [];
    const ollamaChip = document.getElementById('ollamaChip');
    const openaiChip = document.getElementById('openaiChip');
    if (ollamaChip && openaiChip) {
        ollamaChip.classList.add('active');
        openaiChip.classList.remove('active');
    }
}

// ---------- CHAT UI ----------
function formatBotMessage(text) {
    let html = text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');
    // Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Headings: ### text -> <h4>text</h4>
    html = html.replace(/^### (.*?)$/gm, '<h4>$1</h4>');
    // Bullet points: - item -> <li>item</li> inside <ul>
    html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');
    // Line breaks
    html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    return html;
}

function addMessageToChat(role, content, isError = false) {
    if (!chatMessages) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'bot-message'}`;
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    if (isError) bubble.style.backgroundColor = '#dc2626';
    if (role === 'bot') {
        bubble.innerHTML = formatBotMessage(content);
    } else {
        bubble.textContent = content;
    }
    const timeSpan = document.createElement('div');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
    messageDiv.appendChild(bubble);
    messageDiv.appendChild(timeSpan);
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

async function sendMessage() {
    if (!currentFincode) {
        addMessageToChat('bot', 'Please select a company first.', true);
        return;
    }
    const question = aiQuestion.value.trim();
    if (!question) return;
    
    askAIButton.disabled = true;
    aiQuestion.disabled = true;
    addMessageToChat('user', question);
    aiQuestion.value = '';
    showTypingIndicator();
    
    try {
        const response = await fetch(`/company/${currentFincode}/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        removeTypingIndicator();
        addMessageToChat('bot', data.answer);
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

// ---------- SELECT COMPANY (with blur and placeholders) ----------
async function selectCompany(fincode) {
    currentFincode = fincode;
    selectedFincode = fincode;
    resetAITab();  // Also clears chat
    searchResults.classList.remove('visible');
    
    searchLoader.style.display = 'block';
    clearButton.style.display = 'none';
    noResults.style.display = 'none';
    dashboardContent.classList.add('active');
    dashboardContent.classList.add('loading-blur');
    showLoadingPlaceholders();
    document.getElementById('companyName').textContent = 'Loading...';
    
    try {
        const [company, market] = await Promise.all([
            fetch(`/company/${fincode}/`).then(r => r.json()),
            fetch(`/company-market/${fincode}/`).then(r => r.json())
        ]);
        
        document.getElementById('companyName').textContent = company.compname;
        document.getElementById('companySymbol').textContent = company.symbol || 'N/A';
        document.getElementById('companyIndustry').textContent = company.industry || 'N/A';
        document.getElementById('companyStatus').textContent = company.status || 'N/A';
        document.getElementById('marketOpen').textContent = '₹ ' + (market.open || '--');
        document.getElementById('marketHigh').textContent = '₹ ' + (market.high || '--');
        document.getElementById('marketLow').textContent = '₹ ' + (market.low || '--');
        document.getElementById('marketClose').textContent = '₹ ' + (market.close || '--');
        document.getElementById('marketVolume').textContent = market.volume || '--';
        document.getElementById('marketValue').textContent = '₹ ' + (market.value || '--');
        
        dashboardContent.classList.remove('loading-blur');
        searchLoader.style.display = 'none';
        
        Promise.all([
            fetch(`/company-shareholding/${fincode}/`).then(r => r.json()),
            fetch(`/company/${fincode}/ai-summary/`).then(r => r.json()),
            fetch(`/company/${fincode}/financials/`).then(r => r.json()),
            fetch(`/company/${fincode}/announcements/`).then(r => r.json()),
            fetch(`/company/${fincode}/news/`).then(r => r.json()),
            fetch(`/company/${fincode}/corporate-actions/`).then(r => r.json()),
            fetch(`/company/${fincode}/yfinance/`).then(r => r.json())
        ]).then(([shareholding, ai, financials, announcements, news, actions, yfinance]) => {
            updateDashboard({
                compname: company.compname,
                symbol: company.symbol,
                industry: company.industry,
                status: company.status,
                isin: company.isin,
                fincode: company.fincode,
                chairman: company.chairman,
                mdir: company.mdir,
                cosec: company.cosec
            }, market, shareholding, ai, financials, announcements, news, actions, yfinance);
            if (company && company.compname) searchInput.value = company.compname;
            if (searchInput.value.trim()) clearButton.style.display = 'block';
        }).catch(err => {
            console.error('Background load error:', err);
            showError('Some data could not be loaded');
        });
    } catch(error) {
        dashboardContent.classList.remove('loading-blur');
        searchLoader.style.display = 'none';
        console.error('Critical data error:', error);
        showError('Unable to load company data');
    }
}

// ---------- DASHBOARD UPDATE ----------
function updateDashboard(company, market, shareholding, ai, financials, announcements, news, actions, yfinance) {
    document.getElementById('companyName').textContent = company.compname;
    document.getElementById('companySymbol').textContent = company.symbol || 'N/A';
    document.getElementById('companyIndustry').textContent = company.industry || 'N/A';
    document.getElementById('companyStatus').textContent = company.status || 'N/A';
    document.getElementById('kpiRevenue').textContent = formatNumber(financials.net_sales);
    document.getElementById('kpiPAT').textContent = formatNumber(financials.profit_after_tax);
    document.getElementById('kpiPromoter').textContent = shareholding.promoter + '%';
    document.getElementById('kpiPublic').textContent = shareholding.public + '%';
    document.getElementById('kpiMutualFund').textContent = shareholding.mutual_fund + '%';
    document.getElementById('kpiFII').textContent = shareholding.fpi + '%';
    document.getElementById('marketOpen').textContent = '₹ ' + market.open;
    document.getElementById('marketHigh').textContent = '₹ ' + market.high;
    document.getElementById('marketLow').textContent = '₹ ' + market.low;
    document.getElementById('marketClose').textContent = '₹ ' + market.close;
    document.getElementById('marketVolume').textContent = market.volume;
    document.getElementById('marketValue').textContent = '₹ ' + market.value;
    document.getElementById('holdingPromoter').textContent = shareholding.promoter + '%';
    document.getElementById('holdingPublic').textContent = shareholding.public + '%';
    document.getElementById('holdingMutualFund').textContent = shareholding.mutual_fund + '%';
    document.getElementById('holdingFPI').textContent = shareholding.fpi + '%';
    document.getElementById('companyISIN').textContent = company.isin || 'N/A';
    document.getElementById('companyFincode').textContent = company.fincode;
    document.getElementById('companyChairman').textContent = company.chairman || 'N/A';
    document.getElementById('companyMD').textContent = company.mdir || 'N/A';
    document.getElementById('companyCS').textContent = company.cosec || 'N/A';
    document.getElementById('finYearEnd').textContent = financials.year_end;
    document.getElementById('finRevenue').textContent = '₹ ' + financials.net_sales;
    document.getElementById('finOperatingProfit').textContent = '₹ ' + financials.operating_profit;
    document.getElementById('finPAT').textContent = '₹ ' + financials.profit_after_tax;
    document.getElementById('finEPS').textContent = financials.reported_eps;
    document.getElementById('finDividend').textContent = financials.dividend_perc + '%';
    document.getElementById('yfCurrentPrice').textContent = yfinance.current_price ?? '-';
    document.getElementById('yfPE').textContent = yfinance.pe_ratio ?? '-';
    document.getElementById('yfHigh').textContent = yfinance.fifty_two_week_high ?? '-';
    document.getElementById('yfLow').textContent = yfinance.fifty_two_week_low ?? '-';
    document.getElementById('yfMarketCap').textContent = formatNumber(yfinance.market_cap);
    document.getElementById('yfVolume').textContent = formatNumber(yfinance.volume);
    renderStockChart(yfinance.chart_data);
    updateNewsList(news);
    updateAnnouncementsList(announcements);
    updateActionsList(actions);
    updateAIAnalysis(ai);
    searchInput.value = company.compname;
}

function updateNewsList(news) {
    const container = document.getElementById('newsList');
    if (!news || news.length === 0) { container.innerHTML = '<div class="empty-state">No recent news available</div>'; return; }
    container.innerHTML = news.map(item => `<div class="news-item"><div class="item-title">${item.heading}</div><div class="item-date">${item.date}</div></div>`).join('');
}

function updateAnnouncementsList(announcements) {
    const container = document.getElementById('announcementsList');
    if (!announcements || announcements.length === 0) { container.innerHTML = '<div class="empty-state">No announcements available</div>'; return; }
    container.innerHTML = announcements.map(item => `<div class="announcement-item"><div class="item-title">${item.caption}</div><div class="item-date">${item.datetime}</div></div>`).join('');
}

function updateActionsList(actions) {
    const container = document.getElementById('actionsList');
    if (!actions.actions || actions.actions.length === 0) { container.innerHTML = '<div class="empty-state">No corporate actions available</div>'; return; }
    container.innerHTML = actions.actions.map(item => `<div class="action-item"><div class="item-title">${item.details}</div><div class="item-date">${item.date}</div></div>`).join('');
}

function updateAIAnalysis(ai) {
    const summary = ai.summary || 'No AI analysis available';
    document.getElementById('aiOverview').innerHTML = summary;
}

function formatNumber(num) {
    if (!num || num === 'N/A') return num;
    const number = parseFloat(num.toString().replace(/,/g, ''));
    if (isNaN(number)) return num;
    if (number >= 1e9) return (number / 1e9).toFixed(2) + 'B';
    if (number >= 1e7) return (number / 1e7).toFixed(2) + 'Cr';
    if (number >= 1e5) return (number / 1e5).toFixed(2) + 'L';
    return number.toLocaleString('en-IN');
}

// ---------- TAB SYSTEM ----------
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
    });
});

document.addEventListener('click', (e) => {
    const clickedExampleCompany = e.target.closest('.example-company');
    if (e.target !== searchInput && !searchResults.contains(e.target) && !clickedExampleCompany) {
        searchResults.classList.remove('visible');
    }
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

const ollamaChip = document.getElementById('ollamaChip');
const openaiChip = document.getElementById('openaiChip');
ollamaChip.addEventListener('click', async () => {
    if (!currentFincode) return;
    ollamaChip.classList.add('active');
    openaiChip.classList.remove('active');
    document.getElementById('aiOverview').innerHTML = '<div class="loading-placeholder"><span class="spinner"></span><span>Loading Ollama analysis...</span></div>';
    const response = await fetch(`/company/${currentFincode}/ai-summary/`);
    const data = await response.json();
    document.getElementById('aiOverview').innerHTML = data.summary;
});
openaiChip.addEventListener('click', async () => {
    if (!currentFincode) return;
    openaiChip.classList.add('active');
    ollamaChip.classList.remove('active');
    document.getElementById('aiOverview').innerHTML = '<div class="loading-placeholder"><span class="spinner"></span><span>Loading OpenAI analysis...</span></div>';
    const response = await fetch(`/company/${currentFincode}/openai-summary/`);
    const data = await response.json();
    document.getElementById('aiOverview').innerHTML = data.summary;
});

let stockChart = null;
function renderStockChart(chartData) {
    const ctx = document.getElementById('stockPriceChart');
    if (!ctx) return;
    if (stockChart) stockChart.destroy();
    if (!chartData || chartData.length === 0) return;
    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(item => item.date),
            datasets: [{ label: 'Stock Price', data: chartData.map(item => item.close), borderColor: '#7c3aed', borderWidth: 2, tension: 0.3 }]
        }
    });
}

// Attach chat event listeners
if (askAIButton) askAIButton.addEventListener('click', sendMessage);
if (aiQuestion) aiQuestion.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});