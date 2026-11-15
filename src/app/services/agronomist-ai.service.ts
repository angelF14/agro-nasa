import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  AgronomistChatMessageDto,
  AgronomistChatRequest,
  AgronomistChatResponse,
  AgronomistImagePayload,
  AgronomistMessage,
  AgronomistParcelContext,
  AgronomistStatusResponse,
  FarmerPriority,
  SoilObservation,
} from '@models/index';
import { catchError, finalize, firstValueFrom, of, tap } from 'rxjs';

const SESSION_KEY_STORAGE = 'agronasa.gemini_api_key';

const WELCOME_MESSAGE: AgronomistMessage = {
  id: 'welcome',
  role: 'model',
  createdAt: new Date().toISOString(),
  text: [
    'Hola, soy **AgroNasa IA**, tu asistente agrónomo con datos de **NASA POWER**, **Open-Meteo** y **FAO EcoCrop**.',
    '',
    '- Pregúntame sobre aptitud climática, riego, balance hídrico (ET₀) o tu secuencia de rotación de 3 ciclos.',
    '- Marca tus observaciones de suelo y prioridades para ajustar las recomendaciones a tu parcela.',
    '- Adjunta una foto de **hojas, tallos, plagas o suelo** para obtener un diagnóstico visual preliminar.',
  ].join('\n'),
};

@Injectable({
  providedIn: 'root',
})
export class AgronomistAiService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private statusLoaded = false;

  readonly messages = signal<AgronomistMessage[]>([WELCOME_MESSAGE]);
  readonly isSending = signal<boolean>(false);
  readonly isDrawerOpen = signal<boolean>(false);

  readonly serverConfigured = signal<boolean>(false);
  readonly statusChecked = signal<boolean>(false);
  readonly defaultModel = signal<string>('gemini-3.6-flash');
  readonly fallbackModel = signal<string>('gemini-3.5-flash-lite');
  readonly customApiKey = signal<string>(this.readStoredApiKey());

  readonly soilObservations = signal<SoilObservation[]>([]);
  readonly priorities = signal<FarmerPriority[]>(['soil-regeneration', 'water-conservation']);
  readonly customFieldNotes = signal<string>('');

  readonly hasActiveApiKey = computed(
    () => this.serverConfigured() || this.customApiKey().trim().length > 0
  );

  loadStatus(force = false): void {
    if (!this.isBrowser || (this.statusLoaded && !force)) {
      return;
    }
    this.statusLoaded = true;

    this.http
      .get<AgronomistStatusResponse>('/api/agronomist/status')
      .pipe(
        tap((status) => {
          this.serverConfigured.set(Boolean(status.configured));
          this.defaultModel.set(status.defaultModel || 'gemini-3.6-flash');
          this.fallbackModel.set(status.fallbackModel || 'gemini-3.5-flash-lite');
          this.statusChecked.set(true);
        }),
        catchError(() => {
          this.statusChecked.set(true);
          return of(null);
        })
      )
      .subscribe();
  }

  openDrawer(): void {
    this.loadStatus();
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  toggleDrawer(): void {
    if (this.isDrawerOpen()) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  setCustomApiKey(rawKey: string): void {
    const trimmed = rawKey.trim();
    this.customApiKey.set(trimmed);
    if (!this.isBrowser) {
      return;
    }
    try {
      if (trimmed) {
        sessionStorage.setItem(SESSION_KEY_STORAGE, trimmed);
      } else {
        sessionStorage.removeItem(SESSION_KEY_STORAGE);
      }
    } catch {
      // Ignore storage access failures in private browsing contexts.
    }
  }

  toggleSoilObservation(observation: SoilObservation): void {
    this.soilObservations.update((curr) =>
      curr.includes(observation)
        ? curr.filter((item) => item !== observation)
        : [...curr, observation]
    );
  }

  togglePriority(priority: FarmerPriority): void {
    this.priorities.update((curr) =>
      curr.includes(priority) ? curr.filter((item) => item !== priority) : [...curr, priority]
    );
  }

  setCustomFieldNotes(notes: string): void {
    this.customFieldNotes.set(notes);
  }

  clearConversation(): void {
    this.messages.set([
      {
        ...WELCOME_MESSAGE,
        id: `welcome-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async sendMessage(
    rawText: string,
    context: AgronomistParcelContext,
    attachment?: AgronomistImagePayload & { dataUrl: string }
  ): Promise<void> {
    const text = rawText.trim();
    if ((!text && !attachment) || this.isSending()) {
      return;
    }

    const userMessage: AgronomistMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text || 'Analiza esta imagen agrícola considerando el contexto de mi parcela.',
      createdAt: new Date().toISOString(),
      imagePreview: attachment
        ? {
            name: attachment.name,
            mimeType: attachment.mimeType,
            dataUrl: attachment.dataUrl,
          }
        : undefined,
    };

    const currentHistory = this.messages().filter((m) => !m.isError && m.id !== 'welcome');
    const dtoMessages: AgronomistChatMessageDto[] = [
      ...currentHistory.map((m) => ({
        role: m.role,
        text: m.text,
      })),
      {
        role: 'user',
        text: userMessage.text,
        image: attachment
          ? {
              name: attachment.name,
              mimeType: attachment.mimeType,
              dataBase64: attachment.dataBase64,
            }
          : undefined,
      },
    ];

    this.messages.update((curr) => [...curr, userMessage]);
    this.isSending.set(true);

    const requestBody: AgronomistChatRequest = {
      messages: dtoMessages,
      context,
    };

    let headers = new HttpHeaders();
    const key = this.customApiKey().trim();
    if (key) {
      headers = headers.set('x-gemini-api-key', key);
    }

    try {
      const response = await firstValueFrom(
        this.http
          .post<AgronomistChatResponse>('/api/agronomist/chat', requestBody, { headers })
          .pipe(finalize(() => this.isSending.set(false)))
      );

      const assistantMessage: AgronomistMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: response.reply,
        createdAt: new Date().toISOString(),
        model: response.model,
        usedFallback: response.usedFallback,
      };
      this.messages.update((curr) => [...curr, assistantMessage]);
    } catch (error) {
      this.isSending.set(false);
      const errorMessage: AgronomistMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: this.extractErrorMessage(error),
        createdAt: new Date().toISOString(),
        isError: true,
      };
      this.messages.update((curr) => [...curr, errorMessage]);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as { error?: string } | string | null;
      if (typeof apiError === 'object' && apiError?.error) {
        return apiError.error;
      }
      if (typeof apiError === 'string' && apiError.trim()) {
        return apiError;
      }
      if (error.status === 0) {
        return 'No se pudo contactar al servidor de AgroNasa para consultar a Gemini. Verifica que el servidor SSR esté activo.';
      }
    }
    return 'Ocurrió un error al consultar al Asistente Agrónomo IA. Intenta de nuevo en unos segundos.';
  }

  private readStoredApiKey(): string {
    if (!this.isBrowser) {
      return '';
    }
    try {
      return sessionStorage.getItem(SESSION_KEY_STORAGE) ?? '';
    } catch {
      return '';
    }
  }
}
