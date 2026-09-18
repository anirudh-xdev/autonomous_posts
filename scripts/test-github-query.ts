async function testGitHub() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const query = `topic:llm created:>${sevenDaysAgo} stars:>5`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AutonomusPosts-AI-Trend-Agent/1.0',
      Accept: 'application/vnd.github.v3+json',
    }
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Found:', json.total_count, 'items:', json.items?.map((i: any) => i.name));
}

testGitHub();
