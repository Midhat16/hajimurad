import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

export const dynamic = "force-static";

export async function GET() {
  try {
    const newslettersRef = collection(db, "newsletters");
    const newslettersSnap = await getDocs(newslettersRef);
    let migratedFaqs = 0;
    let migratedArticles = 0;
    const details = [];

    for (const docSnap of newslettersSnap.docs) {
      const data = docSnap.data();
      const docId = docSnap.id;

      if (data.question || data.type === "faq" || data.isFaq) {
        // Move to 'faqs' collection
        await setDoc(doc(db, "faqs", docId), data);
        await deleteDoc(doc(db, "newsletters", docId));
        migratedFaqs++;
        details.push({ id: docId, type: "faq", question: data.question });
      } else if (data.contentHtml || data.type === "article" || data.isArticle) {
        // Move to 'articles' collection
        await setDoc(doc(db, "articles", docId), data);
        await deleteDoc(doc(db, "newsletters", docId));
        migratedArticles++;
        details.push({ id: docId, type: "article", title: data.title });
      }
    }

    // Fetch final collection counts
    const faqsSnap = await getDocs(collection(db, "faqs"));
    const articlesSnap = await getDocs(collection(db, "articles"));
    const remainingNewslettersSnap = await getDocs(collection(db, "newsletters"));

    const faqsList = faqsSnap.docs.map((d) => ({ id: d.id, question: d.data().question, category: d.data().category }));
    const articlesList = articlesSnap.docs.map((d) => ({ id: d.id, title: d.data().title, slug: d.data().slug }));

    return NextResponse.json({
      success: true,
      migratedFaqsCount: migratedFaqs,
      migratedArticlesCount: migratedArticles,
      details,
      finalCollectionState: {
        faqsCollectionCount: faqsSnap.size,
        faqsList,
        articlesCollectionCount: articlesSnap.size,
        articlesList,
        newslettersCollectionCount: remainingNewslettersSnap.size,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
