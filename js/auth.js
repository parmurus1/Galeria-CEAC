// =========================================================
// AUTENTICAÇÃO
// Apenas administradores têm conta (criada manualmente no
// painel do Supabase). Não existe cadastro público.
// =========================================================

const Auth = {
  session: null,

  get isAdmin() {
    return !!this.session;
  },

  async init() {
    const { data } = await sb.auth.getSession();
    this.session = data.session;
    this.updateUI();

    sb.auth.onAuthStateChange((_event, session) => {
      this.session = session;
      this.updateUI();
    });
  },

  updateUI() {
    const isAdmin = this.isAdmin;
    document.getElementById("btn-login").classList.toggle("hidden", isAdmin);
    document.getElementById("btn-logout").classList.toggle("hidden", !isAdmin);
    document.getElementById("admin-badge").classList.toggle("hidden", !isAdmin);
    document.getElementById("admin-controls").classList.toggle("hidden", !isAdmin);
    document.querySelectorAll(".admin-only").forEach(el => el.classList.toggle("hidden", !isAdmin));
    // Re-render current view so admin action buttons appear/disappear on cards
    if (window.Gallery) Gallery.render();
  },

  async login(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async logout() {
    await sb.auth.signOut();
    showToast("Você saiu da área de administração.");
  }
};
