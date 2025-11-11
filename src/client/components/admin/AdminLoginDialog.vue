<template>
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card>
      <v-card-title class="bg-primary text-center">
        <v-icon icon="mdi-shield-account" size="x-large" class="mb-2"></v-icon>
        <div>Admin Login</div>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </v-alert>

        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="username"
            label="Username"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :disabled="loading"
            autofocus
          ></v-text-field>

          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            :disabled="loading"
          ></v-text-field>

          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            <small>Default credentials: admin / admin</small>
          </v-alert>

          <div class="d-flex gap-2">
            <v-btn
              type="submit"
              color="primary"
              :loading="loading"
              block
            >
              Login
            </v-btn>
            <v-btn
              color="secondary"
              variant="outlined"
              @click="handleCancel"
              :disabled="loading"
            >
              Cancel
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { authService } from '../../services/auth.service';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'login-success': [];
}>();

const isOpen = ref(props.modelValue);
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal;
  if (newVal) {
    // Reset form when dialog opens
    username.value = '';
    password.value = '';
    error.value = '';
  }
});

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal);
});

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const result = await authService.login(username.value, password.value);

    if (result.success) {
      emit('login-success');
      isOpen.value = false;
    } else {
      error.value = result.message || 'Login failed';
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = 'An unexpected error occurred';
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  isOpen.value = false;
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
