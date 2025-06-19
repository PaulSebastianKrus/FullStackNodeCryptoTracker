<script>
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { io } from 'socket.io-client';

  let chart; // hold Chart.js
  let chartEl; // canvas DOM element where the chart will be rendered
  let prices = []; // Array to store price data points
  let labels = []; // store time labels for the x-axis
  let socket; // hold the Socket.io connection

  const coins = [
    { id: 'bitcoin', name: 'Bitcoin (BTC)', color: '#F7931A', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum (ETH)', color: '#627EEA', symbol: 'ETH' },
    { id: 'solana', name: 'Solana (SOL)', color: '#00FFA3', symbol: 'SOL' },
    { id: 'ripple', name: 'XRP (XRP)', color: '#23292F', symbol: 'XRP' },
    { id: 'dogecoin', name: 'Dogecoin (DOGE)', color: '#C2A633', symbol: 'DOGE' },
  ];

  let selectedCoin = coins[0];
  let selectedTimeframe = '1';

  let timeframes = [
    { value: '1', label: '24H' },
    { value: '7', label: '7D' },
    { value: '30', label: '30D' },
    { value: '90', label: '90D' },
  ];

  let currentPrice = 0;
  let priceChange = 0;

  function selectCoin(coin) {
    selectedCoin = coin;
    updateChartAppearance();
    requestCoinData();
  }

  function selectTimeframe(timeframe) {
    selectedTimeframe = timeframe;
    requestCoinData();
  }

  function requestCoinData() {
    if (socket) {
      socket.emit('request_coin_data', {
        coinId: selectedCoin.id,
        days: selectedTimeframe,
      });
    }
  }

  function updateChartAppearance() {
    if (!chart) return;

    chart.data.datasets[0].label = `${selectedCoin.symbol} Price (USD)`;

    chart.data.datasets[0].borderColor = selectedCoin.color;
    chart.data.datasets[0].backgroundColor = `${selectedCoin.color}33`;

    chart.update();
  }

  function calculatePriceChange(priceData) {
    if (priceData.length < 2) return 0;

    const firstPrice = priceData[0].price;
    const lastPrice = priceData[priceData.length - 1].price;

    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  onMount(() => {
    chart = new Chart(chartEl, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${selectedCoin.symbol} Price (USD)`,
            data: prices,
            borderColor: selectedCoin.color,
            backgroundColor: `${selectedCoin.color}33`,
            tension: 0.2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            display: true,
            ticks: {
              color: '#fff',
              maxTicksLimit: 6,
              maxRotation: 0,
            },
          },
          y: {
            ticks: { color: '#fff' },
          },
        },
      },
    });

    socket = io('http://localhost:3000');

    coins.forEach((coin) => {
      socket.on(`${coin.id}_history`, (data) => {
        if (selectedCoin.id === coin.id) {
          prices = data.map((p) => p.price);
          labels = data.map((p) => {
            const date = new Date(p.time);
            return selectedTimeframe === '1' ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();
          });

          chart.data.labels = labels;
          chart.data.datasets[0].data = prices;
          chart.update();

          currentPrice = data[data.length - 1]?.price || 0;
          priceChange = calculatePriceChange(data);
        }
      });
    });

    requestCoinData();
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
    if (chart) chart.destroy();
  });
</script>

<div class="chart-container">
  <div class="controls">
    <div class="coin-selector">
      {#each coins as coin}
        <button class="coin-button" class:active={selectedCoin.id === coin.id} on:click={() => selectCoin(coin)}>
          {coin.symbol}
        </button>
      {/each}
    </div>

    <div class="timeframe-selector">
      {#each timeframes as timeframe}
        <button class="timeframe-button" class:active={selectedTimeframe === timeframe.value} on:click={() => selectTimeframe(timeframe.value)}>
          {timeframe.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="price-info">
    <div class="current-price">
      <span class="label">Current Price:</span>
      <span class="value">${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
    </div>
    <div class="price-change">
      <span class="label">Period Change:</span>
      <span class="value" class:positive={priceChange > 0} class:negative={priceChange < 0}>
        {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
      </span>
    </div>
  </div>

  <div class="chart">
    <canvas bind:this={chartEl}></canvas>
  </div>
</div>

<style>
  .chart-container {
    padding: 20px;
    background-color: #111;
    border-radius: 8px;
    margin: 20px 0;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .coin-selector,
  .timeframe-selector {
    display: flex;
    gap: 10px;
  }

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: #333;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:hover {
    background-color: #444;
  }

  button.active {
    background-color: #48bb78;
    font-weight: bold;
  }

  .price-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    font-size: 1.2em;
  }

  .current-price .value {
    color: #fff;
    font-weight: bold;
  }

  .positive {
    color: #48bb78;
  }

  .negative {
    color: #f56565;
  }

  .chart {
    height: 400px;
  }
</style>
