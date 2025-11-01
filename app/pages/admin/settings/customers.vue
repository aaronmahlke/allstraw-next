<script setup lang="ts">
import { PlusIcon, TrashIcon } from "@heroicons/vue/16/solid"
import type { DUser, DCompany } from "~/types/models"

definePageMeta({ layout: "admin" })

const { toast } = useToast()

const { data: customers, refresh } = await useFetch<{ customers: DUser[] }>("/api/customers")
const { data: companiesData } = await useFetch<{ companies: DCompany[] }>("/api/companies")

const companiesMap = computed(() => {
  const map = new Map<string, string>()
  if (companiesData.value?.companies) {
    companiesData.value.companies.forEach((company) => {
      map.set(company.id, company.name)
    })
  }
  return map
})

// Only show customer users (already filtered on backend)
const customerList = computed(() => customers.value?.customers || [])

const isModalOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)
const customerToDelete = ref<DUser | null>(null)

const formData = ref({
  name: "",
  surname: "",
  email: "",
  phone: "",
  role: "customer",
  companyId: null
})

function openCreateModal() {
  formData.value = {
    name: "",
    surname: "",
    email: "",
    phone: "",
    role: "customer",
    companyId: null
  }
  editingId.value = null
  isModalOpen.value = true
}

function openEditModal(customer: DUser) {
  formData.value = {
    name: customer.name,
    surname: customer.surname || "",
    email: customer.email,
    phone: customer.phone || "",
    role: customer.role,
    companyId: customer.companyId
  }
  editingId.value = customer.id
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingId.value = null
  formData.value = {
    name: "",
    surname: "",
    email: "",
    phone: "",
    role: "customer",
    companyId: null
  }
}

function openDeleteDialog(customer: DUser) {
  customerToDelete.value = customer
  isDeleteDialogOpen.value = true
}

function closeDeleteDialog() {
  isDeleteDialogOpen.value = false
  customerToDelete.value = null
}

function validateForm() {
  const errors: string[] = []

  if (!formData.value.name.trim()) {
    errors.push("Name is required")
  }

  if (!formData.value.email.trim()) {
    errors.push("Email is required")
  }

  return errors
}

async function saveCustomer() {
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
    const userData = {
      name: formData.value.name,
      surname: formData.value.surname,
      email: formData.value.email,
      phone: formData.value.phone,
      role: formData.value.role,
      companyId: formData.value.companyId
    }

    if (editingId.value) {
      await $fetch(`/api/customers/${editingId.value}`, {
        method: "PUT",
        body: userData
      })
      toast.success({
        title: "Customer Updated",
        description: `${formData.value.name} has been updated successfully`
      })
    } else {
      await $fetch("/api/customers", {
        method: "POST",
        body: userData
      })
      toast.success({
        title: "Customer Created",
        description: `${formData.value.name} has been created successfully`
      })
    }

    closeModal()
    refresh()
  } catch (error) {
    console.error("Error saving customer:", error)
    toast.error({
      title: "Save Failed",
      description: "Failed to save customer. Please try again."
    })
  } finally {
    isSubmitting.value = false
  }
}

async function confirmDelete() {
  if (!customerToDelete.value) return

  try {
    await $fetch(`/api/customers/${customerToDelete.value.id}`, {
      method: "DELETE"
    })
    toast.success({
      title: "Customer Deleted",
      description: `${customerToDelete.value.name} has been deleted successfully`
    })
    refresh()
  } catch (error) {
    console.error("Error deleting customer:", error)
    toast.error({
      title: "Delete Failed",
      description: "Failed to delete customer. Please try again."
    })
  } finally {
    closeDeleteDialog()
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-title-sm text-neutral-strong">Customer Management</h2>
        <p class="text-copy text-neutral-subtle mt-1">
          Manage your customers and their information
        </p>
      </div>
      <DButton
        :icon-left="PlusIcon"
        @click="openCreateModal"
      >
        Add Customer
      </DButton>
    </div>

    <DList v-if="customerList.length > 0">
      <DListItem
        v-for="customer in customerList"
        :key="customer.id"
      >
        <div class="flex w-full items-center justify-between">
          <div>
            <h3 class="text-copy-lg text-neutral-strong">
              {{ customer.name }} {{ customer.surname }}
            </h3>
            <div class="text-copy-sm text-neutral-subtle flex items-center gap-4">
              <p>{{ customer.email }}</p>
              <p v-if="customer.phone">{{ customer.phone }}</p>
              <p
                v-if="customer.companyId"
                class="text-blue-600"
              >
                {{ companiesMap.get(customer.companyId) || "Unknown Company" }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <DButton
              variant="secondary"
              @click="openEditModal(customer)"
            >
              Edit
            </DButton>
            <DButton
              variant="transparent"
              :leading-icon="TrashIcon"
              @click="openDeleteDialog(customer)"
            ></DButton>
          </div>
        </div>
      </DListItem>
    </DList>

    <DEmpty
      v-else
      title="No customers yet"
      description="Create your first customer to get started"
    >
      <DButton @click="openCreateModal">Add Customer</DButton>
    </DEmpty>

    <DModal
      :key="`customer-modal-${editingId || 'new'}`"
      :open="isModalOpen"
      :title="editingId ? 'Edit Customer' : 'Add New Customer'"
      :confirmText="editingId ? 'Update Customer' : 'Create Customer'"
      @close="closeModal"
      @confirm="saveCustomer"
    >
      <div class="space-y-4 p-6">
        <DFormGroup>
          <DFormLabel name="company">Company</DFormLabel>
          <DCompanyCombobox
            v-model="formData.companyId"
            :disabled="isSubmitting"
          />
        </DFormGroup>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DFormGroup>
            <DFormLabel
              required
              name="name"
            >
              First Name
            </DFormLabel>
            <DInput
              v-model="formData.name"
              placeholder="John"
              :disabled="isSubmitting"
              required
            />
          </DFormGroup>

          <DFormGroup>
            <DFormLabel name="surname">Last Name</DFormLabel>
            <DInput
              v-model="formData.surname"
              placeholder="Doe"
              :disabled="isSubmitting"
            />
          </DFormGroup>
        </div>

        <DFormGroup>
          <DFormLabel
            required
            name="email"
          >
            Email
          </DFormLabel>
          <DInput
            v-model="formData.email"
            type="email"
            placeholder="john.doe@example.com"
            :disabled="isSubmitting"
            required
          />
        </DFormGroup>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DFormGroup>
            <DFormLabel name="phone">Phone</DFormLabel>
            <DInput
              v-model="formData.phone"
              placeholder="+1 234 567 8900"
              :disabled="isSubmitting"
            />
          </DFormGroup>
        </div>
      </div>
    </DModal>

    <DDialog
      :open="isDeleteDialogOpen"
      :title="`Delete ${customerToDelete?.name}`"
      description="Are you sure you want to delete this customer? This action cannot be undone."
      confirm-text="Delete"
      danger
      @close="closeDeleteDialog"
      @confirm="confirmDelete"
    />
  </div>
</template>
