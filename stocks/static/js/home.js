        const searchInput = document.getElementById('companySearch');
        const searchResults = document.getElementById('searchResults');
        const noResults = document.getElementById('noResults');
        const dashboardContent = document.getElementById('dashboardContent');
        const clearButton = document.getElementById('clearSearch');
        const searchLoader = document.getElementById('searchLoader');
        

        let selectedFincode = null;
        let currentSearchResults = [];

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

        currentSearchResults = data;

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

    item.onclick = () => selectCompany(company.fincode);

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
            selectedFincode = fincode;
            searchResults.classList.remove('visible');

console.log('SHOWING LOADER');
searchLoader.style.display = 'block';
console.log(searchLoader);
clearButton.style.display = 'none';

            try {
                const [company, market, shareholding, ai, financials, announcements, news, actions] = await Promise.all([
                    fetch(`/company/${fincode}/`).then(r => r.json()),
                    fetch(`/company-market/${fincode}/`).then(r => r.json()),
                    fetch(`/company-shareholding/${fincode}/`).then(r => r.json()),
                    fetch(`/company/${fincode}/ai-summary/`).then(r => r.json()),
                    fetch(`/company/${fincode}/financials/`).then(r => r.json()),
                    fetch(`/company/${fincode}/announcements/`).then(r => r.json()),
                    fetch(`/company/${fincode}/news/`).then(r => r.json()),
                    fetch(`/company/${fincode}/corporate-actions/`).then(r => r.json())
                ]);

                updateDashboard(company, market, shareholding, ai, financials, announcements, news, actions);

                noResults.style.display = 'none';
                dashboardContent.classList.add('active');

                searchLoader.style.display = 'none';

if (searchInput.value.trim()) {
    clearButton.style.display = 'block';
}
            } catch(error) {

    searchLoader.style.display = 'none';

if (searchInput.value.trim()) {
    clearButton.style.display = 'block';
}

    console.error('Error loading company data:', error);

    showError('Unable to load company data');
}
        }

        function updateDashboard(company, market, shareholding, ai, financials, announcements, news, actions) {
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

    currentSearchResults = [];

    searchResults.classList.remove('visible');

    clearButton.style.display = 'none';

    searchInput.focus();

});


const exampleCompanies =
    document.querySelectorAll('.example-company');

    exampleCompanies.forEach(company => {

    company.addEventListener('click', () => {

        console.log(
    company.textContent.trim()
);

        searchInput.value =
            company.textContent.trim();

        clearButton.style.display = 'block';

        performSearch();

        searchInput.focus();

    });

});