const BRANCH = "main";

const postsPanel =
  document.getElementById("postsPanel");

const publisherPanel =
  document.getElementById("publisherPanel");

const postList =
  document.getElementById("postList");

const publisherForm =
  document.getElementById("publisherForm");

const formTitle =
  document.getElementById("formTitle");

const titleInput =
  document.getElementById("title");

const chapterInput =
  document.getElementById("chapter");

const languageInput =
  document.getElementById("language");

const slugInput =
  document.getElementById("slug");

const keywordsInput =
  document.getElementById("keywords");

const coverFile =
  document.getElementById("coverFile");

const chapterFiles =
  document.getElementById("chapterFiles");

const fileList =
  document.getElementById("fileList");

const currentCover =
  document.getElementById("currentCover");

const publishBtn =
  document.getElementById("publishBtn");

const publishStatus =
  document.getElementById("publishStatus");

const cancelBtn =
  document.getElementById("cancelBtn");

let posts = [];
let editingSlug = null;
let manualSlug = false;


function github(path, options = {}){

  if(
    typeof window.githubApi !==
    "function"
  ){

    throw new Error(
      "GitHub authentication system is not loaded."
    );

  }

  return window.githubApi(
    path,
    options
  );

}


function getToken(){

  if(
    typeof window.getToken ===
    "function"
  ){

    return window.getToken();

  }

  return localStorage.getItem(
    "kingdom_github_token"
  ) || "";

}


function showConnectionSuccess(
  message
){

  if(!connectionStatus)
    return;

  connectionStatus.textContent =
    message;

  connectionStatus.className =
    "status success";

}


function showConnectionError(
  message
){

  if(!connectionStatus)
    return;

  connectionStatus.textContent =
    message;

  connectionStatus.className =
    "status error";

}


function updateAdminAfterLogin(){

  if(postsPanel)
    postsPanel.classList.remove(
      "hidden"
    );

  if(publisherPanel)
    publisherPanel.classList.remove(
      "hidden"
    );

}


window.addEventListener(
  "github-connected",
  async () => {

    updateAdminAfterLogin();

    try{

      await loadPosts();

    }catch(error){

      console.error(error);

    }

  }
);


window.addEventListener(
  "github-disconnected",
  () => {

    if(postsPanel)
      postsPanel.classList.add(
        "hidden"
      );

    if(publisherPanel)
      publisherPanel.classList.add(
        "hidden"
      );

  }
);


/*
========================================
LOAD POSTS
========================================
*/

async function loadPosts() {

  postList.innerHTML =
    "Loading chapters...";

  try {

    const response =
      await window.githubApi(
        "/contents/data/posts.json?ref=" + BRANCH
      );

    const data =
      await response.json();

    const decoded =
      decodeBase64(data.content);

    posts =
      JSON.parse(decoded);

    renderPosts();

  } catch (error) {

    postList.innerHTML =
      `<div class="status error">
        ${escapeHtml(error.message)}
      </div>`;

  }

}


/*
========================================
RENDER POSTS
========================================
*/

function renderPosts() {

  if (!posts.length) {

    postList.innerHTML =
      `<div class="help">
        No chapters published yet.
      </div>`;

    return;

  }

  postList.innerHTML =
    posts.map(post => `

      <div class="post-item">

        <div class="post-info">

          <strong>
            ${escapeHtml(post.title)}
          </strong>

          <span>
            Chapter ${escapeHtml(post.chapter)}
            · ${escapeHtml(post.language)}
          </span>

        </div>

        <button
          class="secondary edit-btn"
          data-slug="${escapeHtml(post.slug)}"
        >
          Edit
        </button>

      </div>

    `).join("");

  document
    .querySelectorAll(".edit-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => editPost(
          button.dataset.slug
        )
      );

    });

}


/*
========================================
EDIT POST
========================================
*/

