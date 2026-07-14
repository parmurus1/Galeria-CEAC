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
