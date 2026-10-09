export default async function handler(req, res) {
  // Always set JSON content-type and CORS headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed. Expected POST.`,
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { fullName, reporterName, reporterPhone, lastSeenLocation } = body;

    if (!fullName || !reporterName || !reporterPhone || !lastSeenLocation) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fullName, reporterName, reporterPhone, lastSeenLocation',
      });
    }

    const reportCode = `MIS-${Math.floor(1000 + Math.random() * 9000)}`;
    const familyToken = body.familyToken || `FAM-${Math.floor(1000 + Math.random() * 9000)}`;

    const report = {
      id: `rep-${Date.now()}`,
      reportCode,
      familyToken,
      ...body,
      status: 'REPORTED',
      createdAt: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      reportCode,
      familyToken,
      report,
      matchesFound: 0,
      bestMatch: null,
    });
  } catch (error) {
    console.error('Missing report serverless error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error during report registration',
    });
  }
}
