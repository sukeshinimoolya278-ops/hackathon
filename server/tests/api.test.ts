import { describe, it, expect } from 'vitest';

describe('GlobalX Core API Endpoints Verification', () => {
  const baseUrl = 'http://localhost:5000/api';

  it('GET /api/health returns status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.app).toBe('GlobalX API');
  });

  it('GET /api/dashboard/stats returns impact statistics and seeded camps', async () => {
    const res = await fetch(`${baseUrl}/dashboard/stats`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.impact).toBeDefined();
    expect(data.impact.totalReported).toBeGreaterThanOrEqual(1);
    expect(data.camps.length).toBeGreaterThanOrEqual(4);
    expect(data.impact.reunificationRate).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/search?q=Murugan returns sanitized result with timeline', async () => {
    const res = await fetch(`${baseUrl}/search?q=Murugan`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    const result = data.results[0];
    expect(result.fullName).toContain('Murugan');
    expect(result.reporterPhoneMasked).toContain('****'); // Privacy masking verified
    expect(result.timeline.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/qr/lookup/FAM-CHENNAI-4091 returns linked family members', async () => {
    const res = await fetch(`${baseUrl}/qr/lookup/FAM-CHENNAI-4091`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.token).toBe('FAM-CHENNAI-4091');
    expect(data.primaryContactName).toBe('K. Ramanathan');
  });

  it('POST /api/simulation/sms/inbound handles SMS query correctly', async () => {
    const res = await fetch(`${baseUrl}/simulation/sms/inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromNumber: '+91 98400 99999',
        text: 'MIS-7044',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.reply.message).toContain('VERIFIED SAFE');
  });

  it('GET /api/reunion-intelligence/stats returns live reunion metrics', async () => {
    const res = await fetch(`${baseUrl}/reunion-intelligence/stats`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.avgMatchScore).toBeGreaterThanOrEqual(50);
  });

  it('GET /api/reunion-intelligence/cases returns seeded cross-source cases', async () => {
    const res = await fetch(`${baseUrl}/reunion-intelligence/cases`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    const arjunCase = data.find((c: any) => c.caseCode === 'RC-2024-8801');
    expect(arjunCase).toBeDefined();
    expect(arjunCase.missingReport.personName).toBe('Arjun Kumar');
    expect(arjunCase.candidateRecord.personName).toBe('Arjun Kumra');
  });

  it('GET /api/dashboard/system-health returns measured server & surge metrics', async () => {
    const res = await fetch(`${baseUrl}/dashboard/system-health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.server.status).toBe('ONLINE');
    expect(data.server.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(data.database.status).toBe('HEALTHY');
    expect(data.database.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(data.database.persistedRecordsCount.disasters).toBeGreaterThanOrEqual(1);
    expect(data.apiTelemetry.totalRequests).toBeGreaterThanOrEqual(1);
    expect(data.surgeProtection.idempotentRatePercent).toBeGreaterThanOrEqual(0);
    expect(data.offlineSync).toBeDefined();
  });

  it('POST /api/safe-checkin handles surge deduplication reliably', async () => {
    const checkInPayload = {
      fullName: 'Surge Test Survivor',
      phone: '+91 99999 88888',
      currentLocation: 'Emergency Relief Transit Point',
      message: 'Checking in during disaster surge test',
    };

    // First submission
    const res1 = await fetch(`${baseUrl}/safe-checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkInPayload),
    });
    const data1 = await res1.json();
    expect(res1.status === 200 || res1.status === 201).toBe(true);
    expect(data1.success).toBe(true);

    // Second rapid submission (surge duplicate prevention)
    const res2 = await fetch(`${baseUrl}/safe-checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkInPayload),
    });
    const data2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(data2.success).toBe(true);
    expect(data2.isDuplicatePrevented).toBe(true);
  });
});
