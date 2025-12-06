import { useState } from 'react';
import { X, User, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { FiX } from 'react-icons/fi';

interface ExtremeUser {
  label: string;
  demographics: string;
  amplifiedNeeds?: string; // Power users
  barriersFaced?: string; // Marginalized users
  painPointExperience: string;
  currentWorkarounds?: string; // Power users
  exclusionFactors?: string; // Marginalized users
  uniqueChallenges: string;
  researchValue: string;
  interviewFocus: string;
}

interface ExtremeUserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userSummary: string) => void;
  extremeUserData: any;
}

export const ExtremeUserSelectionModal = ({
  isOpen,
  onClose,
  onSelectUser,
  extremeUserData
}: ExtremeUserSelectionModalProps) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    powerUsers: true,
    marginalizedUsers: true
  });
  const [expandedUsers, setExpandedUsers] = useState<{[key: string]: boolean}>({});

  if (!isOpen) return null;

  const reportData = extremeUserData?.content || extremeUserData;
  
  const powerUsers: ExtremeUser[] = reportData?.extremeUserProfiles?.powerUsersHighNeedExtreme || [];
  const marginalizedUsers: ExtremeUser[] = reportData?.extremeUserProfiles?.marginalizedUsersBarrierFacingExtreme || [];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleUser = (userKey: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userKey]: !prev[userKey]
    }));
  };

  const formatUserSummary = (user: ExtremeUser, type: 'power' | 'marginalized') => {
    const sections = [
      user.label,
      '',
      'Demographics',
      user.demographics,
      '',
      type === 'power' ? 'Amplified Needs' : 'Barriers Faced',
      type === 'power' ? user.amplifiedNeeds : user.barriersFaced,
      '',
      'Pain Point Experience', 
      user.painPointExperience,
      '',
      type === 'power' ? 'Current Workarounds' : 'Exclusion Factors',
      type === 'power' ? user.currentWorkarounds : user.exclusionFactors,
      '',
      'Unique Challenges',
      user.uniqueChallenges,
      '',
      'Research Value',
      user.researchValue,
      '',
      'Interview Focus Areas',
      user.interviewFocus
    ];
    
    // Filter out undefined/empty values but keep empty strings for spacing
    const filteredSections = sections.filter(section => 
      section === '' || (section !== undefined && section !== null && !section.toString().includes('undefined'))
    );
    
    return filteredSections.join('\n');
  };

  const handleSelectUser = (user: ExtremeUser, type: 'power' | 'marginalized') => {
    const userSummary = formatUserSummary(user, type);
    onSelectUser(userSummary);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Select Extreme User</h3>
                <p className="text-sm text-gray-600">Choose from Power Users or Marginalized Users analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-xl transition-colors"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {!powerUsers.length && !marginalizedUsers.length ? (
            <div className="text-center py-12 text-gray-500">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No Extreme Users Available</p>
              <p className="text-sm mt-2">Please generate Extreme User Analysis first to see users here.</p>
              <p className="text-xs mt-4 bg-blue-50 text-blue-700 p-3 rounded-lg">
                💡 <strong>Tip:</strong> Go to the "Extreme User Generator" section, generate your analysis, and then come back here to select users.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Power Users Section */}
              {powerUsers.length > 0 && (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('powerUsers')}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-bold text-gray-900">Power Users (High-Need Extreme)</h4>
                        <p className="text-sm text-gray-600">{powerUsers.length} users available</p>
                      </div>
                    </div>
                    {expandedSections.powerUsers ? 
                      <ChevronDown className="w-5 h-5 text-gray-600" /> : 
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    }
                  </button>
                  
                  {expandedSections.powerUsers && (
                    <div className="p-4 space-y-3 bg-green-50/30">
                      {powerUsers.map((user, index) => {
                        const userKey = `power-${index}`;
                        return (
                          <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleUser(userKey)}
                                className="flex-1 px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                              >
                                <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                                <span className="font-medium text-gray-900">{user.label}</span>
                                {expandedUsers[userKey] ? 
                                  <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" /> : 
                                  <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                                }
                              </button>
                              <button
                                onClick={() => handleSelectUser(user, 'power')}
                                className="px-4 py-2 m-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Select
                              </button>
                            </div>
                            
                            {expandedUsers[userKey] && (
                              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50">
                                <div className="grid md:grid-cols-2 gap-4 mt-3">
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-800 mb-1">Demographics</h5>
                                    <p className="text-sm text-gray-600">{user.demographics}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-800 mb-1">Amplified Needs</h5>
                                    <p className="text-sm text-gray-600">{user.amplifiedNeeds}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-800 mb-1">Pain Point Experience</h5>
                                    <p className="text-sm text-gray-600">{user.painPointExperience}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-800 mb-1">Research Value</h5>
                                    <p className="text-sm text-green-700 font-medium">{user.researchValue}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Marginalized Users Section */}
              {marginalizedUsers.length > 0 && (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('marginalizedUsers')}
                    className="w-full px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-bold text-gray-900">Marginalized Users (Barrier-Facing Extreme)</h4>
                        <p className="text-sm text-gray-600">{marginalizedUsers.length} users available</p>
                      </div>
                    </div>
                    {expandedSections.marginalizedUsers ? 
                      <ChevronDown className="w-5 h-5 text-gray-600" /> : 
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    }
                  </button>
                  
                  {expandedSections.marginalizedUsers && (
                    <div className="p-4 space-y-3 bg-orange-50/30">
                      {marginalizedUsers.map((user, index) => {
                        const userKey = `marginalized-${index}`;
                        return (
                          <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleUser(userKey)}
                                className="flex-1 px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                              >
                                <div className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                                <span className="font-medium text-gray-900">{user.label}</span>
                                {expandedUsers[userKey] ? 
                                  <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" /> : 
                                  <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                                }
                              </button>
                              <button
                                onClick={() => handleSelectUser(user, 'marginalized')}
                                className="px-4 py-2 m-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                              >
                                Select
                              </button>
                            </div>
                            
                            {expandedUsers[userKey] && (
                              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50">
                                <div className="grid md:grid-cols-2 gap-4 mt-3">
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-800 mb-1">Demographics</h5>
                                    <p className="text-sm text-gray-600">{user.demographics}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-800 mb-1">Barriers Faced</h5>
                                    <p className="text-sm text-gray-600">{user.barriersFaced}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-800 mb-1">Pain Point Experience</h5>
                                    <p className="text-sm text-gray-600">{user.painPointExperience}</p>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-semibold text-gray-800 mb-1">Research Value</h5>
                                    <p className="text-sm text-orange-700 font-medium">{user.researchValue}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Expand sections and users to view details, then click "Select" to choose a user
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};