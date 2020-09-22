import "carbon-components/css/carbon-components.min.css";

import {
  ExtensionDefinition,
  PageDefinition,
  registerExtension,
} from "@openmrs/esm-extension-manager";
import { registerApplication, start } from "single-spa";
import "@openmrs/esm-styleguide";
import "carbon-components";
import "carbon-icons";
import { setupI18n } from "./locale";
import {
  routePrefix,
  Activator,
  ActivatorDefinition,
  routeRegex,
} from "./helpers";
import { loadModules } from "./system";
import type { SpaConfig } from "./types";

/**
 * Gets the microfrontend modules (apps). These are entries
 * in the import maps that end with "-app".
 * @param maps The value of the "imports" property of the
 * import maps.
 */
function getApps(maps: Record<string, string>) {
  return Object.keys(maps).filter((m) => m.endsWith("-app"));
}

/**
 * Loads the microfrontends (apps). Should be done *after* the
 * import maps initialized, i.e., after modules loaded.
 */
function loadApps() {
  return window.importMapOverrides
    .getCurrentPageMap()
    .then((importMap) => loadModules(getApps(importMap.imports)));
}

/**
 * Normalizes the activator function, i.e., if we receive a
 * string we'll prepend the SPA base (prefix). We'll also handle
 * the case of a supplied array.
 * @param activator The activator to preprocess.
 */
function preprocessActivator(
  activator: ActivatorDefinition | Array<ActivatorDefinition>
): Activator {
  if (Array.isArray(activator)) {
    const activators = activator.map(preprocessActivator);
    return (location) => activators.some((activator) => activator(location));
  } else if (typeof activator === "string") {
    return (location) => routePrefix(activator, location);
  } else if (activator instanceof RegExp) {
    return (location) => routeRegex(activator, location);
  } else {
    return activator;
  }
}

/**
 * Sets up the microfrontends (apps). Uses the defined export
 * from the root modules of the apps, which should export a
 * special function called "setupOpenMRS".
 * This function returns an object that is used to feed Single
 * SPA.
 */
function setupApps(modules: Array<[string, System.Module]>) {
  for (const [appName, appExports] of modules) {
    const setup = appExports.setupOpenMRS;

    if (typeof setup === "function") {
      const result = setup();

      if (result && typeof result === "object") {
        const availableExtensions: Array<ExtensionDefinition> =
          result.extensions ?? [];

        const availablePages: Array<PageDefinition> = result.pages ?? [];

        if (typeof result.activate !== "undefined") {
          availablePages.push({
            load: result.lifecycle,
            route: result.activate,
          });
        }

        for (const { name, load } of availableExtensions) {
          registerExtension(appName, name, load);
        }

        for (const { route, load } of availablePages) {
          registerApplication(appName, load, preprocessActivator(route));
        }
      }
    }
  }
}

/**
 * Runs the shell by importing the translations and starting single SPA.
 */
function runShell() {
  return setupI18n()
    .catch((err) => console.error(`Failed to initialize translations`, err))
    .then(start);
}

/**
 * Initializes the OpenMRS Microfrontend App Shell.
 * @param config The global configuration to apply.
 */
export function initializeSpa(config: SpaConfig) {
  window.openmrsBase = config.openmrsBase;
  window.spaBase = config.spaBase;
  window.getOpenmrsSpaBase = () => `${window.openmrsBase}${window.spaBase}/`;
  return loadApps().then(setupApps).then(runShell).catch(handleInitFailure);
}

function handleInitFailure() {
  if (localStorage.getItem("openmrs:devtools")) {
    renderDevResetButton();
  } else {
    renderApology();
  }
}

function renderApology() {
  const msg = document.createTextNode(
    "Sorry, something has gone as badly as possible"
  );
  document.appendChild(msg);
}

function renderDevResetButton() {
  const btn = document.createElement("button");
  btn.onclick = clearDevOverrides;
  btn.innerHTML = "Reset dev overrides";
  document.body.appendChild(btn);
}

function clearDevOverrides() {
  for (let key of Object.keys(localStorage)) {
    if (
      key.startsWith("import-map-override:") &&
      !["import-map-override:react", "import-map-override:react-dom"].includes(
        key
      )
    ) {
      localStorage.removeItem(key);
    }
  }
  location.reload();
}
