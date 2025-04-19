import { defineStore } from "pinia";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase.config";

export const useOrganizationStore = defineStore("organization", {
  state: () => ({
    userOrganizations: [],
    selectedOrganizationId: null,
    selectedOrganizationIndex: 0,
  }),

  getters: {
    selectedOrganization: (state) =>
      state.userOrganizations.find(
        (org) => org.id === state.selectedOrganizationId
      ),
  },

  actions: {
    async fetchUserOrganizations(userId) {
      try {
        // For now, using mock data structure
        // TODO: Replace with actual Firestore fetch
        const mockOrgs = [
          {
            id: 1,
            currentPlan: "Pro",
            name: "Organization 1",
            config_done: false,
            jobs: [
              {
                id: "swe-1ab2",
                name: "Software Engineer",
                applications: [],
              },
            ],
          },
        ];

        this.userOrganizations = mockOrgs;
        if (mockOrgs.length > 0) {
          this.selectedOrganizationId = mockOrgs[0].id;
          this.selectedOrganizationIndex = 0;
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
        throw error;
      }
    },

    setSelectedOrganization(id, index) {
      this.selectedOrganizationId = id;
      this.selectedOrganizationIndex = index;
    },

    async createOrganization(orgData) {
      try {
        // TODO: Replace with actual Firestore create
        const newOrg = {
          id: Date.now(), // Temporary ID generation
          ...orgData,
          currentPlan: "Free",
          config_done: false,
          jobs: [],
        };

        this.userOrganizations.push(newOrg);
        return newOrg;
      } catch (error) {
        console.error("Error creating organization:", error);
        throw error;
      }
    },
  },
});
