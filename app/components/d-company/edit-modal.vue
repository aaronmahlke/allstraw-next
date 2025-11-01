<script setup lang="ts">
import type { DCompany } from "~/types/models"

interface Props {
  open: boolean
  companyId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "update:open": [value: boolean]
  "saved": [company: DCompany]
}>()

const { toast } = useToast()

const formData = ref({
  name: ""
})

const isSaving = ref(false)

const openModel = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value)
})

const { data: companiesData, refresh: refreshCompanies } = await useFetch<{ companies: DCompany[] }>("/api/companies")

watch(() => props.companyId, (companyId) => {
  if (companyId) {
    const company = companiesData.value?.companies.find((c) => c.id === companyId)
    if (company) {
      formData.value = {
        name: company.name
      }
    }
  } else {
    formData.value = {
      name: ""
    }
  }
}, { immediate: true })

function close() {
  emit("update:open", false)
}

async function save() {
  if (!props.companyId) return

  if (!formData.value.name.trim()) {
    toast.error({
      title: "Validation Error",
      description: "Company name is required"
    })
    return
  }

  isSaving.value = true

  try {
    const response = await $fetch<{ company: DCompany }>(`/api/companies/${props.companyId}`, {
      method: "PUT",
      body: { name: formData.value.name }
    })
    
    toast.success({
      title: "Company Updated",
      description: `${formData.value.name} has been updated successfully`
    })

    await refreshCompanies()
    emit("saved", response.company)
    close()
  } catch (error) {
    console.error("Error saving company:", error)
    toast.error({
      title: "Save Failed",
      description: "Failed to save company. Please try again."
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <DModal
    v-model:open="openModel"
  >
    <DModalContent>
      <DModalHeader>
        <DModalTitle>
          Edit Company
        </DModalTitle>
      </DModalHeader>

      <div class="space-y-4 p-6">
        <DFormGroup>
          <DFormLabel
            required
            name="companyName"
          >
            Company Name
          </DFormLabel>
          <DInput
            v-model="formData.name"
            placeholder="Company name"
            :disabled="isSaving"
            required
          />
        </DFormGroup>
      </div>

      <DModalFooter v-slot="{ close }">
        <DButton
          variant="secondary"
          @click="close"
        >
          Cancel
        </DButton>
        <DButton
          variant="primary"
          :disabled="isSaving"
          @click="save"
        >
          Update Company
        </DButton>
      </DModalFooter>
    </DModalContent>
  </DModal>
</template>

