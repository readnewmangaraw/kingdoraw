const siteSettingsForm =
  document.getElementById("siteSettingsForm");

const siteNameInput =
  document.getElementById("siteName");

const siteNameJaInput =
  document.getElementById("siteNameJa");

const descriptionJaInput =
  document.getElementById("descriptionJa");

const siteSettingsStatus =
  document.getElementById("siteSettingsStatus");


function getConfigFile() {

  return fetch(
    "../site.config.js?v=" +
    Date.now()
  )
  .then(response => {

    if (!response.ok) {
      throw new Error(
        "Unable to load site configuration."
      );
    }

    return response.text();

  });

}


function extractConfig(text) {

  const match =
    text.match(
      /window\.KINGDOM_CONFIG\s*=\s*(\{[\s\S]*?\});/
    );

  if (!match) {
    throw new Error(
      "Invalid site.config.js"
    );
  }

  return Function(
    `"use strict"; return (${match[1]})`
  )();

}


async function loadSiteSettings() {

  try {

    const text =
      await getConfigFile();

    const config =
      extractConfig(text);

    siteNameInput.value =
      config.siteName || "";

    siteNameJaInput.value =
      config.siteNameJa || "";

    descriptionJaInput.value =
      config.descriptionJa || "";

  } catch (error) {

    showSiteSettingsStatus(
      error.message,
      "error"
    );

  }

}


siteSettingsForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    try {

      const token =
        sessionStorage.getItem(
          "kingdom_github_token"
        );

      if (!token) {
        throw new Error(
          "Please connect GitHub first."
        );
      }


      const siteName =
        siteNameInput.value.trim();

      const siteNameJa =
        siteNameJaInput.value.trim();

      const descriptionJa =
        descriptionJaInput.value.trim();


      if (!siteName) {
        throw new Error(
          "Website name is required."
        );
      }

      if (!siteNameJa) {
        throw new Error(
          "Japanese website name is required."
        );
      }


      const config = {

        siteName,

        siteNameJa,

        descriptionJa,

        defaultLanguage:
          "Japanese",

        languages: [

          {
            code: "ja",
            name: "日本語"
          },

          {
            code: "en",
            name: "English"
          }

        ]

      };


      const content =
        `window.KINGDOM_CONFIG = ${JSON.stringify(
          config,
          null,
          2
        )};\n`;


      const base64 =
        btoa(
          unescape(
            encodeURIComponent(content)
          )
        );


      const existing =
        await window.githubApi(
          "/contents/site.config.js?ref=main"
        );

      const existingData =
        await existing.json();


      await window.githubApi(
        "/contents/site.config.js",
        {

          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              message:
                "Update website settings",

              content: base64,

              sha:
                existingData.sha,

              branch: "main"

            })

        }
      );


      showSiteSettingsStatus(
        "Website settings saved successfully.",
        "success"
      );


    } catch (error) {

      showSiteSettingsStatus(
        error.message,
        "error"
      );

    }

  }
);


function showSiteSettingsStatus(
  message,
  type
) {

  siteSettingsStatus.textContent =
    message;

  siteSettingsStatus.className =
    `status ${type}`;

}


loadSiteSettings();
