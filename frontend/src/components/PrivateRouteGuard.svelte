<script>
  import { onMount } from 'svelte';
  import { currentUser, lastVisitedRoute, token, tokenExpiry } from '../stores/generalStore.js';
  import { refreshAccessToken } from '../util/token.js';
  import { get } from 'svelte/store';

  export let redirectTo = '/login';

  onMount(async () => {
    const user = get(currentUser);
    const expiry = parseInt(get(tokenExpiry), 10);

    if (!user || !get(token) || (expiry && Date.now() >= expiry)) {
      try {
        await refreshAccessToken();
      } catch (err) {
        lastVisitedRoute.set(window.location.pathname);
        window.location.href = redirectTo;
      }
    }
  });
</script>

{#if $currentUser}
  <slot />
{/if}
