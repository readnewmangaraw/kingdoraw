const form = document.getElementById("publisherForm");

const titleInput = document.getElementById("title");
const chapterInput = document.getElementById("chapter");
const languageInput = document.getElementById("language");
const slugInput = document.getElementById("slug");
const keywordsInput = document.getElementById("keywords");

const coverFile = document.getElementById("coverFile");
const chapterFiles = document.getElementById("chapterFiles");

const coverPreview = document.getElementById("coverPreview");
const coverPreviewImage = document.getElementById("coverPreviewImage");
const chapterList = document.getElementById("chapterList");

const statusBox = document.getElementById("status");
const summaryBox = document.getElementById("summary");

let manualSlug = false;


/* ------------------------------
   AUTO SLUG
------------------------------ */

function createSlug() {

  if (manualSlug) {
    return;
  }

  const title = titleInput.value.trim();
  const chapter = chapterInput.value.trim();

  if (!title && !chapter) {
    slugInput.value = "";
    return;
  }

  slugInput.value =
    `${title}-${chapter}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
}


titleInput.addEventListener("input", createSlug);
chapterInput.addEventListener("input", createSlug);

slugInput.addEventListener("input", () => {
  manualSlug = true;
});


/* ------------------------------
   TITLE IMAGE PREVIEW
------------------------------ */

coverFile.addEventListener("change", () => {

  const file = coverFile.files[0];

  if (!file) {
    coverPreview.style.display = "none";
    return;
  }

  const url = URL.createObjectURL(file);

  coverPreviewImage.src = url;
  coverPreview.style.display = "block";
});


/* ------------------------------
   CHAPTER IMAGE LIST
------------------------------ */

chapterFiles.addEventListener("change", () => {

  chapterList.innerHTML = "";

  const files = Array.from(chapterFiles.files);

  if (!files.length) {
    return;
  }

  files.forEach((file, index) => {

    const number =
      String(index + 1).padStart(3, "0");

    const item = document.createElement("div");

    item.textContent =
      `${number}. ${file.name}`;

    chapterList.appendChild(item);

  });

});


/* ------------------------------
   FORM SUBMIT
------------------------------ */

form.addEventListener("submit", (event) => {

  event.preventDefault();

  const title = titleInput.value.trim();
  const chapter = chapterInput.value.trim();
  const language = languageInput.value;
  const slug = slugInput.value.trim();

  const keywords =
    keywordsInput.value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

  const cover = coverFile.files[0];
  const images = Array.from(chapterFiles.files);


  /* VALIDATION */

  if (!title) {
    showError("Please enter the manga title.");
    return;
  }

  if (!chapter) {
    showError("Please enter the chapter number.");
    return;
  }

  if (!slug) {
    showError("Please enter the slug.");
    return;
  }

  if (!cover) {
    showError("Please select the Title Image.");
    return;
  }

  if (!images.length) {
    showError("Please select the Chapter Images.");
    return;
  }


  /* CREATE POST DATA */

  const post = {

    title: title,

    chapter: chapter,

    language: language,

    slug: slug,

    cover: `images/${slug}/title.jpg`,

    images: images.map((file, index) => {

      const number =
        String(index + 1).padStart(3, "0");

      return `images/${slug}/${number}.webp`;

    }),

    keywords: keywords,

    updatedAt: new Date().toISOString()

  };


  console.log("Prepared post:", post);


  /* SUMMARY */

  summaryBox.innerHTML = `

    <h3>Chapter Ready</h3>

    <div class="summary-row">
      <strong>Title:</strong>
      ${escapeHtml(title)}
    </div>

    <div class="summary-row">
      <strong>Chapter:</strong>
      ${escapeHtml(chapter)}
    </div>

    <div class="summary-row">
      <strong>Language:</strong>
      ${escapeHtml(language)}
    </div>

    <div class="summary-row">
      <strong>Slug:</strong>
      ${escapeHtml(slug)}
    </div>

    <div class="summary-row">
      <strong>Title Image:</strong>
      ${escapeHtml(cover.name)}
      → title.jpg
    </div>

    <div class="summary-row">
      <strong>Chapter Images:</strong>
      ${images.length}
    </div>

    <div class="summary-row">
      <strong>Keywords:</strong>
      ${keywords.length}
    </div>

  `;

  summaryBox.style.display = "block";

  showSuccess(
    "Chapter data prepared successfully."
  );

});


/* ------------------------------
   CLEAR
------------------------------ */

document.getElementById("clearBtn")
  .addEventListener("click", () => {

    form.reset();

    manualSlug = false;

    coverPreview.style.display = "none";

    chapterList.innerHTML = "";

    summaryBox.style.display = "none";

    statusBox.style.display = "none";

  });


/* ------------------------------
   STATUS
------------------------------ */

function showSuccess(message) {

  statusBox.textContent = message;

  statusBox.className =
    "status success";

}


function showError(message) {

  statusBox.textContent = message;

  statusBox.className =
    "status error";

}


/* ------------------------------
   ESCAPE HTML
------------------------------ */

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}
