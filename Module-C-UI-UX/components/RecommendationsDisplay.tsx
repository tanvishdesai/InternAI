'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Calendar, DollarSign, Clock, BarChart3, Star, TrendingUp, Award, CheckCircle, Eye, X } from 'lucide-react';
import { useState } from 'react';

interface Recommendation {
  internship_id: string;
  title: string;
  organization: string;
  score: number;
  match_reasons: string[];
  explain_text: string;
  scoring_breakdown: {
    overall_score: number;
    component_scores: {
      [key: string]: {
        raw_score: number;
        weight: number;
        contribution: number;
        percentage: number;
      };
    };
    weights_used: { [key: string]: number };
    recommendation_strength: string;
  };
  location: {
    city: string;
    district: string;
    state: string;
  };
  stipend: string;
  duration_weeks: number;
  remote_allowed: boolean;
  application_deadline: string;
  url: string;
  posted_date: string;
  sector_tags: string;
  description: string;
}

interface RecommendationsDisplayProps {
  recommendations: Recommendation[];
  onGetNewRecommendations: () => void;
  isLoading?: boolean;
}

export default function RecommendationsDisplay({
  recommendations,
  onGetNewRecommendations,
  isLoading = false
}: RecommendationsDisplayProps) {
  const [selectedInternship, setSelectedInternship] = useState<Recommendation | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const toggleDescriptionExpansion = (internshipId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(internshipId)) {
      newExpanded.delete(internshipId);
    } else {
      newExpanded.add(internshipId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const openModal = (internship: Recommendation) => {
    setSelectedInternship(internship);
  };

  const closeModal = () => {
    setSelectedInternship(null);
  };

  if (recommendations.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-white border-slate-200 shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">No Recommendations Found</h3>
          <p className="text-slate-600 text-lg">Please try updating your profile to get personalized recommendations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <Award className="h-5 w-5 text-blue-600" />
          <span className="text-blue-700 font-medium">AI-Powered Recommendations</span>
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
            Your Perfect Internship Matches
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Based on your profile analysis, here are the most relevant opportunities tailored just for you
          </p>
        </div>

        <Button
          onClick={onGetNewRecommendations}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 px-8 py-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5" />
              <span>Get New Recommendations</span>
            </div>
          )}
        </Button>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => {
          const scorePercentage = (rec.score * 100).toFixed(1);
          const isDescriptionExpanded = expandedDescriptions.has(rec.internship_id);
          const descriptionText = rec.description;
          const shortDescription = descriptionText.length > 120 ? descriptionText.substring(0, 120) + '...' : descriptionText;

          return (
            <Card key={`${rec.internship_id}-${index}`} className="bg-white border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden rounded-2xl h-full flex flex-col">
              {/* Header */}
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm px-3 py-1 border-0 font-semibold shadow-sm">
                      {scorePercentage}% Match
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight">
                    {rec.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 font-medium">
                    {rec.organization}
                  </CardDescription>
                </div>
              </CardHeader>

              {/* Content */}
              <CardContent className="p-6 pt-0 flex-1 flex flex-col">
                {/* Quick Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      {rec.location.city && rec.location.city !== 'Unknown' ? rec.location.city : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{rec.duration_weeks} weeks</span>
                  </div>
                  {rec.remote_allowed && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-2 py-1 font-medium w-fit">
                      Remote OK
                    </Badge>
                  )}
                </div>

                {/* Description with Read More */}
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 text-sm">📝</span>
                    <h4 className="text-sm font-semibold text-slate-900">Description</h4>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {isDescriptionExpanded ? descriptionText : shortDescription}
                  </p>
                  {descriptionText.length > 120 && (
                    <button
                      onClick={() => toggleDescriptionExpansion(rec.internship_id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                    >
                      {isDescriptionExpanded ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>

                {/* Key Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-slate-600">Stipend</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {rec.stipend && rec.stipend !== '0' ? `₹${rec.stipend}` : 'Not specified'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-slate-600">Deadline</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {rec.application_deadline ? new Date(rec.application_deadline).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                </div>

                {/* Match Reasons Preview */}
                {rec.match_reasons && rec.match_reasons.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-slate-900">Why it matches</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rec.match_reasons.slice(0, 3).map((reason, idx) => (
                        <Badge key={idx} className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-1 font-medium">
                          {reason}
                        </Badge>
                      ))}
                      {rec.match_reasons.length > 3 && (
                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs px-2 py-1 font-medium">
                          +{rec.match_reasons.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 mt-auto">
                  <Button
                    onClick={() => openModal(rec)}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 py-2 rounded-lg"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">View Details</span>
                  </Button>
                  
                  {rec.url ? (
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 gap-2 text-sm"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <Button
                      className="w-full bg-slate-400 hover:bg-slate-500 text-white py-2 px-4 rounded-lg text-sm font-semibold"
                      disabled
                    >
                      Link Not Available
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="text-center space-y-4 py-8">
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 max-w-4xl mx-auto shadow-sm">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">How It Works</h3>
          </div>
          <div className="text-slate-700 space-y-2">
            <p>Recommendations are generated based on your profile using advanced AI matching algorithms.</p>
            <p>The score reflects how well each internship matches your skills, preferences, and qualifications.</p>
            <p className="mt-4 text-blue-600 font-medium">
              💡 <strong>Pro tip:</strong> Click &quot;View Details&quot; to see the complete scoring breakdown and detailed information!
            </p>
          </div>
        </div>
      </div>

      {/* Detailed View Modal */}
      {selectedInternship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {recommendations.findIndex(r => r.internship_id === selectedInternship.internship_id) + 1}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedInternship.title}</h2>
                    <p className="text-slate-600 font-medium">{selectedInternship.organization}</p>
                  </div>
                </div>
                <Button
                  onClick={closeModal}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 rounded-full p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Match Score */}
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-6 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Star className="h-6 w-6 text-yellow-500" />
                    <h3 className="text-xl font-bold text-slate-900">Match Score</h3>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xl px-6 py-2 border-0 font-bold shadow-sm">
                    {((selectedInternship.score * 100).toFixed(1))}% Match
                  </Badge>
                </div>
                <Badge className={`${selectedInternship.scoring_breakdown.recommendation_strength === 'Excellent' ? 'bg-green-100 text-green-800 border-green-200' :
                                 selectedInternship.scoring_breakdown.recommendation_strength === 'Very Good' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                 'bg-yellow-100 text-yellow-800 border-yellow-200'} text-lg px-4 py-2 border font-semibold`}>
                  {selectedInternship.scoring_breakdown.recommendation_strength} Match
                </Badge>
              </div>

              {/* Full Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-blue-600 text-xl">📝</span>
                  <h3 className="text-xl font-bold text-slate-900">Description</h3>
                </div>
                <p className="text-slate-700 text-base leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {selectedInternship.description}
                </p>
              </div>

              {/* All Match Reasons */}
              {selectedInternship.match_reasons && selectedInternship.match_reasons.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">Why This Matches Your Profile</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedInternship.match_reasons.map((reason, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-800 font-medium">{reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Information Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-blue-600 text-xl">ℹ️</span>
                  <h3 className="text-xl font-bold text-slate-900">Detailed Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600 block">Stipend</span>
                        <p className="text-slate-900 font-bold text-xl">
                          {selectedInternship.stipend && selectedInternship.stipend !== '0' ? `₹${selectedInternship.stipend}` : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600 block">Application Deadline</span>
                        <p className="text-slate-900 font-bold text-xl">
                          {selectedInternship.application_deadline ? new Date(selectedInternship.application_deadline).toLocaleDateString() : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-purple-600 text-xl">🏷️</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600 block">Sector</span>
                        <p className="text-slate-900 font-bold text-xl">
                          {selectedInternship.sector_tags || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600 block">Duration</span>
                        <p className="text-slate-900 font-bold text-xl">
                          {selectedInternship.duration_weeks} weeks
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Breakdown */}
              {selectedInternship.scoring_breakdown && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">Detailed Scoring Breakdown</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedInternship.scoring_breakdown.component_scores).map(([component, data]) => (
                      <div key={component} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-semibold text-slate-900 capitalize">
                            {component.replace('_', ' ')}
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {data.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(data.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <div className="pt-6 border-t border-slate-200">
                {selectedInternship.url ? (
                  <a
                    href={selectedInternship.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 gap-3 group transform hover:scale-[1.02]"
                  >
                    <span className="text-lg">Apply Now</span>
                    <ExternalLink className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                ) : (
                  <Button
                    className="w-full bg-slate-400 hover:bg-slate-500 text-white py-4 px-8 rounded-xl text-lg font-semibold"
                    disabled
                  >
                    Application Link Not Available
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
