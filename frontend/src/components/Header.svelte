<script>
  import { Link } from 'svelte-routing';
  import { currentUser, logout } from '../stores/generalStore.js';
</script>

<nav>
  {#if $currentUser}
    <Link to="/dashboard">Dashboard</Link>
    <Link to="/crypto">CryptoTracker</Link> 
    <Link to="/chart">CryptoChart</Link>
    <Link to="/portfolio">Portfolio</Link>  
    <Link to="/notifications">Notification</Link> 
    <Link to="/news">News</Link> 
            
    <button on:click={logout} style="margin-left: auto;">Logout</button>
  {/if}
</nav>

<style>
  nav {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0;
    padding: 1rem 2rem;
    background: #111; 
    position: fixed;
    top: 0;
    left: 0;
    box-sizing: border-box;
    z-index: 100;
  }
  
  :global(nav a),
  :global(nav .link) {
    text-decoration: none;
    color: #48bb78; 
  }
  
  :global(nav a:hover),
  :global(nav .link:hover) {
    text-decoration: underline;
    color: #5fcf8d; 
  }
  
  button {
    background: none;
    border: none;
    color: #48bb78; 
    cursor: pointer;
    text-decoration: underline;
  }
  
  button:hover {
    color: #5fcf8d; 
  }
</style>