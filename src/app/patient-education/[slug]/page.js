import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { collection, getDocs, query, where, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  ArrowRight,
  Phone,
} from "lucide-react";
import ArticleAppointmentButton from "@/components/ArticleAppointmentButton";

export async function generateStaticParams() {
  try {
    const snap = await getDocs(collection(db, "articles"));
    const params = snap.docs.map((docSnap) => ({
      slug: docSnap.data().slug || docSnap.id,
    }));
    return params.length > 0 ? params : [{ slug: "welcome" }];
  } catch (e) {
    return [{ slug: "welcome" }];
  }
}

export const dynamic = "force-static";

// Helper to fetch article by slug or document ID across articles & newsletters collections
async function getArticleBySlug(slugParam) {
  if (!slugParam) return null;
  const cleanSlug = decodeURIComponent(slugParam).replace(/\/+$/, "").trim();

  try {
    // 1. Query by slug property in articles collection
    try {
      const q = query(
        collection(db, "articles"),
        where("slug", "==", cleanSlug),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    } catch (e) {}

    // 2. Direct doc fetch by ID in articles collection
    try {
      const docSnap = await getDoc(doc(db, "articles", cleanSlug));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (e) {}

    // 3. Scan all docs in articles collection
    try {
      const allSnap = await getDocs(collection(db, "articles"));
      const match = allSnap.docs.find(
        (d) =>
          d.id === cleanSlug ||
          d.data().slug === cleanSlug ||
          d.data().title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") === cleanSlug
      );
      if (match) {
        return { id: match.id, ...match.data() };
      }
    } catch (e) {}

    // 4. Legacy fallback check in newsletters collection
    try {
      const docSnapN = await getDoc(doc(db, "newsletters", cleanSlug));
      if (docSnapN.exists()) {
        return { id: docSnapN.id, ...docSnapN.data() };
      }
    } catch (e) {}
  } catch (err) {
    console.error("Error fetching article by slug:", err);
  }

  return null;
}

// Fetch related articles from same category
async function getRelatedArticles(category, currentId) {
  try {
    let combined = [];

    try {
      const allSnap = await getDocs(collection(db, "articles"));
      allSnap.docs.forEach((d) => combined.push({ id: d.id, ...d.data() }));
    } catch (e) {}

    try {
      const allSnapN = await getDocs(collection(db, "newsletters"));
      allSnapN.docs.forEach((d) => {
        const data = d.data();
        if (data.type === "article" || data.isArticle === true || data.contentHtml) {
          combined.push({ id: d.id, ...data });
        }
      });
    } catch (e) {}

    const uniqueMap = new Map();
    combined.forEach((art) => uniqueMap.set(art.id, art));

    const list = Array.from(uniqueMap.values())
      .filter(
        (a) =>
          (a.status === "Published" || !a.status) &&
          a.id !== currentId &&
          (category ? a.category === category : true)
      );
    return list.slice(0, 3);
  } catch (e) {
    return [];
  }
}

// Generate dynamic SEO metadata per article
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | Haji Murad Eye Hospital Trust",
      description: "Patient education article could not be found.",
    };
  }

  return {
    title: `${article.title} | Haji Murad Eye Hospital Trust`,
    description:
      article.excerpt ||
      `Read ${article.title} - Patient education guide from Haji Murad Eye Hospital Trust in Gujranwala.`,
  };
}

