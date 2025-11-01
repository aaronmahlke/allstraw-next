<script setup lang="ts">
import type { DCompositeProduct } from "~/types/models"

type Props = {
  modelValue: DCompositeProduct
}
const props = defineProps<Props>()

const emit = defineEmits(["update:modelValue"])
function updateProduct(key: keyof DCompositeProduct, value: any) {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Dimensions Section -->
    <div class="border-neutral bg-neutral rounded-lg border p-4">
      <DProductDimensions
        :width="modelValue.width"
        :height="modelValue.height"
        :depth="modelValue.depth"
        @update:width="(value) => updateProduct('width', value)"
        @update:height="(value) => updateProduct('height', value)"
        @update:depth="(value) => updateProduct('depth', value)"
        :unit="modelValue.baseUnit || 'cm'"
      />
    </div>

    <!-- Variants Section -->
    <div class="border-neutral bg-neutral rounded-lg border p-4">
      <DProductOptionsVariants
        :options="modelValue.options"
        :variants="modelValue.variants"
        @update="
          (options, variants) =>
            emit('update:modelValue', {
              ...modelValue,
              options,
              variants
            })
        "
      />
    </div>
  </div>
</template>
