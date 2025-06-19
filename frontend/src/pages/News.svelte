<script>
  import { onMount } from 'svelte';
  import toast from 'svelte-french-toast';

  const coins = [
    { id: 'all', name: 'All News' },
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#00FFA3' },
    { id: 'ripple', name: 'XRP', symbol: 'XRP', color: '#23292F' },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', color: '#C2A633' },
  ];

  let news = [];
  let selectedCoin = coins[0];
  let loading = true;
  let error = null;
  let lastRefresh = null;

  $: fetchNews(selectedCoin.id);

  async function fetchNews(coinId = 'all') {
    loading = true;
    error = null;

    try {
      const response = await fetch(`http://localhost:3000/api/news?coin=${coinId}`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      news = await response.json();
      lastRefresh = new Date();
      toast.success(`Loaded ${news.length} articles`);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      error = err.message || 'Failed to load news';
      toast.error('Could not load news');
    } finally {
      loading = false;
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);

    // if its today show time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // if its yesterday show yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // otherwise show the date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
</script>

<div class="news-page">
  <header>
    <h1>Cryptocurrency News</h1>

    <div class="refresh-info">
      {#if lastRefresh}
        <span>Last updated: {formatDate(lastRefresh)}</span>
      {/if}
      <button class="refresh-btn" on:click={() => fetchNews(selectedCoin.id)} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </header>

  <div class="filter-section">
    <div class="coin-filter">
      {#each coins as coin}
        <button
          class="filter-button"
          class:active={selectedCoin.id === coin.id}
          style={coin.id !== 'all' ? `--coin-color: ${coin.color}` : ''}
          on:click={() => (selectedCoin = coin)}
        >
          {coin.id !== 'all' ? `${coin.symbol} - ` : ''}{coin.name}
        </button>
      {/each}
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading crypto news...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>{error}</p>
      <button on:click={() => fetchNews(selectedCoin.id)}>Try Again</button>
    </div>
  {:else if news.length === 0}
    <div class="empty-state">
      <p>No news articles found for {selectedCoin.name}</p>
      <button on:click={() => (selectedCoin = coins[0])}>Show All News</button>
    </div>
  {:else}
    <div class="news-grid">
      {#each news as article}
        <div class="news-card">
          <div class="news-header">
            {#if article.imageUrl}
              <div class="news-image">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  on:error={(e) => {
                    if (e.target instanceof HTMLImageElement) {
                      e.target.style.display = 'none';
                    }
                  }}
                />
              </div>
            {/if}
            <h3>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                {article.title}
              </a>
            </h3>
          </div>

          <div class="news-meta">
            <span class="news-source">{article.source}</span>
            <span class="news-date">{formatDate(article.publishedAt)}</span>
          </div>

          <p class="news-summary">
            {#if article.body && article.body.length > 200}
              {article.body.substring(0, 200)}...
            {:else}
              {article.body || 'No description available'}
            {/if}
          </p>

          {#if article.relatedCoins && article.relatedCoins.length > 0}
            <div class="news-tags">
              {#each article.relatedCoins as coinSymbol}
                <span class="tag">{coinSymbol}</span>
              {/each}
            </div>
          {/if}

          <a href={article.url} target="_blank" rel="noopener noreferrer" class="read-more"> Read more </a>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .news-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    color: white;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 10px;
  }

  h1 {
    margin: 0;
  }

  .refresh-info {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 14px;
    color: #aaa;
  }

  .refresh-btn {
    background: #333;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .refresh-btn:hover {
    background: #444;
  }

  .refresh-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .filter-section {
    margin-bottom: 20px;
  }

  .coin-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }

  .filter-button {
    padding: 8px 16px;
    background-color: #333;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-button.active {
    background-color: var(--coin-color, #48bb78);
    font-weight: bold;
    transform: scale(1.05);
  }

  .filter-button:hover:not(.active) {
    background-color: #444;
  }

  .loading,
  .error,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;
    text-align: center;
  }

  .spinner {
    border: 4px solid rgba(255, 255, 255, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: #48bb78;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .news-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .news-card {
    background-color: #1a1a1a;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .news-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }

  .news-header {
    padding: 0;
  }

  .news-image {
    height: 150px;
    overflow: hidden;
  }

  .news-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .news-card:hover .news-image img {
    transform: scale(1.05);
  }

  .news-card h3 {
    padding: 16px 16px 10px;
    margin: 0;
    font-size: 18px;
    line-height: 1.4;
  }

  .news-card a {
    color: #48bb78;
    text-decoration: none;
  }

  .news-meta {
    display: flex;
    justify-content: space-between;
    padding: 0 16px 10px;
    font-size: 12px;
    color: #888;
  }

  .news-summary {
    padding: 0 16px;
    margin: 0 0 16px;
    font-size: 14px;
    color: #ccc;
    flex-grow: 1;
    line-height: 1.6;
  }

  .news-tags {
    padding: 0 16px 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag {
    background-color: #333;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
  }

  .read-more {
    align-self: flex-end;
    padding: 8px 16px;
    margin: 0 16px 16px;
    background-color: #222;
    border-radius: 4px;
    transition: background-color 0.2s;
    text-align: center;
  }

  .read-more:hover {
    background-color: #333;
    text-decoration: underline;
  }

  @media (max-width: 600px) {
    .news-grid {
      grid-template-columns: 1fr;
    }

    header {
      flex-direction: column;
      align-items: flex-start;
    }

    .coin-filter {
      overflow-x: auto;
      padding-bottom: 10px;
      flex-wrap: nowrap;
      width: 100%;
    }

    .filter-button {
      flex: 0 0 auto;
    }
  }
</style>
