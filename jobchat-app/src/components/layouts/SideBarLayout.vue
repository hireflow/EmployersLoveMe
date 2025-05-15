<script setup>
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
// import { ref } from "vue";

const authStore = useAuthStore();
const router = useRouter();

// Sample jobs data - replace with actual data source
// const jobs = ref([]);

const onOrgChange = (e) => {
  const selected = authStore.orgs.find(org => org.id === e.target.value);
  if (selected) authStore.setSelectedOrg(selected);
};

// const createOrgAction = () => {
//   // Emit an event that the parent component can handle
//   // For Dashboard2, we'll directly toggle the form
//   router.push({ 
//     path: '/dashboard',
//     query: { action: 'createOrg' }
//   });
// };

// const deleteOrgAction = () => {
//   router.push({ 
//     path: '/dashboard',
//     query: { action: 'deleteOrg' }
//   });
// };

// const createNewJobAction = () => {
//   // Navigate to job creation form or trigger modal
//   router.push({ 
//     path: '/dashboard',
//     query: { action: 'createJob' }
//   });
// };

// const viewJobAction = (jobId) => {
//   // Navigate to job details
//   router.push(`/job/${jobId}`);
// };

const logoutAction = async () => {
  try {
    await authStore.logout();
    router.push("/login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};
</script>


<template>
  <div class="layout-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <!-- Top: Logo / User info -->
      <div class="sidebar-header">
        <img
          src="../imgs/swiftly_logo.png"
          alt="Swiftly Logo"
          class="logo"
        />
        <p class="user-email">
          Welcome, {{ authStore.user?.email }}!
        </p>
      </div>

      <!-- Middle: Nav sections -->
      <nav class="sidebar-nav">
        <!-- Organizations -->
        <div class="sidebar-section">
          <h2 class="section-title">Organizations</h2>
          <select 
            :value="authStore.selectedOrg?.id" 
            @change="onOrgChange"
            class="org-select"
          >
            <option value="">Select an organization</option>
            <option v-for="org in authStore.orgs" :key="org.id" :value="org.id">
              {{ org.companyName }}
            </option>
          </select>
        </div>      
        <!-- Navigation Links -->
        <div class="sidebar-section">
          <h2 class="section-title">Archived</h2>
        </div>
      </nav>

      <!-- Bottom: Logout -->
      <div class="sidebar-footer">
        <button @click="logoutAction" class="btn btn-logout">
          <svg xmlns="http://www.w3.org/2000/svg" class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  
    <!-- Main content -->
    <main class="main-content">
      <!-- Here goes whatever page you're rendering -->
      <slot />
    </main>
  </div>
</template>

<style>
/* Make sure the html/body and #app take the full height */
html, body, #app {
  margin: 0;
  height: 100%;
}

/* Layout Container */
.layout-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative; /* This helps with positioning absolute elements inside */
}

/* Sidebar Styles */
.sidebar {
  width: 260px;
  /* min-width: 260px; Prevent sidebar from shrinking */
  background-color: #6fcaff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  position: relative;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-nav {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  padding-bottom: 70px; /* Add padding to prevent content from being hidden behind fixed footer */
}

.sidebar-section {
  margin-bottom: 25px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  position: fixed;
  bottom: 0;
  width: 260px;
  background-color: #6fcaff;
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
  box-sizing: border-box; /* Ensures padding is included in width calculation */
  left: 0; /* Start at the left edge of viewport */
}

.logo {
  display: inline-block;
}

.user-email {
  font-size: 1rem;
  color: #ffffff;
  font-weight: 900;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
  font-weight: 600;
  margin-bottom: 12px;
}

.org-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 10px;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-block {
  display: block;
  width: 100%;
}

.job-list {
  margin-top: 12px;
  max-height: 240px;
  overflow-y: auto;
}

.job-item {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
}

.job-item:hover {
  background-color: #f0f0f0;
}

.job-title {
  font-weight: 500;
  font-size: 0.875rem;
}

.job-applicants {
  font-size: 0.75rem;
  color: #666;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-link {
  display: block;
  padding: 8px 12px;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.875rem;
}

.nav-link:hover {
  background-color: #f0f0f0;
  color: #3b82f6;
}

.nav-link-active {
  background-color: #e0f2fe;
  color: #3b82f6;
}

.btn-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.875rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.logout-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  overflow: auto;
  background-color: #f5f5f5;
}
</style>
  