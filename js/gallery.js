// =========================================================
// GALERIA — navegação de pastas e exibição de mídias
// =========================================================

const Gallery = {
  currentFolderId: null, // null = raiz
  path: [], // trilha de pastas até a atual: [{id, name}, ...]
  folders: [],
  media: [],

  publicUrl(storagePath) {
    const { data } = sb.storage.from(SUPABASE_CONFIG.mediaBucket).getPublicUrl(storagePath);
    return data.publicUrl;
  },

  async goTo(folderId, folderName) {
    if (folderId === null) {
      this.path = [];
    } else {
      const idx = this.path.findIndex(p => p.id === folderId);
      if (idx >= 0) {
        this.path = this.path.slice(0, idx + 1);
      } else {
        this.path.push({ id: folderId, name: folderName });
      }
    }
    this.currentFolderId = folderId;
    await this.load();
  },

  async load() {
    this.setLoading(true);
    try {
      let foldersQuery = sb.from("folders").select("*").order("created_at", { ascending: true });
      foldersQuery = this.currentFolderId
        ? foldersQuery.eq("parent_id", this.currentFolderId)
        : foldersQuery.is("parent_id", null);

      const [foldersRes, mediaRes] = await Promise.all([
        foldersQuery,
        this.currentFolderId
          ? sb.from("media")
              .select("*")
              .eq("folder_id", this.currentFolderId)
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [], error: null })
      ]);

      if (foldersRes.error) throw foldersRes.error;
      if (mediaRes.error) throw mediaRes.error;

      this.folders = foldersRes.data || [];
      this.media = mediaRes.data || [];
    } catch (err) {
      console.error(err);
      showToast("Não foi possível carregar a galeria. Verifique a configuração do Supabase.", "error");
      this.folders = [];
      this.media = [];
    } finally {
      this.setLoading(false);
      this.renderBreadcrumb();
      this.render();
    }
  },

  setLoading(isLoading) {
    document.getElementById("loading-state").classList.toggle("hidden", !isLoading);
  },

  renderBreadcrumb() {
    const el = document.getElementById("breadcrumb");
    el.innerHTML = "";

    const homeBtn = document.createElement("button");
    homeBtn.className = "crumb" + (this.currentFolderId === null ? " is-active" : "");
    homeBtn.textContent = "Início";
    homeBtn.addEventListener("click", () => this.goTo(null));
    el.appendChild(homeBtn);

    this.path.forEach((p, i) => {
      const sep = document.createElement("span");
      sep.className = "crumb-sep";
      sep.textContent = "/";
      el.appendChild(sep);

      const btn = document.createElement("button");
      btn.className = "crumb" + (i === this.path.length - 1 ? " is-active" : "");
      btn.textContent = p.name;
      btn.addEventListener("click", () => this.goTo(p.id, p.name));
      el.appendChild(btn);
    });
  },

  render() {
    const folderGrid = document.getElementById("folder-grid");
    const mediaGrid = document.getElementById("media-grid");
    const emptyState = document.getElementById("grid-empty");
    const isAdmin = Auth.isAdmin;

    folderGrid.innerHTML = "";
    mediaGrid.innerHTML = "";

    this.folders.forEach(folder => {
      folderGrid.appendChild(this.renderFolderCard(folder, isAdmin));
    });

    this.media.forEach(item => {
      mediaGrid.appendChild(this.renderMediaCard(item, isAdmin));
    });

    const isEmpty = this.folders.length === 0 && this.media.length === 0;
    emptyState.classList.toggle("hidden", !isEmpty);
    if (isEmpty) {
      document.getElementById("empty-sub-text").textContent = isAdmin
        ? "Crie uma nova pasta ou adicione fotos e vídeos usando os botões acima."
        : "Ainda não há fotos ou vídeos nesta pasta.";
    }
  },

  renderFolderCard(folder, isAdmin) {
    const card = document.createElement("div");
    card.className = "folder-card";
    card.innerHTML = `
      <div class="folder-icon">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
        </svg>
      </div>
      <p class="folder-name">${escapeHtml(folder.name)}</p>
      ${isAdmin ? `
      <div class="card-admin-actions">
        <button class="icon-btn" data-action="rename-folder" title="Renomear pasta">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        </button>
        <button class="icon-btn icon-danger" data-action="delete-folder" title="Excluir pasta">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>
        </button>
      </div>` : ""}
    `;
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) return;
      this.goTo(folder.id, folder.name);
    });
    if (isAdmin) {
      card.querySelector('[data-action="rename-folder"]').addEventListener("click", (e) => {
        e.stopPropagation();
        Admin.openRenameFolder(folder);
      });
      card.querySelector('[data-action="delete-folder"]').addEventListener("click", (e) => {
        e.stopPropagation();
        Admin.confirmDeleteFolder(folder);
      });
    }
    return card;
  },

  renderMediaCard(item, isAdmin) {
    const url = this.publicUrl(item.storage_path);
    const card = document.createElement("div");
    card.className = "media-card";

    const thumb = item.type === "video"
      ? `<video class="thumb" src="${url}#t=0.5" muted preload="metadata"></video>
         <div class="video-badge"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>`
      : `<img class="thumb" src="${url}" alt="${escapeHtml(item.title)}" loading="lazy">`;

    card.innerHTML = `
      ${thumb}
      <div class="card-caption">${escapeHtml(item.title)}</div>
      ${isAdmin ? `
      <div class="card-admin-actions">
        <button class="icon-btn" data-action="edit" title="Editar">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        </button>
        <button class="icon-btn icon-danger" data-action="delete" title="Excluir">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>
        </button>
      </div>` : ""}
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) return;
      Lightbox.open(item);
    });

    if (isAdmin) {
      card.querySelector('[data-action="edit"]').addEventListener("click", (e) => {
        e.stopPropagation();
        Admin.openEdit(item);
      });
      card.querySelector('[data-action="delete"]').addEventListener("click", (e) => {
        e.stopPropagation();
        Admin.confirmDeleteMedia(item);
      });
    }

    return card;
  }
};

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
