import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  AgronomistChatMessageDto,
  AgronomistChatRequest,
  AgronomistChatResponse,
  AgronomistImagePayload,
  AgronomistMessage,
  AgronomistParcelContext,
  AgronomistResolvedServiceCard,
  AgronomistStatusResponse,
  ClimateSummary,
  Coordinates,
  Crop,
  FarmerPriority,
  SoilObservation,
  WeatherForecast,
} from '@models/index';
import { detectQueryLanguage } from '@utils/agronomist-query-parser.utils';
import { catchError, finalize, firstValueFrom, of, tap } from 'rxjs';
import { AgronomistQueryResolverService } from './agronomist-query-resolver.service';

export interface DashboardStateBridge {
  getState: () => {
    coordinates: Coordinates | null;
    locationName: string;
    climateSummary: Partial<ClimateSummary> | null;
    weatherForecast: WeatherForecast | null;
    selectedCrop: Crop | null;
  };
  applyState: (updated: {
    coordinates: Coordinates | null;
    locationName: string;
    climateSummary: Partial<ClimateSummary> | null;
    weatherForecast: WeatherForecast | null;
    selectedCrop: Crop | null;
  }) => void;
}

const WELCOME_MESSAGE: AgronomistMessage = {
  id: 'welcome',
  role: 'model',
  createdAt: new Date().toISOString(),
  text: [
    'Hola, soy **AgroHelper Superinteligencia**, tu superinteligencia agronómica conectada en vivo con **NASA POWER**, **Open-Meteo** y **FAO EcoCrop**.',
    '',
    '- **Menciona un lugar y una semilla** en **español o inglés** (ej. *"Quiero sembrar maíz en Comayagua, Honduras"* o *"I want to plant corn in Iowa"*) y buscaré automáticamente el clima satelital, pronóstico y plan de rotación.',
    '- Pregúntame en **español o inglés** sobre aptitud climática, riego, balance hídrico (ET₀) o tu secuencia de rotación de 3 ciclos.',
    '- Adjunta una foto de **hojas, tallos, plagas o suelo** para obtener un diagnóstico visual preliminar.',
  ].join('\n'),
};

