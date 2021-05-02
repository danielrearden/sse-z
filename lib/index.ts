export interface SubscriptionOptions {
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
  onNext?: (data: string) => void;
  searchParams?: { [key: string]: string };
  url: string;
}

export class Subscription {
  eventSource: EventSource;

  private options: SubscriptionOptions;
  private keepAliveTimer?: any;
  private keepAliveLastReceivedAt = Date.now();
  private url: string;

  constructor(options: SubscriptionOptions) {
    this.options = options;

    const searchParams = new URLSearchParams(
      Object.entries(options.searchParams || {}).reduce(
        (accumulator, [key, value]) =>
          value === undefined
            ? accumulator
            : ((accumulator[key] = value), accumulator),
        {} as { [key: string]: any }
      )
    );

    this.url = `${options.url}?${searchParams.toString()}`;

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
        this.options.onNext(event.data);
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
