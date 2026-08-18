const TOKEN_KEY = "kingdom_github_token";

function getToken(){
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token){
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken(){
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("github_owner");
  localStorage.removeItem("github_repo");
}

async function githubRequest(url, options = {}){

  const token = getToken();

  if(!token){
    throw new Error("Please connect GitHub first.");
  }

  return fetch(url,{
    ...options,
    headers:{
      "Accept":"application/vnd.github+json",
      "Authorization":`Bearer ${token}`,
      "X-GitHub-Api-Version":"2022-11-28",
      ...(options.headers || {})
    }
  });
}

async function verifyToken(token){

  const response = await fetch(
    "https://api.github.com/user",
    {
      headers:{
        "Accept":"application/vnd.github+json",
        "Authorization":`Bearer ${token}`,
        "X-GitHub-Api-Version":"2022-11-28"
      }
    }
  );

  if(!response.ok){
    throw new Error("Invalid GitHub token.");
  }

  return response.json();
}

async function verifyRepository(token){

  const owner = window.GITHUB_OWNER;
  const repo = window.GITHUB_REPO;

  if(!owner || !repo){
    throw new Error(
      "GitHub repository could not be detected."
    );
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers:{
        "Accept":"application/vnd.github+json",
        "Authorization":`Bearer ${token}`,
        "X-GitHub-Api-Version":"2022-11-28"
      }
    }
  );

  if(!response.ok){
    throw new Error(
      "Token cannot access this repository."
    );
  }

  const data = await response.json();

  localStorage.setItem(
    "github_owner",
    data.owner.login
  );

  localStorage.setItem(
    "github_repo",
    data.name
  );

  return data;
}

window.githubApi = async function(path, options = {}){

  const owner =
    localStorage.getItem("github_owner") ||
    window.GITHUB_OWNER;

  const repo =
    localStorage.getItem("github_repo") ||
    window.GITHUB_REPO;

  if(!owner || !repo){
    throw new Error(
      "GitHub repository could not be detected."
    );
  }

  const response = await githubRequest(
    `https://api.github.com/repos/${owner}/${repo}${path}`,
    options
  );

  if(!response.ok){

    let message = response.statusText;

    try{
      const data = await response.json();

      if(data.message){
        message = data.message;
      }

    }catch{}

    throw new Error(
      `GitHub API ${response.status}: ${message}`
    );
  }

  return response;
};

const tokenForm =
  document.getElementById("tokenForm");

const tokenInput =
  document.getElementById("githubToken");

const tokenStatus =
  document.getElementById("tokenStatus");

const logoutButton =
  document.getElementById("logoutButton");

const repositoryInfo =
  document.getElementById("repositoryInfo");

function updateRepositoryInfo(){

  if(!repositoryInfo) return;

  const owner =
    localStorage.getItem("github_owner") ||
    window.GITHUB_OWNER ||
    "";

  const repo =
    localStorage.getItem("github_repo") ||
    window.GITHUB_REPO ||
    "";

  repositoryInfo.textContent =
    owner && repo
      ? `${owner}/${repo}`
      : "Repository not detected.";
}

function updateAuthUI(connected){

  if(!tokenForm || !logoutButton) return;

  if(connected){

    tokenForm.classList.add("hidden");
    logoutButton.classList.remove("hidden");

  }else{

    tokenForm.classList.remove("hidden");
    logoutButton.classList.add("hidden");

  }
}

async function connectGitHub(token){

  tokenStatus.textContent =
    "Checking GitHub access...";

  const user =
    await verifyToken(token);

  await verifyRepository(token);

  setToken(token);

  tokenStatus.textContent =
    `Connected as @${user.login}`;

  tokenStatus.className =
    "status success";

  updateRepositoryInfo();
  updateAuthUI(true);

  if(tokenInput){
    tokenInput.value = "";
  }
}

if(tokenForm){

  tokenForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const token =
        tokenInput.value.trim();

      if(!token){

        tokenStatus.textContent =
          "Please enter a GitHub token.";

        tokenStatus.className =
          "status error";

        return;
      }

      try{

        await connectGitHub(token);

      }catch(error){

        clearToken();

        tokenStatus.textContent =
          error.message;

        tokenStatus.className =
          "status error";

        updateAuthUI(false);
      }
    }
  );
}

if(logoutButton){

  logoutButton.addEventListener(
    "click",
    () => {

      clearToken();

      tokenStatus.textContent =
        "GitHub disconnected.";

      tokenStatus.className =
        "status";

      updateRepositoryInfo();
      updateAuthUI(false);
    }
  );
}

if(getToken()){

  verifyToken(getToken())
    .then(async () => {

      try{

        await verifyRepository(
          getToken()
        );

        updateAuthUI(true);
        updateRepositoryInfo();

      }catch{

        clearToken();
        updateAuthUI(false);
        updateRepositoryInfo();

      }

    })
    .catch(() => {

      clearToken();
      updateAuthUI(false);
      updateRepositoryInfo();

    });

}else{

  updateAuthUI(false);
  updateRepositoryInfo();

}
