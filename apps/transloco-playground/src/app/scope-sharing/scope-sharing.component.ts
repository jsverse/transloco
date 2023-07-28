import { Component } from "@angular/core";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
  selector: "app-scope-sharing",
  templateUrl: "./scope-sharing.component.html",
  styleUrls: ["./scope-sharing.component.scss"],
  standalone: true,
  imports: [TranslocoModule]
})
export default class ScopeSharingComponent {}
