// stockapp/static/js/lightweight-chart.js

function initLightweightChart(fincode) {
    const container = document.getElementById('lw-chart');
    if (!container) {
        console.warn('Lightweight Charts container not found');
        return;
    }

    container.innerHTML = '<div class="loading-placeholder">Loading chart...</div>';

    if (typeof LightweightCharts === 'undefined') {
        container.innerHTML = '<div class="text-center text-muted">Lightweight Charts library not loaded</div>';
        console.error('LightweightCharts is not defined. Check CDN.');
        return;
    }

    const url = `/company/${fincode}/yfinance/?period=1y&interval=1D`;

    fetch(url)
        .then(r => r.json())
        .then(response => {
            // Handle new response format
            if (response.available === false || !response.data) {
                container.innerHTML = '<div class="text-center text-muted">No data available</div>';
                return;
            }
            const data = response.data;
            if (!data.chart_data || data.chart_data.length === 0) {
                container.innerHTML = '<div class="text-center text-muted">No data available</div>';
                return;
            }

            container.innerHTML = '';

            const bars = data.chart_data.map(item => ({
                time: Math.floor(new Date(item.date).getTime() / 1000),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume || 0,
            }));

            const chart = LightweightCharts.createChart(container, {
                width: container.clientWidth,
                height: 500,
                layout: {
                    background: { color: '#0b141c' },
                    textColor: '#dae3ee',
                },
                grid: {
                    vertLines: { color: '#1a202c' },
                    horzLines: { color: '#1a202c' },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                },
            });

            const candlestickSeries = chart.addCandlestickSeries({
                upColor: '#10b981',
                downColor: '#ef4444',
                borderVisible: false,
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
            });
            candlestickSeries.setData(bars);
            chart.timeScale().fitContent();

            const volumeSeries = chart.addHistogramSeries({
                color: '#2563eb',
                priceFormat: { type: 'volume' },
                priceScaleId: 'volume',
            });
            volumeSeries.setData(bars.map(b => ({ time: b.time, value: b.volume })));

            const resizeHandler = () => {
                chart.applyOptions({ width: container.clientWidth });
            };
            window.addEventListener('resize', resizeHandler);

            window.lwChart = chart;
        })
        .catch(err => {
            console.error('Lightweight Charts error:', err);
            container.innerHTML = `<div class="text-center text-muted">Failed to load chart: ${err.message}</div>`;
        });
}