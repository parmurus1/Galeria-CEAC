// =========================================================
// APP — inicialização e ligação dos elementos da interface
// =========================================================

const ModalUI = {
  open(id) { document.getElementById(id).classList.remove("hidden"); },
  close(id) { document.getElementById(id).classList.add("hidden"); }
};

document.querySelectorAll("[data-close-modal]").forEach(btn => {
  btn.addEventListener("click", () => ModalUI.close(btn.dataset.closeModal));
});
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });
});

// ---------- Login ----------
document.getElementById("btn-login").addEventListener("click", () => ModalUI.open("modal-login"));
document.getElementById("btn-logout").addEventListener("click", () => Auth.logout());

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  const submitBtn = document.getElementById("login-submit");
  errorEl.classList.add("hidden");
  submitBtn.disabled = true;
  submitBtn.textContent = "Entrando…";
  try {
    await Auth.login(email, password);
    ModalUI.close("modal-login");
    e.target.reset();
    showToast("Login realizado. Modo admin ativado.");
  } catch (err) {
    errorEl.textContent = "E-mail ou senha inválidos.";
    errorEl.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
  }
});

// ---------- Nova pasta ----------
document.getElementById("btn-new-folder").addEventListener("click", () => {
  Admin.renamingFolder = null;
  document.getElementById("modal-folder-title").textContent = "Nova pasta";
  document.getElementById("folder-submit").textContent = "Criar pasta";
  document.getElementById("folder-name").value = "";
  document.getElementById("folder-error").classList.add("hidden");
  ModalUI.open("modal-folder");
});

document.getElementById("form-folder").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("folder-name").value.trim();
  const errorEl = document.getElementById("folder-error");
  if (!name) return;
  try {
    if (Admin.renamingFolder) {
      await Admin.renameFolder(Admin.renamingFolder.id, name);
      Admin.renamingFolder = null;
    } else {
      await Admin.createFolder(name);
    }
    ModalUI.close("modal-folder");
    e.target.reset();
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Não foi possível salvar a pasta. Tente novamente.";
    errorEl.classList.remove("hidden");
  }
});

// ---------- Upload ----------
document.getElementById("btn-upload").addEventListener("click", () => {
  document.getElementById("form-upload").reset();
  document.getElementById("upload-list").innerHTML = "";
  document.getElementById("upload-error").classList.add("hidden");
  ModalUI.open("modal-upload");
});

document.getElementById("upload-files").addEventListener("change", (e) => {
  if (e.target.files.length) Admin.buildUploadList(e.target.files);
});

document.getElementById("form-upload").addEventListener("submit", async (e) => {
  e.preventDefault();
  const files = document.getElementById("upload-files").files;
  const errorEl = document.getElementById("upload-error");
  const submitBtn = document.getElementById("upload-submit");
  if (!files.length) return;
  errorEl.classList.add("hidden");
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando…";
  try {
    await Admin.uploadFiles(files);
    ModalUI.close("modal-upload");
    e.target.reset();
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Falha no envio. Verifique sua conexão e tente novamente.";
    errorEl.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar";
  }
});

// ---------- Editar ----------
document.getElementById("form-edit").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("edit-title").value.trim();
  const file = document.getElementById("edit-file").files[0] || null;
  const errorEl = document.getElementById("edit-error");
  if (!title) return;
  try {
    await Admin.saveEdit(title, file);
    ModalUI.close("modal-edit");
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Não foi possível salvar as alterações.";
    errorEl.classList.remove("hidden");
  }
});

// ---------- Excluir ----------
document.getElementById("confirm-delete-btn").addEventListener("click", () => Admin.executeDelete());

// ---------- Logo / início ----------
document.querySelector("[data-nav-home]").addEventListener("click", (e) => {
  e.preventDefault();
  Gallery.goTo(null);
});

// ---------- Inicialização ----------
(async function init() {
  await Auth.init();
  await Gallery.load();
})();
