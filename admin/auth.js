const TOKEN_KEY = "kingdom_github_token";

const tokenInput =
  document.getElementById("githubToken");

const connectBtn =
  document.getElementById("connectBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const connectionStatus =
  document.getElementById("connectionStatus");


function getToken(){
  return localStorage.getItem(TOKEN_KEY) || "";
}


function setToken(token){
  localStorage.setItem(
    TOKEN_KEY,
    token
  );
}


function clearToken(){
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("github_owner");
  localStorage.removeItem("github_repo");
}


function detectRepository(){

  const host = location.hostname;
  const path = location.pathname;

  if(!host.endsWith(".github.io")){
    throw new Error(
      "This admin must run on GitHub Pages."
    );
  }

  const owner =
    host.replace(".github.io", "");

  const parts =
    path.split("/").filter(Boolean);

  if(!parts.length){
    throw new Error(
      "GitHub repository could not be detected."
    );
  }

  const repo =
    parts[0];

  return {
    owner,
    repo
  };
}

const repository =
  detectRepository();


const OWNER =
  repository.owner;

const REPO =
  repository.repo;


window.GITHUB_OWNER =
  OWNER;

window.GITHUB_REPO =
  REPO;


async function githubApi(
  path,
  options = {}
){

  const token =
    getToken();

  if(!token){

    throw new Error(
      "GitHub token is missing."
    );

  }


  const response =
    await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}${path}`,
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

}


window.githubApi =
  githubApi;


window.github =
  githubApi;


function showSuccess(message){

  if(!connectionStatus)
    return;

  connectionStatus.textContent =
    message;

  connectionStatus.className =
    "status success";

}


function showError(message){

  if(!connectionStatus)
    return;

  connectionStatus.textContent =
    message;

  connectionStatus.className =
    "status error";

}


function updateUI(
  connected,
  username = ""
){

  if(!connectBtn || !logoutBtn)
    return;


  if(connected){

    connectBtn.classList.add(
      "hidden"
    );

    logoutBtn.classList.remove(
      "hidden"
    );

    showSuccess(
      `✓ Connected as @${username} | Repository: ${OWNER}/${REPO}`
    );

  }else{

    connectBtn.classList.remove(
      "hidden"
    );

    logoutBtn.classList.add(
      "hidden"
    );

    if(connectionStatus){

      connectionStatus.textContent =
        "Not connected.";

      connectionStatus.className =
        "status";

    }

  }

}


async function verifyToken(
  token
){

  const response =
    await fetch(
      "https://api.github.com/user",
      {
        headers:{
          "Accept":
            "application/vnd.github+json",

          "Authorization":
            `Bearer ${token}`,

          "X-GitHub-Api-Version":
            "2022-11-28"
        }
      }
    );


  if(!response.ok){

    throw new Error(
      "Invalid GitHub token."
    );

  }


  return response.json();

}


async function verifyRepository(
  token
){

  const response =
    await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}`,
      {
        headers:{
          "Accept":
            "application/vnd.github+json",

          "Authorization":
            `Bearer ${token}`,

          "X-GitHub-Api-Version":
            "2022-11-28"
        }
      }
    );


  if(!response.ok){

    if(response.status === 404){

      throw new Error(
        `Token cannot access ${OWNER}/${REPO}.`
      );

    }

    throw new Error(
      `Repository check failed: ${response.status}`
    );

  }


  return response.json();

}


async function connectGitHub(){

  const token =
    tokenInput
      ? tokenInput.value.trim()
      : "";


  if(!token){

    showError(
      "Enter your GitHub token."
    );

    return;

  }


  if(connectBtn){

    connectBtn.disabled =
      true;

    connectBtn.textContent =
      "Connecting...";

  }


  try{

    showSuccess(
      "Checking GitHub token..."
    );


    const user =
      await verifyToken(token);


    showSuccess(
      `Token valid. Checking ${OWNER}/${REPO}...`
    );


    await verifyRepository(
      token
    );


    setToken(token);


    updateUI(
      true,
      user.login
    );


    if(tokenInput){
      tokenInput.value = "";
    }


    window.dispatchEvent(
      new Event("github-connected")
    );


  }catch(error){

    clearToken();

    updateUI(false);

    showError(
      `❌ ${error.message}`
    );


  }finally{

    if(connectBtn){

      connectBtn.disabled =
        false;

      connectBtn.textContent =
        "Connect GitHub";

    }

  }

}


if(connectBtn){

  connectBtn.addEventListener(
    "click",
    connectGitHub
  );

}


if(logoutBtn){

  logoutBtn.addEventListener(
    "click",
    () => {

      clearToken();

      updateUI(false);

      window.dispatchEvent(
        new Event("github-disconnected")
      );

    }
  );

}


async function restoreLogin(){

  const token =
    getToken();


  if(!token){

    updateUI(false);

    return;

  }


  try{

    const user =
      await verifyToken(token);


    await verifyRepository(
      token
    );


    updateUI(
      true,
      user.login
    );


    window.dispatchEvent(
      new Event("github-connected")
    );


  }catch{

    clearToken();

    updateUI(false);

  }

}


restoreLogin();
