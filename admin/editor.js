const editorForm = document.getElementById("editorForm");
const postSelect = document.getElementById("postSelect");

const editTitle = document.getElementById("editTitle");
const editChapter = document.getElementById("editChapter");
const editLanguage = document.getElementById("editLanguage");
const editKeywords = document.getElementById("editKeywords");

const editCoverFile = document.getElementById("editCoverFile");
const editCoverPreview = document.getElementById("editCoverPreview");

const editImageList = document.getElementById("editImageList");
const editNewImages = document.getElementById("editNewImages");
const editNewImageList = document.getElementById("editNewImageList");

const editorStatus = document.getElementById("editorStatus");
const updateChapterBtn =
  document.getElementById("updateChapterBtn");
const deleteChapterBtn =
  document.getElementById("deleteChapterBtn");

let editorPosts = [];
let selectedPost = null;
let deletedImages = [];
let replacementImages = {};
let newImages = [];


/*
========================================
HELPERS
========================================
*/

function editorMessage(message, type = "success") {

  editorStatus.textContent = message;
  editorStatus.className =
    "status " + type;

}


function encodePath(path) {

  return path
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");

}


function base64Encode(text) {

  return btoa(
    unescape(
      encodeURIComponent(text)
    )
  );

}


function fileToDataURL(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(reader.result);

      reader.onerror =
        () => reject(
          new Error(
            "Unable to read " + file.name
          )
        );

      reader.readAsDataURL(file);

    }
  );

}


function safeFileName(name) {

  return name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

}


function fileExtension(name) {

  const parts =
    name.split(".");

  return parts.length > 1
    ? parts.pop().toLowerCase()
    : "webp";

}


/*
========================================
LOAD POSTS
========================================
*/

async function loadEditorPosts() {

  try {

    const response =
      await fetch(
        "../data/posts.json?v=" + Date.now()
      );

    if (!response.ok) {

      throw new Error(
        "Unable to load posts."
      );

    }

    editorPosts =
      await response.json();

    postSelect.innerHTML =
      `<option value="">
        Select a chapter to edit
      </option>` +

      editorPosts
        .map(
          (post, index) => `
            <option value="${index}">
              ${escapeEditor(post.title || "")}
              - Chapter
              ${escapeEditor(post.chapter || "")}
            </option>
          `
        )
        .join("");

  } catch (error) {

    editorMessage(
      error.message,
      "error"
    );

  }

}


/*
========================================
LOAD SELECTED POST
========================================
*/

postSelect.addEventListener(
  "change",
  async () => {

    const index =
      postSelect.value;

    deletedImages = [];
    replacementImages = {};
    newImages = [];

    editCoverFile.value = "";
    editNewImages.value = "";
    editNewImageList.innerHTML = "";

    if (index === "") {

      selectedPost = null;

      editorForm.reset();

      editImageList.innerHTML =
        "Select a chapter to load its images.";

      editCoverPreview.textContent =
        "Select a chapter to load its title image.";

      return;

    }

    selectedPost =
      editorPosts[
        Number(index)
      ];

    editTitle.value =
      selectedPost.title || "";

    editChapter.value =
      selectedPost.chapter || "";

    editLanguage.value =
      selectedPost.language ||
      "Japanese";

    editKeywords.value =
      Array.isArray(selectedPost.keywords)
        ? selectedPost.keywords.join(", ")
        : "";

    renderCover();
    renderImages();

    editorMessage(
      "Chapter loaded.",
      "success"
    );

  }
);


/*
========================================
COVER PREVIEW
========================================
*/

function renderCover() {

  if (!selectedPost) {

    editCoverPreview.textContent =
      "Select a chapter.";

    return;

  }

  if (!selectedPost.cover) {

    editCoverPreview.textContent =
      "No title image.";

    return;

  }

  editCoverPreview.innerHTML = `
    <div class="edit-cover-box">
      <img
        src="${escapeEditor(selectedPost.cover)}"
        alt="${escapeEditor(
          selectedPost.title
        )} ${escapeEditor(
          selectedPost.chapter
        )}"
        style="
          max-width:220px;
          max-height:180px;
          display:block;
          border-radius:8px;
          margin-bottom:10px;
        "
      >
      <div>
        ${escapeEditor(
          selectedPost.cover
        )}
      </div>
    </div>
  `;

}


/*
========================================
CHAPTER IMAGE LIST
========================================
*/

