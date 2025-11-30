'use client';

import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { newsArticles, getCategoryColor } from './articles-data';

export default function NewsPage() {
  // Sort articles by date (newest first)
  const sortedArticles = [...newsArticles].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

        <div className="max-w-[1200px] mx-auto px-6 pt-8 mt-12">
          {/* Main Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 border-b-2 border-gray-300 pb-6"
          >
            <h1 className="text-5xl md:text-6xl font-black text-[#1d1d1f] mb-2 leading-tight">
              LifeØS <span className="text-red-600">NEWS</span>
            </h1>
            <p className="text-lg text-[#424245]">
              Latest updates and breaking news about LifeØS, our platform development, and industry developments.
            </p>
          </motion.div>

          {/* Featured Article (Latest) */}
          {sortedArticles.length > 0 && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12 group"
            >
              <Link href={`/news/${sortedArticles[0].id}`}>
                <div className="relative bg-white border-l-4 border-red-600 hover:border-red-700 shadow-lg transition-all overflow-hidden p-8 md:p-12 border-t border-r border-b border-gray-200">
                  <div className="absolute top-6 right-6 z-10">
                    <span className={`px-4 py-2 text-xs font-black uppercase border-2 ${getCategoryColor(sortedArticles[0].category)}`}>
                      {sortedArticles[0].category}
                    </span>
                  </div>
                  
                  <div className="relative z-10 pr-32">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase">BREAKING</span>
                      <span className="text-red-600 text-sm font-bold">
                        {new Date(sortedArticles[0].date + 'T12:00:00').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-[#1d1d1f] mb-4 group-hover:text-red-600 transition-colors leading-tight">
                      {sortedArticles[0].title}
                    </h2>
                    <p className="text-[#424245] text-xl leading-relaxed mb-6 font-medium">
                      {sortedArticles[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[#86868b] text-sm font-semibold">
                        By {sortedArticles[0].author}
                      </p>
                      <span className="text-red-600 font-black inline-flex items-center gap-2 group-hover:gap-3 transition-all text-lg">
                        READ MORE
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          )}

          {/* News Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedArticles.slice(1).map((article, i) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (i * 0.05) }}
                className="group"
              >
                <Link href={`/news/${article.id}`}>
                  <div className="relative bg-white border-l-4 border-gray-300 hover:border-red-600 shadow-md hover:shadow-xl transition-all overflow-hidden h-full flex flex-col border-t border-r border-b">
                    {/* Category Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`px-3 py-1 text-xs font-black uppercase border-2 ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-6 pt-8 flex-1 flex flex-col">
                      <div className="mb-4 flex-1 pr-24">
                        <p className="text-red-600 text-xs mb-3 font-bold uppercase">
                          {new Date(article.date + 'T12:00:00').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <h2 className="text-xl font-black text-[#1d1d1f] mb-3 group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                          {article.title}
                        </h2>
                        <p className="text-[#424245] text-sm leading-relaxed line-clamp-3">
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200 mt-auto">
                        <p className="text-[#86868b] text-xs font-semibold">
                          {article.author}
                        </p>
                        <span className="text-red-600 hover:text-red-700 text-sm font-black inline-flex items-center gap-1 transition-colors uppercase">
                          Read
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>

          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Link href="/" className="text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-2 font-semibold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
