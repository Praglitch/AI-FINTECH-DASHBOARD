        const searchInput = document.getElementById('companySearch');
        const searchResults = document.getElementById('searchResults');
        const noResults = document.getElementById('noResults');
        const dashboardContent = document.getElementById('dashboardContent');
        const clearButton = document.getElementById('clearSearch');
        const searchLoader = document.getElementById('searchLoader');
        const mainContent = document.querySelector('.main-content');
        const askAIButton = document.getElementById('askAIButton');
        const ai = document.getElementById('aiQuestion');
        const aiAnswer = document.getElementById('aiAnswer');
  
    

        let selectedFincode = null;
        let currentFincode = null;

        async function performSearch() {

    const query = searchInput.value.trim();

    if (query.length > 0) {
    clearButton.style.display = 'block';
} else {
    clearButton.style.display = 'none';
}

    if (query.length < 1) {
        searchResults.classList.remove('visible');
        return;
    }

    try {

        searchResults.innerHTML = `
            <div class="search-result-item">
                Searching...
            </div>
        `;

        searchResults.classList.add('visible');

        const response = await fetch(
            `/search/?q=${encodeURIComponent(query)}`
        );

        const data = await response.json();


        searchResults.innerHTML = '';

        if (data.length === 0) {

            searchResults.innerHTML = `
                <div class="search-result-item">
                    No companies found
                </div>
            `;

            return;
        }

        data.forEach(company => {

    const item = document.createElement('div');

    item.className = 'search-result-item';

    item.innerHTML = `
        <div class="search-result-name">${company.compname}</div>
        <div class="search-result-meta">
            ${company.symbol || 'N/A'} • ${company.fincode}
        </div>
    `;

    item.onclick = () => {

    searchInput.value = company.compname;

    selectCompany(company.fincode);

};

    searchResults.appendChild(item);

});

    } catch(error) {

        console.error(error);

        searchResults.innerHTML = `
        <div class="search-result-item">
            Unable to search companies
        </div>
    `;

    searchResults.classList.add('visible');

    }
}
let searchTimeout;
       searchInput.addEventListener('input', () => {

    clearButton.style.display =
        searchInput.value.trim()
            ? 'block'
            : 'none';

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        performSearch();
    }, 100);

});

    

        async function selectCompany(fincode) {
            currentFincode = fincode;
            selectedFincode = fincode;
            searchResults.classList.remove('visible');

searchLoader.style.display = 'block';
clearButton.style.display = 'none';
noResults.classList.add('loading-blur');
dashboardContent.classList.add('loading-blur');

            try {
                const [company, market, shareholding, ai, financials, announcements, news, actions, yfinance] = await Promise.all([
                    fetch(`/company/${fincode}/`).then(r => r.json()),
                    fetch(`/company-market/${fincode}/`).then(r => r.json()),
                    fetch(`/company-shareholding/${fincode}/`).then(r => r.json()),
                    fetch(`/company/${fincode}/ai-summary/`).then(r => r.json()),
                    fetch(`/company/${fincode}/financials/`).then(r => r.json()),
                    fetch(`/company/${fincode}/announcements/`).then(r => r.json()),
                    fetch(`/company/${fincode}/news/`).then(r => r.json()),
                    fetch(`/company/${fincode}/corporate-actions/`).then(r => r.json()),
                    fetch(`/company/${fincode}/yfinance/`).then(r => r.json())
                ]);
console.log("BEFORE UPDATE");
                updateDashboard(company, market, shareholding, ai, financials, announcements, news, actions, yfinance);

                noResults.style.display = 'none';
                dashboardContent.classList.add('active');
console.log("AFTER UPDATE");
                searchLoader.style.display = 'none';
                noResults.classList.remove('loading-blur');
dashboardContent.classList.remove('loading-blur');

if (searchInput.value.trim()) {
    clearButton.style.display = 'block';
}
            } catch(error) {

    searchLoader.style.display = 'none';
    noResults.classList.remove('loading-blur');
dashboardContent.classList.remove('loading-blur');

if (searchInput.value.trim()) {
    clearButton.style.display = 'block';
}

    console.error('Error loading company data:', error);

    showError('Unable to load company data');
}
        }

        function updateDashboard(company, market, shareholding, ai, financials, announcements, news, actions, yfinance) {
            // Hero section
            document.getElementById('companyName').textContent = company.compname;
            document.getElementById('companySymbol').textContent = company.symbol || 'N/A';
            document.getElementById('companyIndustry').textContent = company.industry || 'N/A';
            document.getElementById('companyStatus').textContent = company.status || 'N/A';

            // KPI Cards
            document.getElementById('kpiRevenue').textContent = formatNumber(financials.net_sales);
            document.getElementById('kpiPAT').textContent = formatNumber(financials.profit_after_tax);
            document.getElementById('kpiPromoter').textContent = shareholding.promoter + '%';
            document.getElementById('kpiPublic').textContent = shareholding.public + '%';
            document.getElementById('kpiMutualFund').textContent = shareholding.mutual_fund + '%';
            document.getElementById('kpiFII').textContent = shareholding.fpi + '%';

            // Overview Tab - Market Snapshot
            document.getElementById('marketOpen').textContent = '₹ ' + market.open;
            document.getElementById('marketHigh').textContent = '₹ ' + market.high;
            document.getElementById('marketLow').textContent = '₹ ' + market.low;
            document.getElementById('marketClose').textContent = '₹ ' + market.close;
            document.getElementById('marketVolume').textContent = market.volume;
            document.getElementById('marketValue').textContent = '₹ ' + market.value;

            // Shareholding
            document.getElementById('holdingPromoter').textContent = shareholding.promoter + '%';
            document.getElementById('holdingPublic').textContent = shareholding.public + '%';
            document.getElementById('holdingMutualFund').textContent = shareholding.mutual_fund + '%';
            document.getElementById('holdingFPI').textContent = shareholding.fpi + '%';

            // Company Details
            document.getElementById('companyISIN').textContent = company.isin || 'N/A';
            document.getElementById('companyFincode').textContent = company.fincode;
            document.getElementById('companyChairman').textContent = company.chairman || 'N/A';
            document.getElementById('companyMD').textContent = company.mdir || 'N/A';
            document.getElementById('companyCS').textContent = company.cosec || 'N/A';

            // Financials Tab
            document.getElementById('finYearEnd').textContent = financials.year_end;
            document.getElementById('finRevenue').textContent = '₹ ' + financials.net_sales;
            document.getElementById('finOperatingProfit').textContent = '₹ ' + financials.operating_profit;
            document.getElementById('finPAT').textContent = '₹ ' + financials.profit_after_tax;
            document.getElementById('finEPS').textContent = financials.reported_eps;
            document.getElementById('finDividend').textContent = financials.dividend_perc + '%';

            // YFinance Market Analysis

            document.getElementById('yfCurrentPrice').textContent = yfinance.current_price ?? '-';
            document.getElementById('yfPE').textContent = yfinance.pe_ratio ?? '-';
            document.getElementById('yfHigh').textContent = yfinance.fifty_two_week_high ?? '-';
            document.getElementById('yfLow').textContent = yfinance.fifty_two_week_low ?? '-';              
            document.getElementById('yfMarketCap').textContent = formatNumber(yfinance.market_cap);
            document.getElementById('yfVolume').textContent = formatNumber(yfinance.volume);

            const prices = yfinance.chart_data.map(x => x.close);
const volumes = yfinance.chart_data.map(x => x.volume);
const labels = yfinance.chart_data.map(x => x.date);

            renderStockChart(yfinance.chart_data);


            // News
            updateNewsList(news);
            updateAnnouncementsList(announcements);
            updateActionsList(actions);

            // AI Analysis
            updateAIAnalysis(ai);

            // Update search input
            searchInput.value = company.compname;
        }

        function updateNewsList(news) {
            const container = document.getElementById('newsList');

            if (news.length === 0) {
                container.innerHTML = '<div class="empty-state">No recent news available</div>';
                return;
            }

            container.innerHTML = news.map(item => `
                <div class="news-item">
                    <div class="item-title">${item.heading}</div>
                    <div class="item-date">${item.date}</div>
                </div>
            `).join('');
        }

        function updateAnnouncementsList(announcements) {
            const container = document.getElementById('announcementsList');

            if (announcements.length === 0) {
                container.innerHTML = '<div class="empty-state">No announcements available</div>';
                return;
            }

            container.innerHTML = announcements.map(item => `
                <div class="announcement-item">
                    <div class="item-title">${item.caption}</div>
                    <div class="item-date">${item.datetime}</div>
                </div>
            `).join('');
        }

        function updateActionsList(actions) {
            const container = document.getElementById('actionsList');

            if (!actions.actions || actions.actions.length === 0) {
                container.innerHTML = '<div class="empty-state">No corporate actions available</div>';
                return;
            }

            container.innerHTML = actions.actions.map(item => `
                <div class="action-item">
                    <div class="item-title">${item.details}</div>
                    <div class="item-date">${item.date}</div>
                </div>
            `).join('');
        }

        function updateAIAnalysis(ai) {
            const summary = ai.summary || 'No AI analysis available';
            document.getElementById('aiOverview').textContent = summary;
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

        // Tab System
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

    const clickedExampleCompany =
        e.target.closest('.example-company');

    if (
        e.target !== searchInput &&
        !searchResults.contains(e.target) &&
        !clickedExampleCompany
    ) {
        searchResults.classList.remove('visible');
    }

});
        
