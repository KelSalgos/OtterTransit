"""Fallback when the public traffic page requires rendering. Read one public page only."""
from playwright.sync_api import sync_playwright
URL="https://www.tpf.ch/fr/horaires-et-reseaux/perturbations-et-travaux/info-trafic"
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(locale="fr-CH")
    page.route("**/*",lambda route: route.abort() if route.request.resource_type in ("image","media","font") else route.continue_())
    page.goto(URL,wait_until="domcontentloaded",timeout=45000)
    try:
        page.get_by_text("Informations détaillées",exact=True).first.wait_for(state="attached",timeout=12000)
    except Exception:
        pass
    # Include hidden cards in the DOM if they are already delivered to the page.
    # Preserve line boundaries without reading script, style, or template contents.
    print(page.evaluate("""() => {
      const root=document.body.cloneNode(true);
      root.querySelectorAll('script,style,noscript,template,svg').forEach(x=>x.remove());
      root.querySelectorAll('h1,h2,h3,h4,h5,h6,div,section,article,p,li,br,td,span').forEach(x=>{x.prepend('\\n');x.append('\\n')});
      return root.textContent;
    }"""))
    browser.close()
