export class FortniteNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`Not found: ${path}`);
    this.name = "FortniteNotFoundError";
  }
}

export class FortniteRateLimitError extends Error {
  constructor(public readonly stale: boolean) {
    super("Fortnite Data API rate limited");
    this.name = "FortniteRateLimitError";
  }
}

export class FortniteApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "FortniteApiError";
  }
}
