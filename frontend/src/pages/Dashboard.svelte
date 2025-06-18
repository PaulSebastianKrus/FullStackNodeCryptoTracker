<script>
  import PrivateRoute from '../components/PrivateRouteGuard.svelte';
  import { currentUser } from '../stores/generalStore.js';
  import { onMount } from 'svelte';
  import toast from 'svelte-french-toast'; 
  
  let coinId = '';
  let userId;
  let userCoins = [];
  let coinData = [];
  let loading = false;

  $: userId = $currentUser?.id;

  async function addCoin() {
    try {
      const response = await fetch('http://localhost:3000/api/coins/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, coinId }),
      });
      const data = await response.json();
      
      toast.success(data.message);
      
      coinId = '';
      await fetchUserCoins();
    } catch (error) {
      console.error('Error adding coin:', error);
      toast.error('Failed to add coin'); 
    }
  }

  async function removeCoin(coinId) {
    try {
      await fetch(`http://localhost:3000/api/coins/remove?userId=${userId}&coinId=${encodeURIComponent(coinId)}`, {
        method: 'DELETE',
      });
      toast.success('Coin removed successfully');
      await fetchUserCoins();
    } catch (error) {
      console.error('Error removing coin:', error);
      toast.error('Failed to remove coin');
    }
  }

  
  let originalIdMap = {};

  async function fetchUserCoins() {
    if (!userId) return;
    try {
      const response = await fetch(`http://localhost:3000/api/coins/${userId}`);
      userCoins = await response.json();

      // Store the original coin IDs in a map for easy lookup later
      originalIdMap = {};
      for (const coin of userCoins) {
        originalIdMap[coin.coinId.toLowerCase()] = coin.coinId;
      }

      await fetchCoinData();
    } catch (error) {
      console.error('Error fetching user coins:', error);
    }
  }

  async function fetchCoinData() {
    if (!userCoins.length) {
      coinData = [];
      return;
    }
    loading = true;
    // Build a comma-separated list of coin IDs
    const ids = userCoins.map(c => c.coinId).join(',');
    try {
      const res = await fetch(`http://localhost:3000/api/crypto/user-prices?ids=${ids}`);
      coinData = await res.json();
    } catch (error) {
      console.error('Error fetching coin data:', error);
      coinData = [];
    }
    loading = false;
  }

  
  $: if (userId) fetchUserCoins();
</script>

<PrivateRoute redirectTo="/login">
  <main>
    <h1>Welcome, {$currentUser.username}!</h1>
    <h1>Dashboard</h1>
    <p>Manage your crypto coins below:</p>

    <form on:submit|preventDefault={addCoin}>
      <input type="text" bind:value={coinId} placeholder="Enter Coin ID (e.g., bitcoin)" />
      <button type="submit">Add Coin</button>
    </form>

    <h2>Your Coins:</h2>
    {#if loading}
      <p>Loading...</p>
    {:else if coinData.length === 0}
      <p>No coins added yet.</p>
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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {#each coinData as coin, i}
            <tr>
              <td>{i + 1}</td>
              <td style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: bold;">{coin.name}</span>
                <span style="color: #aaa;">{coin.symbol.toUpperCase()}</span>
              </td>
              <td>${coin.price?.toLocaleString()}</td>
              <td>
                {#if coin.change_24h !== undefined}
                  <span class={coin.change_24h >= 0 ? "green" : "red"}>
                    {coin.change_24h >= 0 ? "+" : ""}{coin.change_24h?.toFixed(2)}%
                  </span>
                {:else}
                  N/A
                {/if}
              </td>
              <td>
                Rank: {coin.rank}
              </td>
              <td>
                {#if coin.volume_24h !== undefined}
                  ${coin.volume_24h?.toLocaleString()}
                {:else}
                  N/A
                {/if}
              </td>
              <td>
                <button on:click={() => removeCoin(originalIdMap[coin.id.toLowerCase()] || coin.id)}>Remove</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </main>
</PrivateRoute>

<svelte:head>
  <style>
    :root {
      --toastBackground: #48bb78;
      --toastColor: white;
      --toastErrorBackground: #f56565;
    }
  </style>
</svelte:head>

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
  button {
    background: #ea3943;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    font-weight: bold;
  }
  button:hover {
    background: #c82333;
  }
</style>
