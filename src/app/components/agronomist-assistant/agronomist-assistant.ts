import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AgronomistMessage,
  AgronomistParcelContext,
  FarmerPriority,
  SoilObservation,
} from '@models/index';
import { AgronomistAiService } from '@services/agronomist-ai.service';
import { compressAgronomistImage, CompressedAgronomistImage } from '@utils/image-compress.utils';
import { MarkdownBlock, parseMarkdownBlocks } from '@utils/markdown-blocks.utils';

interface OptionChip<T extends string> {
  value: T;
  label: string;
}

const SOIL_OPTIONS: OptionChip<SoilObservation>[] = [
  { value: 'compacted', label: 'Compactado' },
  { value: 'sandy', label: 'Arenoso' },
  { value: 'low-retention', label: 'Baja retención' },
  { value: 'erosion-prone', label: 'Propenso a erosión' },
  { value: 'saline', label: 'Salino' },
  { value: 'healthy', label: 'Suelo sano' },
];

const PRIORITY_OPTIONS: OptionChip<FarmerPriority>[] = [
  { value: 'water-conservation', label: 'Conservar agua' },
  { value: 'soil-regeneration', label: 'Regenerar suelo' },
  { value: 'heat-resilience', label: 'Resiliencia térmica' },
  { value: 'nitrogen-recovery', label: 'Recuperar nitrógeno' },
  { value: 'yield-stability', label: 'Estabilidad de rendimiento' },
];

