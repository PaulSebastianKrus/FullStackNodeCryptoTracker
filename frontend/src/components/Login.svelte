<script>
  import toast from 'svelte-french-toast';
  import { login, signup } from '../util/fetch.js';
  import { currentUser, lastVisitedRoute } from '../stores/generalStore.js';
  import { get } from 'svelte/store';

  let isLoginMode = true;
  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';

  async function handleSubmit() {
    if (!isLoginMode && password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    try {
      const response = isLoginMode ? await login(email, password) : await signup(username, email, password);

      if (isLoginMode) {
        currentUser.set(response.user);
        toast.success('Welcome back!');
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000); 
      } else {
        toast.success('Account created! Please log in.');
        resetForm();
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred.');
    }
  }

  function resetForm() {
    isLoginMode = true;
    username = '';
    email = '';
    password = '';
    confirmPassword = '';
  }

  function toggleMode() {
    isLoginMode = !isLoginMode;
  }
</script>

<div class="login-center">
  <main>
    <h1>{isLoginMode ? 'Login' : 'Sign Up'}</h1>
    <form on:submit|preventDefault={handleSubmit}>
      {#if !isLoginMode}
        <div>
          <label for="username">Username:</label>
          <input id="username" type="text" bind:value={username} required />
        </div>
      {/if}
      <div>
        <label for="email">Email:</label>
        <input id="email" type="email" bind:value={email} required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input id="password" type="password" bind:value={password} required />
      </div>
      {#if !isLoginMode}
        <div>
          <label for="confirmPassword">Confirm Password:</label>
          <input id="confirmPassword" type="password" bind:value={confirmPassword} required />
        </div>
      {/if}
      <button type="submit">{isLoginMode ? 'Login' : 'Sign Up'}</button>
    </form>
    <p>
      {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
      <button on:click={toggleMode} style="color: blue; text-decoration: underline; background: none; border: none; cursor: pointer;">
        {isLoginMode ? 'Sign Up' : 'Login'}
      </button>
    </p>
  </main>
</div>

<style>
  .login-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh; 
  }
  main {
    max-width: 400px;
    margin: 0 auto;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #222;
    color: #fff;
  }
  label {
    display: block;
    margin-bottom: 0.5rem;
  }
  input {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #333;
    color: #fff;
  }
  button {
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:hover {
    background-color: #0056b3;
  }
</style>
