/**
 * Authentication Store
 *
 * This store manages all authentication-related state and operations:
 * - User authentication state
 * - Organization management
 * - Login/Logout operations
 * - User registration
 */

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
  const userProfile = ref(null);
  const loading = ref(true);
  const error = ref(null);
  const orgs = ref([]);
  const selectedOrg = ref(null);
  const lastSelectedOrgId = ref(null); // Keep track of last selected org

  const getUserProfileCallable = httpsCallable(
    functions,
    "getUserProfile" // Example name for your Cloud Function
  );

  // Computed Properties
  const isAuthenticated = computed(() => !!user.value && !!userProfile.value);
  const hasOrgs = computed(() => orgs.value.length > 0);
  const currentOrg = computed(() => selectedOrg.value);

  /**
   * Resets all state to initial values
   */
  const resetState = () => {
    user.value = null;
    userProfile.value = null;
    orgs.value = [];
    selectedOrg.value = null;
    error.value = null;
    lastSelectedOrgId.value = null;
  };

  /**
   * Clears any existing error state
   */
  const clearError = () => {
    error.value = null;
  };

  const fetchUserProfile = async (uid) => {
    if (!uid) {
      userProfile.value = null;
      return;
    }
    try {
      const result = await getUserProfileCallable({ uid });
      if (result.data.success && result.data.user) {
        userProfile.value = result.data.user;
      } else {
        console.warn(
          `Hiring Manager profile not found for UID ${uid}:`,
          result.data.message || "Profile does not exist."
        );
        userProfile.value = null; // Explicitly set to null
      }
    } catch (err) {
      console.error("Error fetching Hiring Manager profile:", err);
      userProfile.value = null; // Ensure profile is null on error
    }
  };

  /**
   * Sets the currently selected organization
   * @param {Object} org - The organization to select
   */
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
    } catch (err) {
      console.error("Error setting selected organization:", err);
      error.value = err.message;
    }
  };

  /**
   * Fetches organizations associated with the current user
   * @param {boolean} forceRefresh - Whether to force a refresh of the orgs list
   */
  const fetchUserOrgs = async (forceRefresh = false) => {
    try {
      if (!isAuthenticated.value || !user.value?.uid) { // Check isAuthenticated
        orgs.value = [];
        selectedOrg.value = null;
        console.log("Cannot fetch orgs: User is not authenticated as a Hiring Manager or UID is missing.");
        return;
      }
      // If we already have orgs and no force refresh, skip
      if (orgs.value.length > 0 && !forceRefresh) {
        return;
      }
      const fetchUserOrganizations = httpsCallable(functions, "fetchUserOrgsById");
      const result = await fetchUserOrganizations({
        userId: user.value.uid,
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

  /**
   * Initializes the authentication state and sets up auth state listener
   */
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
              if (!isAuthenticated.value){
                await fetchUserProfile(user.value.uid);
              }
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

  /**
   * Registers a new user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {Object} additionalData - Additional user data
   */
  const register = async (email, password, additionalData = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const registerUser = httpsCallable(functions, "registerUser");
      const result = await registerUser({ email, password, ...additionalData });

      await signInWithEmailAndPassword(auth, email, password);

      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            user.value = firebaseUser;
            await fetchUserProfile(firebaseUser.uid);
            unsubscribe();
            resolve();
          }
        });
      });

      return result.data;
    } catch (err) {
      console.error("Error registering user:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Logs in a user
   * @param {string} email - User's email
   * @param {string} password - User's password
   */
  const login = async (email, password) => {
    try {
      loading.value = true;
      error.value = null;

      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will trigger fetchUserOrgs
      await fetchUserProfile(user.value.uid);
      if (!userProfile.value) {
        error.value = "Login failed: This account is not registered as a user or the profile is missing.";
        await signOut(auth);
        throw new Error(error.value);
      }
    } catch (err) {
      console.error("Error logging in:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Logs out the current user
   */
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
