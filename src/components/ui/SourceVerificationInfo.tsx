import React from 'react';
import { SOURCE_VERIFICATION_TIERS } from '@/services/sourceVerificationService';

interface SourceVerificationInfoProps {
  className?: string;
  showDetails?: boolean;
}

export const SourceVerificationInfo: React.FC<SourceVerificationInfoProps> = ({
  className = '',
  showDetails = false
}) => {
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-blue-900">Source Verification Framework</h3>
          <p className="text-sm text-blue-700">Building trust through verified sources</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-3">
        {SOURCE_VERIFICATION_TIERS.map((tier) => (
          <div key={tier.tier} className="text-center">
            <div className={`px-2 py-1 rounded text-white text-xs font-medium ${
              tier.tier === 1 ? 'bg-green-500' :
              tier.tier === 2 ? 'bg-blue-500' :
              tier.tier === 3 ? 'bg-yellow-500' :
              tier.tier === 4 ? 'bg-orange-500' :
              'bg-red-500'
            }`}>
              Tier {tier.tier}
            </div>
            <div className="text-xs text-gray-600 mt-1">{tier.credibilityScore}%</div>
            <div className="text-xs text-gray-500 font-medium">{tier.name}</div>
          </div>
        ))}
      </div>

      {showDetails && (
        <div className="space-y-3">
          {SOURCE_VERIFICATION_TIERS.map((tier) => (
            <div key={tier.tier} className="border-l-4 border-gray-200 pl-3">
              <div className="flex items-center mb-1">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  tier.tier <= 2 ? 'bg-green-400' : 
                  tier.tier <= 3 ? 'bg-yellow-400' : 'bg-red-400'
                }`}></span>
                <span className="font-medium text-sm">{tier.name}</span>
                <span className="text-xs text-gray-500 ml-2">({tier.credibilityScore}% credibility)</span>
              </div>
              <p className="text-xs text-gray-600 mb-1">{tier.description}</p>
              <div className="text-xs text-gray-500">
                <strong>Examples:</strong> {tier.examples.slice(0, 3).join(', ')}
                {tier.examples.length > 3 && ` +${tier.examples.length - 3} more`}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs text-blue-700">
          <span>💡 Higher tiers = Higher credibility and trust</span>
          <span>🔍 All sources verified and bias-assessed</span>
        </div>
      </div>
    </div>
  );
};

export const SourceVerificationBadge: React.FC<{ tier: number; className?: string }> = ({
  tier,
  className = ''
}) => {
  const tierInfo = SOURCE_VERIFICATION_TIERS.find(t => t.tier === tier);
  
  if (!tierInfo) return null;

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
      tier === 1 ? 'bg-green-100 text-green-800' :
      tier === 2 ? 'bg-blue-100 text-blue-800' :
      tier === 3 ? 'bg-yellow-100 text-yellow-800' :
      tier === 4 ? 'bg-orange-100 text-orange-800' :
      'bg-red-100 text-red-800'
    } ${className}`}>
      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
        tier <= 2 ? 'bg-green-400' : 
        tier <= 3 ? 'bg-yellow-400' : 'bg-red-400'
      }`}></span>
      Tier {tier} - {tierInfo.name}
    </div>
  );
}; 