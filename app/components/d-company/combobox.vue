<script setup lang="ts">
import type { DCompany } from "~/types/models"

interface Props {
  modelValue?: string | null
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Select or create company...",
  disabled: false
})

const emit = defineEmits<{
  "update:modelValue": [value: string | null]
}>()

const { toast } = useToast()

const companyOptions = ref<{ label: string; value: string }[]>([
  { label: "No company", value: "NONE" }
])
const allCompanies = ref<DCompany[]>([])
const isCreatingCompany = ref(false)
const pendingCompanyName = ref("")

const modelValue = computed({
  get: () => props.modelValue === null ? "NONE" : props.modelValue,
  set: (value) => emit("update:modelValue", value === "NONE" ? null : value)
})

async function loadCompanies() {
  try {
    const { companies } = await $fetch<{ companies: DCompany[] }>("/api/companies")
    allCompanies.value = companies
    companyOptions.value = [
      { label: "No company", value: "NONE" },
      ...companies.map((company) => ({
        label: company.name,
        value: company.id
      }))
    ]
  } catch (error) {
    console.error("Error loading companies:", error)
  }
}

function getCompanyOptionsForSearch(searchTerm: string = "") {
  const baseOptions = [
    { label: "No company", value: "NONE" },
    ...allCompanies.value.map((company) => ({
      label: company.name,
      value: company.id
    }))
  ]

  // Add "Create company" option if search term doesn't match any existing company
  if (
    searchTerm.trim() &&
    !allCompanies.value.find((c) => c.name.toLowerCase() === searchTerm.toLowerCase())
  ) {
    pendingCompanyName.value = searchTerm
    baseOptions.push({
      label: `Create "${searchTerm}"`,
      value: "CREATE_NEW"
    })
  }

  return baseOptions
}

async function handleCompanySelection(value: string) {
  if (value === "CREATE_NEW" && pendingCompanyName.value) {
    await createCompany(pendingCompanyName.value)
  } else {
    modelValue.value = value
  }
}

async function createCompany(companyName: string) {
  isCreatingCompany.value = true
  try {
    const response = await $fetch("/api/companies", {
      method: "POST",
      body: { name: companyName }
    })

    // Add new company to options and select it
    const newCompany = response.company
    modelValue.value = newCompany.id

    // Refresh company options
    await loadCompanies()

    toast.success({
      title: "Company Created",
      description: `${companyName} has been created successfully`
    })
  } catch (error) {
    console.error("Error creating company:", error)
    toast.error({
      title: "Creation Failed",
      description: "Failed to create company. Please try again."
    })
  } finally {
    isCreatingCompany.value = false
  }
}

function filterCompanies(items: any[], term: string) {
  const options = getCompanyOptionsForSearch(term)
  const filtered = options.filter(
    (item) =>
      item.label.toLowerCase().includes(term.toLowerCase()) &&
      item.value !== "CREATE_NEW"
  )

  // Only show create option if no companies match
  const hasMatches = filtered.some((item) => item.value !== "NONE")
  if (!hasMatches && options.find((item) => item.value === "CREATE_NEW")) {
    filtered.push(options.find((item) => item.value === "CREATE_NEW")!)
  }

  return filtered
}

// Load companies on mount
onMounted(() => {
  loadCompanies()
})
</script>

<template>
  <div>
    <DCombobox
      :model-value="modelValue"
      @update:model-value="handleCompanySelection"
      :items="companyOptions"
      :placeholder="placeholder"
      :filter-function="filterCompanies"
      :disabled="disabled"
    />
    <p
      v-if="isCreatingCompany"
      class="text-neutral-subtle mt-1 text-xs"
    >
      Creating company...
    </p>
  </div>
</template>
