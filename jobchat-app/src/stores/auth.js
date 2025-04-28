import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase.config";
import { auth } from "../firebase.config";

export const useAuthStore = defineStore("auth", () => {
  // State
  const functions = getFunctions(app);
  const user = ref(null);
  const loading = ref(true);
  const error = ref(null);
  const orgs = ref([]);
  const selectedOrg = ref(null);
  const lastSelectedOrgId = ref(null); // Keep track of last selected org

  // Computed
  const isAuthenticated = computed(() => !!user.value);
  const hasOrgs = computed(() => orgs.value.length > 0);
  const currentOrg = computed(() => selectedOrg.value);

  // Reset state to initial values
  const resetState = () => {
    user.value = null;
    orgs.value = [];
    selectedOrg.value = null;
    error.value = null;
    lastSelectedOrgId.value = null;
  };

  // Clear error state
  const clearError = () => {
    error.value = null;
  };

  const setSelectedOrg = async (org) => {
    try {
      if (!org) {
        selectedOrg.value = null;
        lastSelectedOrgId.value = null;
        return;
      }

      // Validate org exists in our list
      const foundOrg = orgs.value.find((o) => o.id === org.id);
      if (!foundOrg) {
        throw new Error(
          "Selected organization not found in user's organizations"
        );
      }

      selectedOrg.value = foundOrg;
      lastSelectedOrgId.value = foundOrg.id;

      // Could add additional org-specific initialization here if needed
    } catch (err) {
      console.error("Error setting selected organization:", err);
      error.value = err.message;
    }
  };

  const fetchUserOrgs = async (forceRefresh = false) => {
    try {
      if (!user.value?.email) {
        orgs.value = [];
        selectedOrg.value = null;
        return;
      }

      // If we already have orgs and no force refresh, skip
      if (orgs.value.length > 0 && !forceRefresh) {
        return;
      }

      const fetchUserOrgs = httpsCallable(functions, "fetchUserOrgsByEmail");
      const result = await fetchUserOrgs({
        createdByEmail: user.value.email,
      });

      // Ensure orgs is always an array
      orgs.value = result.data.success ? result.data.orgs : [];

      // Handle org selection
      if (orgs.value && orgs.value.length > 0) {
        // Try to restore last selected org
        if (lastSelectedOrgId.value) {
          const lastOrg = orgs.value.find(
            (org) => org.id === lastSelectedOrgId.value
          );
          if (lastOrg) {
            await setSelectedOrg(lastOrg);
            return;
          }
        }
        // Default to first org if no last selection
        await setSelectedOrg(orgs.value[0]);
      } else {
        await setSelectedOrg(null);
      }
    } catch (err) {
      console.error("Error fetching user orgs:", err);
      error.value = err.message;
      orgs.value = [];
      selectedOrg.value = null;
    }
  };

  const initialize = async () => {
    try {
      loading.value = true;
      error.value = null;

      // Set persistence to LOCAL
      await setPersistence(auth, browserLocalPersistence);

      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            if (firebaseUser) {
              user.value = firebaseUser;
              await fetchUserOrgs();
            } else {
              resetState();
            }
          } catch (err) {
            console.error("Error in auth state change:", err);
            error.value = err.message;
            resetState();
          } finally {
            loading.value = false;
            resolve(unsubscribe);
          }
        });
      });
    } catch (err) {
      console.error("Error initializing auth:", err);
      error.value = err.message;
      resetState();
      loading.value = false;
    }
  };

  const register = async (email, password, additionalData = {}) => {
    try {
      loading.value = true;
      error.value = null;

      const registerUser = httpsCallable(functions, "registerUser");
      const result = await registerUser({ email, password, ...additionalData });

      // Automatically sign in the user after successful registration
      await signInWithEmailAndPassword(auth, email, password);
      return result.data;
    } catch (err) {
      console.error("Error registering user:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const login = async (email, password) => {
    try {
      loading.value = true;
      error.value = null;

      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will trigger fetchUserOrgs
    } catch (err) {
      console.error("Error logging in:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      loading.value = true;
      error.value = null;

      await signOut(auth);
      resetState();
    } catch (err) {
      console.error("Error logging out:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    user,
    loading,
    error,
    orgs,
    selectedOrg,

    // Computed
    isAuthenticated,
    hasOrgs,
    currentOrg,

    // Methods
    initialize,
    register,
    login,
    logout,
    fetchUserOrgs,
    setSelectedOrg,
    clearError,
    resetState,
  };
});
