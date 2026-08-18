(function(){

  const adConfig = {
    "300x250": {
      key: "a8fba384be29ec4a82c34766ea57dbf3",
      width: 300,
      height: 250
    },
    "728x90": {
      key: "00059cdb84be03e73f5ebf5ccbe3604b",
      width: 728,
      height: 90
    },
    "468x60": {
      key: "01a47e18e3f9b47d2cf82803a3e1ce6c",
      width: 468,
      height: 60
    }
  };

  function loadAd(slot){

    if(!slot || slot.dataset.loaded === "1"){
      return;
    }

    const type = slot.dataset.ad;

    if(type === "effective"){

      const script =
        document.createElement("script");

      script.src =
        "https://pl30270976.effectivecpmnetwork.com/1f/8c/68/1f8c68782f3828302f4719d69dfda015.js";

      script.async = true;

      slot.appendChild(script);

      slot.dataset.loaded = "1";

      return;
    }

    const config =
      adConfig[type];

    if(!config){
      return;
    }

    const options =
      document.createElement("script");

    options.textContent =
      "atOptions = " +
      JSON.stringify({
        key: config.key,
        format: "iframe",
        height: config.height,
        width: config.width,
        params: {}
      }) +
      ";";

    slot.appendChild(options);

    const script =
      document.createElement("script");

    script.src =
      "https://www.highperformanceformat.com/" +
      config.key +
      "/invoke.js";

    script.async = true;

    slot.appendChild(script);

    slot.dataset.loaded = "1";
  }


  function loadAds(){

    document
      .querySelectorAll("[data-ad]")
      .forEach(loadAd);

  }


  window.loadKingdomAds =
    loadAds;


  if(document.readyState === "loading"){

    document.addEventListener(
      "DOMContentLoaded",
      loadAds
    );

  }else{

    loadAds();

  }

})();
