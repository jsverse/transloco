import { Route } from "@angular/router";

export const DYNAMIC_TRANSLATION_ROUTES: Route = {
  path: "dynamic-translation",
  loadComponent: () =>
    import("./dynamic-translation.component").then(
      (DynamicTranslationComponent) => DynamicTranslationComponent
    )
};
