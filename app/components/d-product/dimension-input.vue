<script setup lang="ts">
import { TrashIcon } from "@heroicons/vue/16/solid"

type DimensionRange = {
  min: number
  max: number
  step: number
}

type Props = {
  label: string
  modelValue: DimensionRange | null
  unit: string
  loading?: boolean
}

const { label, modelValue, unit, loading = false } = defineProps<Props>()

const emit = defineEmits<{
  "update:modelValue": [value: DimensionRange | null]
  remove: []
}>()

function updateField(field: keyof DimensionRange, value: number) {
  if (modelValue) {
    emit("update:modelValue", { ...modelValue, [field]: value })
  }
}

function remove() {
  emit("remove")
}
</script>

<template>
  <DFormGroup>
    <DLabel>{{ label }}</DLabel>
    <div class="flex items-center gap-2">
      <DInput
        v-if="modelValue"
        type="number"
        :model-value="modelValue.min"
        @update:model-value="updateField('min', Number($event))"
        leading="Min"
        :trailing="unit"
        :step="0.1"
        :min="0"
        :disabled="loading"
      />
      <DInput
        v-if="modelValue"
        type="number"
        :model-value="modelValue.max"
        @update:model-value="updateField('max', Number($event))"
        leading="Max"
        :trailing="unit"
        :step="0.1"
        :min="0"
        :disabled="loading"
      />
      <DInput
        v-if="modelValue"
        type="number"
        :model-value="modelValue.step"
        @update:model-value="updateField('step', Number($event))"
        leading="Step"
        :trailing="unit"
        :step="0.01"
        :min="0.01"
        :disabled="loading"
      />
      <DButton
        @click="remove"
        :leading-icon="TrashIcon"
        variant="secondary"
        :disabled="loading"
      />
    </div>
  </DFormGroup>
</template>
