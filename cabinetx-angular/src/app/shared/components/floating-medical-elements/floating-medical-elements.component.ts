import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';

const ICONS = ['💊', '🩺', '⚕️', '❤️', '🧬', '🧪', '💉'];

@Component({
  selector: 'app-floating-medical-elements',
  standalone: true,
  imports: [NgFor],
  template: `
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        *ngFor="let item of elements; let i = index"
        class="absolute text-4xl opacity-50 animate-[spin_18s_linear_infinite]"
        [style.left.%]="(i * 13) % 100"
        [style.top.%]="(i * 17) % 100"
        [style.animationDelay.s]="-(i * 0.7)"
      >
        {{ item }}
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingMedicalElementsComponent {
  @Input() count = 18;

  get elements(): string[] {
    return Array.from({ length: this.count }, (_v, i) => ICONS[i % ICONS.length]);
  }
}
