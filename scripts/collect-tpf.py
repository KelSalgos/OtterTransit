"""Read the official TPF current traffic section. No full page or notice text is republished."""
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import sys
URL = "https://www.tpf.ch/fr/horaires-et-reseaux/perturbations-et-travaux/info-trafic"
BLOCK = {"h1","h2","h3","h4","h5","h6","div","section","article","p","li","br","main","header","footer","tr","td","ul","ol"}
IGNORE = {"script","style","noscript","template","svg"}
class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.ignored = []
    def handle_starttag(self, tag, attrs):
        if tag in IGNORE:
            self.ignored.append(tag)
        if not self.ignored and tag in BLOCK:
            self.parts.append("\n")
    def handle_endtag(self, tag):
        if self.ignored:
            if tag == self.ignored[-1]:
                self.ignored.pop()
            return
        if tag in BLOCK:
            self.parts.append("\n")
    def handle_data(self, data):
        if not self.ignored:
            self.parts.append(data)
if __name__ == "__main__":
    req = Request(URL, headers={"User-Agent":"OtterTransit/0.8 (public traffic information; https://github.com/KelSalgos/OtterTransit)", "Accept":"text/html"})
    with urlopen(req, timeout=25) as res:
        if urlparse(res.geturl()).hostname not in ("www.tpf.ch","tpf.ch"):
            raise ValueError("Unexpected redirect")
        raw = res.read(4_000_001)
        if len(raw)>4_000_000:
            raise ValueError("Page too large")
        encoding = res.headers.get_content_charset() or "utf-8"
    parser = Text()
    parser.feed(raw.decode(encoding,errors="replace"))
    sys.stdout.write("".join(parser.parts))
