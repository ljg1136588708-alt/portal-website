<template>
  <div class="privacy-wrapper">
    <div class="privacy-content">
      <h1>Privacy Policy</h1>
      <p class="updated">Last updated: May 15, 2026</p>

      <section>
        <h2>Overview</h2>
        <p>
          This privacy policy applies to the browser extension developed by <strong>Tom Liu</strong>.
          We are committed to protecting your privacy. This document explains what information we
          collect (or rather, what we do not collect) and how your data is handled.
        </p>
      </section>

      <section>
        <h2>No Data Collection</h2>
        <p>
          This extension does <strong>not</strong> collect, transmit, or share any personal
          information or usage data. We do not use analytics, tracking pixels, or any third-party
          services that gather data about you or your browsing activity.
        </p>
      </section>

      <section>
        <h2>Local Data Storage</h2>
        <p>
          All data generated or used by this extension is stored exclusively on your local device
          using the browser's built-in storage APIs. No data is ever sent to external servers.
          Your information stays entirely under your control and never leaves your device.
        </p>
      </section>

      <section>
        <h2>Permissions</h2>
        <p>
          Any browser permissions requested by the extension are used solely to provide the
          extension's core functionality. These permissions are not used to collect or transmit
          data of any kind.
        </p>
      </section>

      <section>
        <h2>Third-Party Services</h2>
        <p>
          This extension does not integrate with any third-party services, advertising networks,
          or analytics platforms.
        </p>
      </section>

      <section>
        <h2>Changes to This Policy</h2>
        <p>
          If this privacy policy is updated in the future, the new version will be published at
          this URL. Continued use of the extension after any changes constitutes acceptance of
          the updated policy.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          If you have any questions or concerns about this privacy policy, please contact
          <strong>Tom Liu</strong> at
          <a href="mailto:ljg1136588708@gmail.com">ljg1136588708@gmail.com</a>.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.privacy-wrapper {
  min-height: 100vh;
  background: #f9f9f9;
  padding: 60px 16px;
}

.privacy-content {
  max-width: 760px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 48px 56px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
}

.updated {
  color: #888;
  font-size: 0.875rem;
  margin-bottom: 36px;
}

section {
  margin-bottom: 32px;
}

h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #222;
  margin-bottom: 10px;
}

p {
  line-height: 1.75;
  color: #444;
}

a {
  color: #1677ff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
