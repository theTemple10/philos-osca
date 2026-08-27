"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { getLanguageColor } from "@/lib/utils";

interface Skill {
  name: string;
  proficiency: number;
  years?: string;
}

export interface SkillMapProps {
  skillProfile: {
    languages?: Skill[];
    frameworks?: string[];
    strengths?: string[];
    weaknesses?: string[];
    experienceLevel?: string;
    primaryFocus?: string;
  } | null;
}

export function SkillMap({ skillProfile }: SkillMapProps) {
  if (!skillProfile) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Skill Profile</h3>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Analyze your repositories to generate your skill profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Skill Profile</h3>
          <span className="text-sm text-gray-500">
            {skillProfile.experienceLevel} • {skillProfile.primaryFocus}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Languages */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Languages</h4>
          <div className="space-y-2">
            {skillProfile.languages?.slice(0, 8).map((lang) => (
              <div key={lang.name} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getLanguageColor(lang.name) }}
                />
                <span className="text-sm w-24">{lang.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${lang.proficiency * 100}%`,
                      backgroundColor: getLanguageColor(lang.name),
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {Math.round(lang.proficiency * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Frameworks */}
        {skillProfile.frameworks && skillProfile.frameworks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Frameworks</h4>
            <div className="flex flex-wrap gap-2">
              {skillProfile.frameworks.map((framework) => (
                <span
                  key={framework}
                  className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm"
                >
                  {framework}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {skillProfile.strengths?.map((strength) => (
                <li key={strength} className="text-sm text-green-600 flex items-center gap-2">
                  <span>✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Areas to Improve</h4>
            <ul className="space-y-1">
              {skillProfile.weaknesses?.map((weakness) => (
                <li key={weakness} className="text-sm text-orange-600 flex items-center gap-2">
                  <span>→</span>
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
