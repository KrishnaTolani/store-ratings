type ErrorReportingOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type ErrorEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: ErrorReportingOptions,
  ) => void;
};

declare global {
  interface Window {
    __appErrorEvents?: ErrorEvents;
    __appReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
    // kept for backward compat with editor preview hooks
    __lovableEvents?: ErrorEvents;
    __lovableReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const ctx = {
    source: "react_error_boundary",
    route: window.location.pathname,
    ...context,
  };
  const opts: ErrorReportingOptions = {
    mechanism: "react_error_boundary",
    handled: false,
    severity: "error",
  };

  window.__appErrorEvents?.captureException?.(error, ctx, opts);
  // Forward to editor preview hook if present
  window.__lovableEvents?.captureException?.(error, ctx, opts);

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const payload = { message, ...(stack !== undefined && { stack }), filename: window.location.pathname };

  window.__appReportRuntimeError?.(payload);
  window.__lovableReportRuntimeError?.(payload);
}
