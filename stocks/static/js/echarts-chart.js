// stockapp/static/js/echarts-chart.js

let echartsInstance = null;
let cachedData = null; // store data to avoid refetching on toggles

function initEChartsChart(fincode) {
    const container = document.getElementById('echarts-container');
    if (!container) return;

    if (echartsInstance) {
        echartsInstance.dispose();
        echartsInstance = null;
    }

    container.innerHTML = '<div class="loading-placeholder">Loading chart...</div>';

    if (typeof echarts === 'undefined') {
        container.innerHTML = '<div class="text-center text-muted">ECharts library not loaded</div>';
        console.error('echarts is not defined. Check CDN.');
        return;
    }

    const url = `/company/${fincode}/yfinance/?period=1y&interval=1D`;

    fetch(url)
        .then(r => r.json())
        .then(response => {
            if (response.available === false || !response.data) {
                container.innerHTML = '<div class="text-center text-muted">No data available</div>';
                return;
            }
            const data = response.data;
            if (!data.chart_data || data.chart_data.length === 0) {
                container.innerHTML = '<div class="text-center text-muted">No data available</div>';
                return;
            }

            cachedData = data.chart_data; // store for toggling
            container.innerHTML = '';
            const chart = echarts.init(container, 'dark');
            echartsInstance = chart;

            renderChartWithIndicators(chart, cachedData);

            // Resize handler
            const resizeHandler = () => { chart.resize(); };
            window.addEventListener('resize', resizeHandler);
        })
        .catch(err => {
            console.error('ECharts error:', err);
            container.innerHTML = `<div class="text-center text-muted">Failed to load chart: ${err.message}</div>`;
        });
}

// ---------- Indicator Calculations ----------
function calculateMA(data, dayCount) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < dayCount - 1) {
            result.push(null);
            continue;
        }
        let sum = 0;
        for (let j = 0; j < dayCount; j++) {
            sum += data[i - j].close;
        }
        result.push(+(sum / dayCount).toFixed(2));
    }
    return result;
}

function calculateRSI(closes, period = 14) {
    const rsi = [];
    let gain = 0, loss = 0;
    for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i-1];
        if (i < period) {
            if (change > 0) gain += change;
            else loss += Math.abs(change);
            rsi.push(null);
            continue;
        }
        const avgGain = gain / period;
        const avgLoss = loss / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(+(100 - (100 / (1 + rs))).toFixed(2));
        // update for next iteration
        const nextChange = closes[i+1] - closes[i] || 0;
        if (nextChange > 0) gain = gain * (period-1)/period + nextChange;
        else loss = loss * (period-1)/period + Math.abs(nextChange);
    }
    return rsi;
}

function calculateMACD(closes, fast=12, slow=26, signal=9) {
    // EMA helper
    function EMA(data, period) {
        const result = [];
        let multiplier = 2 / (period + 1);
        let ema = data[0];
        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                result.push(data[i]);
                continue;
            }
            ema = (data[i] - ema) * multiplier + ema;
            result.push(+ema.toFixed(2));
        }
        return result;
    }

    const emaFast = EMA(closes, fast);
    const emaSlow = EMA(closes, slow);
    const macdLine = emaFast.map((v, i) => +(v - emaSlow[i]).toFixed(2));
    const signalLine = EMA(macdLine, signal);
    const histogram = macdLine.map((v, i) => +(v - signalLine[i]).toFixed(2));
    return { macdLine, signalLine, histogram };
}

function calculateBollingerBands(closes, period=20, stdDev=2) {
    const middle = calculateMA(closes.map((v, i) => ({ close: v })), period);
    const upper = [];
    const lower = [];
    for (let i = 0; i < closes.length; i++) {
        if (i < period - 1) {
            upper.push(null);
            lower.push(null);
            continue;
        }
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
            sum += closes[j];
        }
        const mean = sum / period;
        let variance = 0;
        for (let j = i - period + 1; j <= i; j++) {
            variance += Math.pow(closes[j] - mean, 2);
        }
        variance /= period;
        const std = Math.sqrt(variance);
        upper.push(+(mean + stdDev * std).toFixed(2));
        lower.push(+(mean - stdDev * std).toFixed(2));
    }
    return { upper, middle, lower };
}

