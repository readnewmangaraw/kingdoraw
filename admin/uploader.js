const uploadForm =
  document.getElementById("uploadForm");

const uploadTitle =
  document.getElementById("uploadTitle");

const uploadChapter =
  document.getElementById("uploadChapter");

const uploadLanguage =
  document.getElementById("uploadLanguage");

const newTitleImage =
  document.getElementById("newTitleImage");

const newChapterImages =
  document.getElementById("newChapterImages");

const uploadKeywords =
  document.getElementById("uploadKeywords");

const uploadButton =
  document.getElementById("uploadButton");

const uploadStatus =
  document.getElementById("uploadStatus");


function makeSlug(title, chapter){

  return (
    `${title}-${chapter}`
      .toLowerCase()
      .trim()
      .replace(/[^\w\u3040-\u30ff\u3400-\u9fff-]+/g,"-")
      .replace(/-+/g,"-")
      .replace(/^-|-$/g,"")
  );

}


function safeFileName(name){

  return name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g,"-")
    .replace(/-+/g,"-")
    .replace(/^-|-$/g,"")
    .toLowerCase();

}


function extension(name){

  const parts =
    name.split(".");

  return parts.length > 1
    ? parts.pop().toLowerCase()
    : "webp";

}


function readFile(file){

  return new Promise(
    (resolve,reject)=>{

      const reader =
        new FileReader();

      reader.onload =
        () => resolve(reader.result);

      reader.onerror =
        () => reject(
          new Error(
            `Unable to read ${file.name}`
          )
        );

      reader.readAsDataURL(file);

    }
  );

}


async function uploadGitHubFile(
  path,
  base64,
  message
){

  let sha = null;

  /*
   * File may not exist yet.
   * A 404 here is normal for a new image.
   */
  try{

    const existing =
      await githubApi(
        `/contents/${path}?ref=main`
      );

    const data =
      await existing.json();

    sha =
      data.sha;

  }catch(error){

    /*
     * Ignore 404 because it means
     * the file is being created for
     * the first time.
     */
    if(
      !String(error.message)
        .includes("404")
    ){

      throw error;

    }

  }


  const body = {

    message,

    content: base64,

    branch: "main"

  };


  /*
   * Existing file requires SHA.
   * New file does not.
   */
  if(sha){

    body.sha =
      sha;

  }


  const response =
    await githubApi(
      `/contents/${path}`,
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


  if(!response.ok){

    throw new Error(
      `Upload failed: ${path}`
    );

  }

}


async function getPosts(){

  const response =
    await githubApi(
      "/contents/data/posts.json?ref=main"
    );

  if(!response.ok){

    throw new Error(
      "Unable to read posts.json"
    );

  }

  const data =
    await response.json();

  const decoded =
    decodeURIComponent(
      escape(
        atob(
          data.content.replace(/\n/g,"")
        )
      )
    );

  return {
    posts:
      JSON.parse(decoded),

    sha:
      data.sha
  };

}


async function savePosts(
  posts,
  sha,
  chapter
){

  const content =
    JSON.stringify(
      posts,
      null,
      2
    );

  const base64 =
    btoa(
      unescape(
        encodeURIComponent(
          content
        )
      )
    );


  const response =
    await githubApi(
      "/contents/data/posts.json",
      {

        method:"PUT",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            message:
              `Publish chapter ${chapter}`,

            content:
              base64,

            sha,

            branch:"main"

          })

      }
    );


  if(!response.ok){

    throw new Error(
      "Unable to update posts.json"
    );

  }

}


uploadForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    try{

      const title =
        uploadTitle.value.trim();

      const chapter =
        uploadChapter.value.trim();

      const language =
        uploadLanguage.value;

      const titleFile =
        newTitleImage.files[0];

      const imageFiles =
        Array.from(
          newChapterImages.files
        );


      if(!titleFile){
        throw new Error(
          "Please select a title image."
        );
      }


      if(!imageFiles.length){
        throw new Error(
          "Please select chapter images."
        );
      }


      uploadButton.disabled = true;

      uploadButton.textContent =
        "Uploading...";


      uploadStatus.textContent =
        "Preparing upload...";

      uploadStatus.className =
        "status";


      const slug =
        makeSlug(
          title,
          chapter
        );


      const folder =
        `images/${slug}`;


      /*
      TITLE IMAGE
      */

      uploadStatus.textContent =
        "Uploading title image...";


      const titleExt =
        extension(
          titleFile.name
        );


      const titlePath =
        `${folder}/title.${titleExt}`;


      const titleData =
        await readFile(
          titleFile
        );


      await uploadGitHubFile(
        titlePath,
        titleData.split(",")[1],
        `Add title image for ${title} ${chapter}`
      );


      /*
      CHAPTER IMAGES
      */

      imageFiles.sort(
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


      const imagePaths = [];


      for(
        let i = 0;
        i < imageFiles.length;
        i++
      ){

        const file =
          imageFiles[i];

        uploadStatus.textContent =
          `Uploading chapter image ${i + 1} of ${imageFiles.length}...`;


        const data =
          await readFile(file);


        const ext =
          extension(file.name);


        const number =
          String(i + 1)
            .padStart(3,"0");


        const path =
          `${folder}/${number}.${ext}`;


        await uploadGitHubFile(
          path,
          data.split(",")[1],
          `Add chapter image ${number} for ${title} ${chapter}`
        );


        imagePaths.push(path);

      }


      /*
      POSTS.JSON
      */

      uploadStatus.textContent =
        "Updating chapter database...";


      const result =
        await getPosts();


      let posts =
        Array.isArray(result.posts)
          ? result.posts
          : [];


      const keywords =
        uploadKeywords.value
          .split(",")
          .map(
            x => x.trim()
          )
          .filter(Boolean);


      const post = {

        title,

        chapter,

        language,

        slug,

        cover:
          titlePath,

        images:
          imagePaths,

        keywords,

        updatedAt:
          new Date().toISOString()

      };


      const existingIndex =
        posts.findIndex(
          item =>
            item.slug === slug
        );


      if(existingIndex >= 0){

        posts[existingIndex] =
          post;

      }else{

        posts.unshift(
          post
        );

      }


      await savePosts(
        posts,
        result.sha,
        chapter
      );


      uploadStatus.textContent =
        existingIndex >= 0
          ? "Chapter updated successfully."
          : "Chapter published successfully.";


      uploadStatus.className =
        "status success";


      uploadButton.textContent =
        existingIndex >= 0
          ? "Chapter Updated"
          : "Chapter Published";


    }catch(error){

      console.error(error);

      uploadStatus.textContent =
        error.message ||
        "Upload failed.";

      uploadStatus.className =
        "status error";


      uploadButton.disabled =
        false;

      uploadButton.textContent =
        "Publish Chapter";

    }

  }
);
