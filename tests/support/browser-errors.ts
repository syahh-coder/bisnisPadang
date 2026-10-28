import type { Page } from "@playwright/test";

export async function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  // window.error/unhandledrejection mengukur exception aplikasi. WebKit juga
  // mengirim pembatalan prefetch saat navigasi sebagai Playwright pageerror,
  // tanpa window.error: https://github.com/microsoft/playwright/issues/43120.
  await page.exposeFunction("reportRuntimeError", (message: string) => { errors.push(message); });
  await page.addInitScript(() => {
    const report = (message: string) => {
      const target = window as unknown as { reportRuntimeError: (message: string) => Promise<void> };
      void target.reportRuntimeError(message).catch(() => {});
    };
    window.addEventListener("error", (event) => report(event.message));
    window.addEventListener("unhandledrejection", (event) => report(String(event.reason)));
  });
  return errors;
}
