// stockapp/static/js/echarts-chart.js

let echartsInstance = null;

function initEChartsChart(fincode) {
    const container = document.getElementById('echarts-container');
    if (!container) {
        console.warn('ECharts container not found');
        return;
    }

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

            container.innerHTML = '';

            const dates = data.chart_data.map(item => item.date);
            const ohlc = data.chart_data.map(item => [
                item.open,
                item.close,
                item.low,
                item.high,
            ]);
            const volume = data.chart_data.map(item => item.volume || 0);

            function calculateMA(dayCount) {
                const result = [];
                for (let i = 0; i < ohlc.length; i++) {
                    if (i < dayCount - 1) {
                        result.push('-');
                        continue;
                    }
                    let sum = 0;
                    for (let j = 0; j < dayCount; j++) {
                        sum += ohlc[i - j][1];
                    }
                    result.push(+(sum / dayCount).toFixed(2));
                }
                return result;
            }

            const ma5 = calculateMA(5);
            const ma10 = calculateMA(10);
            const ma20 = calculateMA(20);

            function calculateRSI(data, period = 14) {
                const rsi = [];
                let gain = 0, loss = 0;
                for (let i = 1; i < data.length; i++) {
                    const change = data[i] - data[i-1];
                    if (i < period) {
                        if (change > 0) gain += change;
                        else loss += Math.abs(change);
                        rsi.push('-');
                        continue;
                    }
                    const avgGain = gain / period;
                    const avgLoss = loss / period;
                    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
                    rsi.push(+(100 - (100 / (1 + rs))).toFixed(2));
                    const nextChange = data[i+1] - data[i] || 0;
                    if (nextChange > 0) gain = gain * (period-1)/period + nextChange;
                    else loss = loss * (period-1)/period + Math.abs(nextChange);
                }
                return rsi;
            }

            const closes = data.chart_data.map(item => item.close);
            const rsi14 = calculateRSI(closes);

            const chart = echarts.init(container, 'dark');

            const option = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'cross' },
                    backgroundColor: 'rgba(11, 20, 28, 0.9)',
                    borderColor: '#414754',
                    borderWidth: 1,
                    textStyle: { color: '#dae3ee' },
                },
                grid: [
                    { left: '8%', right: '8%', top: '5%', height: '40%' },
                    { left: '8%', right: '8%', top: '50%', height: '15%' },
                    { left: '8%', right: '8%', top: '70%', height: '20%' }
                ],
                xAxis: [
                    { type: 'category', data: dates, gridIndex: 0, axisLine: { lineStyle: { color: '#414754' } }, splitLine: { show: false } },
                    { type: 'category', data: dates, gridIndex: 1, axisLine: { lineStyle: { color: '#414754' } }, splitLine: { show: false } },
                    { type: 'category', data: dates, gridIndex: 2, axisLine: { lineStyle: { color: '#414754' } }, splitLine: { show: false } }
                ],
                yAxis: [
                    { scale: true, gridIndex: 0, splitLine: { lineStyle: { color: '#1a202c' } }, axisLabel: { color: '#94a3b8' } },
                    { scale: true, gridIndex: 1, splitLine: { show: false }, axisLabel: { color: '#94a3b8' } },
                    { scale: true, gridIndex: 2, splitLine: { show: false }, axisLabel: { color: '#94a3b8' } }
                ],
                dataZoom: [
                    { type: 'inside', start: 0, end: 100 },
                    { start: 0, end: 100 }
                ],
                series: [
                    {
                        name: 'Candlestick',
                        type: 'candlestick',
                        data: ohlc,
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
                    },
                    {
                        name: 'MA5',
                        type: 'line',
                        data: ma5,
                        smooth: true,
                        lineStyle: { color: '#8b5cf6', width: 1.5 },
                        symbol: 'none',
                    },
                    {
                        name: 'MA10',
                        type: 'line',
                        data: ma10,
                        smooth: true,
                        lineStyle: { color: '#3b82f6', width: 1.5 },
                        symbol: 'none',
                    },
                    {
                        name: 'MA20',
                        type: 'line',
                        data: ma20,
                        smooth: true,
                        lineStyle: { color: '#f59e0b', width: 1.5 },
                        symbol: 'none',
                    },
                    {
                        name: 'Volume',
                        type: 'bar',
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        data: volume,
                        itemStyle: {
                            color: function(params) {
                                const idx = params.dataIndex;
                                const close = ohlc[idx]?.[1] || 0;
                                const open = ohlc[idx]?.[0] || 0;
                                return close >= open ? '#10b981' : '#ef4444';
                            }
                        }
                    },
                    {
                        name: 'RSI (14)',
                        type: 'line',
                        xAxisIndex: 2,
                        yAxisIndex: 2,
                        data: rsi14,
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
                    }
                ]
            };

            chart.setOption(option);
            echartsInstance = chart;

            const resizeHandler = () => { chart.resize(); };
            window.addEventListener('resize', resizeHandler);
        })
        .catch(err => {
            console.error('ECharts error:', err);
            container.innerHTML = `<div class="text-center text-muted">Failed to load chart: ${err.message}</div>`;
        });
}