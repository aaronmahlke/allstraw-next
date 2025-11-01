<script setup lang="ts">
import { PlusIcon, TrashIcon, EditIcon } from "lucide-vue-next"
import type { DCarrier } from "~/types/models"

definePageMeta({ layout: "admin" })

const { toast } = useToast()

// Fetch carriers
const { data: carriers, refresh } = await useFetch<{ carriers: DCarrier[] }>("/api/carriers")

// Modal state
const isModalOpen = ref(false)
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)

const formData = ref({
  name: "",
  basePrice: null as number | null
})

const basePriceEur = computed({
  get: () => (formData.value.basePrice ? formData.value.basePrice / 100 : undefined),
  set: (value) => {
    formData.value.basePrice = value ? Math.round(Number(value) * 100) : 0
  }
})

function openCreateModal() {
  formData.value = { name: "", basePrice: 0 }
  editingId.value = null
  isModalOpen.value = true
}

function openEditModal(carrier: DCarrier) {
  formData.value = {
    name: carrier.name,
    basePrice: carrier.basePrice
  }
  editingId.value = carrier.id
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingId.value = null
  formData.value = { name: "", basePrice: 0 }
}

function validateForm() {
  const errors: string[] = []

  if (!formData.value.name.trim()) {
    errors.push("Carrier name is required")
  }

  if (formData.value.basePrice < 0) {
    errors.push("Base price must be 0 or greater")
  }

  return errors
}

async function saveCarrier() {
  const errors = validateForm()

  if (errors.length > 0) {
    toast.error({
      title: "Validation Error",
      description: errors[0]
    })
    return
  }

  isSubmitting.value = true

  try {
    if (editingId.value) {
      // Update existing carrier
      await $fetch(`/api/carriers/${editingId.value}`, {
        method: "PUT",
        body: formData.value
      })
      toast.success({
        title: "Carrier Updated",
        description: `${formData.value.name} has been updated successfully`
      })
    } else {
      // Create new carrier
      await $fetch("/api/carriers", {
        method: "POST",
        body: formData.value
      })
      toast.success({
        title: "Carrier Created",
        description: `${formData.value.name} has been created successfully`
      })
    }

    closeModal()
    refresh()
  } catch (error) {
    console.error("Error saving carrier:", error)
    toast.error({
      title: "Save Failed",
      description: "Failed to save carrier. Please try again."
    })
  } finally {
    isSubmitting.value = false
  }
}

async function deleteCarrier(carrier: DCarrier) {
  if (!confirm(`Are you sure you want to delete ${carrier.name}?`)) {
    return
  }

  try {
    await $fetch(`/api/carriers/${carrier.id}`, {
      method: "DELETE"
    })
    toast.success({
      title: "Carrier Deleted",
      description: `${carrier.name} has been deleted successfully`
    })
    refresh()
  } catch (error) {
    console.error("Error deleting carrier:", error)
    toast.error({
      title: "Delete Failed",
      description: "Failed to delete carrier. Please try again."
    })
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-title-sm text-neutral-strong">Shipping Carriers</h2>
        <p class="text-copy text-neutral-subtle mt-1">
          Manage shipping providers and their base pricing
        </p>
      </div>
      <DButton
        :icon-left="PlusIcon"
        @click="openCreateModal"
      >
        Add Carrier
      </DButton>
    </div>

    <!-- Carriers List -->
    <div
      v-if="carriers?.carriers && carriers.carriers.length > 0"
      class="space-y-3"
    >
      <div
        v-for="carrier in carriers.carriers"
        :key="carrier.id"
        class="border-neutral bg-surface flex items-center justify-between rounded-lg border p-4"
      >
        <div>
          <h3 class="text-copy-lg text-neutral-strong font-medium">
            {{ carrier.name }}
          </h3>
          <p class="text-copy-sm text-neutral-subtle">
            Base price: €{{ (carrier.basePrice / 100).toFixed(2) }}
          </p>
        </div>

        <div class="flex gap-2">
          <DButton
            variant="secondary"
            :icon-left="EditIcon"
            @click="openEditModal(carrier)"
          >
            Edit
          </DButton>
          <DButton
            variant="secondary"
            :icon-left="TrashIcon"
            @click="deleteCarrier(carrier)"
          >
            Delete
          </DButton>
        </div>
      </div>
    </div>

    <DEmpty
      v-else
      title="No carriers yet"
      description="Create your first shipping carrier to get started"
    >
      <DButton @click="openCreateModal">Add Carrier</DButton>
    </DEmpty>

    <!-- Create/Edit Modal -->
    <DModal
      :open="isModalOpen"
      :title="editingId ? 'Edit Carrier' : 'Add New Carrier'"
      :confirmText="editingId ? 'Update Carrier' : 'Create Carrier'"
      @close="closeModal"
      @confirm="saveCarrier"
    >
      <div class="space-y-4 p-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DFormGroup>
            <DFormLabel
              required
              name="name"
            >
              Carrier Name
            </DFormLabel>
            <DInput
              v-model="formData.name"
              placeholder="e.g., DHL Express"
              :disabled="isSubmitting"
              required
            />
          </DFormGroup>

          <DFormGroup>
            <DFormLabel
              required
              name="basePrice"
            >
              Base Price
            </DFormLabel>
            <DInput
              type="number"
              v-model="basePriceEur"
              placeholder="0.00"
              :step="0.01"
              :min="0"
              :disabled="isSubmitting"
              leading="€"
            />
          </DFormGroup>
        </div>
      </div>
    </DModal>
  </div>
</template>
