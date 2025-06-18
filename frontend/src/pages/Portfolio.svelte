<script>
  import PrivateRoute from '../components/PrivateRouteGuard.svelte';
  import { onMount, onDestroy } from 'svelte';
  import toast from 'svelte-french-toast';
  import { currentUser } from '../stores/generalStore.js'; 
  import { Chart } from 'chart.js/auto'; 
  
  //State Variables
  let portfolio = [];
  let coinId = '';
  let amount = 0;
  let loading = false;
  let coinPrices = {}; 
  let chartCanvas;
  let chartInstance;
  
  
  $: userId = $currentUser?.id;
  $: if (userId) fetchPortfolio(); 

  async function fetchPortfolio() {
    if (!userId) return;
    
    loading = true;
    try {
      const res = await fetch(`http://localhost:3000/api/portfolio/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      portfolio = await res.json();
      
      
      if (portfolio.length > 0) {
        await fetchPrices();
      }
    } catch (error) {
      toast.error('Failed to load portfolio');
    } finally {
      loading = false;
    }
  }

  async function fetchPrices() {
    if (portfolio.length === 0) return;
    
    try {
      const coinIds = portfolio.map(p => p.coinId).join(',');
      
      const res = await fetch(`http://localhost:3000/api/crypto/user-prices?ids=${coinIds}`);
      const priceData = await res.json();
      
      // price lookup object
      coinPrices = {};
      for (const coin of priceData) {
        coinPrices[coin.id] = coin.price;
      }
      
     
      // Build pricesForPortfolio with portfolio coinId as keys
      let pricesForPortfolio = {};
      for (const entry of portfolio) {
        const apiCoinId = getApiCoinId(entry.coinId);
        pricesForPortfolio[entry.coinId] = coinPrices[apiCoinId] || null;
      }

      await fetch('http://localhost:3000/api/portfolio/check-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, prices: pricesForPortfolio })
      });
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  }
  
  const COIN_MAPPINGS = {
    // Standard to internal format
    standard: {
      'btc': 'bitcoin',
      'eth': 'ethereum',
      'sol': 'solana',
      'xrp': 'ripple',
      'doge': 'dogecoin'
    },
    // Internal to API format
    api: {
      'bitcoin': 'btc-bitcoin',
      'ethereum': 'eth-ethereum',
      'solana': 'sol-solana', 
      'ripple': 'xrp-xrp',
      'dogecoin': 'doge-dogecoin'
    }
  };

  function standardizeCoinId(id) {
    const lowerCaseId = id.toLowerCase();
    return COIN_MAPPINGS.standard[lowerCaseId] || lowerCaseId;
  }

  function getApiCoinId(id) {
    return COIN_MAPPINGS.api[id] || id;
  }

  async function upsertPortfolio() {
    if (!userId) {
      toast.error('You must be logged in');
      return;
    }
    
    const standardizedCoinId = standardizeCoinId(coinId);
    
    try {
      const res = await fetch('http://localhost:3000/api/portfolio/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          coinId: standardizedCoinId, 
          amount: Number(amount) 
        }),
      });
      if (!res.ok) throw new Error('Failed to update portfolio');
      const data = await res.json();
      toast.success(data.message);
      coinId = '';
      amount = 0;
      await fetchPortfolio();
    } catch (error) {
      toast.error('Failed to update portfolio');
    }
  }

  async function removePortfolio(coinId) {
    try {
      const res = await fetch(`http://localhost:3000/api/portfolio/remove?userId=${userId}&coinId=${encodeURIComponent(coinId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove entry');
      toast.success('Entry removed!');
      await fetchPortfolio();
    } catch (error) {
      toast.error('Failed to remove entry');
    }
  }

  function getCoinValue(coinId, amount) {
    const apiCoinId = getApiCoinId(coinId);
    const price = coinPrices[apiCoinId] || 0;
    return price * amount;
  }

  $: totalValue = portfolio.reduce((sum, entry) => sum + getCoinValue(entry.coinId, entry.amount), 0);

  $: if (chartCanvas && portfolio.length > 0) {
    createChart();
  }
  
  function createChart() {
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    const labels = portfolio.map(entry => entry.coinId);
    const values = portfolio.map(entry => {
      const apiCoinId = getApiCoinId(entry.coinId);
      const price = coinPrices[apiCoinId] || 0;
      return price * entry.amount;
    });
    
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#15616D', '#78C091', '#C06C84', '#F67280'
    ];
    
    chartInstance = new Chart(chartCanvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          hoverBackgroundColor: colors.slice(0, labels.length)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = typeof context.raw === 'number' ? context.raw : 0;
                
                let total = 0;
                if (context.dataset.data && Array.isArray(context.dataset.data)) {
                  total = context.dataset.data.reduce((a, b) => 
                    a + (typeof b === 'number' ? b : 0), 0);
                }
                
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                
                const valueFormatted = value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
                
                return `${context.label || ''}: $${valueFormatted} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  onDestroy(() => {
    if (chartInstance) chartInstance.destroy();
  });

  async function saveNotificationSetting(coinId, notifyAbove, notifyBelow) {
    try {
      await fetch('http://localhost:3000/api/portfolio/update-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          coinId,
          notifyAbove: notifyAbove ? parseFloat(notifyAbove) : null,
          notifyBelow: notifyBelow ? parseFloat(notifyBelow) : null
        })
      });
      toast.success('Notification setting saved!');
    } catch (error) {
      toast.error('Failed to save notification setting');
    }
  }
