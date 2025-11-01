<script setup lang="ts">
const mainNavigation = [
  { name: "Products", to: "/admin/products" },
  { name: "Settings", to: "/admin/settings/carriers" }
]
</script>

<template>
  <div class="flex h-full max-h-screen flex-col">
    <DPageHeader :navigation="mainNavigation" />
    <main class="flex flex-1 flex-col overflow-scroll">
      <slot></slot>
    </main>
  </div>
</template>
