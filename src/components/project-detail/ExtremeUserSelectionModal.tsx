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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-8 py-6 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Users className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Select Extreme User</h3>
                <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">Choose from Power Users or Marginalized Users analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <FiX className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {!powerUsers.length && !marginalizedUsers.length ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900">No Extreme Users Available</p>
              <p className="mt-2 text-sm text-gray-600">Please generate Extreme User Analysis first to see users here.</p>
              <p className="mt-4 text-xs bg-gray-50 text-gray-700 p-3 rounded-xl border border-gray-200">
                💡 <strong>Tip:</strong> Go to the "Extreme User Generator" section, generate your analysis, and then come back here to select users.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Power Users Section */}
              {powerUsers.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleSection('powerUsers')}
                    className="w-full px-6 py-5 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <User className="h-5 w-5 text-gray-900" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Power Users (High-Need Extreme)</h4>
                        <p className="mt-1 text-xs text-gray-500">{powerUsers.length} users available</p>
                      </div>
                    </div>
                    {expandedSections.powerUsers ? 
                      <ChevronDown className="h-5 w-5 text-gray-600" /> : 
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    }
                  </button>
                  
                  {expandedSections.powerUsers && (
                    <div className="p-6 flex flex-col gap-3 bg-gray-50/50">
                      {powerUsers.map((user, index) => {
                        const userKey = `power-${index}`;
                        return (
                          <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleUser(userKey)}
                                className="flex-1 px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                              >
                                <div className="w-6 h-6 bg-gray-100 text-gray-900 rounded-lg flex items-center justify-center text-xs font-semibold">
                                  {index + 1}
                                </div>
                                <span className="font-medium text-sm text-gray-900">{user.label}</span>
                                {expandedUsers[userKey] ? 
                                  <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" /> : 
                                  <ChevronRight className="h-4 w-4 text-gray-500 ml-auto" />
                                }
                              </button>
                              <button
                                onClick={() => handleSelectUser(user, 'power')}
                                className="px-3 py-2 m-2 bg-black text-white text-[11px] uppercase tracking-wider font-semibold rounded-lg hover:bg-black/90 transition-colors"
                              >
                                Select
                              </button>
                            </div>
                            
                            {expandedUsers[userKey] && (
                              <div className="p-6 flex flex-col gap-6 border-t border-gray-100 bg-white">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                  <div>
                                    <h5 className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Demographics</h5>
                                    <p className="text-sm text-gray-700">{user.demographics}</p>
                                  </div>
                                  <div>
                                    <h5 className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Amplified Needs</h5>
                                    <p className="text-sm text-gray-700">{user.amplifiedNeeds}</p>
                                  </div>
                                  <div>
                                    <h5 className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Pain Point Experience</h5>
                                    <p className="text-sm text-gray-700">{user.painPointExperience}</p>
                                  </div>
                                  <div>
                                    <h5 className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Research Value</h5>
                                    <p className="text-sm leading-relaxed text-gray-900 font-medium border-l border-gray-200 pl-3">{user.researchValue}</p>
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
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleSection('marginalizedUsers')}
                    className="w-full px-6 py-5 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <User className="h-5 w-5 text-gray-900" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Marginalized Users (Barrier-Facing Extreme)</h4>
                        <p className="mt-1 text-xs text-gray-500">{marginalizedUsers.length} users available</p>
                      </div>
                    </div>
                    {expandedSections.marginalizedUsers ? 
                      <ChevronDown className="h-5 w-5 text-gray-600" /> : 
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    }
                  </button>
                  
                  {expandedSections.marginalizedUsers && (
                    <div className="p-6 flex flex-col gap-3 bg-gray-50/50">
                      {marginalizedUsers.map((user, index) => {
                        const userKey = `marginalized-${index}`;
                        return (
                          <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleUser(userKey)}
                                className="flex-1 px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                              >
                                <div className="w-6 h-6 bg-gray-100 text-gray-900 rounded-lg flex items-center justify-center text-xs font-semibold">
                                  {index + 1}
                                </div>
                                <span className="font-medium text-sm text-gray-900">{user.label}</span>
                                {expandedUsers[userKey] ? 
                                  <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" /> : 
                                  <ChevronRight className="h-4 w-4 text-gray-500 ml-auto" />
                                }
                              </button>
                              <button
                                onClick={() => handleSelectUser(user, 'marginalized')}
                                className="px-3 py-2 m-2 bg-black text-white text-[11px] uppercase tracking-wider font-semibold rounded-lg hover:bg-black/90 transition-colors"
                              >
                                Select
                              </button>
                            </div>
                            
                            {expandedUsers[userKey] && (
                              <div className="p-6 flex flex-col gap-6 border-t border-gray-100 bg-white">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                  <div>
                                    <h5 className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Demographics</h5>
                                    <p className="text-sm text-gray-700">{user.demographics}</p>
                                  </div>
                                  <div>
                                    <h5 className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Barriers Faced</h5>
                                    <p className="text-sm text-gray-700">{user.barriersFaced}</p>
                                  </div>
                                  <div>
                                    <h5 className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Pain Point Experience</h5>
                                    <p className="text-sm text-gray-700">{user.painPointExperience}</p>
                                  </div>
                                  <div>
                                    <h5 className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Research Value</h5>
                                    <p className="text-sm leading-relaxed text-gray-900 font-medium border-l border-gray-200 pl-3">{user.researchValue}</p>
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
        <div className="px-8 py-6 bg-white border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 uppercase tracking-wide">
              Expand sections and users to view details, then click "Select"
            </p>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};