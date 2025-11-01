<script setup lang="ts">
import { EditIcon, PlusIcon, TrashIcon } from "lucide-vue-next"
import { uuidv7 } from "uuidv7"
import type { DCompositeOption, DProductOptionValue } from "~/types/models"

const props = defineProps<{
  options: DCompositeOption[]
}>()

const emit = defineEmits(["update:options"])

const editingOptionId = ref<string | null>(null)
const optionNameInput = ref<HTMLInputElement | null>(null)

function updateOption(option: DCompositeOption, field: string, value: any) {
  const updatedOptions = props.options.map((o) =>
    o.id === option.id ? { ...o, [field]: value } : o
  )
  emit("update:options", updatedOptions)
}

function removeOption(option: DCompositeOption) {
  emit(
    "update:options",
    props.options.filter((o) => o.id !== option.id)
  )
  editingOptionId.value = null
}

function updateOptionValue(option: DCompositeOption, value: DProductOptionValue, newValue: string) {
  const updatedOptions = props.options.map((o) => {
    if (o.id === option.id) {
      return {
        ...o,
        values: o.values.map((v) => (v.id === value.id ? { ...v, value: newValue } : v))
      }
    }
    return o
  })
  emit("update:options", updatedOptions)
}

function removeOptionValue(option: DCompositeOption, value: DProductOptionValue) {
  const updatedOptions = props.options.map((o) => {
    if (o.id === option.id) {
      return {
        ...o,
        values: o.values.filter((v) => v.id !== value.id)
      }
    }
    return o
  })
  emit("update:options", updatedOptions)
}

function addOptionValue(option: DCompositeOption) {
  const updatedOptions = props.options.map((o) => {
    if (o.id === option.id) {
      return {
        ...o,
        values: [
          ...o.values,
          {
            id: uuidv7(),
            optionId: option.id,
            value: ""
          }
        ]
      }
    }
    return o
  })
  emit("update:options", updatedOptions)
}

function addOption() {
  const newOption: DCompositeOption = {
    id: uuidv7(),
    name: "",
    type: "select",
    values: [],
    minValue: "",
    maxValue: "",
    unit: "",
    priceEffect: "none",
    dimensionGroup: null
  }

  emit("update:options", [...props.options, newOption])
  editingOptionId.value = newOption.id

  // Focus the name input after the DOM updates
  nextTick(() => {
    optionNameInput.value?.focus()
  })
}

// Watch for clicks outside of edit mode
const isClickOutsideEnabled = ref(true)
onClickOutside(optionNameInput, () => {
  if (isClickOutsideEnabled.value && editingOptionId.value) {
    editingOptionId.value = null
  }
})
</script>

<template>
  <div class="space-y-4">
    <DList>
      <DListItem
        v-if="options.length > 0"
        v-for="option in options"
        :key="option.id"
        :hover="editingOptionId !== option.id"
        @click="editingOptionId !== option.id && (editingOptionId = option.id)"
        class="items-center"
      >
        <!-- View Mode -->
        <div
          v-if="editingOptionId !== option.id"
          class="w-full"
        >
          <div
            v-if="option.name"
            class="font-medium"
          >
            {{ option.name }}
          </div>
          <div
            class="text-neutral-weak font-medium"
            v-else
          >
            Unnamed
          </div>
          <div
            class="mt-1 flex flex-wrap gap-2"
            v-if="option.values.length > 0"
          >
            <span
              v-for="value in option.values"
              :key="value.id"
              class="bg-neutral-strong text-copy-sm rounded px-2 py-0.5"
            >
              <span v-if="value.value">
                {{ value.value }}
              </span>
              <span
                v-else
                class="text-neutral-weak"
              >
                Unnamed
              </span>
            </span>
          </div>
        </div>

        <!-- Edit Mode -->
        <div
          v-else
          class="w-full space-y-4"
          @click.stop
        >
          <DFormGroup>
            <DLabel>Option Name</DLabel>
            <DInput
              ref="optionNameInput"
              v-model="option.name"
              placeholder="Option name"
              @update:modelValue="updateOption(option, 'name', $event)"
            />
          </DFormGroup>

          <div class="space-y-2">
            <DFormGroup class="items-start">
              <DLabel>Option values</DLabel>
              <div
                v-for="value in option.values"
                :key="value.id"
                class="flex w-full items-center gap-2"
              >
                <DInput
                  :modelValue="value.value"
                  placeholder="Option value"
                  @update:modelValue="updateOptionValue(option, value, $event)"
                  class="flex-grow"
                />
                <DButton
                  variant="secondary"
                  @click.stop="removeOptionValue(option, value)"
                  :icon-left="TrashIcon"
                ></DButton>
              </div>

              <DButton
                variant="secondary"
                :icon-left="PlusIcon"
                @click.stop="addOptionValue(option)"
              >
                Add value
              </DButton>
            </DFormGroup>
          </div>

          <div class="flex justify-between pt-2">
            <DButton
              variant="danger-light"
              @click.stop="removeOption(option)"
            >
              Delete
            </DButton>
            <DButton
              variant="secondary"
              @click.stop="editingOptionId = null"
            >
              Done
            </DButton>
          </div>
        </div>
      </DListItem>
      <DListItem
        :padding="false"
        :min-height="false"
        class="text-neutral text-copy flex cursor-pointer items-center gap-2 px-4 py-2"
        @click="addOption"
      >
        <PlusIcon class="text-neutral-subtle size-4" />
        <span>Add option</span>
      </DListItem>
    </DList>
  </div>
</template>
