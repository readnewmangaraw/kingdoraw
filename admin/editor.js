const editorForm = document.getElementById("editorForm");
const postSelect = document.getElementById("postSelect");
const editTitle = document.getElementById("editTitle");
const editChapter = document.getElementById("editChapter");
const editLanguage = document.getElementById("editLanguage");
const editKeywords = document.getElementById("editKeywords");
const editCover = document.getElementById("editCover");
const editImages = document.getElementById("editImages");
const editorStatus = document.getElementById("editorStatus");

let editorPosts = [];

async function loadEditorPosts() {
  try {
    const response = await fetch("../data/posts.json?v=" + Date.now());

    if (!response.ok) {
      throw new Error("Unable to load posts.");
    }

    editorPosts = await response.json();

    postSelect.innerHTML =
      `<option value="">Select a chapter to edit</option>` +
      editorPosts.map((post, index) => `
        <option value="${index}">
          ${escapeEditor(post.title || "")} - Chapter ${escapeEditor(post.chapter || "")}
        </option>
      `).join("");

  } catch (error) {
    editorStatus.textContent = error.message;
    editorStatus.className = "status error";
  }
}

postSelect.addEventListener("change", () => {

  const index = postSelect.value;

  if (index === "") {
    editorForm.reset();
    return;
  }

  const post = editorPosts[Number(index)];

  editTitle.value =
    post.title || "";

  editChapter.value =
    post.chapter || "";

  editLanguage.value =
    post.language || "Japanese";

  editKeywords.value =
    Array.isArray(post.keywords)
      ? post.keywords.join(", ")
      : "";

  editCover.value =
    post.cover || "";

  editImages.value =
    Array.isArray(post.images)
      ? post.images.join("\n")
      : "";

});

editorForm.addEventListener("submit", async event => {

  event.preventDefault();

  try {

    const index = postSelect.value;

    if (index === "") {
      throw new Error(
        "Please select a chapter."
      );
    }

    const post =
      editorPosts[Number(index)];

    const updated = {

      ...post,

      title:
        editTitle.value.trim(),

      chapter:
        editChapter.value.trim(),

      language:
        editLanguage.value,

      keywords:
        editKeywords.value
          .split(",")
          .map(x => x.trim())
          .filter(Boolean),

      cover:
        editCover.value.trim(),

      images:
        editImages.value
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean),

      updatedAt:
        new Date().toISOString()

    };

    editorPosts[Number(index)] =
      updated;

    const content =
      JSON.stringify(
        editorPosts,
        null,
        2
      );

    const encoded =
      btoa(
        unescape(
          encodeURIComponent(content)
        )
      );

    const existing =
      await window.githubApi(
        "/contents/data/posts.json?ref=main"
      );

    const existingData =
      await existing.json();

    await window.githubApi(
      "/contents/data/posts.json",
      {

        method: "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            message:
              `Update chapter ${updated.chapter}`,

            content:
              encoded,

            sha:
              existingData.sha,

            branch:
              "main"

          })

      }
    );

    editorStatus.textContent =
      "Chapter updated successfully.";

    editorStatus.className =
      "status success";

    await loadEditorPosts();

  } catch (error) {

    editorStatus.textContent =
      error.message;

    editorStatus.className =
      "status error";

  }

});

function escapeEditor(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

loadEditorPosts();
