<template>
  <div>
    <div v-if="showSidebar" class="sidebar-overlay" @click="toggleSidebar">
      <div class="sidebar" @click.stop>
        <ul>
          <li><a href="#">Dashboard</a></li>
          <li><a href="#">Profile</a></li>
          <li><a href="#">Settings</a></li>
        </ul>

        <div class="sidebar-footer">
          <button @click="logoutAction" class="logout-button">
            <svg xmlns="http://www.w3.org/2000/svg" class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>

    <div class="top-bar">
      <div class="nav-icon" @click="toggleSidebar">☰</div>
      <div class="logo-container">
        <img src="../imgs/swiftly_logo.png" alt="Logo" class="logo" />
        <span class="logo-text">Swiftly</span>
      </div>
    </div>

    <div class="dashboard-container">
      <div class="dashboard-header">
        <h2>Completed Applications</h2>
        <div class="controls">
          <input v-model="searchQuery" type="text" placeholder="Search" class="search-input" />
          <select v-model="sortOrder" class="sort-dropdown">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

        <table class="application-table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Company</th>
              <th>Job Posted</th>
              <th>Country</th>
              <th>Status</th>
              <th>Report</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in paginatedApplications" :key="app.id">
              <td>{{ app.jobTitle }}</td>
              <td>{{ app.companyName }}</td>
              <td>{{ app.jobPosted }}</td>
              <td>{{ app.country }}</td>
              <td>
                <span :class="['status-tag', app.status === 'Active' ? 'active' : 'inactive']">
                  {{ app.status }}
                </span>
              </td>
              <td>
                <a href="#" class="report-link">View Report <i class="icon-report"></i></a>
              </td>
            </tr>
          </tbody>
        </table>

      <div v-if="totalApplications > itemsPerPage" class="pagination">
        <button @click="currentPage--" :disabled="currentPage === 1">‹</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="currentPage++" :disabled="currentPage === totalPages">›</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";

const totalApplications = computed(() => applications.value.length);
const showSidebar = ref(false)
const authStore = useAuthStore();
const router = useRouter();


