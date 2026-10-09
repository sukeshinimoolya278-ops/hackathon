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
    const {
      fullName,
      campId,
      approxAge,
      gender,
      priorityFlag,
      medicalNeeds,
      physicalDesc,
      groupNotes,
      familyToken,
    } = body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: fullName is required for camp intake.',
      });
    }

    const entryCode = `INT-${Math.floor(1000 + Math.random() * 9000)}`;
    const shelterEntry = {
      id: `shl-${Date.now()}`,
      entryCode,
      fullName,
      campId: campId || 'camp-1',
      approxAge: approxAge ? Number(approxAge) : null,
      gender: gender || 'UNKNOWN',
      priorityFlag: priorityFlag || 'NONE',
      medicalNeeds: medicalNeeds || '',
      physicalDesc: physicalDesc || '',
      groupNotes: groupNotes || '',
      familyToken: familyToken || '',
      status: 'IN_SHELTER',
      createdAt: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      entryCode,
      shelterEntry,
      message: 'Intake record successfully registered.',
    });
  } catch (error) {
    console.error('Intake serverless error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error during intake processing',
    });
  }
}
