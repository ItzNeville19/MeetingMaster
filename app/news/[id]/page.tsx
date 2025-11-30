'use client';

import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { newsArticles, getCategoryColor } from '../articles-data';

export default function ArticlePage() {
  const params = useParams();
  const articleId = params?.id as string;
  const article = newsArticles.find(a => a.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#1d1d1f] mb-4">Article Not Found</h1>
            <p className="text-[#424245] mb-8">The article you're looking for doesn't exist.</p>
            <Link href="/news" className="text-red-600 hover:underline inline-flex items-center gap-2 font-semibold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to News
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="pt-20 pb-20">
        {/* Fox News Style Header Bar - Always Visible */}
        <div className="fixed top-14 left-0 right-0 z-40 bg-red-600 text-white py-2 border-b-4 border-blue-600">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg">LIFEØS NEWS</span>
                <span className="text-sm">|</span>
                <span className="text-sm font-semibold">BREAKING NEWS</span>
              </div>
              <div className="text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[900px] mx-auto px-6 pt-8 mt-12">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <Link href="/news" className="text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-2 font-semibold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to News
            </Link>
          </motion.div>

          {/* Article Header */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-l-4 border-red-600 shadow-lg p-8 md:p-12 border-t border-r border-b border-gray-200"
          >
            {/* Category Badge */}
            <div className="mb-6">
              <span className={`inline-block px-4 py-2 text-xs font-black uppercase border-2 ${getCategoryColor(article.category)}`}>
                {article.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-black text-[#1d1d1f] mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b-4 border-red-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-[#424245] text-sm font-bold">{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[#424245] text-sm font-bold">
                  {new Date(article.date + 'T12:00:00').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="prose max-w-none">
              <p className="text-xl text-[#1d1d1f] leading-relaxed mb-6 font-semibold">
                {article.excerpt}
              </p>
              <div className="text-[#424245] leading-relaxed space-y-4 text-lg">
                {article.content.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </motion.article>

          {/* Related Articles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-[#1d1d1f] mb-6 border-b-2 border-red-600 pb-2">More Stories</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {newsArticles
                .filter(a => a.id !== article.id)
                .slice(0, 2)
                .map((relatedArticle) => (
                  <Link
                    key={relatedArticle.id}
                    href={`/news/${relatedArticle.id}`}
                    className="group block bg-white rounded-lg border-2 border-gray-200 hover:border-red-600 shadow-md hover:shadow-lg transition-all p-6"
                  >
                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase border mb-3 ${getCategoryColor(relatedArticle.category)}`}>
                      {relatedArticle.category}
                    </span>
                    <h3 className="text-lg font-bold text-[#1d1d1f] mb-2 group-hover:text-red-600 transition-colors">
                      {relatedArticle.title}
                    </h3>
                    <p className="text-[#424245] text-sm line-clamp-2">
                      {relatedArticle.excerpt}
                    </p>
                  </Link>
                ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

