"""Static release checks; no server, dependencies or external account required."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import base64
import hashlib
import json
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://lakshmikantha.in/'


class HTML(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags, self.ids, self.scripts = [], [], []
        self.current, self.parts, self.title = None, [], ''
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag in ('script', 'title'):
            self.current, self.parts = (tag, attrs), []

    def handle_data(self, text):
        if self.current:
            self.parts.append(text)

    def handle_endtag(self, tag):
        if self.current and self.current[0] == tag:
            text = ''.join(self.parts)
            if tag == 'script':
                self.scripts.append((self.current[1], text))
            else:
                self.title = text
            self.current = None


def floor_fingerprint(text):
    svg = re.search(r'<div class="faceted-floor"[^>]*>(<svg.*?</svg>)', text, re.S)[1]
    root = ET.fromstring(svg)
    polygons = []
    for node in root:
        attrs = {**root.attrib, **node.attrib}
        color = attrs['fill']
        rgb = list(bytes.fromhex(color[1:])) if color.startswith('#') else [int(n) for n in re.findall(r'\d+', color)]
        polygons.append({
            'points': [float(n) for n in re.findall(r'-?\d+(?:\.\d+)?', attrs['points'])],
            'fill': rgb, 'stroke': attrs['stroke'],
            'opacity': float(attrs['stroke-opacity']), 'width': float(attrs['stroke-width'])
        })
    assert len(polygons) == 480
    return hashlib.sha256(json.dumps(polygons, separators=(',', ':')).encode()).hexdigest()


def preserved_ui(text):
    start = text.index('  // All resume links')
    end = text.index('\n  const pointer=', start)
    text = text[:start] + '[ENQUIRY]\n' + text[end:]
    marker = '  let chapterNavigationBusy='
    start = text.index(marker) if marker in text else text.index("  document.addEventListener('click',async e=>{")
    end = text.index("  $$('[data-details]')", start)
    return text[:start] + '[SECTION_NAVIGATION]\n' + text[end:]


def preserved_motion(text):
    text = text.replace(",embers=$('embers'),ec=embers?.getContext('2d')", '')
    resize = "    if(embers&&ec){const d=Math.min(devicePixelRatio||1,1.5);embers.width=Math.round(w*d);embers.height=Math.round(h*d);ec.setTransform(d,0,0,d,0,0);}\n"
    text = text.replace(resize, '')
    if '  function emberFrame(' in text:
        start = text.index('  function emberFrame(')
        end = text.index('  function flameFrame(', start)
        text = text[:start] + text[end:]
    start = text.index('  function updateImmerse(')
    end = text.index('  // Loading handoff:', start)
    text = text[:start] + '[NAVIGATION_HINT]\n' + text[end:]
    start = text.index('  // Loading handoff:')
    end = text.index('  const set=', start)
    text = text[:start] + '[LOADING_HANDOFF]\n' + text[end:]
    start = text.index('    if(!openingDone){')
    end = text.index('    // Keep scene choreography', start)
    text = text[:start] + '[LOADING_WAIT]\n' + text[end:]
    return text.replace("    if(behavior==='instant'||reduce.matches)smoothedY=scrollY;\n", '')


class Site(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.urls = [n.text for n in ET.parse(ROOT / 'sitemap.xml').iter() if n.tag.endswith('loc')]
        cls.docs = {url: HTML((ROOT / (urlsplit(url).path.lstrip('/') + 'index.html')).read_text()) for url in cls.urls}
        cls.baseline = json.loads((ROOT / 'tests/animation-baseline.json').read_text())

    def test_all_public_page_metadata_and_identity(self):
        self.assertEqual(len(self.urls), 11)
        titles = set()
        for url, doc in self.docs.items():
            with self.subTest(url=url):
                self.assertEqual(len(doc.ids), len(set(doc.ids)), 'Duplicate IDs')
                self.assertEqual(sum(t == 'h1' for t, _ in doc.tags), 1)
                self.assertEqual([a.get('href') for t, a in doc.tags if t == 'link' and a.get('rel') == 'canonical'], [url])
                self.assertTrue(doc.title)
                self.assertNotIn(doc.title, titles)
                titles.add(doc.title)
                self.assertTrue(any(t == 'meta' and a.get('name') == 'description' and a.get('content') for t, a in doc.tags))
                people = []
                for attrs, text in doc.scripts:
                    if attrs.get('type') == 'application/ld+json':
                        data = json.loads(text)
                        for item in data.get('@graph', [data]):
                            if item.get('@type') == 'Person':
                                people.append(item)
                            if item.get('@type') == 'BreadcrumbList':
                                for entry in item['itemListElement']:
                                    self.assertIn(entry['item'], self.docs)
                self.assertTrue(people)
                for person in people:
                    self.assertEqual(person['@id'], BASE + '#person')
                    self.assertEqual(person['name'], 'Lakshmikantha R K')
                    self.assertEqual(person['alternateName'], ['LK', 'Lakshmikantha RK', 'LKRK'])

    def test_local_references_fragments_and_csp(self):
        docs = {**self.docs, BASE + '404.html': HTML((ROOT / '404.html').read_text())}
        checked = 0
        for url, doc in docs.items():
            with self.subTest(url=url):
                for tag, attrs in doc.tags:
                    if tag == 'img':
                        self.assertIn('alt', attrs)
                    for name in ('href', 'src', 'poster'):
                        raw = attrs.get(name, '')
                        if not raw or raw.startswith(('mailto:', 'tel:', 'data:', 'blob:')):
                            continue
                        target = urlsplit(urljoin(url, raw))
                        if target.netloc != 'lakshmikantha.in':
                            continue
                        rel = unquote(target.path).lstrip('/')
                        if not rel or rel.endswith('/'):
                            rel += 'index.html'
                        self.assertTrue((ROOT / rel).is_file(), raw)
                        checked += 1
                        target_url = BASE + rel.removesuffix('index.html')
                        if target.fragment and target_url in docs:
                            self.assertIn(unquote(target.fragment), docs[target_url].ids, raw)
                csp = next((a['content'] for t, a in doc.tags if t == 'meta' and a.get('http-equiv') == 'Content-Security-Policy'), '')
                for attrs, text in doc.scripts:
                    if attrs.get('type') in ('application/json', 'application/ld+json'):
                        json.loads(text)
                    elif not attrs.get('src'):
                        digest = base64.b64encode(hashlib.sha256(text.encode()).digest()).decode()
                        self.assertIn('sha256-' + digest, csp)
        self.assertGreaterEqual(checked, 239)

    def test_contact_is_available_without_javascript(self):
        attrs = {a['id']: a for _, a in self.docs[BASE].tags if 'id' in a}
        self.assertNotIn('hidden', attrs['enquiry-panel'], 'The fallback form must be accessible without scripts')
        self.assertIn('hidden', attrs['enquiry-toggle'], 'Script-only disclosure must be progressively enabled')
        self.assertIn('hidden', attrs['copy-enquiry'], 'Script-only copying must be progressively enabled')
        self.assertIn('hidden', attrs['analytics-preferences'])

    def test_all_pages_share_consent_controlled_measurement(self):
        for url, doc in self.docs.items():
            with self.subTest(url=url):
                settings = [a for a, _ in doc.scripts if 'settings.js' in a.get('src', '')]
                self.assertEqual(len(settings), 1)
                self.assertEqual(settings[0]['src'], '/assets/js/settings.js?v=ga4-20261104')
                attrs = {a['id']: a for _, a in doc.tags if 'id' in a}
                self.assertIn('hidden', attrs['analytics-choice'])
                self.assertIn('hidden', attrs['analytics-preferences'])
                csp = next(a['content'] for t, a in doc.tags if t == 'meta' and a.get('http-equiv') == 'Content-Security-Policy')
                self.assertIn('https://www.googletagmanager.com', csp)
                self.assertIn('https://*.google-analytics.com', csp)
                self.assertFalse(any('googletagmanager.com' in a.get('src', '') for a, _ in doc.scripts))
                self.assertNotIn('This page uses no analytics', (ROOT / (urlsplit(url).path.lstrip('/') + 'index.html')).read_text())

    def test_confirmed_biography_and_project_counts(self):
        data = json.loads(next(s for a, s in self.docs[BASE].scripts if a.get('id') == 'portfolio-data'))
        self.assertEqual(data['profile']['fullName'], 'Lakshmikantha R K')
        self.assertEqual(data['profile']['email'], 'lakshmikanthark20@gmail.com')
        jobs = {item['company']: item['period'] for item in data['experience']}
        self.assertEqual(jobs['Hiland Realty'], 'Jan – Sep 2026')
        self.assertEqual(jobs['Posterwa'], '2023 – ongoing freelance work')
        for key, count in [('projects', 4), ('experiments', 4), ('artworks', 8)]:
            self.assertEqual(len(data[key]), count)
        for project in data['projects']:
            self.assertTrue(project['status'])

    def test_original_animation_and_media_are_preserved(self):
        for rel, expected in self.baseline['files'].items():
            with self.subTest(file=rel):
                self.assertEqual(hashlib.sha256((ROOT / rel).read_bytes()).hexdigest(), expected)
        ui = preserved_ui((ROOT / 'assets/js/ui.js').read_text())
        self.assertEqual(hashlib.sha256(ui.encode()).hexdigest(), self.baseline['ui_outside_enquiry'])
        motion = preserved_motion((ROOT / 'assets/js/motion.js').read_text())
        self.assertEqual(hashlib.sha256(motion.encode()).hexdigest(), self.baseline['motion_outside_loading'])

    def test_svg_geometry_colour_and_paint_order_are_identical(self):
        self.assertEqual(floor_fingerprint((ROOT / 'index.html').read_text()), self.baseline['floor_fingerprint'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