export default async function PatientEducationDetailPage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || article.status === "Draft") {
    notFound();
  }

  const related = await getRelatedArticles(article.category, article.id);

  return (
    <div className="min-h-screen bg-[var(--fog)] py-10 sm:py-16 font-sans">

      {/* Embedded CSS for image sizing and alignment */}
      <style>{`
        .article-content img,
        .article-content img.article-img {
          display: inline-block !important;
          max-width: 100% !important;
          height: auto;
          border-radius: 1.25rem;
          margin: 0.75rem 0.5rem 0.75rem 0;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
          object-fit: cover;
          vertical-align: middle;
        }
        .article-content img.size-small,
        .article-content img[data-size="small"] {
          width: 33.333% !important;
          max-width: 100% !important;
        }
        .article-content img.size-medium,
        .article-content img[data-size="medium"] {
          width: 50% !important;
          max-width: 100% !important;
        }
        .article-content img.size-large,
        .article-content img[data-size="large"] {
          width: 75% !important;
          max-width: 100% !important;
        }
        .article-content img.size-full,
        .article-content img[data-size="full"] {
          width: 100% !important;
        }
        .article-content img.align-center,
        .article-content img[data-align="center"] {
          margin-left: auto !important;
          margin-right: auto !important;
          clear: both !important;
        }
        .article-content img.align-left,
        .article-content img[data-align="left"] {
          float: left !important;
          margin-right: 1.5rem !important;
          margin-bottom: 1rem !important;
        }
        .article-content img.align-right,
        .article-content img[data-align="right"] {
          float: right !important;
          margin-left: 1.5rem !important;
          margin-bottom: 1rem !important;
        }

        /* Orientation / Format Rules */
        .article-content img.shape-horizontal,
        .article-content img[data-orientation="horizontal"] {
          aspect-ratio: 16 / 9 !important;
          object-fit: cover !important;
          max-height: 420px !important;
        }
        .article-content img.shape-vertical,
        .article-content img[data-orientation="vertical"] {
          aspect-ratio: 3 / 4 !important;
          object-fit: cover !important;
          max-height: 480px !important;
        }
        .article-content img.shape-square,
        .article-content img[data-orientation="square"] {
          aspect-ratio: 1 / 1 !important;
          object-fit: cover !important;
          max-height: 380px !important;
        }
        .article-content img.shape-natural,
        .article-content img[data-orientation="natural"] {
          aspect-ratio: auto !important;
          height: auto !important;
          object-fit: contain !important;
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Return Navigation */}
        <div>
          <Link
            href="/patient-education"
            className="inline-flex items-center gap-2 text-xs font-black text-slate-700 hover:text-[var(--iris)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--iris)]" />
            <span>Return to Patient Education</span>
          </Link>
        </div>

        {/* Unified Article Header & Hero Section (NO separate card boxes) */}
        <header className="space-y-4 border-b border-slate-200/80 pb-8">
          {article.category && (
            <span className="inline-block bg-[#1E1433] text-white text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
              {article.category}
            </span>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#2B1F1A] tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[var(--iris)]" />
              <span>Published on {article.publishedAt || "Recently"}</span>
            </div>
            <span>•</span>
            <span className="text-[var(--iris)] font-extrabold">Haji Murad Eye Hospital Trust</span>
          </div>

          {article.excerpt && (
            <p className="text-base sm:text-lg font-semibold text-slate-600 leading-relaxed border-l-4 border-[var(--iris)] pl-4 py-2 bg-white/80 rounded-r-2xl shadow-xs mt-4">
              {article.excerpt}
            </p>
          )}

          {/* Cover Hero Banner Image (if added by Admin) */}
          {article.featuredImage && (
            <div className="pt-4">
              <div className="w-full max-h-[460px] rounded-3xl overflow-hidden shadow-lg border border-slate-200/80">
                <Image
                  src={article.featuredImage}
                  alt={article.title}
                  width={800}
                  height={460}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </header>

        {/* Unified Article Content Column (Flows directly on page without boxed card wrapper) */}
        <main className="max-w-3xl mx-auto py-2">
          <article
            className="article-content prose prose-slate max-w-none text-slate-800 text-base sm:text-lg leading-relaxed font-sans
              [&_h2]:text-2xl [&_h2]:sm:text-3xl [&_h2]:font-extrabold [&_h2]:text-[#1E1433] [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-slate-200/60 [&_h2]:pb-2.5
              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#2B1F1A] [&_h3]:mt-7 [&_h3]:mb-3
              [&_p]:mb-6 [&_p]:text-slate-700 [&_p]:font-medium [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2.5 [&_ul]:my-6 [&_ul]:text-slate-800
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2.5 [&_ol]:my-6 [&_ol]:text-slate-800
              [&_li]:font-medium [&_li]:text-slate-700
              [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--iris)] [&_blockquote]:bg-rose-50/60 [&_blockquote]:p-4 [&_blockquote]:rounded-r-2xl [&_blockquote]:italic [&_blockquote]:my-6"
            dangerouslySetInnerHTML={{ __html: article.contentHtml || "" }}
          />
        </main>

        {/* Bottom CTA Banner */}
        <section className="bg-[#1E1433] text-white p-8 sm:p-10 rounded-3xl text-center space-y-4 shadow-xl mt-12">
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Have Questions About Your Vision or Eye Care Options?
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto font-medium leading-relaxed">
            Consult our expert ophthalmologists at Haji Murad Eye Hospital Trust in Gujranwala for personalized care and diagnostic evaluations.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <ArticleAppointmentButton className="w-full sm:w-auto px-8 py-3.5 text-xs sm:text-sm" />
            <a
              href="tel:03241111691"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm border border-white/20 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#5EEAD4]" />
              <span>Call Helpline (0324-1111691)</span>
            </a>
          </div>
        </section>

        {/* Related Articles Section */}
        {related.length > 0 && (
          <section className="space-y-4 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-black text-[#2B1F1A] flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[var(--iris)]" />
              <span>Related Articles & Guides</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/patient-education/${rel.slug || rel.id}`}
                  className="bg-white p-5 rounded-2xl border border-[var(--line)] shadow-2xs hover:shadow-md hover:border-[var(--iris)] transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[var(--iris)] uppercase tracking-wider block">
                      {rel.category || "General"}
                    </span>
                    <h4 className="text-sm font-extrabold text-[#2B1F1A] group-hover:text-[var(--iris)] transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                  </div>
                  <div className="pt-3 flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--iris)] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
