const firefoxAPI = globalThis.browser;
const chromeAPI = globalThis.chrome;
const panelIconPath = "/icons/logo.svg";

function createDevtoolsPanel() {
  if (firefoxAPI?.devtools?.panels?.create) {
    firefoxAPI.devtools.panels
      .create("Playground", panelIconPath, "panel.html")
      .then(() => {
        console.log("Playground 面板已创建");
      })
      .catch((error) => {
        console.error("创建 Playground 面板失败:", error);
      });
    return;
  }

  if (!chromeAPI?.devtools?.panels?.create) {
    console.error("当前浏览器不支持 devtools.panels.create");
    return;
  }

  chromeAPI.devtools.panels.create(
    "Playground",
    panelIconPath,
    "panel.html",
    () => {
      console.log("Playground 面板已创建");
    },
  );
}

createDevtoolsPanel();
