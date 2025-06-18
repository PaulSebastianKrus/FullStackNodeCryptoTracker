<script>
  let coins = [];
  let loading = true;

  async function fetchPrices() {
    loading = true;
    const res = await fetch('http://localhost:3000/api/crypto/prices');
    coins = await res.json();
    loading = false;
  }

  fetchPrices();
</script>

<h1>Crypto Tracker</h1>
{#if loading}
  <p>Loading...</p>
{:else}
  <table class="crypto-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Price (USD)</th>
        <th>Change 24h</th>
        <th>Market Cap</th>
        <th>Volume 24h</th>
      </tr>
    </thead>
    <tbody>
      {#each coins as coin, i}
        <tr>
          <td>{i + 1}</td>
          <td style="display: flex; align-items: center; gap: 0.5rem;">
            <img src={coin.image} alt={coin.name} width="24" height="24" style="vertical-align: middle;" />
            <span style="font-weight: bold;">{coin.name}</span>
            <span style="color: #aaa;">{coin.symbol.toUpperCase()}</span>
          </td>
          <td>${coin.current_price.toLocaleString()}</td>
          <td class={coin.price_change_percentage_24h >= 0 ? 'green' : 'red'}>
            {coin.price_change_percentage_24h?.toFixed(2)}%
          </td>
          <td>${coin.market_cap.toLocaleString()}</td>
          <td>${coin.total_volume.toLocaleString()}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  h1 {
    color: #fff;
    text-align: center;
    margin-bottom: 2rem;
  }
  .crypto-table {
    width: 90%;
    margin: 0 auto;
    border-collapse: collapse;
    background: #181818;
    color: #fff;
    border-radius: 12px;
    overflow: hidden;
    font-size: 1rem;
    box-shadow: 0 2px 16px #0006;
  }
  .crypto-table th, .crypto-table td {
    padding: 1rem 0.75rem;
    text-align: left;
  }
  .crypto-table th {
    background: #222;
    font-weight: 600;
    border-bottom: 2px solid #333;
  }
  .crypto-table tr {
    border-bottom: 1px solid #222;
    transition: background 0.2s;
  }
  .crypto-table tr:hover {
    background: #232323;
  }
  .green {
    color: #16c784;
    font-weight: bold;
  }
  .red {
    color: #ea3943;
    font-weight: bold;
  }
</style>