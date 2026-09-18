async function main() {
  console.log('Testing GET /api/sources...');
  const sourcesRes = await fetch('http://localhost:3000/api/sources');
  const sourcesData = await sourcesRes.json();
  console.log(`HTTP ${sourcesRes.status}: Found ${sourcesData.sources?.length || 0} sources.`);
  if (sourcesData.sources?.length > 0) {
    console.log('Sample source:', sourcesData.sources[0].name, 'Tier:', sourcesData.sources[0].priority, 'Trust:', sourcesData.sources[0].trustScore);
  }

  console.log('\nTesting GET /api/topics...');
  const topicsRes = await fetch('http://localhost:3000/api/topics');
  const topicsData = await topicsRes.json();
  console.log(`HTTP ${topicsRes.status}: Found ${topicsData.topics?.length || 0} topics.`);
  if (topicsData.topics?.length > 0) {
    console.log('Sample topic:', topicsData.topics[0].name, 'Keywords:', topicsData.topics[0].keywords);
  }

  console.log('\nTesting GET /api/trends...');
  const trendsRes = await fetch('http://localhost:3000/api/trends');
  const trendsData = await trendsRes.json();
  console.log(`HTTP ${trendsRes.status}: Found ${trendsData.trends?.length || 0} trends in database.`);
}

main().catch(console.error);
