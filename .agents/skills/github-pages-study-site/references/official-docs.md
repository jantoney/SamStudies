# Official Docs

Use GitHub and Jekyll primary sources before promising exact GitHub Pages behavior.

Re-check the live docs when the task depends on:
- Current limits.
- Current plan availability for private repositories.
- Publishing source behavior.
- Jekyll plugin support.
- Custom domain or HTTPS setup details.

## Current Capability Notes

These points were verified from official docs while creating this skill:

- GitHub Pages is a static site hosting service that serves HTML, CSS, and JavaScript from a repository and can optionally run a build step.
- GitHub Actions is currently the recommended approach for deploying and automating GitHub Pages sites.
- GitHub Pages' built-in Jekyll flow cannot build sites that depend on unsupported plugins; build elsewhere and publish static output instead.
- If a repository contains symbolic links, branch publishing is not the safe assumption; use a GitHub Actions workflow.
- GitHub Pages limits currently include a recommended 1 GB source repository size, a 1 GB published-site size limit, a 10 minute deployment timeout, a 100 GB per month soft bandwidth limit, and a 10 builds per hour soft limit. The 10 builds per hour limit does not apply when publishing with a custom GitHub Actions workflow.

## GitHub Docs

- What is GitHub Pages?  
  https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Creating a GitHub Pages site  
  https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Configuring a publishing source for your GitHub Pages site  
  https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Using custom workflows with GitHub Pages  
  https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub Pages limits  
  https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- About GitHub Pages and Jekyll  
  https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll
- Troubleshooting Jekyll build errors for GitHub Pages sites  
  https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/troubleshooting-jekyll-build-errors-for-github-pages-sites
- About custom domains and GitHub Pages  
  https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
- Securing your GitHub Pages site with HTTPS  
  https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

## Jekyll Docs

- Front matter  
  https://jekyllrb.com/docs/front-matter/
- Collections  
  https://jekyllrb.com/docs/collections/
- Step-by-step collections  
  https://jekyllrb.com/docs/step-by-step/09-collections/
- Data files  
  https://jekyllrb.com/docs/datafiles/
- Directory structure  
  https://jekyllrb.com/docs/structure/
- Layouts  
  https://jekyllrb.com/docs/layouts/
- Step-by-step layouts  
  https://jekyllrb.com/docs/step-by-step/04-layouts/
- Permalinks  
  https://jekyllrb.com/docs/permalinks/