const logoutAction = async () => {
  try {
    await authStore.logout();
    router.push("/candidate-login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

const applications = ref([
  { id: 1, jobTitle: 'rpi pub safe officer', companyName: 'Microsoft', jobPosted: '2024-01-01', country: 'india', status: 'Active' },
  { id: 2, jobTitle: 'quant intern', companyName: 'Yahoo', jobPosted: '2024-01-03', country: 'jewish country', status: 'Active' },
  { id: 3, jobTitle: 'Hirebird SWE Intern', companyName: 'Adobe', jobPosted: '2024-01-04', country: 'mountains', status: 'Active' },
  { id: 4, jobTitle: 'Sipsmrt Intern', companyName: 'Tesla', jobPosted: '2024-01-06', country: 'mexico', status: 'Active' },
  { id: 5, jobTitle: 'Financial analyst', companyName: 'Google', jobPosted: '2024-01-07', country: 'nepali town', status: 'Active' },
  { id: 6, jobTitle: 'Comedian', companyName: 'Microsoft', jobPosted: '2024-01-08', country: 'portugal', status: 'Active' },
  { id: 7, jobTitle: 'Actor', companyName: 'Yahoo', jobPosted: '2024-01-09', country: 'Madagascar', status: 'Active' },
  { id: 8, jobTitle: 'NBA player', companyName: 'Facebook', jobPosted: '2024-01-10', country: 'USA', status: 'Inactive' },
  { id: 9, jobTitle: 'Actor', companyName: 'Yahoo', jobPosted: '2024-01-09', country: 'Madagascar', status: 'Active' },
  { id: 10, jobTitle: 'NBA player', companyName: 'Facebook', jobPosted: '2024-01-10', country: 'USA', status: 'Inactive' },
  { id: 11, jobTitle: 'rpi pub safe officer', companyName: 'Microsoft', jobPosted: '2024-01-01', country: 'india', status: 'Active' },
  { id: 12, jobTitle: 'quant intern', companyName: 'Yahoo', jobPosted: '2024-01-03', country: 'jewish country', status: 'Active' },
  { id: 13, jobTitle: 'Hirebird SWE Intern', companyName: 'Adobe', jobPosted: '2024-01-04', country: 'mountains', status: 'Active' },
  { id: 14, jobTitle: 'Sipsmrt Intern', companyName: 'Tesla', jobPosted: '2024-01-06', country: 'mexico', status: 'Active' },
  { id: 15, jobTitle: 'Financial analyst', companyName: 'Google', jobPosted: '2024-01-07', country: 'nepali town', status: 'Active' },
  { id: 16, jobTitle: 'Comedian', companyName: 'Microsoft', jobPosted: '2024-01-08', country: 'portugal', status: 'Active' },
  { id: 17, jobTitle: 'Actor', companyName: 'Yahoo', jobPosted: '2024-01-09', country: 'Madagascar', status: 'Active' },
  { id: 18, jobTitle: 'NBA player', companyName: 'Facebook', jobPosted: '2024-01-10', country: 'USA', status: 'Inactive' },
  { id: 19, jobTitle: 'Actor', companyName: 'Yahoo', jobPosted: '2024-01-09', country: 'Madagascar', status: 'Active' },
  { id: 20, jobTitle: 'NBA player', companyName: 'Facebook', jobPosted: '2024-01-10', country: 'USA', status: 'Inactive' },
  { id: 21, jobTitle: 'Actor', companyName: 'Yahoo', jobPosted: '2024-01-09', country: 'Madagascar', status: 'Active' },
  { id: 22, jobTitle: 'NBA player', companyName: 'Facebook', jobPosted: '2024-01-10', country: 'USA', status: 'Inactive' },
]);

const searchQuery = ref('');
const sortOrder = ref('newest');
const currentPage = ref(1);
const itemsPerPage = 20;

function toggleSidebar() {
  showSidebar.value = !showSidebar.value
}

const filteredApplications = computed(() => {
  return applications.value.filter(app =>
    app.jobTitle.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    app.companyName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const sortedApplications = computed(() => {
  const sorted = [...filteredApplications.value];
  return sorted.sort((a, b) => {
    const aDate = new Date(a.jobPosted);
    const bDate = new Date(b.jobPosted);
    return sortOrder.value === 'newest' ? bDate - aDate : aDate - bDate;
  });
});

const totalPages = computed(() => Math.ceil(sortedApplications.value.length / itemsPerPage));

const paginatedApplications = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return sortedApplications.value.slice(start, start + itemsPerPage);
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: sans-serif;
}

.top-bar {
  width: 100%;
  background-color: #6FCAFF;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  height: 60px;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.logo {
  height: 32px;
  object-fit: contain;
}

.sidebar-overlay {
  position: fixed;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  z-index: 99;
}

.sidebar {
  position: fixed;
  top: 60px; 
  left: 0;
  height: calc(100% - 60px);
  width: 250px;
  background-color: #6FCAFF;
  color: white;
  padding: 20px;
  transition: transform 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar ul li {
  margin-bottom: 16px;
}

.sidebar ul li a {
  color: white;
  text-decoration: none;
  font-weight: 500;
}

.sidebar ul li a:hover {
  text-decoration: underline;
}

.sidebar-footer {
  width: 100%;
}

.logout-wrapper {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
}

.logout-button {
  width: 100%;
  padding: 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #A4DDFF;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.logout-button:hover {
  background-color: #90D4FF;
}

.logout-icon {
  width: 20px;
  height: 20px;
  stroke: white;
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

.logout-button:hover {
  background-color: #90D4FF;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); 
}

.logout-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.dashboard-container {
  padding: 2rem;
  padding-top: 80px;
  font-family: sans-serif;
  background-color: #f9f9fc;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.controls {
  display: flex;
  gap: 1rem;
}

.search-input {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.sort-dropdown {
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.application-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

.application-table th,
.application-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.status-tag {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.status-tag.active {
  background-color: #e6f8f1;
  color: #2e8c5e;
}

.status-tag.inactive {
  background-color: #fff4d6;
  color: #d09100;
}

.report-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
}

.pagination button {
  background: #f0f0f5;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}
</style>
