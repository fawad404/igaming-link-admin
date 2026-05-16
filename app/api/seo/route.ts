import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/lib/models/Article";
import { Provider } from "@/lib/models/Provider";
import { License } from "@/lib/models/License";
import { Page } from "@/lib/models/Page";
import { SeoSettings } from "@/lib/models/SeoSettings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const denied = checkPermission(session, "seo:manage");
    if (denied) return denied;

    await connectDB();

    const [articles, providers, licenses, pages, seoRecords] = await Promise.all([
      Article.find({}, "title slug status").lean(),
      Provider.find({}, "name slug isActive").lean(),
      License.find({}, "name slug isActive").lean(),
      Page.find({}, "title slug isVisible").lean(),
      SeoSettings.find({}, "entityType entityId title metaDescription canonicalUrl robots ogTitle ogDescription ogImage focusKeywords sitemapInclude").lean(),
    ]);

    const seoMap = new Map(
      seoRecords.map((s) => [`${s.entityType}:${s.entityId?.toString()}`, s])
    );

    function buildRow(
      entityType: string,
      id: string,
      label: string,
      slug: string,
      status: string
    ) {
      const seo = seoMap.get(`${entityType}:${id}`);
      return {
        entityType,
        entityId: id,
        label,
        slug,
        status,
        seo: seo
          ? {
              hasTitle: !!seo.title,
              hasMetaDesc: !!seo.metaDescription,
              hasCanonical: !!seo.canonicalUrl,
              hasOgTitle: !!seo.ogTitle,
              hasOgImage: !!seo.ogImage,
              robots: seo.robots,
              sitemapInclude: seo.sitemapInclude,
              focusKeywordsCount: (seo.focusKeywords ?? []).length,
            }
          : null,
      };
    }

    const rows = [
      ...articles.map((a) =>
        buildRow("Article", a._id.toString(), (a as { title: string }).title, (a as { slug: string }).slug, (a as { status: string }).status)
      ),
      ...providers.map((p) =>
        buildRow("Provider", p._id.toString(), (p as { name: string }).name, (p as { slug: string }).slug, (p as { isActive: boolean }).isActive ? "active" : "inactive")
      ),
      ...licenses.map((l) =>
        buildRow("License", l._id.toString(), (l as { name: string }).name, (l as { slug: string }).slug, (l as { isActive: boolean }).isActive ? "active" : "inactive")
      ),
      ...pages.map((pg) =>
        buildRow("Page", pg._id.toString(), (pg as { title: string }).title, (pg as { slug: string }).slug, (pg as { isVisible: boolean }).isVisible ? "visible" : "hidden")
      ),
    ];

    return NextResponse.json({ rows, total: rows.length });
  } catch (err) {
    console.error("[seo GET]", err);
    return NextResponse.json({ error: "Failed to load SEO overview" }, { status: 500 });
  }
}
