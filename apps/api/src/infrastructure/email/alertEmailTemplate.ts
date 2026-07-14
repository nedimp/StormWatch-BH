import type { AlertDto } from '@stormwatch/application';

const DASHBOARD_URL = process.env['DASHBOARD_URL'] ?? 'http://localhost:5173/dashboard';
const UNSUBSCRIBE_URL = process.env['API_BASE_URL'] ?? 'http://localhost:3001';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#9C27B0',
  HIGH: '#F44336',
  MEDIUM: '#FF9800',
  LOW: '#4CAF50',
};

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'KRITIČNO',
  HIGH: 'VISOKO',
  MEDIUM: 'SREDNJE',
  LOW: 'NISKO',
};

const CONDITION_LABELS: Record<string, string> = {
  THUNDERSTORM: 'Nevrijeme / Grmljavina',
  HEAVY_RAIN: 'Jaka kiša',
  HAIL: 'Tuča / Grad',
  STRONG_WIND: 'Jak vjetar',
  HEAVY_SNOW: 'Jak snijeg',
  FOG: 'Magla',
  EXTREME_HEAT: 'Ekstremna vrućina',
  FROST: 'Mraz',
  TORNADO_RISK: 'Opasnost od tornada',
};

export function buildAlertEmailHtml(alert: AlertDto, subscriberEmail: string): string {
  const color = SEVERITY_COLORS[alert.severity] ?? '#F44336';
  const severityLabel = SEVERITY_LABELS[alert.severity] ?? alert.severity;
  const conditionLabel = CONDITION_LABELS[alert.condition] ?? alert.condition;
  const unsubscribeLink = `${UNSUBSCRIBE_URL}/api/v1/subscriptions/${encodeURIComponent(subscriberEmail)}`;

  const recommendationsHtml = alert.recommendations
    .map(
      (rec) => `
      <tr>
        <td style="padding: 6px 0; vertical-align: top;">
          <span style="color: ${color}; font-weight: bold; margin-right: 8px;">›</span>
        </td>
        <td style="padding: 6px 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">${rec}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${alert.title}</title>
</head>
<body style="margin:0; padding:0; background-color:#0f1117; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px;" align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="
                    background: #4f46e5;
                    border-radius: 12px;
                    width: 40px;
                    height: 40px;
                    text-align: center;
                    vertical-align: middle;
                    font-size: 20px;
                    line-height: 40px;
                  ">⛈️</td>
                  <td style="padding-left: 12px;">
                    <span style="color: #e2e8f0; font-size: 16px; font-weight: 700;">StormWatch BH</span><br/>
                    <span style="color: #64748b; font-size: 11px;">Praćenje nevremena · Bosna i Hercegovina</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alert Card -->
          <tr>
            <td style="
              background: #1e2433;
              border-radius: 16px;
              border: 1px solid #2d3748;
              overflow: hidden;
            ">
              <!-- Severity banner -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="
                    background: ${color};
                    padding: 14px 28px;
                    border-radius: 16px 16px 0 0;
                  ">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <span style="
                            color: rgba(255,255,255,0.85);
                            font-size: 11px;
                            font-weight: 700;
                            letter-spacing: 0.1em;
                            text-transform: uppercase;
                          ">Nivo upozorenja</span><br/>
                          <span style="
                            color: #ffffff;
                            font-size: 20px;
                            font-weight: 900;
                            letter-spacing: 0.05em;
                          ">${severityLabel}</span>
                        </td>
                        <td align="right">
                          <span style="
                            background: rgba(255,255,255,0.2);
                            color: #ffffff;
                            font-size: 12px;
                            font-weight: 600;
                            padding: 6px 14px;
                            border-radius: 20px;
                          ">${conditionLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 28px;">

                    <!-- Region & time -->
                    <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">
                      Područje
                    </p>
                    <p style="margin: 0 0 24px 0; color: #e2e8f0; font-size: 18px; font-weight: 700;">
                      ${alert.regionName}
                    </p>

                    <!-- Alert title -->
                    <h1 style="
                      margin: 0 0 12px 0;
                      color: #ffffff;
                      font-size: 22px;
                      font-weight: 900;
                      line-height: 1.3;
                      border-left: 4px solid ${color};
                      padding-left: 16px;
                    ">${alert.title}</h1>

                    <!-- Description -->
                    <p style="
                      margin: 0 0 28px 0;
                      color: #94a3b8;
                      font-size: 15px;
                      line-height: 1.6;
                      padding-left: 20px;
                    ">${alert.description}</p>

                    <!-- Recommendations -->
                    ${recommendationsHtml ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="
                      background: rgba(255,255,255,0.04);
                      border-radius: 10px;
                      padding: 16px 20px;
                      margin-bottom: 28px;
                    ">
                      <tr>
                        <td colspan="2" style="padding-bottom: 10px;">
                          <span style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">Preporuke</span>
                        </td>
                      </tr>
                      ${recommendationsHtml}
                    </table>
                    ` : ''}

                    <!-- Validity -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      <tr>
                        <td style="width:50%; padding-right: 8px;">
                          <div style="
                            background: rgba(255,255,255,0.04);
                            border-radius: 8px;
                            padding: 12px 16px;
                          ">
                            <div style="color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Izdano</div>
                            <div style="color: #e2e8f0; font-size: 13px; font-weight: 600;">${new Date(alert.issuedAt).toLocaleString('bs-BA', { timeZone: 'Europe/Sarajevo', dateStyle: 'short', timeStyle: 'short' })}</div>
                          </div>
                        </td>
                        <td style="width:50%; padding-left: 8px;">
                          <div style="
                            background: rgba(255,255,255,0.04);
                            border-radius: 8px;
                            padding: 12px 16px;
                          ">
                            <div style="color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Vrijedi do</div>
                            <div style="color: #e2e8f0; font-size: 13px; font-weight: 600;">${new Date(alert.validUntil).toLocaleString('bs-BA', { timeZone: 'Europe/Sarajevo', dateStyle: 'short', timeStyle: 'short' })}</div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${DASHBOARD_URL}" style="
                            display: inline-block;
                            background: #4f46e5;
                            color: #ffffff;
                            font-size: 14px;
                            font-weight: 700;
                            text-decoration: none;
                            padding: 14px 36px;
                            border-radius: 10px;
                            letter-spacing: 0.02em;
                          ">Otvori Dashboard →</a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 0 0 0;" align="center">
              <p style="margin: 0 0 8px 0; color: #334155; font-size: 12px;">
                Primili ste ovu poruku jer ste se pretplatili na StormWatch BH upozorenja.
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="${unsubscribeLink}" style="color: #64748b; text-decoration: underline;">Otkazati pretplatu</a>
                &nbsp;·&nbsp;
                <span style="color: #334155;">Meteorološki podaci: Open-Meteo · © ${new Date().getFullYear()} StormWatch BH</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildAlertEmailSubject(alert: AlertDto): string {
  return `[StormWatch BH] ${alert.title} — ${alert.regionName}`;
}
