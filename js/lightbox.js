// =========================================================
// LIGHTBOX — visualização em destaque + download
// =========================================================

const Lightbox = {
  currentItem: null,

  open(item) {
    this.currentItem = item;
    const url = Gallery.publicUrl(item.storage_path);
    const mediaEl = document.getElementById("lightbox-media");

    mediaEl.innerHTML = item.type === "video"
      ? `<video src="${url}" controls autoplay></video>`
      : `<img src="${url}" alt="${escapeHtml(item.title)}">`;

    document.getElementById("lightbox-title").textContent = item.title;

    const downloadBtn = document.getElementById("lightbox-download");
    downloadBtn.href = url;
    downloadBtn.setAttribute("download", item.title);
    downloadBtn.dataset.url = url;

    const editBtn = document.getElementById("lightbox-edit");
    const deleteBtn = document.getElementById("lightbox-delete");
    editBtn.onclick = () => { this.close(); Admin.openEdit(item); };
    deleteBtn.onclick = () => { this.close(); Admin.confirmDeleteMedia(item); };

    document.getElementById("lightbox").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  },

  close() {
    document.getElementById("lightbox").classList.add("hidden");
    document.getElementById("lightbox-media").innerHTML = "";
    document.body.style.overflow = "";
    this.currentItem = null;
  }
};

document.getElementById("lightbox-close").addEventListener("click", () => Lightbox.close());
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") Lightbox.close();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") Lightbox.close();
});

// Download: em desktop e Android baixa direto (link temporário), sem abrir
// nova aba nem menus. No iPhone/iPad, o Safari não suporta forçar esse
// download direto para o app Fotos — por isso ali usamos o menu nativo de
// compartilhar, de onde a pessoa escolhe "Guardar imagem" / "Guardar vídeo".
function isAppleTouchDevice() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  // iPadOS recente se identifica como "Macintosh" mas tem suporte a toque
  const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return isIOS || isIPadOS;
}

document.getElementById("lightbox-download").addEventListener("click", async (e) => {
  e.preventDefault();
  const btn = e.currentTarget;
  const item = Lightbox.currentItem;
  const url = btn.dataset.url;
  if (!item || !url) return;

  const originalLabel = btn.innerHTML;
  btn.style.pointerEvents = "none";
  btn.textContent = "Preparando…";

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Falha ao buscar o arquivo");
    const blob = await response.blob();

    const ext = (item.storage_path.split(".").pop() || "").split("?")[0];
    const safeTitle = item.title.replace(/[\\/:*?"<>|]/g, "").trim() || "arquivo";
    const filename = ext ? `${safeTitle}.${ext}` : safeTitle;

    if (isAppleTouchDevice()) {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: item.title });
          return;
        } catch (shareErr) {
          if (shareErr.name === "AbortError") return; // a pessoa cancelou o compartilhamento
          // se falhar por outro motivo, cai no download normal abaixo
        }
      }
    }

    // Desktop, Android, ou fallback caso o compartilhar não esteja disponível.
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
  } catch (err) {
    console.error(err);
    showToast("Não foi possível baixar o arquivo. Tente novamente.", "error");
  } finally {
    btn.style.pointerEvents = "";
    btn.innerHTML = originalLabel;
  }
});