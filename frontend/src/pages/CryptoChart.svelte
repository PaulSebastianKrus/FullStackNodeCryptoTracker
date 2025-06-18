<script>
  import { onMount, onDestroy } from 'svelte'; 
  import Chart from 'chart.js/auto';           
  import { io } from 'socket.io-client';       

  
  let chart;     // Will hold the Chart.js instance
  let chartEl;   // Reference to the canvas DOM element where the chart will be rendered
  let prices = []; // Array to store price data points
  let labels = []; // Array to store time labels for the x-axis
  let socket;    // Will hold the Socket.io connection

  // Each coin has an id (for API), name, brand color, and symbol
  const coins = [
    { id: 'bitcoin', name: 'Bitcoin (BTC)', color: '#F7931A', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum (ETH)', color: '#627EEA', symbol: 'ETH' },
    { id: 'solana', name: 'Solana (SOL)', color: '#00FFA3', symbol: 'SOL' },
    { id: 'ripple', name: 'XRP (XRP)', color: '#23292F', symbol: 'XRP' },
    { id: 'dogecoin', name: 'Dogecoin (DOGE)', color: '#C2A633', symbol: 'DOGE' }
  ];
  
  let selectedCoin = coins[0];  
  let selectedTimeframe = '1';  
  
  
  let timeframes = [
    { value: '1', label: '24H' },   
    { value: '7', label: '7D' },    
    { value: '30', label: '30D' },  
    { value: '90', label: '90D' }   
  ];
  
  
  let currentPrice = 0;    
  let priceChange = 0;     
  
  /**
   * Handles coin selection from the UI
   * @param {Object} coin - The selected coin object
   */
  function selectCoin(coin) {
    selectedCoin = coin;                // Update selected coin
    updateChartAppearance();           // Update chart colors to match coin
    requestCoinData();                 // Request fresh data for the selected coin
  }
  
  /**
   * Handles timeframe selection from the UI
   * @param {string} timeframe - The number of days to display ('1', '7', '30', '90')
   */
  function selectTimeframe(timeframe) {
    selectedTimeframe = timeframe;     // Update selected timeframe
    requestCoinData();                // Request data for the new timeframe
  }
  
  /**
   * Requests cryptocurrency price data from the server via WebSocket
   * Sends the coin ID and timeframe to get specific historical data
   */
  function requestCoinData() {
    if (socket) {
      socket.emit('request_coin_data', { 
        coinId: selectedCoin.id,      // Which cryptocurrency to fetch
        days: selectedTimeframe       // How many days of history
      });
    }
  }
  
  /**
   * Updates the chart's visual appearance based on selected coin
   * Changes colors and labels to match the selected cryptocurrency
   */
  function updateChartAppearance() {
    if (!chart) return;  // Safety check if chart isn't initialized yet
    
    // Update chart label with coin symbol
    chart.data.datasets[0].label = `${selectedCoin.symbol} Price (USD)`;
    
    // Update chart colors based on coin's brand color
    chart.data.datasets[0].borderColor = selectedCoin.color;
    chart.data.datasets[0].backgroundColor = `${selectedCoin.color}33`;  // 33 is hex for 20% opacity
    
    // Apply changes to the chart
    chart.update();
  }
  
  /**
   * Calculates the percentage price change between first and last data points
   * @param {Array} priceData - Array of price data objects with 'price' property
   * @return {number} - Percentage change (positive or negative)
   */
  function calculatePriceChange(priceData) {
    if (priceData.length < 2) return 0;  // Need at least 2 points to calculate change
    
    const firstPrice = priceData[0].price;           // Starting price
    const lastPrice = priceData[priceData.length - 1].price;  // Ending price
    
    // Calculate percentage change formula: ((new - old) / old) * 100
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  /**
   * Component initialization function - runs when component is mounted to DOM
   * Sets up chart, establishes socket connection, and prepares data listeners
   */
  onMount(() => {
    // Initialize Chart.js chart
    chart = new Chart(chartEl, {
      type: 'line',               // Line chart type for time series data
      data: {
        labels,                   // X-axis labels (time)
        datasets: [{
          label: `${selectedCoin.symbol} Price (USD)`,
          data: prices,           // Y-axis data (prices)
          borderColor: selectedCoin.color,      // Line color
          backgroundColor: `${selectedCoin.color}33`,  // Fill color with opacity
          tension: 0.2,           // Curve smoothness (0 = straight lines)
          fill: true,             // Fill area under the line
        }]
      },
      options: {
        responsive: true,         // Resize chart when container resizes
        plugins: { 
          legend: { display: false }  // Hide legend for cleaner look
        },
        scales: {
          x: {
            display: true,
            ticks: { 
              color: '#fff',      // White text for dark theme
              maxTicksLimit: 6,   // Limit number of x-axis labels
              maxRotation: 0      // Keep labels horizontal
            }
          },
          y: {
            ticks: { color: '#fff' }  // White text for y-axis
          }
        }
      }
    });

    socket = io('http://localhost:3000');
    
    // Set up listeners for price updates from each supported coin
    coins.forEach(coin => {
      // Listen for specific coin's price history events
      socket.on(`${coin.id}_history`, (data) => {
        // Only process data if it's for currently selected coin
        if (selectedCoin.id === coin.id) {
          prices = data.map(p => p.price);
          labels = data.map(p => {
            const date = new Date(p.time);
            return selectedTimeframe === '1' 
              ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              : date.toLocaleDateString();
          });
          
          chart.data.labels = labels;
          chart.data.datasets[0].data = prices;
          chart.update();
          
          // Update price stats
          currentPrice = data[data.length - 1]?.price || 0;
          priceChange = calculatePriceChange(data);
        }
      });
    });
    
    // Request data for initially selected coin
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
        <button 
          class="coin-button"
          class:active={selectedCoin.id === coin.id} 
          on:click={() => selectCoin(coin)}>
          {coin.symbol}
        </button>
      {/each}
    </div>
    
    <div class="timeframe-selector">
      {#each timeframes as timeframe}
        <button 
          class="timeframe-button"
          class:active={selectedTimeframe === timeframe.value} 
          on:click={() => selectTimeframe(timeframe.value)}>
          {timeframe.label}
        </button>
      {/each}
    </div>
  </div>
  
  <div class="price-info">
    <div class="current-price">
      <span class="label">Current Price:</span>
      <span class="value">${currentPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
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
  
  .coin-selector, .timeframe-selector {
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