@Component({
  selector: 'app-agronomist-assistant',
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './agronomist-assistant.html',
  styleUrl: './agronomist-assistant.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class AgronomistAssistantComponent {
  protected readonly ai = inject(AgronomistAiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly messagesListRef = viewChild<ElementRef<HTMLDivElement>>('messagesList');
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly composerInputRef = viewChild<ElementRef<HTMLTextAreaElement>>('composerInput');

  readonly mode = input<'panel' | 'drawer'>('panel');
  readonly context = input.required<AgronomistParcelContext>();
  readonly active = input<boolean>(true);

  readonly closeDrawer = output<void>();
  readonly expandToPanel = output<void>();
  readonly goToStep = output<'map' | 'crops' | 'recommendations'>();

  protected readonly soilOptions = SOIL_OPTIONS;
  protected readonly priorityOptions = PRIORITY_OPTIONS;

  protected readonly draftText = signal<string>('');
  protected readonly pendingImage = signal<CompressedAgronomistImage | null>(null);
  protected readonly attachmentError = signal<string | null>(null);
  protected readonly isProcessingImage = signal<boolean>(false);
  protected readonly isDragOver = signal<boolean>(false);
  protected readonly showKeyEditor = signal<boolean>(false);
  protected readonly apiKeyInput = signal<string>('');
  protected readonly copiedMessageId = signal<string | null>(null);

  protected readonly parsedMessages = computed<
    { message: AgronomistMessage; blocks: MarkdownBlock[] }[]
  >(() =>
    this.ai.messages().map((message) => ({
      message,
      blocks: message.role === 'model' ? parseMarkdownBlocks(message.text) : [],
    }))
  );

  protected readonly quickPrompts = computed<string[]>(() => {
    const ctx = this.context();
    const limit = this.mode() === 'drawer' ? 3 : 4;

    if (this.pendingImage()) {
      return [
        'Diagnostica posibles plagas, enfermedades o deficiencias nutricionales en esta foto considerando el clima de mi parcela.',
        '¿Qué acciones inmediatas de manejo integrado recomiendas según lo que se ve y el pronóstico de 7 días?',
        '¿Podría ser estrés hídrico o térmico según los datos de NASA POWER?',
      ].slice(0, limit);
    }

    if (ctx.selectedCrop && ctx.cropEvaluation) {
      return [
        `Analiza los riesgos principales para ${ctx.selectedCrop.commonName} con el pronóstico de 7 días y NASA POWER.`,
        '¿Cómo debo ajustar el riego y la cobertura del suelo con el balance hídrico actual?',
        'Dame un calendario práctico de siembra, manejo y fertilización orgánica para este plan de rotación.',
        '¿Por qué esta secuencia de 3 ciclos protege el nitrógeno y reduce plagas en mi parcela?',
      ].slice(0, limit);
    }

    if (ctx.coordinates) {
      return [
        'Según los datos de NASA POWER en esta coordenada, ¿qué 3 cultivos recomiendas priorizar?',
        'Evalúa el riesgo térmico e hídrico de esta ubicación y cómo proteger el suelo.',
        '¿Qué cultivos de cobertura o leguminosas funcionan mejor para iniciar rotación aquí?',
      ].slice(0, limit);
    }

    return [
      '¿Cómo diseño una rotación de 3 ciclos que recupere nitrógeno y conserve agua?',
      '¿Qué cultivos toleran mejor olas de calor y lluvia irregular?',
      '¿Qué síntomas en hojas diferencian déficit de nitrógeno vs estrés hídrico?',
    ].slice(0, limit);
  });

  protected readonly contextBadge = computed<string>(() => {
    const ctx = this.context();
    if (!ctx.coordinates) {
      return 'Consulta general (sin parcela fijada)';
    }
    const location = ctx.locationName?.split(',')[0]?.trim() || `${ctx.coordinates.lat}, ${ctx.coordinates.lon}`;
    if (ctx.selectedCrop && ctx.cropEvaluation) {
      return `${location} · ${ctx.selectedCrop.commonName} (${ctx.cropEvaluation.overallScore}%)`;
    }
    return location;
  });

  constructor() {
    this.ai.loadStatus();

    effect(() => {
      const count = this.ai.messages().length;
      const sending = this.ai.isSending();
      const visible = this.active();
      if (!this.isBrowser || !visible || (count === 0 && !sending)) {
        return;
      }
      requestAnimationFrame(() => {
        const container = this.messagesListRef()?.nativeElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    });

    effect(() => {
      if (this.mode() === 'drawer' && this.active() && this.isBrowser) {
        setTimeout(() => this.composerInputRef()?.nativeElement.focus(), 80);
      }
    });
  }

  protected onEscape(): void {
    if (this.mode() === 'drawer' && this.active()) {
      this.closeDrawer.emit();
    }
  }

  protected openFilePicker(): void {
    this.fileInputRef()?.nativeElement.click();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    await this.attachImageFile(file);
  }

  protected async onPaste(event: ClipboardEvent): Promise<void> {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          await this.attachImageFile(file);
          return;
        }
      }
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  protected onDragLeave(): void {
    this.isDragOver.set(false);
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await this.attachImageFile(file);
    }
  }

  protected clearPendingImage(): void {
    this.pendingImage.set(null);
    this.attachmentError.set(null);
  }

  protected useQuickPrompt(prompt: string): void {
    if (this.ai.isSending()) return;
    if (!this.ai.hasActiveApiKey()) {
      this.draftText.set(prompt);
      this.showKeyEditor.set(true);
      return;
    }
    void this.submitMessage(prompt);
  }

  protected async onSubmit(): Promise<void> {
    await this.submitMessage(this.draftText());
  }

  protected onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.onSubmit();
    }
  }

  protected saveApiKey(): void {
    const val = this.apiKeyInput().trim();
    if (!val) return;
    this.ai.setCustomApiKey(val);
    this.apiKeyInput.set('');
    this.showKeyEditor.set(false);
  }

  protected clearCustomApiKey(): void {
    this.ai.setCustomApiKey('');
    this.apiKeyInput.set('');
  }

  protected async copyMessage(message: AgronomistMessage): Promise<void> {
    if (!this.isBrowser || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(message.text);
      this.copiedMessageId.set(message.id);
      setTimeout(() => {
        if (this.copiedMessageId() === message.id) {
          this.copiedMessageId.set(null);
        }
      }, 2000);
    } catch {
      // Ignore clipboard failures in restricted contexts.
    }
  }

  private async submitMessage(rawText: string): Promise<void> {
    const text = rawText.trim();
    const image = this.pendingImage();
    if ((!text && !image) || this.ai.isSending()) {
      return;
    }

    this.draftText.set('');
    this.pendingImage.set(null);
    this.attachmentError.set(null);

    await this.ai.sendMessage(text, this.context(), image ?? undefined);
  }

  private async attachImageFile(file: File): Promise<void> {
    if (!this.isBrowser) return;
    this.attachmentError.set(null);
    this.isProcessingImage.set(true);
    try {
      const compressed = await compressAgronomistImage(file);
      this.pendingImage.set(compressed);
    } catch (error) {
      this.attachmentError.set(
        error instanceof Error ? error.message : 'No se pudo cargar la imagen.'
      );
    } finally {
      this.isProcessingImage.set(false);
    }
  }
}
