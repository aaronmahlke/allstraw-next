<script setup lang="ts">
definePageMeta({ layout: "admin" })
</script>

<template>
  <DPageTitle title="Settings" />
  <DPageWrapper>
    <div class="flex gap-8 py-10">
      <nav class="w-48 flex-shrink-0 space-y-1">
        <DSettingsNavigationLink
          name="Carriers"
          to="/admin/settings/carriers"
        />
        <DSettingsNavigationLink
          name="Users"
          to="/admin/settings/users"
        />
      </nav>
      <div class="flex-grow">
        <NuxtPage />
      </div>
    </div>
  </DPageWrapper>
</template>
