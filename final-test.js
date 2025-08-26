import fetch from 'node-fetch';

async function testCompleteFlow() {
  try {
    console.log('Testing complete flow with GET request...');
    const response = await fetch('http://localhost:4000/validate-idea?prompt=AI-powered%20healthcare%20app', {
      method: 'GET'
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    
    // Check if we have the expected data structure
    if (data.novelty_assessment && data.validation_summary) {
      console.log('✅ SUCCESS: API is working correctly!');
      console.log('Novelty Score:', data.novelty_assessment.overall_novelty_score);
      console.log('Viability Score:', data.validation_summary.overall_viability_score);
      console.log('Recommendation:', data.validation_summary.go_no_go_recommendation);
    } else {
      console.log('❌ ERROR: Unexpected data structure');
      console.log('Data:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

testCompleteFlow();

