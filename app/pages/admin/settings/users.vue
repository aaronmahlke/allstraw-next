<script setup lang="ts">
import { PlusIcon, TrashIcon } from "@heroicons/vue/16/solid"
import type { DUser } from "~/types/models"

definePageMeta({ layout: "admin" })

const { toast } = useToast()

const { data: users, refresh } = await useFetch<{ users: DUser[] }>("/api/users")
const { data: currentUser } = await useFetch("/api/me")

const isModalOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)
const userToDelete = ref<DUser | null>(null)

const formData = ref({
  name: "",
  surname: "",
  email: "",
  phone: "",
  role: "sales"
})

const roleOptions = [
  { label: "Sales Rep", value: "sales" },
  { label: "Admin", value: "admin" }
]

// Only show staff users (admin/sales), not customers
const staff = computed(() => users.value?.users.filter((u) => u.role !== "customer") || [])

function openCreateModal() {
  formData.value = { name: "", surname: "", email: "", phone: "", role: "sales" }
  editingId.value = null
  isModalOpen.value = true
}

function openEditModal(user: DUser) {
  formData.value = {
    name: user.name,
    surname: user.surname || "",
    email: user.email,
    phone: user.phone || "",
    role: user.role
  }
  editingId.value = user.id
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingId.value = null
  formData.value = { name: "", surname: "", email: "", phone: "", role: "sales" }
}

function openDeleteDialog(user: DUser) {
  userToDelete.value = user
  isDeleteDialogOpen.value = true
}

function closeDeleteDialog() {
  isDeleteDialogOpen.value = false
  userToDelete.value = null
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

async function saveUser() {
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
      await $fetch(`/api/users/${editingId.value}`, {
        method: "PUT",
        body: formData.value
      })
      toast.success({
        title: "User Updated",
        description: `${formData.value.name} has been updated successfully`
      })
    } else {
      await $fetch("/api/users", {
        method: "POST",
        body: formData.value
      })
      toast.success({
        title: "User Created",
        description: `${formData.value.name} has been created successfully`
      })
    }

    closeModal()
    refresh()
  } catch (error) {
    console.error("Error saving user:", error)
    toast.error({
      title: "Save Failed",
      description: "Failed to save user. Please try again."
    })
  } finally {
    isSubmitting.value = false
  }
}

async function confirmDelete() {
  if (!userToDelete.value) return

  try {
    await $fetch(`/api/users/${userToDelete.value.id}`, {
      method: "DELETE"
    })
    toast.success({
      title: "User Deleted",
      description: `${userToDelete.value.name} has been deleted successfully`
    })
    refresh()
  } catch (error) {
    console.error("Error deleting user:", error)
    toast.error({
      title: "Delete Failed",
      description: "Failed to delete user. Please try again."
    })
  } finally {
    closeDeleteDialog()
  }
}

function getRoleLabel(role: string) {
  return roleOptions.find((r) => r.value === role)?.label || role
}

async function updateUserRole(userId: string, newRole: string) {
  try {
    // Get current user data to preserve other fields
    const currentUser = staff.value.find((u) => u.id === userId)
    if (!currentUser) return

    await $fetch(`/api/users/${userId}`, {
      method: "PUT",
      body: {
        name: currentUser.name,
        surname: currentUser.surname,
        email: currentUser.email,
        phone: currentUser.phone,
        role: newRole
      }
    })
    toast.success({
      title: "Role Updated",
      description: "User role has been updated successfully"
    })
    refresh()
  } catch (error) {
    console.error("Error updating role:", error)
    toast.error({
      title: "Update Failed",
      description: "Failed to update user role. Please try again."
    })
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-title-sm text-neutral-strong">User Management</h2>
        <p class="text-copy text-neutral-subtle mt-1">
          Manage sales representatives and administrators
        </p>
      </div>
      <DButton
        :icon-left="PlusIcon"
        @click="openCreateModal"
      >
        Add User
      </DButton>
    </div>

    <DList v-if="staff.length > 0">
      <DListItem
        v-for="user in staff"
        :key="user.id"
      >
        <div class="flex w-full items-center justify-between">
          <div>
            <h3 class="text-copy-lg text-neutral-strong">{{ user.name }} {{ user.surname }}</h3>
            <div class="text-copy-sm text-neutral-subtle flex items-center gap-4">
              <p>{{ user.email }}</p>
              <p v-if="user.phone">{{ user.phone }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <DCombobox
              v-if="user.id !== currentUser?.id"
              :model-value="user.role"
              @update:model-value="updateUserRole(user.id, $event)"
              :items="roleOptions"
              size="sm"
            />
            <span
              v-else
              class="text-copy text-neutral-subtle px-4"
            >
              {{ getRoleLabel(user.role) }}
            </span>
            <DButton
              variant="secondary"
              @click="openEditModal(user)"
            >
              Edit
            </DButton>
            <DButton
              v-if="user.id !== currentUser?.id"
              variant="transparent"
              :leading-icon="TrashIcon"
              @click="openDeleteDialog(user)"
            ></DButton>
          </div>
        </div>
      </DListItem>
    </DList>

    <DEmpty
      v-else
      title="No staff users yet"
      description="Create your first sales representative or admin user"
    >
      <DButton @click="openCreateModal">Add User</DButton>
    </DEmpty>

    <DModal
      :key="`user-modal-${editingId || 'new'}`"
      :open="isModalOpen"
      :title="editingId ? 'Edit User' : 'Add New User'"
      :confirmText="editingId ? 'Update User' : 'Create User'"
      @close="closeModal"
      @confirm="saveUser"
    >
      <div class="space-y-4 p-6">
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
      :title="`Delete ${userToDelete?.name}`"
      description="Are you sure you want to delete this user? This action cannot be undone."
      confirm-text="Delete"
      danger
      @close="closeDeleteDialog"
      @confirm="confirmDelete"
    />
  </div>
</template>
