import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { TranslocoModule } from "@ngneat/transloco";

@Component({
  selector: "app-on-push",
  templateUrl: "./on-push.component.html",
  styleUrls: ["./on-push.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, TranslocoModule]
})
export class OnPushComponent {
  dynamic = "🦄";
  key = "home";

  translateList = ["b", "c"];

  changeKey() {
    this.key = this.key === "home" ? "fromList" : "home";
  }

  changeParam() {
    this.dynamic = this.dynamic === "🦄" ? "🦄🦄🦄" : "🦄";
  }
}
