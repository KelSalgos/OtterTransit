"""Collect the public line-filtered TPF notice cards, without publishing original prose."""
import re
import sys
from playwright.sync_api import sync_playwright
URL="https://www.tpf.ch/fr/horaires-et-reseaux/perturbations-et-travaux/info-trafic"
SELECTOR='img[src*="/Images/Lines/" i]'
EXTRACT=r"""() => {
 const root=document.body.cloneNode(true);
 root.querySelectorAll('script,style,noscript,template,svg').forEach(x=>x.remove());
 root.querySelectorAll('h1,h2,h3,h4,h5,h6,div,section,article,p,li,br,td').forEach(x=>{x.prepend('\n');x.append('\n')});
 return root.textContent;
}"""
def normalize(s):
    return re.sub(r"\s+"," ",s).strip()
def notices(text):
    # Do not rely on exact layout, and never combine the end of one card with another.
    if "Informations détaillées" in text:
        text=text.split("Informations détaillées",1)[1]
    text=re.split(r"Questions fréquemment posées",text,flags=re.I)[0]
    return [normalize(x) for x in re.split(r"(?=\bDu\s*:\s*\d{2}[./]\d{2}[./]\d{4})",text) if re.search(r"\bDu\s*:\s*\d{2}[./]\d{2}[./]\d{4}",x) and re.search(r"\bAu\s*:",x)]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(locale="fr-CH")
    page.route("**/*",lambda route: route.abort() if route.request.resource_type in ("media","font") else route.continue_())
    page.goto(URL,wait_until="domcontentloaded",timeout=45000)
    # The line icons are image controls on the traffic page. Inspect their DOM,
    # then click their actual interactive ancestor; avoid unrelated navigation.
    try:
        page.locator(SELECTOR).first.wait_for(state="attached",timeout=15000)
    except Exception:
        pass
    initial=page.evaluate(EXTRACT)
    collected=dict.fromkeys(notices(initial))
    icons=page.locator(SELECTOR).evaluate_all("""els=>[...new Set(els.filter(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0).map(e=>e.getAttribute('src')).filter(Boolean))]""")
    print(f"TPF detail collector: {len(icons)} visible line icons; {len(collected)} initial cards",file=sys.stderr)
    failed=0
    for src in icons[:100]:
        try:
            icon=page.locator(SELECTOR)
            target=next((icon.nth(i) for i in range(icon.count()) if icon.nth(i).get_attribute("src")==src and icon.nth(i).is_visible()),None)
            if target is None:
                raise RuntimeError("line icon missing")
            # Playwright dispatches click on the actual image, bubbling to the site's handler.
            # Avoid a navigation to an image file or unrelated domain.
            previous=page.url
            target.click(timeout=2500)
            try:
                page.get_by_text("Informations détaillées",exact=True).first.wait_for(state="attached",timeout=3000)
            except Exception:
                pass
            # Allow asynchronous rendering, but bound waiting per line.
            page.wait_for_timeout(700)
            if not page.url.startswith(URL):
                page.goto(previous,wait_until="domcontentloaded",timeout=15000)
                raise RuntimeError("line click navigated away")
            cards=notices(page.evaluate(EXTRACT))
            for card in cards:
                collected[card]=None
            if not cards:
                failed+=1
        except Exception as exc:
            failed+=1
            print(f"Line interaction failed: {type(exc).__name__}",file=sys.stderr)
    print(f"TPF detail collector: {len(collected)} distinct cards; {failed} failed line interactions",file=sys.stderr)
    # Single synthetic section made from real site content. Parser handles deduplication.
    print(initial.split("Travaux et manifestations",1)[0])
    print("Travaux et manifestations\nInformations détaillées")
    if failed or len(icons)>100:
        print("OTTER_PARTIAL_COVERAGE")
    for card in collected:
        print(card)
    browser.close()
