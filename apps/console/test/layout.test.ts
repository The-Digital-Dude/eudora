import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children
}));

vi.mock("@/contexts/sidebar-context", () => ({
  SidebarConfigProvider: ({ children }: { children: React.ReactNode }) => children
}));

vi.mock("@/lib/fonts", () => ({
  inter: {
    className: "inter-class",
    variable: "inter-variable"
  }
}));

describe("console root layout", () => {
  it("suppresses hydration warnings on the document shell", async () => {
    const { default: RootLayout } = await import("../src/app/layout");

    const html = RootLayout({ children: "content" }) as ReactElement<{
      "data-scroll-behavior"?: string;
      suppressHydrationWarning?: boolean;
      children: ReactElement[];
    }>;
    const children = html.props.children;
    const head = children[0] as ReactElement<{
      children: ReactElement<{
        id?: string;
        strategy?: string;
        dangerouslySetInnerHTML: { __html: string };
      }>;
    }>;
    const body = children[1] as ReactElement<{
      suppressHydrationWarning?: boolean;
    }>;
    const hydrationScript = head.props.children;

    expect(html.props["data-scroll-behavior"]).toBe("smooth");
    expect(html.props.suppressHydrationWarning).toBe(true);
    expect(hydrationScript.props.id).toBe("browser-extension-hydration-fix");
    expect(hydrationScript.props.strategy).toBe("beforeInteractive");
    expect(body.props.suppressHydrationWarning).toBe(true);
    expect(hydrationScript.props.dangerouslySetInnerHTML.__html).toContain(
      "cz-shortcut-listen"
    );
    expect(hydrationScript.props.dangerouslySetInnerHTML.__html).toContain(
      "MutationObserver"
    );
  });
});
