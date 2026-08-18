(function(){

const AUTH = window.KINGDOM_AUTH = window.KINGDOM_AUTH || {};

const TOKEN_KEY = "kingdom_github_token";

AUTH.getToken = function(){
  return localStorage.getItem(TOKEN_KEY) || "";
};

AUTH.setToken = function(token){
  localStorage.setItem(TOKEN_KEY, token);
};

AUTH.clearToken = function(){
  localStorage.removeItem(TOKEN_KEY);
};

AUTH.getRepository = function(){

  const host =
    location.hostname;

  const path =
    location.pathname;

  if(!host.endsWith(".github.io")){
    throw new Error("Repository not detected.");
  }

  const owner =
    host.split(".")[0];

  const parts =
    path
      .replace(/^\/+/, "")
      .split("/")
      .filter(Boolean);

  const repo =
    parts[0];

  if(!owner || !repo){
    throw new Error("Repository not detected.");
  }

  return {
    owner,
    repo
  };
};

AUTH.githubApi = async function(path, options = {}){

  const token =
    AUTH.getToken();

  if(!token){
    throw new Error(
      "GitHub token is missing."
    );
  }

  const repository =
    AUTH.getRepository();

  const response =
    await fetch(
      `https://api.github.com/repos/${repository.owner}/${repository.repo}${path}`,
      {
        ...options,

        headers:{
          "Accept":
            "application/vnd.github+json",

          "Authorization":
            `Bearer ${token}`,

          "X-GitHub-Api-Version":
            "2022-11-28",

          ...(options.headers || {})
        }
      }
    );

  if(!response.ok){

    let message =
      response.statusText;

    try{

      const data =
        await response.json();

      if(data.message){
        message =
          data.message;
      }

    }catch{}

    throw new Error(
      `GitHub API ${response.status}: ${message}`
    );
  }

  return response;
};


window.githubApi =
  AUTH.githubApi;


/* --------------------------------
   LOGIN UI
-------------------------------- */

function initLogin(){

  const tokenInput =
    document.getElementById(
      "githubToken"
    );

  const connectBtn =
    document.getElementById(
      "connectBtn"
    );

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );

  const status =
    document.getElementById(
      "connectionStatus"
    );


  if(!tokenInput || !connectBtn){
    return;
  }


  async function connect(){

    const token =
      tokenInput.value.trim();

    if(!token){

      if(status){
        status.textContent =
          "Enter your GitHub token.";
        status.className =
          "status error";
      }

      return;
    }


    try{

      AUTH.setToken(token);

      const response =
        await AUTH.githubApi(
          "/contents/data/posts.json?ref=main"
        );

      if(!response.ok){
        throw new Error(
          "GitHub connection failed."
        );
      }


      if(status){

        status.textContent =
          "✓ GitHub connected successfully.";

        status.className =
          "status success";

      }


      tokenInput.value = "";

      connectBtn.classList.add(
        "hidden"
      );


      if(logoutBtn){

        logoutBtn.classList.remove(
          "hidden"
        );

      }


      window.dispatchEvent(
        new Event("github-connected")
      );

    }catch(error){

      AUTH.clearToken();

      if(status){

        status.textContent =
          error.message;

        status.className =
          "status error";

      }

    }

  }


  connectBtn.onclick =
    connect;


  if(logoutBtn){

    logoutBtn.onclick = function(){

      AUTH.clearToken();

      location.reload();

    };

  }


  if(AUTH.getToken()){

    AUTH.githubApi(
      "/contents/data/posts.json?ref=main"
    )
    .then(function(){

      if(status){

        status.textContent =
          "✓ GitHub session restored.";

        status.className =
          "status success";

      }

      connectBtn.classList.add(
        "hidden"
      );

      if(logoutBtn){

        logoutBtn.classList.remove(
          "hidden"
        );

      }

      window.dispatchEvent(
        new Event("github-connected")
      );

    })
    .catch(function(){

      AUTH.clearToken();

    });

  }

}


if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initLogin,
    {once:true}
  );

}else{

  initLogin();

}

})();
