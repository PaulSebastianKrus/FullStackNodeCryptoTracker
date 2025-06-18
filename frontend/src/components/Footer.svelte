<script>
  import { Link } from 'svelte-routing';
</script>

<footer class="footer">
  <p>
    © {new Date().getFullYear()} My Crypto App. All rights reserved.
  </p>
  <p>
    <Link to="/privacy-policy">Privacy Policy</Link> | 
    We use cookies to improve your experience. By using our site, you agree to our use of cookies and our GDPR-compliant practices.
  </p>
</footer>

<style>
  .footer {
    background: #111;
    color: #aaa;
    text-align: center;
    padding: 1rem;
    position: fixed;
    bottom: 0;
    width: 100%;
    font-size: 0.9rem;
    z-index: 100;
  }
  .footer :global(a) {
    color: #16c784;
    text-decoration: underline;
    margin: 0 0.25rem;
  }
</style>