import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { TranslocoModule, TranslocoService } from "@ngneat/transloco";

@Component({
  selector: "app-dynamic-translation",
  templateUrl: "./dynamic-translation.component.html",
  styleUrls: ["./dynamic-translation.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule]
})
export default class DynamicTranslationComponent {
  translocoService = inject(TranslocoService);

  updateTitle() {
    this.translocoService.setTranslationKey("home", "New title");
  }

  addNewKey() {
    this.translocoService.setTranslationKey("newKey", "New key");
  }

  addTranslationObj() {
    const newTranslation = {
      newTranslation: {
        title: "New translation title"
      }
    };
    this.translocoService.setTranslation(newTranslation, "en", { merge: true });
  }
}