function renderImages() {

  if (!selectedPost) {

    editImageList.innerHTML =
      "Select a chapter.";

    return;

  }

  const images =
    Array.isArray(selectedPost.images)
      ? selectedPost.images
      : [];

  if (!images.length) {

    editImageList.innerHTML =
      "No chapter images.";

    return;

  }

  editImageList.innerHTML =
    images
      .map(
        (src, index) => {

          if (
            deletedImages.includes(src)
          ) {
            return "";
          }

          const replacement =
            replacementImages[src];

          const displaySrc =
            replacement
              ? URL.createObjectURL(
                  replacement
                )
              : "../" + src;

          return `
            <div
              class="edit-image-item"
              data-src="${escapeEditor(src)}"
              style="
                display:flex;
                gap:12px;
                align-items:center;
                padding:10px;
                margin-bottom:8px;
                background:#101820;
                border:1px solid #1c2b38;
                border-radius:8px;
              "
            >

              <img
                src="${escapeEditor(displaySrc)}"
                alt="${escapeEditor(
                  selectedPost.title
                )} 第${escapeEditor(
                  selectedPost.chapter
                )}話 ${String(
                  index + 1
                ).padStart(3,"0")}"
                style="
                  width:80px;
                  height:80px;
                  object-fit:cover;
                  border-radius:6px;
                "
              >

              <div style="flex:1;min-width:0">

                <div>
                  ${String(
                    index + 1
                  ).padStart(3,"0")}
                </div>

                <div class="help">
                  ${escapeEditor(src)}
                </div>

                ${
                  replacement
                    ? `
                      <div
                        style="color:#39e58c"
                      >
                        Replacement selected
                      </div>
                    `
                    : ""
                }

              </div>

              <label
                class="secondary"
                style="
                  cursor:pointer;
                  padding:9px 12px;
                "
              >
                Replace

                <input
                  type="file"
                  accept="image/*"
                  class="replace-image-input"
                  style="display:none"
                >

              </label>

              <button
                type="button"
                class="primary delete-image-btn"
              >
                Delete
              </button>

            </div>
          `;

        }
      )
      .join("");

  document
    .querySelectorAll(
      ".replace-image-input"
    )
    .forEach(
      input => {

        input.addEventListener(
          "change",
          event => {

            const file =
              event.target.files[0];

            if (!file) return;

            const item =
              event.target.closest(
                ".edit-image-item"
              );

            const src =
              item.dataset.src;

            replacementImages[src] =
              file;

            renderImages();

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".delete-image-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const item =
              button.closest(
                ".edit-image-item"
              );

            const src =
              item.dataset.src;

            if (
              !deletedImages.includes(src)
            ) {

              deletedImages.push(src);

            }

            delete replacementImages[src];

            renderImages();

          }
        );

      }
    );

}


/*
========================================
NEW IMAGES
========================================
*/

editNewImages.addEventListener(
  "change",
  () => {

    newImages =
      Array.from(
        editNewImages.files
      );

    editNewImageList.innerHTML =
      newImages
        .map(
          (file, index) => `
            ${index + 1}.
            ${escapeEditor(file.name)}
          `
        )
        .join("<br>");

  }
);


/*
========================================
UPLOAD / UPDATE FILE
========================================
*/

async function uploadEditorFile(
  path,
  base64,
  message
) {

  const existing =
    await window.githubApi(
      `/contents/${encodePath(path)}?ref=main`
    );

  let sha = null;

  if (existing.status === 200) {

    const data =
      await existing.json();

    sha = data.sha;

  }
  else if (
    existing.status !== 404
  ) {

    throw new Error(
      `Unable to check ${path}`
    );

  }

  const body = {

    message,

    content: base64,

    branch: "main"

  };

  if (sha) {

    body.sha = sha;

  }

  const response =
    await window.githubApi(
      `/contents/${encodePath(path)}`,
      {

        method: "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(body)

      }
    );

  if (!response.ok) {

    throw new Error(
      `Unable to upload ${path}`
    );

  }

}


/*
========================================
DELETE FILE
========================================
*/

async function deleteEditorFile(path) {

  const existing =
    await window.githubApi(
      `/contents/${encodePath(path)}?ref=main`
    );

  if (existing.status === 404) {

    return;

  }

  if (!existing.ok) {

    throw new Error(
      `Unable to find ${path}`
    );

  }

  const data =
    await existing.json();

  await window.githubApi(
    `/contents/${encodePath(path)}`,
    {

      method: "DELETE",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify({

          message:
            `Delete ${path}`,

          sha:
            data.sha,

          branch:
            "main"

        })

    }
  );

}