// ---------- Main Render Function ----------
function renderChartWithIndicators(chart, data) {
    const dates = data.map(item => item.date);
    const ohlc = data.map(item => [item.open, item.close, item.low, item.high]);
    const closes = data.map(item => item.close);
    const volumes = data.map(item => item.volume || 0);

    // Get checkbox states
    const showMA = document.getElementById('indicator-ma')?.checked ?? true;
    const showBB = document.getElementById('indicator-bb')?.checked ?? false;
    const showRSI = document.getElementById('indicator-rsi')?.checked ?? true;
    const showMACD = document.getElementById('indicator-macd')?.checked ?? false;
    const showVolume = true; // always show volume

    // Calculate indicators
    const ma5 = showMA ? calculateMA(data, 5) : [];
    const ma10 = showMA ? calculateMA(data, 10) : [];
    const ma20 = showMA ? calculateMA(data, 20) : [];
    const rsiData = showRSI ? calculateRSI(closes, 14) : [];
    const macd = showMACD ? calculateMACD(closes) : null;
    const bb = showBB ? calculateBollingerBands(closes) : null;

    // Build grids and axes dynamically based on visible indicators
    const grids = [];
    const xAxes = [];
    const yAxes = [];
    let topOffset = 5;
    const gridHeight = 30; // percentage of total height

    // Main price grid (always present)
    grids.push({ left: '8%', right: '8%', top: topOffset + '%', height: '40%' });
    xAxes.push({ type: 'category', data: dates, gridIndex: 0, axisLine: { lineStyle: { color: '#414754' } }, splitLine: { show: false } });
    yAxes.push({ scale: true, gridIndex: 0, splitLine: { lineStyle: { color: '#1a202c' } }, axisLabel: { color: '#94a3b8' } });

    // Volume grid (always present, below price)
    const volumeGridIdx = grids.length;
    grids.push({ left: '8%', right: '8%', top: (topOffset + 40) + '%', height: '15%' });
    xAxes.push({ type: 'category', data: dates, gridIndex: 1, axisLine: { lineStyle: { color: '#414754' } }, splitLine: { show: false } });
    yAxes.push({ scale: true, gridIndex: 1, splitLine: { show: false }, axisLabel: { color: '#94a3b8' } });

    let currentTop = topOffset + 40 + 15;

    // RSI grid (optional)
    let rsiGridIdx = null;
    if (showRSI) {
        rsiGridIdx = grids.length;
        grids.push({ left: '8%', right: '8%', top: currentTop + '%', height: '12%' });
        xAxes.push({ type: 'category', data: dates, gridIndex: rsiGridIdx, axisLine: { lineStyle: { color: '#414754' } }, splitLine: { show: false } });
        yAxes.push({ scale: true, gridIndex: rsiGridIdx, splitLine: { show: false }, axisLabel: { color: '#94a3b8' }, min: 0, max: 100 });
        currentTop += 12;
    }

    // MACD grid (optional)
    let macdGridIdx = null;
    if (showMACD) {
        macdGridIdx = grids.length;
        grids.push({ left: '8%', right: '8%', top: currentTop + '%', height: '12%' });
        xAxes.push({ type: 'category', data: dates, gridIndex: macdGridIdx, axisLine: { lineStyle: { color: '#414754' } }, splitLine: { show: false } });
        yAxes.push({ scale: true, gridIndex: macdGridIdx, splitLine: { show: false }, axisLabel: { color: '#94a3b8' } });
        currentTop += 12;
    }

    // Build series array
    const series = [];

    // Candlestick (always)
    series.push({
        name: 'Candlestick',
        type: 'candlestick',
        data: ohlc,
        gridIndex: 0,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: {
            color: '#10b981',
            color0: '#ef4444',
            borderColor: '#10b981',
            borderColor0: '#ef4444',
        },
        markLine: {
            silent: true,
            data: [{ type: 'average', name: 'Avg' }],
            lineStyle: { color: '#f59e0b' },
            label: { color: '#f59e0b' },
        }
    });

    // Moving Averages (overlay on price grid)
    if (showMA) {
        series.push({
            name: 'MA5',
            type: 'line',
            data: ma5,
            gridIndex: 0,
            xAxisIndex: 0,
            yAxisIndex: 0,
            smooth: true,
            lineStyle: { color: '#8b5cf6', width: 1.5 },
            symbol: 'none',
        });
        series.push({
            name: 'MA10',
            type: 'line',
            data: ma10,
            gridIndex: 0,
            xAxisIndex: 0,
            yAxisIndex: 0,
            smooth: true,
            lineStyle: { color: '#3b82f6', width: 1.5 },
            symbol: 'none',
        });
        series.push({
            name: 'MA20',
            type: 'line',
            data: ma20,
            gridIndex: 0,
            xAxisIndex: 0,
            yAxisIndex: 0,
            smooth: true,
            lineStyle: { color: '#f59e0b', width: 1.5 },
            symbol: 'none',
        });
    }

    // Bollinger Bands (overlay on price grid)
    if (showBB && bb) {
        series.push({
            name: 'BB Upper',
            type: 'line',
            data: bb.upper,
            gridIndex: 0,
            xAxisIndex: 0,
            yAxisIndex: 0,
            lineStyle: { color: '#f472b6', width: 1, type: 'dashed' },
            symbol: 'none',
        });
        series.push({
            name: 'BB Middle',
            type: 'line',
            data: bb.middle,
            gridIndex: 0,
            xAxisIndex: 0,
            yAxisIndex: 0,
            lineStyle: { color: '#f472b6', width: 1 },
            symbol: 'none',
        });
        series.push({
            name: 'BB Lower',
            type: 'line',
            data: bb.lower,
            gridIndex: 0,
            xAxisIndex: 0,
            yAxisIndex: 0,
            lineStyle: { color: '#f472b6', width: 1, type: 'dashed' },
            symbol: 'none',
        });
    }

    // Volume (always)
    series.push({
        name: 'Volume',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        gridIndex: 1,
        data: volumes,
        itemStyle: {
            color: function(params) {
                const idx = params.dataIndex;
                const close = ohlc[idx]?.[1] || 0;
                const open = ohlc[idx]?.[0] || 0;
                return close >= open ? '#10b981' : '#ef4444';
            }
        }
    });

    // RSI
    if (showRSI && rsiGridIdx !== null) {
        series.push({
            name: 'RSI (14)',
            type: 'line',
            data: rsiData,
            gridIndex: rsiGridIdx,
            xAxisIndex: rsiGridIdx,
            yAxisIndex: rsiGridIdx,
            lineStyle: { color: '#a78bfa', width: 1.5 },
            symbol: 'none',
            markLine: {
                silent: true,
                data: [
                    { yAxis: 70, label: { formatter: 'Overbought' } },
                    { yAxis: 30, label: { formatter: 'Oversold' } }
                ],
                lineStyle: { color: '#ef4444', type: 'dashed' },
                label: { color: '#94a3b8' },
            }
        });
    }

    // MACD
    if (showMACD && macd && macdGridIdx !== null) {
        series.push({
            name: 'MACD Histogram',
            type: 'bar',
            data: macd.histogram,
            gridIndex: macdGridIdx,
            xAxisIndex: macdGridIdx,
            yAxisIndex: macdGridIdx,
            itemStyle: {
                color: function(params) {
                    return params.value >= 0 ? '#10b981' : '#ef4444';
                }
            }
        });
        series.push({
            name: 'MACD Signal',
            type: 'line',
            data: macd.signalLine,
            gridIndex: macdGridIdx,
            xAxisIndex: macdGridIdx,
            yAxisIndex: macdGridIdx,
            lineStyle: { color: '#f59e0b', width: 1.5 },
            symbol: 'none',
        });
        series.push({
            name: 'MACD Line',
            type: 'line',
            data: macd.macdLine,
            gridIndex: macdGridIdx,
            xAxisIndex: macdGridIdx,
            yAxisIndex: macdGridIdx,
            lineStyle: { color: '#60a5fa', width: 1.5 },
            symbol: 'none',
        });
    }

    // Build final option
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            backgroundColor: 'rgba(11, 20, 28, 0.9)',
            borderColor: '#414754',
            borderWidth: 1,
            textStyle: { color: '#dae3ee' },
        },
        grid: grids,
        xAxis: xAxes,
        yAxis: yAxes,
        dataZoom: [
            { type: 'inside', start: 0, end: 100 },
            { start: 0, end: 100 }
        ],
        series: series,
    };

    chart.setOption(option, true);
}

// ---------- Attach toggle listeners ----------
function attachIndicatorListeners() {
    const checkboxes = ['indicator-ma', 'indicator-bb', 'indicator-rsi', 'indicator-macd'];
    checkboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', function() {
                if (echartsInstance && cachedData) {
                    renderChartWithIndicators(echartsInstance, cachedData);
                }
            });
        }
    });
}

// Call this after DOM ready
document.addEventListener('DOMContentLoaded', function() {
    attachIndicatorListeners();
});