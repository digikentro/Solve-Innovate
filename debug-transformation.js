// Debug script to test transformation framework data
// Run this in browser console to check project data

function debugTransformationData() {
  console.log('=== DEBUGGING TRANSFORMATION FRAMEWORK DATA ===');
  
  // Try to find project data from localStorage or other sources
  const keys = Object.keys(localStorage);
  console.log('localStorage keys:', keys);
  
  // Look for any project-related data
  keys.forEach(key => {
    if (key.includes('project') || key.includes('supabase')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        console.log(`${key}:`, data);
      } catch (e) {
        console.log(`${key} (raw):`, localStorage.getItem(key));
      }
    }
  });
  
  // Check if there's a way to access the current project
  if (window.location.pathname.includes('/project/')) {
    const projectId = window.location.pathname.split('/').pop();
    console.log('Current project ID:', projectId);
  }
}

// Run the debug function
debugTransformationData();