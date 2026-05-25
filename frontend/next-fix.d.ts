declare module 'next/navigation' {
    export interface NavigateOptions {
        scroll?: boolean;
    }
    
    export interface AppRouterInstance {
        back(): void;
        forward(): void;
        refresh(): void;
        push(href: string, options?: NavigateOptions): void;
        replace(href: string, options?: NavigateOptions): void;
        prefetch(href: string, options?: NavigateOptions): void;
    }

    export function useRouter(): AppRouterInstance;
    export function usePathname(): string;
    export function useSearchParams(): any;
    export function useParams(): Record<string, string | string[]>;
}

declare module 'next/link' {
    import { ComponentType, AnchorHTMLAttributes } from 'react';
    export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
        href: string;
        as?: string;
        replace?: boolean;
        scroll?: boolean;
        shallow?: boolean;
        passHref?: boolean;
        prefetch?: boolean;
    }
    const Link: ComponentType<LinkProps>;
    export default Link;
}

declare module 'next/server' {
    export class NextResponse extends Response {
        static json(body: any, init?: ResponseInit): NextResponse;
        static redirect(url: string | URL, status?: number): NextResponse;
        static next(init?: any): NextResponse;
        static rewrite(url: string | URL, init?: any): NextResponse;
        cookies: any;
    }
    export class NextRequest extends Request {
        nextUrl: URL;
        cookies: any;
    }
}

declare module 'next/headers' {
    export function headers(): any;
    export function cookies(): any;
}

declare module 'next/font/google' {
    export function Inter(options?: any): any;
    export function Outfit(options?: any): any;
    export function Roboto(options?: any): any;
    export function Geist(options?: any): any;
    export function Geist_Mono(options?: any): any;
}

declare module 'next' {
    const next: any;
    export default next;
    export type Metadata = any;
    export namespace MetadataRoute {
        export type Sitemap = any;
    }
}

declare module 'next/types.js' {
    export type ResolvingMetadata = any;
    export type ResolvingViewport = any;
}

declare module 'next/server.js' {
    export * from 'next/server';
}

declare module 'next/font/local' {
    export default function localFont(options: any): any;
}
