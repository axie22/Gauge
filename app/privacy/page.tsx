export default function PrivacyPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 48 }}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 32 }}>
          <h1
            className="font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text-1)', letterSpacing: '-0.02em' }}
          >
            Privacy Policy
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.06em', marginTop: 8 }}>
            LAST UPDATED: MARCH 2026
          </p>
        </div>

        <div className="space-y-8" style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Overview
            </h2>
            <p>
              Training Intelligence is a personal-use application that integrates with Hevy and WHOOP
              to provide workout analytics and AI coaching. This application is not a commercial product
              and is operated solely for personal use by its owner.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Data Collection and Use
            </h2>
            <p>
              This application accesses the following data from connected services:
            </p>
            <ul className="mt-3 space-y-2 pl-4" style={{ listStyleType: 'disc' }}>
              <li>Workout history and exercise data from Hevy</li>
              <li>Recovery scores, HRV, resting heart rate, and sleep data from WHOOP</li>
              <li>WHOOP workout activities including heart rate and strain metrics</li>
            </ul>
            <p className="mt-4">
              All data is used exclusively to generate personal training insights and power an AI coaching
              assistant. No data is transmitted to any third party or external service other than the
              local AI model (Ollama) running on your own machine.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Data Storage
            </h2>
            <p>
              All data is stored locally on the device running this application. OAuth access tokens
              are stored in a local file and are not transmitted beyond the application. No databases,
              cloud services, or analytics platforms are used.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Data Sharing
            </h2>
            <p>
              <strong style={{ color: 'var(--text-1)' }}>
                Your data is not shared with, sold to, or disclosed to any third parties.
              </strong>{' '}
              The application does not transfer or disclose WHOOP user data to any external party,
              consistent with the WHOOP API Terms of Use.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Security
            </h2>
            <p>
              This application communicates with WHOOP and Hevy APIs exclusively over HTTPS.
              OAuth tokens are stored locally with access restricted to the running application process.
              Sensitive credentials are stored in environment variables and never committed to version control.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Revoking Access
            </h2>
            <p>
              You can disconnect WHOOP access at any time from the Profile page. This deletes the stored
              tokens locally. You can also revoke application access directly from your WHOOP account
              settings at any time.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Contact
            </h2>
            <p>
              This is a personal-use application. For questions about data handling, contact the
              application owner directly.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
