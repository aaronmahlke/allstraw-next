<script setup lang="ts">
import { PlusIcon, TrashIcon } from "lucide-vue-next"

type Range = {
  min: number
  max: number
  step: number
}

type Props = {
  width: Range | null
  height: Range | null
  depth: Range | null
  unit: string
}

const { unit } = defineProps<Props>()
const emit = defineEmits(["update:width", "update:height", "update:depth"])

function addWidth() {
  emit("update:width", { min: 0, max: 100, step: 1 })
}

function addHeight() {
  emit("update:height", { min: 0, max: 100, step: 1 })
}

function addDepth() {
  emit("update:depth", { min: 0, max: 100, step: 1 })
}
</script>

<template>
  <div class="space-y-2">
    <h3 class="text-neutral text-copy-lg font-medium">Dimensions</h3>

    <div>
      <DFormGroup v-if="width !== null">
        <DLabel>Width</DLabel>
        <div class="flex items-center gap-2">
          <DInput
            v-if="width"
            v-model="width.min"
            leading="Min"
            :trailing="unit"
          />
          <DInput
            v-if="width"
            v-model="width.max"
            leading="Max"
            :trailing="unit"
          />
          <DInput
            v-if="width"
            v-model="width.step"
            leading="Step"
            :trailing="unit"
          />

          <DButton
            @click="emit('update:width', null)"
            :icon-left="TrashIcon"
            variant="secondary"
          />
        </div>
      </DFormGroup>
    </div>

    <div>
      <DFormGroup v-if="height !== null">
        <DLabel>Height</DLabel>
        <div class="flex items-center gap-2">
          <DInput
            v-if="height"
            v-model="height.min"
            leading="Min"
            :trailing="unit"
          />
          <DInput
            v-if="height"
            v-model="height.max"
            leading="Max"
            :trailing="unit"
          />
          <DInput
            v-if="height"
            v-model="height.step"
            leading="Step"
            :trailing="unit"
          />
          <DButton
            @click="emit('update:height', null)"
            :icon-left="TrashIcon"
            variant="secondary"
          />
        </div>
      </DFormGroup>
    </div>
    <div>
      <DFormGroup v-if="depth !== null">
        <DLabel>Depth</DLabel>
        <div class="flex items-center gap-2">
          <DInput
            v-if="depth"
            v-model="depth.min"
            leading="Min"
            :trailing="unit"
          />
          <DInput
            v-if="depth"
            v-model="depth.max"
            leading="Max"
            :trailing="unit"
          />
          <DInput
            v-if="depth"
            v-model="depth.step"
            leading="Step"
            :trailing="unit"
          />
          <DButton
            @click="emit('update:depth', null)"
            :icon-left="TrashIcon"
            variant="secondary"
          />
        </div>
      </DFormGroup>
    </div>
    <div class="flex items-center gap-2">
      <DButton
        v-if="width === null"
        @click="addWidth"
        variant="secondary"
        :icon-left="PlusIcon"
      >
        Add width
      </DButton>
      <DButton
        v-if="height === null"
        @click="addHeight"
        :icon-left="PlusIcon"
        variant="secondary"
      >
        Add height
      </DButton>
      <DButton
        v-if="depth === null"
        @click="addDepth"
        variant="secondary"
        :icon-left="PlusIcon"
      >
        Add depth
      </DButton>
    </div>
  </div>
</template>
