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

// Shared wrapper — light background, adapts to email client theme
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        ${content}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailHeader(): string {
  return `
  <tr>
    <td style="padding-bottom:28px;" align="center">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#4f46e5;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:18px;line-height:36px;">⛈️</td>
          <td style="padding-left:10px;">
            <span style="color:#1e293b;font-size:15px;font-weight:700;">StormWatch BH</span><br/>
            <span style="color:#64748b;font-size:11px;">Praćenje nevremena · Bosna i Hercegovina</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function emailFooter(subscriberEmail: string): string {
  const link = `${UNSUBSCRIBE_URL}/api/v1/subscriptions/${encodeURIComponent(subscriberEmail)}`;
  return `
  <tr>
    <td style="padding:24px 0 0;" align="center">
      <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;">
        Pretplaćeni ste kao <strong style="color:#64748b;">${subscriberEmail}</strong>
      </p>
      <p style="margin:0;font-size:12px;">
        <a href="${link}" style="color:#94a3b8;text-decoration:underline;">Otkazati pretplatu</a>
        &nbsp;·&nbsp;
        <span style="color:#cbd5e1;">Open-Meteo · © ${new Date().getFullYear()} StormWatch BH</span>
      </p>
    </td>
  </tr>`;
}

// ── Alert email ──────────────────────────────────────────────────────────────

export function buildAlertEmailHtml(alert: AlertDto, subscriberEmail: string): string {
  const color = SEVERITY_COLORS[alert.severity] ?? '#F44336';
  const severityLabel = SEVERITY_LABELS[alert.severity] ?? alert.severity;
  const conditionLabel = CONDITION_LABELS[alert.condition] ?? alert.condition;

  const recs = alert.recommendations.map((rec) => `
    <tr>
      <td style="padding:5px 8px 5px 0;color:${color};font-weight:bold;vertical-align:top;font-size:15px;">›</td>
      <td style="padding:5px 0;color:#475569;font-size:14px;line-height:1.5;">${rec}</td>
    </tr>`).join('');

  return emailWrapper(`
    ${emailHeader()}
    <tr>
      <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Severity banner -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:${color};padding:18px 24px;border-radius:16px 16px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:rgba(255,255,255,0.85);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Nivo upozorenja</span><br/>
                    <span style="color:#ffffff;font-size:20px;font-weight:900;">${severityLabel}</span>
                  </td>
                  <td align="right">
                    <span style="background:rgba(255,255,255,0.25);color:#ffffff;font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px;">${conditionLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Područje</p>
              <p style="margin:0 0 20px;color:#1e293b;font-size:17px;font-weight:700;">${alert.regionName}</p>

              <h1 style="margin:0 0 10px;color:#0f172a;font-size:20px;font-weight:900;line-height:1.3;border-left:4px solid ${color};padding-left:14px;">${alert.title}</h1>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;padding-left:18px;">${alert.description}</p>

              ${recs ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:24px;border:1px solid #e2e8f0;">
                <tr><td colspan="2" style="padding-bottom:10px;">
                  <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Preporuke</span>
                </td></tr>
                ${recs}
              </table>` : ''}

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:50%;padding-right:6px;">
                    <div style="background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e2e8f0;">
                      <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Izdano</div>
                      <div style="color:#1e293b;font-size:13px;font-weight:600;">${new Date(alert.issuedAt).toLocaleString('bs-BA', { timeZone: 'Europe/Sarajevo', dateStyle: 'short', timeStyle: 'short' })}</div>
                    </div>
                  </td>
                  <td style="width:50%;padding-left:6px;">
                    <div style="background:#f8fafc;border-radius:8px;padding:12px 14px;border:1px solid #e2e8f0;">
                      <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Vrijedi do</div>
                      <div style="color:#1e293b;font-size:13px;font-weight:600;">${new Date(alert.validUntil).toLocaleString('bs-BA', { timeZone: 'Europe/Sarajevo', dateStyle: 'short', timeStyle: 'short' })}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td align="center">
                  <a href="${DASHBOARD_URL}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:10px;">
                    Otvori Dashboard →
                  </a>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${emailFooter(subscriberEmail)}
  `);
}

export function buildAlertEmailSubject(alert: AlertDto): string {
  return `[StormWatch BH] ${alert.title} — ${alert.regionName}`;
}

// ── Welcome email ────────────────────────────────────────────────────────────

export function buildWelcomeEmailHtml(subscriberEmail: string): string {
  return emailWrapper(`
    ${emailHeader()}
    <tr>
      <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Green banner -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#047857);padding:28px;border-radius:16px 16px 0 0;" align="center">
              <div style="font-size:36px;margin-bottom:8px;">✅</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;">Pretplata potvrđena!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Uspješno ste se pretplatili na upozorenja o nevremenu</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
                Zdravo! Od sada ćete primati email obavještenja čim StormWatch BH izda upozorenje za područja Bosne i Hercegovine.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:24px;border:1px solid #e2e8f0;">
                <tr><td colspan="2" style="padding-bottom:10px;">
                  <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Šta možete očekivati</span>
                </td></tr>
                ${[['⛈️','Upozorenja za nevrijeme i grmljavinu'],['💨','Upozorenja za jak vjetar'],['🌧️','Upozorenja za obilne padavine i poplave'],['🌡️','Upozorenja za ekstremnu vrućinu']].map(([icon,text]) => `
                <tr>
                  <td style="width:28px;padding:5px 8px 5px 0;font-size:16px;vertical-align:top;">${icon}</td>
                  <td style="padding:5px 0;color:#475569;font-size:13px;line-height:1.5;">${text}</td>
                </tr>`).join('')}
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td align="center">
                  <a href="${DASHBOARD_URL}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:10px;">
                    Otvori Dashboard →
                  </a>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${emailFooter(subscriberEmail)}
  `);
}

export function buildWelcomeEmailSubject(): string {
  return '✅ Pretplata potvrđena — StormWatch BH upozorenja';
}