/*
========================================
UPDATE POSTS.JSON
========================================
*/

async function saveEditorPosts(
  posts,
  message
) {

  /*
   * Always fetch the latest posts.json first.
   * GitHub requires the current SHA when updating
   * an existing file.
   */

  const existing =
    await window.githubApi(
      "/contents/data/posts.json?ref=main"
    );

  if (!existing.ok) {

    let details = "";

    try {
      details = await existing.text();
    } catch {}

    throw new Error(
      `Unable to read posts.json (${existing.status}): ${details}`
    );

  }

  const data =
    await existing.json();

  if (!data.sha) {

    throw new Error(
      "GitHub did not return the posts.json SHA."
    );

  }


  const content =
    JSON.stringify(
      posts,
      null,
      2
    );


  const response =
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

            message,

            content:
              base64Encode(content),

            sha:
              data.sha,

            branch:
              "main"

          })

      }
    );


  if (!response.ok) {

    let details = "";

    try {
      details = await response.text();
    } catch {}

    throw new Error(
      `Unable to update posts.json (${response.status}): ${details}`
    );

  }


  return await response.json();

}


/*
========================================
UPDATE CHAPTER
========================================
*/

editorForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (!selectedPost) {

      editorMessage(
        "Please select a chapter.",
        "error"
      );

      return;

    }

    try {

      updateChapterBtn.disabled =
        true;

      editorMessage(
        "Updating chapter...",
        "warning"
      );


      const oldSlug =
        selectedPost.slug;


      const title =
        editTitle.value.trim();

      const chapter =
        editChapter.value.trim();

      const language =
        editLanguage.value;

      const keywords =
        editKeywords.value
          .split(",")
          .map(
            x => x.trim()
          )
          .filter(Boolean);


      if (!title || !chapter) {

        throw new Error(
          "Title and chapter are required."
        );

      }


      const newSlug =
        makeEditorSlug(
          title,
          chapter
        );


      const folder =
        `images/${newSlug}`;


      /*
      TITLE IMAGE REPLACEMENT
      */

      if (
        editCoverFile.files.length
      ) {

        const file =
          editCoverFile.files[0];

        const data =
          await fileToDataURL(file);

        const ext =
          fileExtension(file.name);

        const coverPath =
          `${folder}/title.${ext}`;

        await uploadEditorFile(
          coverPath,
          data.split(",")[1],
          `Update title image ${title} ${chapter}`
        );

        selectedPost.cover =
          coverPath;

      }


      /*
      DELETE OLD IMAGES
      */

      for (
        const path of deletedImages
      ) {

        await deleteEditorFile(
          path
        );

      }


      /*
      REPLACE EXISTING IMAGES
      */

      const currentImages =
        Array.isArray(
          selectedPost.images
        )
          ? selectedPost.images
          : [];

      const updatedImages = [];


      for (
        let i = 0;
        i < currentImages.length;
        i++
      ) {

        const oldPath =
          currentImages[i];

        if (
          deletedImages.includes(
            oldPath
          )
        ) {

          continue;

        }


        const replacement =
          replacementImages[
            oldPath
          ];


        if (replacement) {

          const data =
            await fileToDataURL(
              replacement
            );

          const ext =
            fileExtension(
              replacement.name
            );

          const newPath =
            `${folder}/${String(
              updatedImages.length + 1
            ).padStart(3,"0")}.${ext}`;


          await uploadEditorFile(
            newPath,
            data.split(",")[1],
            `Replace chapter image ${updatedImages.length + 1}`
          );


          if (
            oldPath !== newPath
          ) {

            await deleteEditorFile(
              oldPath
            );

          }


          updatedImages.push(
            newPath
          );

        }
        else {

          updatedImages.push(
            oldPath
          );

        }

      }


      /*
      ADD NEW IMAGES
      */

      newImages.sort(
        (a,b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            {
              numeric:true,
              sensitivity:"base"
            }
          )
      );


      for (
        const file of newImages
      ) {

        const data =
          await fileToDataURL(file);

        const number =
          String(
            updatedImages.length + 1
          ).padStart(3,"0");

        const path =
          `${folder}/${number}.${fileExtension(
            file.name
          )}`;

        await uploadEditorFile(
          path,
          data.split(",")[1],
          `Add chapter image ${number}`
        );

        updatedImages.push(path);

      }


      /*
      UPDATE POST
      */

      const updated = {

        ...selectedPost,

        title,

        chapter,

        language,

        keywords,

        slug:
          newSlug,

        images:
          updatedImages,

        updatedAt:
          new Date().toISOString()

      };


      if (!updated.cover) {

        updated.cover =
          `${folder}/title.webp`;

      }


      /*
      DELETE OLD FOLDER
      IF SLUG CHANGED
      */

      if (
        oldSlug &&
        oldSlug !== newSlug
      ) {

        await deleteEditorFolder(
          oldSlug
        );

      }


      const index =
        editorPosts.findIndex(
          post =>
            post.slug === oldSlug
        );


      if (index >= 0) {

        editorPosts[index] =
          updated;

      }


      await saveEditorPosts(
        editorPosts,
        `Update chapter ${chapter}`
      );


      selectedPost =
        updated;

      deletedImages = [];
      replacementImages = {};
      newImages = [];

      editCoverFile.value = "";
      editNewImages.value = "";

      renderCover();
      renderImages();

      await loadEditorPosts();

      postSelect.value =
        String(index);

      editorMessage(
        "Chapter updated successfully.",
        "success"
      );


    } catch (error) {

      console.error(error);

      editorMessage(
        error.message ||
        "Update failed.",
        "error"
      );

    } finally {

      updateChapterBtn.disabled =
        false;

    }

  }
);


