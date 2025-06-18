<script>
  import { onMount } from 'svelte'; 
  import { Router, Link, Route, navigate } from 'svelte-routing';
  import { Toaster } from 'svelte-french-toast'; 
  import { currentUser, logout, tokenExpiry } from './stores/generalStore.js'; 
  import { refreshAccessToken } from './util/token.js';
  import { get } from 'svelte/store';
  import Login from './components/Login.svelte';
  import Dashboard from './pages/Dashboard.svelte'; 
  import Header from './components/Header.svelte';
  import CryptoTracker from './pages/CryptoTracker.svelte';
  import CryptoChart from './pages/CryptoChart.svelte';
  import PrivacyPolicy from './pages/PrivacyPolicy.svelte'; 
  import Portfolio from './pages/Portfolio.svelte';
  import Notifications from './pages/Notifications.svelte'
  import News from './pages/News.svelte'
  import Footer from './components/Footer.svelte';
  export let url = ''; 

  // refresh token on user interaction
  const handleUserAction = async () => {
    const expiry = parseInt(get(tokenExpiry), 10);
    if (expiry && Date.now() >= expiry - 60000) {
      try {
        await refreshAccessToken();
      } catch (err) {
        console.error('Failed to refresh token:', err);
        logout(); 
        window.location.href = '/login';
      }
    }
  };

  onMount(() => {
   
    if (window.location.pathname === '/') {
      navigate('/login');
    }

    
    document.body.addEventListener('click', handleUserAction);
    document.body.addEventListener('keydown', handleUserAction);
    return () => {
      document.body.removeEventListener('click', handleUserAction);
      document.body.removeEventListener('keydown', handleUserAction);
    };
  });
</script>

<Router {url}>
  <Header />
  <div class="content-container">
    <Route path="/login" exact>
      <Login />
    </Route>
    <Route path="/dashboard">
      <Dashboard />
    </Route>
    <Route path="/crypto">
      <CryptoTracker />
    </Route>
    <Route path="/chart">
      <CryptoChart />
    </Route>
    <Route path="/privacy-policy">
      <PrivacyPolicy />
    </Route>
    <Route path="/portfolio">
      <Portfolio />
    </Route>
    <Route path="/notifications">
      <Notifications />
    </Route>
    <Route path="/news">
      <News />
    </Route>
  </div>
  <Footer />
</Router>


<Toaster />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #222;
    min-height: 100vh;
  }
  
  .content-container {
    padding-top: 60px;
    padding-bottom: 80px; 
  }

  :global(.footer) {
    background: #111; 
    color: #aaa; 
    text-align: center; 
    padding: 1rem;
    position: fixed;
    bottom: 0;
    left: 50%; 
    transform: translateX(-50%); 
    width: 100%;
    font-size: 0.9rem;
    z-index: 100;
  }

  :global(.footer a) {
    color: #16c784;
    text-decoration: underline;
    margin: 0 0.25rem;
  }
</style>
