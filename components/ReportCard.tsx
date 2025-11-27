'use client';

import Link from 'next/link';
import { Report } from '@/lib/types';

interface ReportCardProps {
  report: Report;
}

function getSeverityLabel(score: number): string {
  if (score >= 9) return 'Critical';
  if (score >= 7) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
}

function getSeverityColor(score: number): string {
  if (score >= 9) return 'text-[#ff3b30]';
  if (score >= 7) return 'text-[#ff9500]';
  if (score >= 5) return 'text-[#966a00]';
  return 'text-[#34c759]';
}

function getSeverityBg(score: number): string {
  if (score >= 9) return 'bg-[#ff3b30]';
  if (score >= 7) return 'bg-[#ff9500]';
  if (score >= 5) return 'bg-[#ffcc00]';
  return 'bg-[#34c759]';
}

export default function ReportCard({ report }: ReportCardProps) {
  const { analysis } = report;
  const riskScore = analysis?.overallRiskScore || 0;
  const risksCount = analysis?.risks?.length || 0;
  const highRisks = analysis?.risks?.filter(r => r.severity >= 7).length || 0;

  return (
    <Link href={`/reports/${report.id}`}>
      <article className="bg-white rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-lg group cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#1d1d1f] truncate group-hover:text-[#0071e3] transition-colors">
              {report.fileName}
            </h3>
            <p className="text-sm text-[#86868b] mt-1">
              {new Date(report.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          
          <div className={`w-14 h-14 ${getSeverityBg(riskScore)} rounded-2xl flex flex-col items-center justify-center text-white`}>
            <span className="text-xl font-bold">{riskScore.toFixed(1)}</span>
          </div>
        </div>

        {analysis?.summary && (
          <p className="text-sm text-[#86868b] line-clamp-2 mb-4">
            {analysis.summary}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm">
          <span className={getSeverityColor(riskScore)}>
            {getSeverityLabel(riskScore)} Risk
          </span>
          <span className="text-[#d2d2d7]">•</span>
          <span className="text-[#86868b]">{risksCount} issues</span>
          {highRisks > 0 && (
            <>
              <span className="text-[#d2d2d7]">•</span>
              <span className="text-[#ff3b30]">{highRisks} critical</span>
            </>
          )}
        </div>
      </article>
    </Link>
  );
}