function showError(message) {

    const toast = document.getElementById('errorToast');

    toast.textContent = message;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

clearButton.addEventListener('click', () => {

    searchInput.value = '';

    searchResults.classList.remove('visible');

    clearButton.style.display = 'none';

    searchInput.focus();

});


const exampleCompanies =
    document.querySelectorAll('.example-company');

    exampleCompanies.forEach(company => {

    company.addEventListener('click', () => {



        searchInput.value =
            company.textContent.trim();

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

    document.getElementById('aiOverview').textContent =
        'Loading Ollama analysis...';

    const response = await fetch(
        `/company/${currentFincode}/ai-summary/`
    );

    const data = await response.json();

    document.getElementById('aiOverview').textContent =
        data.summary;
});


openaiChip.addEventListener('click', async () => {

    if (!currentFincode) return;

    openaiChip.classList.add('active');
    ollamaChip.classList.remove('active');

    document.getElementById('aiOverview').textContent =
        'Loading OpenAI analysis...';

    const response = await fetch(
        `/company/${currentFincode}/openai-summary/`
    );

    const data = await response.json();

    document.getElementById('aiOverview').textContent =
        data.summary;
}); 

let stockChart = null;

function renderStockChart(chartData) {

    const ctx =
        document.getElementById('stockPriceChart');

    if (!ctx) return;

    if (stockChart) {
        stockChart.destroy();
    }

    stockChart = new Chart(ctx, {

        type: 'line',

        data: {
            labels: chartData.map(
                item => item.date
            ),

            datasets: [
                {
                    label: 'Stock Price',

                    data: chartData.map(
                        item => item.close
                    ),

                    borderColor: '#7c3aed',
                    borderWidth: 2,
                    tension: 0.3
                }
            ]
        }
    });
}


askAIButton.addEventListener(
    'click',
    async () => {

        const question =
    ai.value.trim();

        if (!question) {
            return;
        }

        askAIButton.classList.add("active");
        askAIButton.disabled = true;
        askAIButton.textContent = "Thinking...";

        aiAnswer.textContent =
            "Generating answer...";

        try {

            console.log("Current Fincode:", currentFincode);
            console.log("Question:", question);

            const response = await fetch(
                `/company/${currentFincode}/chat/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        question
                    })
                }
            );

            if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
}

            const data =
                await response.json();

            console.log("Response:", data);

            aiAnswer.textContent =
                data.answer;

        } finally {

            askAIButton.classList.remove("active");
            askAIButton.disabled = false;
            askAIButton.textContent = "Ask AI";
        }
    }
);

document
    .querySelectorAll(".prompt-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document.getElementById(
                    "aiQuestion"
                ).value =
                    button.textContent.trim();

            }
        );

    });