function editPost(slug) {

  const post =
    posts.find(
      item => item.slug === slug
    );

  if (!post) {
    return;
  }

  editingSlug = slug;
  manualSlug = true;

  formTitle.textContent =
    "Update Existing Chapter";

  publishBtn.textContent =
    "Update Chapter";

  titleInput.value =
    post.title || "";

  chapterInput.value =
    post.chapter || "";

  languageInput.value =
    post.language || "English";

  slugInput.value =
    post.slug || "";

  keywordsInput.value =
    Array.isArray(post.keywords)
      ? post.keywords.join(", ")
      : "";

  coverFile.value = "";
  chapterFiles.value = "";

  currentCover.textContent =
    `Current title image: ${post.cover || "none"}`;

  fileList.innerHTML =
    `Existing chapter images: ${
      Array.isArray(post.images)
        ? post.images.length
        : 0
    }`;

  publisherPanel.scrollIntoView({
    behavior: "smooth"
  });

}


/*
========================================
NEW CHAPTER
========================================
*/

function resetPublisher() {

  editingSlug = null;
  manualSlug = false;

  formTitle.textContent =
    "New Chapter";

  publishBtn.textContent =
    "Publish Chapter";

  publisherForm.reset();

  currentCover.textContent = "";

  fileList.innerHTML = "";

  publishStatus.className =
    "status";

  publishStatus.textContent = "";

}


/*
========================================
CANCEL
========================================
*/

cancelBtn.addEventListener(
  "click",
  resetPublisher
);


/*
========================================
AUTO SLUG
========================================
*/