</script>

<PrivateRoute redirectTo="/login">
  {#if loading}
    <p>Loading your portfolio...</p>
  {:else}
    <h2>Your Portfolio <button class="refresh-btn" on:click={fetchPrices}>↻ Refresh Prices</button></h2>
    <form on:submit|preventDefault={upsertPortfolio}>
      <select bind:value={coinId} required>
        <option value="">Select a coin</option>
        <option value="bitcoin">Bitcoin (BTC)</option>
        <option value="ethereum">Ethereum (ETH)</option>
        <option value="solana">Solana (SOL)</option>
        <option value="ripple">XRP</option>
        <option value="dogecoin">Dogecoin (DOGE)</option>
      </select>
      <input type="number" min="0" step="any" placeholder="Amount" bind:value={amount} required />
      <button type="submit">Add/Update</button>
    </form>

    {#if portfolio.length === 0}
      <p>No coins in your portfolio yet. Add some above!</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Coin</th>
            <th>Amount</th>
            <th>Price (USD)</th>
            <th>Value (USD)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {#each portfolio as entry}
            <tr>
              <td>{entry.coinId}</td>
              <td class="amount-cell">{Number(entry.amount).toFixed(8)}</td>
              <td>${(coinPrices[getApiCoinId(entry.coinId)] || 0).toLocaleString(undefined, {maximumFractionDigits: 6})}</td>
              <td class="value-cell">${((coinPrices[getApiCoinId(entry.coinId)] || 0) * entry.amount).toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Notify above"
                  bind:value={entry.notifyAbove}
                  on:change={() => saveNotificationSetting(entry.coinId, entry.notifyAbove, entry.notifyBelow)}
                  style="width: 90px;"
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Notify below"
                  bind:value={entry.notifyBelow}
                  on:change={() => saveNotificationSetting(entry.coinId, entry.notifyAbove, entry.notifyBelow)}
                  style="width: 90px;"
                />
              </td>
              <td>
                <button on:click={() => removePortfolio(entry.coinId)}>Remove</button>
              </td>
            </tr>
          {/each}
          <tr class="total-row">
            <td colspan="3"><strong>Total Portfolio Value:</strong></td>
            <td class="total-value">${totalValue.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    {/if}

    {#if portfolio.length > 0}
      <div class="chart-container">
        <h3>Portfolio Distribution</h3>
        <div class="pie-chart">
          <canvas bind:this={chartCanvas}></canvas>
        </div>
      </div>
    {/if}
  {/if}
</PrivateRoute>

<style>
  :global(body), .chart-container, .pie-chart, .pie-chart canvas {
    background-color: #111 !important;
    color: #fff !important;
  }

  .chart-container {
    margin-top: 40px;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .pie-chart {
    max-width: 500px;
    margin: 0 auto;
    border-radius: 8px;
  }

  .pie-chart canvas {
    border-radius: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    background: #111;
    color: #fff;
  }

  th, td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #333;
  }

  .total-row {
    background-color: #222;
    font-weight: bold;
    color: #fff;
  }

  form {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
  }

  select, input {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #333;
    background: #222;
    color: #fff;
  }

  button, .refresh-btn {
    padding: 6px 14px;
    font-size: 0.9rem;
    background: #48bb78;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 10px;
    transition: background 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }

  .refresh-btn:hover, button:hover {
    background: #38a169;
  }

  .amount-cell {
    color: #60a5fa; /* blue-400 */
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .value-cell, .total-value {
    color: #34d399; /* emerald-400 */
    font-weight: bold;
  }
</style>