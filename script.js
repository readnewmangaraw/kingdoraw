let posts = [];

const config =
  window.KINGDOM_CONFIG || {};

const homeView =
  document.getElementById("homeView");

const readerView =
  document.getElementById("readerView");

const chapterGrid =
  document.getElementById("chapterGrid");

const chapterCount =
  document.getElementById("chapterCount");

const readerTitle =
  document.getElementById("readerTitle");

const readerChapter =
  document.getElementById("readerChapter");

const readerLanguage =
  document.getElementById("readerLanguage");

const readerCover =
  document.getElementById("readerCover");

const readerImages =
  document.getElementById("readerImages");

const readerKeywords =
  document.getElementById("readerKeywords");

const previousButton =
  document.getElementById("previousButton");

const nextButton =
  document.getElementById("nextButton");

const backButton =
  document.getElementById("backButton");


/*
==============================
SITE BRANDING
==============================
*/

function applyBranding(){

  const name =
    config.siteNameJa ||
    config.siteName ||
    "Manga";

  const description =
    config.descriptionJa ||
    `${name} 最新話`;

  document.title =
    name;

  document
    .querySelectorAll("[data-site-name]")
    .forEach(el => {
      el.textContent = name;
    });

  const meta =
    document.getElementById(
      "metaDescription"
    );

  if(meta){
    meta.content =
      description;
  }

  const heroDescription =
    document.getElementById(
      "heroDescription"
    );

  if(heroDescription){
    heroDescription.textContent =
      description;
  }

}


/*
==============================
LOAD POSTS
==============================
*/

async function loadPosts(){

  try{

    const response =
      await fetch(
        "data/posts.json?v=" +
        Date.now()
      );

    if(!response.ok){
      throw new Error(
        "Posts could not be loaded."
      );
    }

    posts =
      await response.json();

    if(!Array.isArray(posts)){
      posts = [];
    }

    posts.sort(
      (a,b) =>
        new Date(b.updatedAt || 0) -
        new Date(a.updatedAt || 0)
    );

    renderChapters();

    handleRoute();

  }catch(error){

    chapterGrid.innerHTML =
      `<div class="loading">
        データを読み込めませんでした。
      </div>`;

  }

}


/*
==============================
CHAPTER LIST
==============================
*/

function renderChapters(){

  chapterCount.textContent =
    posts.length;

  if(!posts.length){

    chapterGrid.innerHTML =
      `<div class="loading">
        まだ公開された話はありません。
      </div>`;

    return;

  }

  chapterGrid.innerHTML =
    posts.map(post => {

      const cover =
        post.cover ||
        (
          Array.isArray(post.images) &&
          post.images[0]
        ) ||
        "";

      return `

        <a
          class="chapter-card"
          href="#/${encodeURIComponent(post.slug)}"
        >

          <div class="card-image">

            ${
              cover
              ?
              `<img
                src="${escapeAttr(cover)}"
                alt="${escapeAttr(
                  post.title
                )} ${escapeAttr(
                  post.chapter
                )}"
                loading="lazy"
              >`
              :
              ""
            }

          </div>

          <div class="card-body">

            <div class="card-title">
              ${escapeHtml(post.title || "")}
            </div>

            <div class="card-chapter">
              第${escapeHtml(
                post.chapter || ""
              )}話
            </div>

            <div class="card-meta">
              ${escapeHtml(
                post.language || "日本語"
              )}
            </div>

          </div>

        </a>

      `;

    }).join("");

}


/*
==============================
ROUTING
==============================
*/

function getSlugFromHash(){

  const hash =
    location.hash;

  if(!hash.startsWith("#/")){
    return null;
  }

  return decodeURIComponent(
    hash.slice(2)
  );

}


function handleRoute(){

  const slug =
    getSlugFromHash();

  if(!slug){

    showHome();

    return;

  }

  const post =
    posts.find(
      item =>
        item.slug === slug
    );

  if(!post){

    showHome();

    return;

  }

  showReader(post);

}


function showHome(){

  homeView.classList.remove(
    "hidden"
  );

  readerView.classList.add(
    "hidden"
  );

  window.scrollTo(
    0,
    0
  );

}


function showReader(post){

  homeView.classList.add(
    "hidden"
  );

  readerView.classList.remove(
    "hidden"
  );

  renderReader(post);

  window.scrollTo(
    0,
    0
  );

}


/*
==============================
READER
==============================
*/

function renderReader(post){

  readerTitle.textContent =
    post.title || "";

  readerChapter.textContent =
    `第${post.chapter || ""}話`;

  readerLanguage.textContent =
    post.language || "日本語";


  /*
    COVER
  */

  if(post.cover){

    readerCover.innerHTML =
      `<img
        src="${escapeAttr(
          post.cover
        )}"
        alt="${escapeAttr(
          post.title
        )} 第${escapeAttr(
          post.chapter
        )}話"
      >`;

  }else{

    readerCover.innerHTML = "";

  }


  /*
    CHAPTER IMAGES
  */

  const images =
    Array.isArray(post.images)
      ? post.images
      : [];

  readerImages.innerHTML =
    images.map(
      (src,index) =>
        `<img
          src="${escapeAttr(src)}"
          alt="${escapeAttr(
            post.title
          )} 第${escapeAttr(
            post.chapter
          )}話 ${String(
            index + 1
          ).padStart(3,"0")}"
          loading="${
            index < 2
              ? "eager"
              : "lazy"
          }"
        >`
    ).join("");


  /*
    KEYWORDS
  */

  const keywords =
    Array.isArray(post.keywords)
      ? post.keywords
      : [];

  if(keywords.length){

    readerKeywords.innerHTML = `

      <div class="keyword-title">
        キーワード
      </div>

      <div class="keyword-list">

        ${
          keywords.map(
            keyword =>
              `<span class="keyword">
                ${escapeHtml(keyword)}
              </span>`
          ).join("")
        }

      </div>

    `;

  }else{

    readerKeywords.innerHTML = "";

  }


  /*
    PREVIOUS / NEXT
  */

  const index =
    posts.findIndex(
      item =>
        item.slug === post.slug
    );

  const newer =
    index > 0
      ? posts[index - 1]
      : null;

  const older =
    index <
    posts.length - 1
      ? posts[index + 1]
      : null;


  previousButton.disabled =
    !older;

  nextButton.disabled =
    !newer;


  previousButton.onclick =
    () => {

      if(older){

        location.hash =
          `/${encodeURIComponent(
            older.slug
          )}`;

      }

    };


  nextButton.onclick =
    () => {

      if(newer){

        location.hash =
          `/${encodeURIComponent(
            newer.slug
          )}`;

      }

    };

}


/*
==============================
NAVIGATION
==============================
*/

window.addEventListener(
  "hashchange",
  handleRoute
);


backButton.addEventListener(
  "click",
  () => {

    location.hash = "";

  }
);


/*
==============================
ESCAPE
==============================
*/

function escapeHtml(value){

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


function escapeAttr(value){

  return escapeHtml(value);

}


/*
==============================
START
==============================
*/

applyBranding();

loadPosts();