/*
========================================
DELETE ENTIRE CHAPTER
========================================
*/

deleteChapterBtn.addEventListener(
  "click",
  async () => {

    if (!selectedPost) {

      editorMessage(
        "Please select a chapter first.",
        "error"
      );

      return;

    }


    const confirmed =
      confirm(
        `Delete ${selectedPost.title} Chapter ${selectedPost.chapter}?\n\nThis will delete the chapter from posts.json and delete its GitHub image folder.`
      );


    if (!confirmed) {

      return;

    }


    try {

      deleteChapterBtn.disabled =
        true;

      updateChapterBtn.disabled =
        true;

      editorMessage(
        "Deleting chapter...",
        "warning"
      );


      const slug =
        selectedPost.slug;


      await deleteEditorFolder(
        slug
      );


      const index =
        editorPosts.findIndex(
          post =>
            post.slug === slug
        );


      if (index >= 0) {

        editorPosts.splice(
          index,
          1
        );

      }


      await saveEditorPosts(
        editorPosts,
        `Delete chapter ${selectedPost.chapter}`
      );


      selectedPost = null;

      deletedImages = [];
      replacementImages = [];
      newImages = [];

      editorForm.reset();

      editImageList.innerHTML =
        "Select a chapter to load its images.";

      editCoverPreview.textContent =
        "Select a chapter to load its title image.";

      editNewImageList.innerHTML =
        "";

      await loadEditorPosts();

      editorMessage(
        "Chapter deleted successfully.",
        "success"
      );


    } catch (error) {

      console.error(error);

      editorMessage(
        error.message ||
        "Delete failed.",
        "error"
      );

    } finally {

      deleteChapterBtn.disabled =
        false;

      updateChapterBtn.disabled =
        false;

    }

  }
);


/*
========================================
DELETE GITHUB FOLDER
========================================
*/

async function deleteEditorFolder(
  slug
) {

  const response =
    await window.githubApi(
      `/contents/images/${encodePath(
        slug
      )}?ref=main`
    );


  if (response.status === 404) {

    return;

  }


  if (!response.ok) {

    throw new Error(
      `Unable to read image folder: ${slug}`
    );

  }


  const files =
    await response.json();


  if (!Array.isArray(files)) {

    return;

  }


  for (
    const file of files
  ) {

    if (
      file.type === "file"
    ) {

      await window.githubApi(
        `/contents/${encodePath(
          file.path
        )}`,
        {

          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              message:
                `Delete chapter image ${file.name}`,

              sha:
                file.sha,

              branch:
                "main"

            })

        }
      );

    }

  }

}


/*
========================================
SLUG
========================================
*/

function makeEditorSlug(
  title,
  chapter
) {

  return (
    `${title}-${chapter}`
      .toLowerCase()
      .trim()
      .replace(
        /[^\w\u3040-\u30ff\u3400-\u9fff-]+/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-|-$/g,
        ""
      )
  );

}


/*
========================================
ESCAPE
========================================
*/

function escapeEditor(
  value
) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/*
========================================
START
========================================
*/

loadEditorPosts();
