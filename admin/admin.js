const form = document.getElementById("publisherForm");
const statusBox = document.getElementById("status");
const preview = document.getElementById("preview");

const titleInput = document.getElementById("title");
const chapterInput = document.getElementById("chapter");
const slugInput = document.getElementById("slug");
const coverFile = document.getElementById("coverFile");

titleInput.addEventListener("input", makeSlug);
chapterInput.addEventListener("input", makeSlug);

function makeSlug() {
  if (slugInput.dataset.manual === "true") return;

  const title = titleInput.value.trim();
  const chapter = chapterInput.value.trim();

  slugInput.value = `${title}-${chapter}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

slugInput.addEventListener("input", () => {
  slugInput.dataset.manual = "true";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const chapter = chapterInput.value.trim();
  const language = document.getElementById("language").value;
  const slug = slugInput.value.trim();
  const keywords = document.getElementById("keywords").value
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

  const chapterFiles = document.getElementById("chapterFiles").files;

  if (!title || !chapter || !slug) {
    showStatus("Please complete Title, Chapter and Slug.", true);
    return;
  }

  if (!coverFile.files.length) {
    showStatus("Please select a title image.", true);
    return;
  }

  if (!chapterFiles.length) {
    showStatus("Please select chapter images.", true);
    return;
  }

  const post = {
    title,
    chapter,
    language,
    slug,
    cover: `images/${slug}/title.jpg`,
    images: [],
    keywords,
    updatedAt: new Date().toISOString()
  };

  for (let i = 0; i < chapterFiles.length; i++) {
    const number = String(i + 1).padStart(3, "0");
    post.images.push(`images/${slug}/${number}.webp`);
  }

  showStatus("Chapter data prepared successfully.");

  preview.innerHTML = `
    <h3>Preview</h3>
    <p><strong>${escapeHtml(title)}</strong></p>
    <p>Chapter ${escapeHtml(chapter)}</p>
    <p>Language: ${escapeHtml(language)}</p>
    <p>Images: ${chapterFiles.length}</p>
  `;

  console.log("Prepared post:", post);
});

function showStatus(message, error = false) {
  statusBox.textContent = message;
  statusBox.style.color = error ? "#ff304f" : "#39e58c";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
