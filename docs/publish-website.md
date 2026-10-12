# Put The Public Square online

The website is ready for free hosting on GitHub Pages. All electoral tools, maps, filters, civic pages and downloads are included. Your existing GitHub repository holds the website and its publishing workflow.

## One-time setup

1. Sign in to the GitHub account that owns the repository.
2. Open [the repository’s Pages settings](https://github.com/mongezikembe10111-create/Mora-Data-Center-MDC-/settings/pages).
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open [the Publish The Public Square workflow](https://github.com/mongezikembe10111-create/Mora-Data-Center-MDC-/actions/workflows/pages.yml).
5. Click **Run workflow**, leave the branch as **main**, and click the green **Run workflow** button.
6. Wait for both the build and deploy jobs to show green ticks. This can take a few minutes.
7. Open the website link shown in the deployment job. After successful publication, its default address is `https://mongezikembe10111-create.github.io/Mora-Data-Center-MDC-/`.

A saved source update is not proof that hosting succeeded. Use the green deployment result and open the site to confirm it is online. If the workflow shows a red cross, open the failed step and copy its error text when asking for help.

## Later changes

Once Pages is enabled, a push to `main` runs tests, builds the complete static site and publishes it. The original Node.js development and production commands still work locally. A custom domain is optional and can be added by its owner in Pages settings.

The curated civic source records still require editorial checking and a new build when they change. Displayed status follows South African time; users should confirm submission details with the linked issuer.

## What was verified

The public-site export was built in an isolated directory and served with the exact GitHub project path. Direct page loads, client navigation, branding, municipality lookup, keyboard form submission, the WebGL map and local source assets were verified. Public hosting is a separate step: the cloud environment could not access the GitHub Pages administration API, so repository Pages enablement must be completed by its owner.
