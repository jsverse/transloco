import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import {provideTranslocoScope, TranslocoModule} from "@ngneat/transloco";

@Component({
  selector: "app-transpilers",
  templateUrl: "./transpilers.component.html",
  styleUrls: ["./transpilers.component.scss"],
  standalone: true,
  providers: [
      provideTranslocoScope({
          scope: "transpilers/messageformat",
          alias: "mf"
      })
  ],
  imports: [CommonModule, TranslocoModule]
})
export default class TranspilersComponent {
  dynamic = "🦄";
  key = "home";
  userGender = "female";

  changeParam() {
    this.dynamic = this.dynamic === "🦄" ? "🦄🦄🦄" : "🦄";
  }
}
