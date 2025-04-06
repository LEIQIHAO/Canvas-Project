<script setup>
// App根组件
</script>

<template>
  <div class="app-container">
    <header>
      <div class="logo">
        <img src="./assets/vue.svg" alt="Vue logo" class="logo-img" />
        <h1>Vue 3 + Vite 项目</h1>
      </div>
      <nav>
        <router-link to="/"> 首页 </router-link> |
        <router-link to="/about"> 关于 </router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <p>© {{ new Date().getFullYear() }} Vue 3 + Vite 项目</p>
    </footer>
  </div>
</template>

<style>
.app-container {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: #f8f8f8;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 3rem;
  margin-right: 1rem;
}

nav {
  padding: 1rem;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  margin: 0 0.5rem;
}

nav a.router-link-exact-active {
  color: #42b883;
}

main {
  flex-grow: 1;
  padding: 1rem;
}

footer {
  background-color: #f8f8f8;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
  color: #666;
}
</style>
