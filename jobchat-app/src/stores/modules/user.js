

export default {
  namespaced: true,
  state: {
    // initial state
    currentUser: null,
    isAuthenticated: false,
  },
  mutations: {
    SET_CURRENT_USER(state, user) {
      state.currentUser = user;
      state.isAuthenticated = !!user;
    },
  },
  actions: {
    login({ commit }, ) {},
    signup({commit}, ) {},
  }, // actions call mutators using
};
