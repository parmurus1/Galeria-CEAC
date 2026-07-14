// =========================================================
// ADMIN — criar pastas, enviar mídia, editar e excluir
// =========================================================

const Admin = {
  pendingDelete: null, // { type: 'folder'|'media', target }
  editingItem: null,
  renamingFolder: null, // folder being renamed, or null when creating a new one

  async createFolder(name) {
    const { error } = await sb.from("folders").insert({
      name,
      parent_id: Gallery.currentFolderId,
      created_by: Auth.session?.user?.id ?? null
    });
    if (error) throw error;
    showToast("Pasta criada com sucesso.");
    await Gallery.load();
  },

  openRenameFolder(folder) {
    this.renamingFolder = folder;
    document.getElementById("modal-folder-title").textContent = "Renomear pasta";
    document.getElementById("folder-submit").textContent = "Salvar";
    document.getElementById("folder-name").value = folder.name;
    document.getElementById("folder-error").classList.add("hidden");
    ModalUI.open("modal-folder");
  },

  async renameFolder(id, newName) {
    const { error } = await sb.from("folders").update({ name: newName }).eq("id", id);
    if (error) throw error;
    showToast("Pasta renomeada com sucesso.");
    // atualiza o nome na trilha (breadcrumb) se a pasta atual estiver aberta
    const crumb = Gallery.path.find(p => p.id === id);
    if (crumb) crumb.name = newName;
    await Gallery.load();
  },

  // -------- Upload --------
  buildUploadList(files) {
    const list = document.getElementById("upload-list");
    list.innerHTML = "";
    Array.from(files).forEach((file, i) => {
      const row = document.createElement("div");
      row.className = "upload-item";
      const isImage = file.type.startsWith("image/");
      const preview = isImage
        ? `<img src="${URL.createObjectURL(file)}" alt="">`
        : `<div class="file-placeholder"></div>`;
      const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
      row.innerHTML = `
        ${preview}
        <input type="text" data-file-index="${i}" value="${escapeHtml(defaultTitle)}" placeholder="Título" required>
      `;
      list.appendChild(row);
    });
  },

  async uploadFiles(files) {
    const titleInputs = document.querySelectorAll('#upload-list input[data-file-index]');
    const progressWrap = document.getElementById("upload-progress");
    const progressBar = document.getElementById("upload-progress-bar");
    progressWrap.classList.remove("hidden");

    const total = files.length;
    let done = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const title = titleInputs[i]?.value?.trim() || file.name;
      const type = file.type.startsWith("video/") ? "video" : "image";
      const ext = file.name.split(".").pop();
      const path = `${Gallery.currentFolderId || "raiz"}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await sb.storage
        .from(SUPABASE_CONFIG.mediaBucket)
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { error: dbError } = await sb.from("media").insert({
        folder_id: Gallery.currentFolderId,
        title,
        type,
        storage_path: path,
        created_by: Auth.session?.user?.id ?? null
      });
      if (dbError) throw dbError;

      done++;
      progressBar.style.width = `${Math.round((done / total) * 100)}%`;
    }

    progressWrap.classList.add("hidden");
    progressBar.style.width = "0%";
    showToast(total > 1 ? "Itens enviados com sucesso." : "Item enviado com sucesso.");
    await Gallery.load();
  },

  // -------- Edit --------
  openEdit(item) {
    this.editingItem = item;
    document.getElementById("edit-title").value = item.title;
    document.getElementById("edit-file").value = "";
    document.getElementById("edit-error").classList.add("hidden");
    ModalUI.open("modal-edit");
  },

  async saveEdit(newTitle, newFile) {
    const item = this.editingItem;
    if (!item) return;

    let updates = { title: newTitle };

    if (newFile) {
      const ext = newFile.name.split(".").pop();
      const newPath = `${item.folder_id || "raiz"}/${crypto.randomUUID()}.${ext}`;
      const newType = newFile.type.startsWith("video/") ? "video" : "image";

      const { error: uploadError } = await sb.storage
        .from(SUPABASE_CONFIG.mediaBucket)
        .upload(newPath, newFile, { upsert: false });
      if (uploadError) throw uploadError;

      // remove o arquivo antigo do storage
      await sb.storage.from(SUPABASE_CONFIG.mediaBucket).remove([item.storage_path]);

      updates.storage_path = newPath;
      updates.type = newType;
    }

    const { error } = await sb.from("media").update(updates).eq("id", item.id);
    if (error) throw error;

    showToast("Item atualizado com sucesso.");
    this.editingItem = null;
    await Gallery.load();
  },

  // -------- Delete --------
  confirmDeleteMedia(item) {
    this.pendingDelete = { type: "media", target: item };
    document.getElementById("delete-target-name").textContent =
      `Tem certeza que deseja excluir "${item.title}"? Esta ação não pode ser desfeita.`;
    ModalUI.open("modal-delete");
  },

  confirmDeleteFolder(folder) {
    this.pendingDelete = { type: "folder", target: folder };
    document.getElementById("delete-target-name").textContent =
      `Tem certeza que deseja excluir a pasta "${folder.name}"? Todo o conteúdo dentro dela também será excluído. Esta ação não pode ser desfeita.`;
    ModalUI.open("modal-delete");
  },

  async executeDelete() {
    if (!this.pendingDelete) return;
    const { type, target } = this.pendingDelete;

    try {
      if (type === "media") {
        await sb.storage.from(SUPABASE_CONFIG.mediaBucket).remove([target.storage_path]);
        const { error } = await sb.from("media").delete().eq("id", target.id);
        if (error) throw error;
        showToast("Item excluído.");
      } else {
        // Exclui recursivamente mídias e subpastas (a policy de cascade cuida das linhas,
        // mas os arquivos no Storage precisam ser removidos manualmente).
        await this.deleteFolderRecursive(target.id);
        showToast("Pasta excluída.");
      }
      this.pendingDelete = null;
      ModalUI.close("modal-delete");
      await Gallery.load();
    } catch (err) {
      console.error(err);
      showToast("Não foi possível excluir. Tente novamente.", "error");
    }
  },

  async deleteFolderRecursive(folderId) {
    // Apaga mídias diretas
    const { data: mediaItems } = await sb.from("media").select("*").eq("folder_id", folderId);
    if (mediaItems?.length) {
      await sb.storage.from(SUPABASE_CONFIG.mediaBucket).remove(mediaItems.map(m => m.storage_path));
    }
    // Apaga subpastas recursivamente
    const { data: subFolders } = await sb.from("folders").select("id").eq("parent_id", folderId);
    for (const sub of subFolders || []) {
      await this.deleteFolderRecursive(sub.id);
    }
    // Apaga a pasta (cascade remove media/subpastas nas linhas do banco)
    await sb.from("folders").delete().eq("id", folderId);
  }
};