@Injectable({
  providedIn: 'root',
})
export class AgronomistAiService {
  private readonly http = inject(HttpClient);
  private readonly queryResolver = inject(AgronomistQueryResolverService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private statusLoaded = false;
  private dashboardBridge: DashboardStateBridge | null = null;

  readonly messages = signal<AgronomistMessage[]>([WELCOME_MESSAGE]);
  readonly isSending = signal<boolean>(false);
  readonly progressLabel = signal<string | null>(null);
  readonly isDrawerOpen = signal<boolean>(false);

  readonly serverConfigured = signal<boolean>(false);
  readonly statusChecked = signal<boolean>(false);
  readonly defaultModel = signal<string>('gemini-3.6-flash');
  readonly fallbackModel = signal<string>('gemini-3.5-flash-lite');

  readonly soilObservations = signal<SoilObservation[]>([]);
  readonly priorities = signal<FarmerPriority[]>(['soil-regeneration', 'water-conservation']);
  readonly customFieldNotes = signal<string>('');

  registerDashboardBridge(bridge: DashboardStateBridge): void {
    this.dashboardBridge = bridge;
  }

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
        }),
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

  toggleSoilObservation(observation: SoilObservation): void {
    this.soilObservations.update((curr) =>
      curr.includes(observation)
        ? curr.filter((item) => item !== observation)
        : [...curr, observation],
    );
  }

  togglePriority(priority: FarmerPriority): void {
    this.priorities.update((curr) =>
      curr.includes(priority) ? curr.filter((item) => item !== priority) : [...curr, priority],
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
    attachment?: AgronomistImagePayload & { dataUrl: string },
  ): Promise<void> {
    const text = rawText.trim();
    if ((!text && !attachment) || this.isSending()) {
      return;
    }

    const currentHistory = this.messages().filter(
      (m) => !m.isError && m.id !== 'welcome' && !m.id.startsWith('welcome-')
    );
    let historyLanguage: 'es' | 'en' = 'es';
    for (let i = 0; i < currentHistory.length; i++) {
      const prev = currentHistory[i];
      if (prev.role === 'user' && prev.text) {
        historyLanguage = detectQueryLanguage(prev.text, historyLanguage);
      }
    }
    const activeLanguage = detectQueryLanguage(text, historyLanguage);

    const userMessage: AgronomistMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text:
        text ||
        (activeLanguage === 'en'
          ? 'Analyze this agricultural image considering my parcel context.'
          : 'Analiza esta imagen agrícola considerando el contexto de mi parcela.'),
      createdAt: new Date().toISOString(),
      imagePreview: attachment
        ? {
            name: attachment.name,
            mimeType: attachment.mimeType,
            dataUrl: attachment.dataUrl,
          }
        : undefined,
    };

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
    this.progressLabel.set(
      activeLanguage === 'en' ? 'Analyzing query...' : 'Analizando consulta...'
    );

    let effectiveContext = context;
    let resolvedCard: AgronomistResolvedServiceCard | undefined;

    if (text && this.dashboardBridge) {
      try {
        const liveState = this.dashboardBridge.getState();
        const recentUserTexts = currentHistory.filter((m) => m.role === 'user').map((m) => m.text);

        const resolution = await this.queryResolver.resolveFromMessage(
          text,
          {
            ...liveState,
            soilObservations: this.soilObservations(),
            priorities: this.priorities(),
            customNotes: this.customFieldNotes(),
          },
          (label) => this.progressLabel.set(label),
          recentUserTexts,
          (immediateState) => this.dashboardBridge?.applyState(immediateState),
        );

        effectiveContext = resolution.context;
        resolvedCard = resolution.resolvedCard;

        if (resolution.stateChanged) {
          this.dashboardBridge.applyState(resolution.updatedState);
        }
      } catch {
        // Fallback to existing context if service resolution encounters an error.
      }
    }

    this.progressLabel.set(
      activeLanguage === 'en'
        ? 'Generating recommendation with AgroNasa Superintelligence...'
        : 'Generando recomendación con Superinteligencia Gemini...'
    );

    const requestBody: AgronomistChatRequest = {
      messages: dtoMessages,
      context: effectiveContext,
    };

    try {
      const response = await firstValueFrom(
        this.http
          .post<AgronomistChatResponse>('/api/agronomist/chat', requestBody)
          .pipe(
            finalize(() => {
              this.isSending.set(false);
              this.progressLabel.set(null);
            }),
          ),
      );

      const { cleanReply, detectedLocation, detectedSeed } = this.extractDetectedEntitiesTag(
        response.reply,
      );

      if (this.dashboardBridge && (detectedLocation || detectedSeed)) {
        try {
          const postState = this.dashboardBridge.getState();
          const postResolution = await this.queryResolver.resolveExplicitEntities(
            detectedLocation,
            detectedSeed,
            {
              ...postState,
              soilObservations: this.soilObservations(),
              priorities: this.priorities(),
              customNotes: this.customFieldNotes(),
            },
            activeLanguage
          );
          if (postResolution && postResolution.stateChanged) {
            this.dashboardBridge.applyState(postResolution.updatedState);
            resolvedCard = postResolution.resolvedCard ?? resolvedCard;
          }
        } catch {
          // Ignore post-flight resolution errors.
        }
      }

      const assistantMessage: AgronomistMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: cleanReply,
        createdAt: new Date().toISOString(),
        model: response.model,
        usedFallback: response.usedFallback,
        resolvedCard,
      };
      this.messages.update((curr) => [...curr, assistantMessage]);
    } catch (error) {
      this.isSending.set(false);
      this.progressLabel.set(null);
      const errorMessage: AgronomistMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: this.extractErrorMessage(error, activeLanguage),
        createdAt: new Date().toISOString(),
        isError: true,
      };
      this.messages.update((curr) => [...curr, errorMessage]);
    }
  }

  private extractDetectedEntitiesTag(rawReply: string): {
    cleanReply: string;
    detectedLocation?: string;
    detectedSeed?: string;
  } {
    const tagRegex =
      /\[\[AGRONASA_DETECTED:\s*(?:lugar|location|place)="([^"]*)"\s*\|\s*(?:semilla|seed|crop)="([^"]*)"\s*\]\]/gi;
    let detectedLocation: string | undefined;
    let detectedSeed: string | undefined;

    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(rawReply)) !== null) {
      if (match[1]?.trim()) {
        detectedLocation = match[1].trim();
      }
      if (match[2]?.trim()) {
        detectedSeed = match[2].trim();
      }
    }

    const cleanReply = rawReply
      .replace(tagRegex, '')
      .replace(/\[\[AGRONASA_DETECTED:[^\]]*\]\]/gi, '')
      .trim();
    return { cleanReply, detectedLocation, detectedSeed };
  }

  private extractErrorMessage(error: unknown, lang: 'es' | 'en' = 'es'): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as { error?: string } | string | null;
      if (typeof apiError === 'object' && apiError?.error) {
        return apiError.error;
      }
      if (typeof apiError === 'string' && apiError.trim()) {
        return apiError;
      }
      if (error.status === 0) {
        return lang === 'en'
          ? 'Could not reach the AgroNasa server to query the Agronomic Superintelligence. Please verify the server is running.'
          : 'No se pudo contactar al servidor de AgroNasa para consultar a la Superinteligencia. Verifica que el servidor SSR esté activo.';
      }
    }
    return lang === 'en'
      ? 'An error occurred while querying the Agronomic Superintelligence. Please try again in a few seconds.'
      : 'Ocurrió un error al consultar a la Superinteligencia Agrónoma. Intenta de nuevo en unos segundos.';
  }
}
