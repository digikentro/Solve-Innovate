import React, { useState } from 'react';

interface ResourceFrameworkSelectorProps {
  onTierSelect: (tier: 'express' | 'standard' | 'premium') => void;
  selectedTier?: 'express' | 'standard' | 'premium';
}

const tiers = [
  {
    id: 'express',
    name: 'Express Assessment',
    description: 'Quick automated evaluation with minimal human input',
    features: [
      'Automated data collection',
      'AI-powered scoring',
      'Basic cultural analysis',
      'Standard quality checks',
      '24-hour turnaround'
    ],
    effort: 'Low',
    cost: 'Free',
    accuracy: '70-80%',
    color: 'bg-green-50 border-green-200'
  },
  {
    id: 'standard',
    name: 'Standard Assessment',
    description: 'Balanced human expertise with automated tools',
    features: [
      'Expert review + automation',
      'Enhanced cultural intelligence',
      'Collaborative assessment',
      'Quality validation',
      '3-5 day turnaround'
    ],
    effort: 'Medium',
    cost: 'Standard',
    accuracy: '85-90%',
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'premium',
    name: 'Premium Assessment',
    description: 'Deep expert-driven evaluation with comprehensive analysis',
    features: [
      'Expert consultant review',
      'Advanced cultural analysis',
      'Multi-stakeholder validation',
      'Comprehensive quality assurance',
      '1-2 week turnaround'
    ],
    effort: 'High',
    cost: 'Premium',
    accuracy: '95%+',
    color: 'bg-purple-50 border-purple-200'
  }
];

export const ResourceFrameworkSelector: React.FC<ResourceFrameworkSelectorProps> = ({
  onTierSelect,
  selectedTier
}) => {
  return (
    <div className="space-y-4 p-4 border rounded bg-white">
      <h2 className="text-lg font-bold">Assessment Tier Selection</h2>
      <p className="text-gray-600 mb-4">
        Choose the assessment tier based on your available resources and accuracy requirements.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedTier === tier.id 
                ? `${tier.color} border-2 border-blue-500` 
                : `${tier.color} hover:border-gray-300`
            }`}
            onClick={() => onTierSelect(tier.id as any)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{tier.name}</h3>
              {selectedTier === tier.id && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{tier.description}</p>
            
            <div className="space-y-2 mb-4">
              {tier.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                  {feature}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">Effort</div>
                <div className="text-gray-600">{tier.effort}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Cost</div>
                <div className="text-gray-600">{tier.cost}</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Accuracy</div>
                <div className="text-gray-600">{tier.accuracy}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 