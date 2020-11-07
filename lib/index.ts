export interface SSESubscriptionOptions {
  eventSourceOptions?: {
    withCredentials?: boolean;
    [key: string]: any;
  };
  keepAlive?: {
    eventType?: string;
    intervalMs: number;
  };
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onNext?: (type: string, data: string) => void;
  searchParams?: { [key: string]: string };
  url: string;
}

export class SSESubscription {
  eventSource: EventSource;

  private options: SSESubscriptionOptions;
  private keepAliveTimer?: any;
  private keepAliveLastReceivedAt = Date.now();
  private url: string;

  constructor(options: SSESubscriptionOptions) {
    this.options = options;

    const url = new URL(options.url);
    const searchParams = new URLSearchParams(options.searchParams || {});
    url.search = searchParams.toString();
    this.url = url.toString();

    this.eventSource = this.connect();

    const keepAliveIntervalMs = this.options.keepAlive?.intervalMs;
    if (keepAliveIntervalMs) {
      this.keepAliveTimer = setInterval(() => {
        if (Date.now() - this.keepAliveLastReceivedAt > keepAliveIntervalMs) {
          this.eventSource = this.connect();
        }
      }, 1000);
    }
  }

  private connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const eventSource = new EventSource(this.url, {
      ...(this.options.eventSourceOptions || {}),
    });

    eventSource.addEventListener("message", (event) => {
      if (this.options.onNext) {
        this.options.onNext(event.type, event.data);
      }
    });

    eventSource.addEventListener("error", () => {
      if (this.options.onError) {
        this.options.onError(new Error("Event source error."));
      }
    });

    eventSource.addEventListener(
      this.options.keepAlive?.eventType || "keepAlive",
      () => {
        this.keepAliveLastReceivedAt = Date.now();
      }
    );
    return eventSource;
  }

  get closed(): boolean {
    return false;
  }

  unsubscribe() {
    if (this.keepAliveTimer !== "undefined") {
      clearInterval(this.keepAliveTimer);
    }

    this.eventSource.close();

    if (this.options.onComplete) {
      this.options.onComplete();
    }
  }
}
