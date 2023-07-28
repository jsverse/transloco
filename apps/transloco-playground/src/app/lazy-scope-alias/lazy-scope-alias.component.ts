import { Component } from "@angular/core";
import {TranslocoModule, TRANSLOCO_SCOPE, provideTranslocoScope} from "@ngneat/transloco";

@Component({
  selector: "app-lazy-scope-alias",
  templateUrl: "./lazy-scope-alias.component.html",
  styleUrls: ["lazy-scope-alias.component.scss"],
  providers: [
      provideTranslocoScope({ scope: "lazy-scope-alias", alias: "myScopeAlias" })
  ],
  standalone: true,
  imports: [TranslocoModule]
})
export default class LazyScopeAliasComponent {}
