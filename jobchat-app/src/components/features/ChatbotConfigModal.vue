<template>
  <div class="modal-overlay" v-if="show">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Configure Chatbot</h2>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>

      <form @submit.prevent="$emit('submit', formData)" class="form-grid">
        <div class="form-group">
          <label>Chatbot Settings</label>
          <textarea
            v-model="formData.welcomeMessage"
            placeholder="Welcome Message"
            required
          ></textarea>
          <select v-model="formData.interviewStyle" required>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="technical">Technical</option>
          </select>
          <input
            type="number"
            v-model="formData.maxQuestions"
            placeholder="Maximum Questions"
            min="1"
            max="20"
            required
          />
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="cancel-button">
            Cancel
          </button>
          <button type="submit" class="submit-button">Save Settings</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  job: {
    type: Object,
    required: true,
  },
});

const formData = ref({
  welcomeMessage: "",
  interviewStyle: "professional",
  maxQuestions: 5,
});

watch(
  () => props.job,
  (newJob) => {
    if (newJob.chatbotSettings) {
      formData.value = { ...newJob.chatbotSettings };
    }
  },
  { deep: true }
);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  font-weight: bold;
  color: #333;
}

input,
textarea,
select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.submit-button,
.cancel-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button {
  background-color: #4caf50;
  color: white;
}

.submit-button:hover {
  background-color: #45a049;
}

.cancel-button {
  background-color: #f44336;
  color: white;
}

.cancel-button:hover {
  background-color: #da190b;
}
</style>