function createSlug() {

  if (manualSlug) {
    return;
  }

  const title =
    titleInput.value.trim();

  const chapter =
    chapterInput.value.trim();

  slugInput.value =
    `${title}-${chapter}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

}

titleInput.addEventListener(
  "input",
  createSlug
);

chapterInput.addEventListener(
  "input",
  createSlug
);

slugInput.addEventListener(
  "input",
  () => {
    manualSlug = true;
  }
);


/*
========================================
FILES
========================================
*/

chapterFiles.addEventListener(
  "change",
  () => {

    const files =
      Array.from(chapterFiles.files);

    fileList.innerHTML =
      files.map((file, index) => {

        const number =
          String(index + 1)
            .padStart(3, "0");

        return `
          ${number}. ${escapeHtml(file.name)}
        `;

      }).join("<br>");

  }
);


/*
========================================
PUBLISH / UPDATE
========================================
*/

publisherForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    try {

      publishBtn.disabled = true;

      showPublishStatus(
        editingSlug
          ? "Updating chapter..."
          : "Publishing chapter...",
        "warning"
      );


      const title =
        titleInput.value.trim();

      const chapter =
        chapterInput.value.trim();

      const language =
        languageInput.value;

      const slug =
        slugInput.value.trim();

      const keywords =
        keywordsInput.value
          .split(",")
          .map(x => x.trim())
          .filter(Boolean);

      if (!title) {
        throw new Error(
          "Manga title is required."
        );
      }

      if (!chapter) {
        throw new Error(
          "Chapter number is required."
        );
      }

      if (!slug) {
        throw new Error(
          "Slug is required."
        );
      }


      const newCover =
        coverFile.files[0] || null;

      const newImages =
        Array.from(
          chapterFiles.files
        );


      if (!editingSlug && !newCover) {
        throw new Error(
          "Title image is required."
        );
      }

      if (!editingSlug && !newImages.length) {
        throw new Error(
          "Chapter images are required."
        );
      }


      /*
        Find old post
      */

      const oldPost =
        editingSlug
          ? posts.find(
              p => p.slug === editingSlug
            )
          : null;


      /*
        Upload title image
      */

      let coverPath =
        oldPost?.cover ||
        `images/${slug}/title.jpg`;

      if (newCover) {

        coverPath =
          `images/${slug}/title.jpg`;

        await uploadFile(
          coverPath,
          await fileToBase64(newCover),
          `Update title image: ${title} Chapter ${chapter}`
        );

      }


      /*
        Upload chapter images
      */

      let imagePaths =
        oldPost?.images
          ? [...oldPost.images]
          : [];


      if (newImages.length) {

        imagePaths = [];

        for (
          let i = 0;
          i < newImages.length;
          i++
        ) {

          const number =
            String(i + 1)
              .padStart(3, "0");

          const filePath =
            `images/${slug}/${number}.webp`;

          await uploadFile(
            filePath,
            await fileToBase64(
              newImages[i]
            ),
            `Update chapter image ${number}`
          );

          imagePaths.push(filePath);

        }

      }


      /*
        If slug changed during update,
        remove old directory.
      */

      if (
        oldPost &&
        oldPost.slug !== slug
      ) {

        await deleteDirectoryFiles(
          oldPost.slug
        );

      }


      /*
        Create new post
      */

      const post = {

        title,

        chapter,

        language,

        slug,

        cover: coverPath,

        images: imagePaths,

        keywords,

        updatedAt:
          new Date().toISOString()

      };


      /*
        Update posts array
      */

      const index =
        posts.findIndex(
          p =>
            p.slug ===
            (editingSlug || slug)
        );


      if (index >= 0) {

        posts[index] = post;

      } else {

        posts.unshift(post);

      }


      /*
        Save posts.json
      */

      await savePosts();


      /*
        Finish
      */

      showPublishStatus(
        editingSlug
          ? "Chapter updated successfully."
          : "Chapter published successfully.",
        "success"
      );

      await loadPosts();

      resetPublisher();

    } catch (error) {

      console.error(error);

      showPublishStatus(
        error.message,
        "error"
      );

    } finally {

      publishBtn.disabled = false;

    }

  }
);


/*
========================================
UPLOAD FILE
========================================
*/

async function uploadFile(
  filePath,
  base64,
  message
) {

  let sha = null;

  try {

    const existing =
      await window.githubApi(
        `/contents/${encodePath(filePath)}?ref=${BRANCH}`
      );

    const data =
      await existing.json();

    sha = data.sha;

  } catch {}

  const body = {

    message,

    content: base64,

    branch: BRANCH

  };

  if (sha) {
    body.sha = sha;
  }

  await window.githubApi(
    `/contents/${encodePath(filePath)}`,
    {
      method: "PUT",

      body:
        JSON.stringify(body),

      headers: {
        "Content-Type":
          "application/json"
      }
    }
  );

}


/*
========================================
SAVE POSTS JSON
========================================
*/

async function savePosts() {

  const response =
    await window.githubApi(
      `/contents/data/posts.json?ref=${BRANCH}`
    );

  const data =
    await response.json();

  const content =
    btoa(
      unescape(
        encodeURIComponent(
          JSON.stringify(
            posts,
            null,
            2
          ) + "\n"
        )
      )
    );


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
            "Update manga posts",

          content,

          sha: data.sha,

          branch: BRANCH

        })

    }
  );

}


/*
========================================
DELETE OLD DIRECTORY FILES
========================================
*/

async function deleteDirectoryFiles(
  slug
) {

  let files = [];

  try {

    const response =
      await window.githubApi(
        `/contents/images/${encodePath(slug)}?ref=${BRANCH}`
      );

    files =
      await response.json();

  } catch {

    return;

  }


  if (!Array.isArray(files)) {
    return;
  }


  for (const file of files) {

    if (file.type !== "file") {
      continue;
    }

    await window.githubApi(
      `/contents/${encodePath(file.path)}`,
      {
        method: "DELETE",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            message:
              "Remove old manga image",

            sha:
              file.sha,

            branch:
              BRANCH

          })

      }
    );

  }

}


/*
========================================
FILE TO BASE64
========================================
*/

function fileToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload = () => {

        const result =
          reader.result;

        const base64 =
          result
            .split(",")[1];

        resolve(base64);

      };

      reader.onerror =
        reject;

      reader.readAsDataURL(file);

    }
  );

}


/*
========================================
BASE64 DECODE
========================================
*/

function decodeBase64(value) {

  const binary =
    atob(
      value.replace(/\n/g, "")
    );

  const bytes =
    Uint8Array.from(
      binary,
      char => char.charCodeAt(0)
    );

  return new TextDecoder()
    .decode(bytes);

}


/*
========================================
PATH ENCODE
========================================
*/

function encodePath(value) {

  return value
    .split("/")
    .map(encodeURIComponent)
    .join("/");

}


/*
========================================
STATUS
========================================
*/

function showConnectionSuccess(
  message
) {

  connectionStatus.textContent =
    message;

  connectionStatus.className =
    "status success";

}

function showConnectionError(
  message
) {

  connectionStatus.textContent =
    message;

  connectionStatus.className =
    "status error";

}

function showPublishStatus(
  message,
  type
) {

  publishStatus.textContent =
    message;

  publishStatus.className =
    `status ${type}`;

}


/*
========================================
ESCAPE
========================================
*/

function escapeHtml(value) {

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
