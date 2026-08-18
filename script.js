let posts = [];
let currentLanguage = "all";

async function loadPosts() {
  const container = document.getElementById("chapters");

  try {
    const response = await fetch("data/posts.json?v=" + Date.now());

    if (!response.ok) {
      throw new Error("Could not load posts.json");
    }

    posts = await response.json();
    renderChapters();
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="empty">
        No chapters available yet.
      </div>
    `;
  }
}

function renderChapters() {
  const container = document.getElementById("chapters");

  let filtered = posts;

  if (currentLanguage !== "all") {
    filtered = posts.filter(post => post.language === currentLanguage);
  }

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty">
        No chapters found.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(post => {
    const cover = post.cover || "images/placeholder.jpg";
    const slug = post.slug || "";

    return `
      <a class="chapter-card" href="#/${escapeHtml(slug)}">
        <img
          class="chapter-cover"
          src="${escapeHtml(cover)}"
          alt="${escapeHtml(post.title || "Manga")} Chapter ${escapeHtml(post.chapter || "")}"
          loading="lazy"
        >

        <div class="chapter-info">
          <h3 class="chapter-title">
            ${escapeHtml(post.title || "Untitled")}
          </h3>

          <div class="chapter-number">
            Chapter ${escapeHtml(post.chapter || "")}
          </div>

          <span class="chapter-language">
            ${escapeHtml(post.language || "English")}
          </span>
        </div>
      </a>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn")
      .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");
    currentLanguage = button.dataset.language;
    renderChapters();
  });
});

loadPosts();
