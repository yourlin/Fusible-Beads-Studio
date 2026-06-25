import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

/**
 * 按当前路由与语言动态维护 <head> 中的 SEO 元信息：
 * title、description、html lang、Open Graph / Twitter 标题与描述、canonical。
 *
 * 这是单页应用，首屏 index.html 提供了静态兜底（默认英文），
 * 本 composable 在客户端导航与语言切换时同步更新这些标签，
 * 让分享卡片与浏览器标题始终与当前页面一致。
 */
export function useSeo(): void {
  const { t, locale } = useI18n();
  const route = useRoute();

  function origin(): string {
    if (typeof window === 'undefined') return '';
    return window.location.origin + (import.meta.env.BASE_URL || '/');
  }

  /** 创建或更新 <meta>，按 name 或 property 匹配。 */
  function setMeta(attr: 'name' | 'property', key: string, content: string): void {
    if (typeof document === 'undefined') return;
    let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  /** 创建或更新 <link rel="canonical">。 */
  function setCanonical(href: string): void {
    if (typeof document === 'undefined') return;
    let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  function apply(): void {
    const seoKey = (route.meta.seoKey as string) || 'home';
    const isZh = locale.value === 'zh';

    const title = t(`seo.${seoKey}Title`);
    const description = t(`seo.${seoKey}Description`);
    const base = origin();
    // route.path 去掉前导斜杠后拼到 base，避免出现重复斜杠。
    const url = base.replace(/\/$/, '') + route.path;

    if (typeof document !== 'undefined') {
      document.title = title;
      document.documentElement.lang = isZh ? 'zh-CN' : 'en';
    }

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:locale', isZh ? 'zh_CN' : 'en_US');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setCanonical(url);
  }

  watch([locale, () => route.fullPath], apply, { immediate: true });
}
