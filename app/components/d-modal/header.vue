<script setup lang="ts">
import { DialogClose } from "reka-ui"
import { XMarkIcon } from "@heroicons/vue/16/solid"
</script>

<template>
  <div class="flex items-start justify-between p-5">
    <div>
      <slot />
    </div>
    <DialogClose asChild>
      <DButton
        variant="transparent"
        size="sm"
        :leading-icon="XMarkIcon"
      />
    </DialogClose>
  </div>
</template>

