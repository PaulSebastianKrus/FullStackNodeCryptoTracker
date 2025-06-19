<script>
  import { onMount } from 'svelte';
  import { currentUser } from '../stores/generalStore.js';
  import toast from 'svelte-french-toast';
  import PrivateRoute from '../components/PrivateRouteGuard.svelte';

  let notifications = [];
  let loading = false;
  let error = null;

  $: userId = $currentUser?.id;

  $: if (userId) {
    fetchNotifications();
  }

  async function fetchNotifications() {
    if (!userId) return;

    loading = true;
    error = null;
    try {
      console.log('Fetching notifications for user:', userId);
      const res = await fetch(`http://localhost:3000/api/portfolio/notifications?userId=${userId}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch notifications: ${res.status}`);
      }

      notifications = await res.json();
      console.log('Notifications received:', notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      error = 'Failed to load notifications';
      toast.error('Failed to load notifications');
    } finally {
      loading = false;
    }
  }

  async function deleteNotification(id) {
    try {
      const res = await fetch(`http://localhost:3000/api/portfolio/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');

      notifications = notifications.filter((n) => n.id !== id);
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  }
</script>

<PrivateRoute redirectTo="/login">
  <div class="container">
    <h2>Your Notifications</h2>

    {#if loading}
      <p>Loading notifications...</p>
    {:else if error}
      <p>Error: {error}</p>
      <button on:click={fetchNotifications}>Try Again</button>
    {:else if notifications.length === 0}
      <p>No notifications</p>
      <button on:click={fetchNotifications}>Refresh</button>
    {:else}
      <button on:click={fetchNotifications}>Refresh</button>
      <ul class="notification-list">
        {#each notifications as n}
          <li class="notification-item">
            <div class="notification-content">
              <strong>{n.coinId}</strong>
              {#if n.type === 'above'}
                <span class="above">rose above ${parseFloat(n.threshold).toFixed(4)}</span>
              {:else}
                <span class="below">fell below ${parseFloat(n.threshold).toFixed(4)}</span>
              {/if}
              <span class="price-info">(Current: ${parseFloat(n.price).toFixed(4)})</span>
            </div>
            <button class="delete-btn" on:click={() => deleteNotification(n.id)}>Delete</button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</PrivateRoute>

<style>
  .container {
    padding: 20px;
    background: #111;
    color: #fff;
  }

  h2 {
    margin-bottom: 20px;
  }

  .notification-list {
    list-style-type: none;
    padding: 0;
  }

  .notification-item {
    background: #222;
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .notification-content {
    flex: 1;
  }

  .delete-btn {
    background-color: #e53e3e;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
  }

  .delete-btn:hover {
    background-color: #c53030;
  }

  .price-info {
    color: #48bb78;
    font-weight: bold;
  }

  .above {
    color: #48bb78; /* Green for price above */
  }

  .below {
    color: #f56565; /* Red for price below */
  }
</style>
