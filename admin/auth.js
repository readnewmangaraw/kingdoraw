(function(){

  if(window.KINGDOM_AUTH_INITIALIZED){
    return;
  }

  window.KINGDOM_AUTH_INITIALIZED = true;

  const AUTH = {};

  const TOKEN_KEY =
    "kingdom_github_token";

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

    const parts =
      location.pathname
        .replace(/^\/+/, "")
        .split("/")
        .filter(Boolean);

    if(!host.endsWith(".github.io")){
      throw new Error(
        "Repository not detected."
      );
    }

    const owner =
      host.split(".")[0];

    const repo =
      parts[0];

    if(!owner || !repo){
      throw new Error(
        "Repository not detected."
      );
    }

    return {
      owner: owner,
      repo: repo
    };
  };


  AUTH.githubApi = async function(
    path,
    options = {}
  ){

    const token =
      AUTH.getToken();

    if(!token){
      throw new Error(
        "GitHub token is missing."
      );
    }

    const repository =
      AUTH.getRepository();

    return fetch(
      "https://api.github.com/repos/" +
      repository.owner +
      "/" +
      repository.repo +
      path,
      {
        ...options,

        headers:{
          "Accept":
            "application/vnd.github+json",

          "Authorization":
            "Bearer " + token,

          "X-GitHub-Api-Version":
            "2022-11-28",

          ...(options.headers || {})
        }
      }
    );
  };


  window.KINGDOM_AUTH =
    AUTH;

  window.githubApi =
    AUTH.githubApi;


  function showStatus(
    message,
    type
  ){

    const element =
      document.getElementById(
        "connectionStatus"
      );

    if(!element){
      return;
    }

    element.textContent =
      message;

    element.className =
      "status " + type;
  }


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

    if(!tokenInput || !connectBtn){
      return;
    }


    connectBtn.onclick =
      async function(){

        const token =
          tokenInput.value.trim();

        if(!token){

          showStatus(
            "Enter your GitHub token.",
            "error"
          );

          return;
        }


        try{

          AUTH.setToken(token);

          const response =
            await AUTH.githubApi(
              "/contents/data/posts.json?ref=main"
            );

          if(!response.ok){

            const data =
              await response.json()
                .catch(() => ({}));

            throw new Error(
              "GitHub API " +
              response.status +
              ": " +
              (data.message || "Request failed")
            );

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

          showStatus(
            "✓ GitHub connected successfully.",
            "success"
          );

          window.dispatchEvent(
            new Event(
              "github-connected"
            )
          );

        }catch(error){

          AUTH.clearToken();

          showStatus(
            error.message,
            "error"
          );

        }

      };


    if(logoutBtn){

      logoutBtn.onclick =
        function(){

          AUTH.clearToken();

          location.reload();

        };

    }


    if(AUTH.getToken()){

      AUTH.githubApi(
        "/contents/data/posts.json?ref=main"
      )
      .then(function(response){

        if(!response.ok){
          throw new Error(
            "GitHub session expired."
          );
        }

        connectBtn.classList.add(
          "hidden"
        );

        if(logoutBtn){

          logoutBtn.classList.remove(
            "hidden"
          );

        }

        showStatus(
          "✓ GitHub session restored.",
          "success"
        );

        window.dispatchEvent(
          new Event(
            "github-connected"
          )
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
