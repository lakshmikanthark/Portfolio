"""Release checks for crawlable pages, factual entity links and share metadata.

Uses the existing site parser and Pillow for actual PNG/WebP dimensions.
"""
from collections import Counter
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.robotparser import RobotFileParser
import json
import re
import runpy
import unittest
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://lakshmikantha.in/'
HTML = runpy.run_path(str(ROOT / 'tests/site.test.py'))['HTML']


class Discovery(unittest.TestCase):
    def test_original_knight_icons_are_available_on_every_portfolio_page(self):
        originals = {'favicon.ico': '33d762db7f495fba.ico',
                     'favicon-96x96.png': '8c61cbbfb759d262.png',
                     'favicon-32x32.png': 'e335ffbdf93f12e1.png',
                     'favicon-16x16.png': 'b045955c226ddd73.png',
                     'apple-touch-icon.png': '6e9ee796923c6e8b.png'}
        for name, original in originals.items():
            self.assertEqual((ROOT / name).read_bytes(), (ROOT / 'assets/media' / original).read_bytes())
            with Image.open(ROOT / name) as image:
                self.assertEqual(image.width, image.height)
        robots = RobotFileParser()
        robots.parse((ROOT / 'robots.txt').read_text().splitlines())
        for name in originals:
            self.assertTrue(robots.can_fetch('Googlebot-Image', BASE + name))
        for path in ROOT.rglob('*.html'):
            if 'assets' in path.relative_to(ROOT).parts:
                continue
            links = [a for tag, a in HTML(path.read_text()).tags if tag == 'link']
            for name in originals:
                self.assertEqual(sum(a.get('href') == '/' + name for a in links), 1, str(path))
            self.assertEqual(sum(a.get('rel') == 'manifest' and a.get('href') == '/site.webmanifest' for a in links), 1)
        manifest = json.loads((ROOT / 'site.webmanifest').read_text())
        self.assertEqual(manifest['start_url'], '/')
        self.assertEqual(manifest['scope'], '/')
        self.assertEqual(manifest['icons'][0]['src'], '/favicon-96x96.png')

    @classmethod
    def setUpClass(cls):
        cls.urls = [n.text for n in ET.parse(ROOT / 'sitemap.xml').iter() if n.tag.endswith('loc')]
        cls.docs = {url: HTML((ROOT / urlsplit(url).path.lstrip('/') / 'index.html').read_text()) for url in cls.urls}
        cls.graphs = {url: [node for attrs, text in doc.scripts
                            if attrs.get('type') == 'application/ld+json'
                            for node in json.loads(text).get('@graph', [])]
                      for url, doc in cls.docs.items()}

    def test_social_cards_match_the_actual_images_and_canonical_page(self):
        descriptions = set()
        for url, doc in self.docs.items():
            with self.subTest(url=url):
                entries = [(a.get('property', a.get('name')), a.get('content')) for t, a in doc.tags if t == 'meta']
                counts = Counter(k for k, _ in entries if k)
                self.assertTrue(all(n == 1 for n in counts.values()), 'Conflicting duplicate metadata')
                meta = dict(entries)
                self.assertEqual(meta['og:url'], url)
                self.assertNotIn('noindex', meta['robots'])
                self.assertTrue(meta['description'])
                self.assertNotIn(meta['description'], descriptions)
                descriptions.add(meta['description'])
                for key in ['og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image:alt']:
                    self.assertTrue(meta.get(key), key)
                self.assertEqual(meta['twitter:card'], 'summary_large_image')
                if any(n['@type'] == 'Article' for n in self.graphs[url]):
                    self.assertEqual(meta['og:type'], 'article')
                self.assertEqual(meta['twitter:image'], meta['og:image'])
                self.assertEqual(meta['og:image:secure_url'], meta['og:image'])
                parsed = urlsplit(meta['og:image'])
                self.assertEqual((parsed.scheme, parsed.netloc), ('https', 'lakshmikantha.in'))
                with Image.open(ROOT / parsed.path.lstrip('/')) as image:
                    self.assertEqual((int(meta['og:image:width']), int(meta['og:image:height'])), image.size)
                    self.assertEqual(meta['og:image:type'], Image.MIME[image.format])

    def test_entity_references_resolve_and_services_and_articles_have_real_owners(self):
        entities = {n['@id'] for nodes in self.graphs.values() for n in nodes if '@id' in n}

        def references(value):
            if isinstance(value, dict):
                if '@id' in value:
                    yield value['@id']
                for child in value.values():
                    yield from references(child)
            elif isinstance(value, list):
                for child in value:
                    yield from references(child)

        for url, nodes in self.graphs.items():
            with self.subTest(url=url):
                ids = [node['@id'] for node in nodes if '@id' in node]
                self.assertEqual(len(ids), len(set(ids)))
                self.assertTrue(set(references(nodes)) <= entities)
                for node in nodes:
                    if node['@type'] == 'ProfilePage':
                        self.assertEqual(node['mainEntity']['@id'], BASE + '#person')
                    elif node['@type'] == 'Service':
                        self.assertEqual(node['provider']['@id'], BASE + '#person')
                        self.assertEqual(node['url'], url)
                    elif node['@type'] == 'Article':
                        self.assertEqual(node['author']['@id'], BASE + '#person')
                        self.assertEqual(node['url'], url)
                    elif node['@type'] == 'BreadcrumbList':
                        items = node['itemListElement']
                        self.assertEqual([i['position'] for i in items], list(range(1, len(items) + 1)))
                        self.assertEqual(items[-1]['item'], url)

    def test_every_canonical_page_is_reachable_through_initial_html_links(self):
        reached, pending = set(), [BASE]
        while pending:
            url = pending.pop()
            if url in reached:
                continue
            reached.add(url)
            for tag, attrs in self.docs[url].tags:
                if tag != 'a' or not attrs.get('href'):
                    continue
                target = urlsplit(urljoin(url, attrs['href']))
                candidate = target._replace(query='', fragment='').geturl()
                if candidate in self.docs and candidate not in reached:
                    pending.append(candidate)
        self.assertEqual(reached, set(self.urls), 'An intended search landing page is orphaned')

    def test_all_canonical_pages_allow_the_consent_controlled_google_connection(self):
        for url, doc in self.docs.items():
            with self.subTest(url=url):
                settings = [a['src'] for a, _ in doc.scripts if 'settings.js' in a.get('src', '')]
                self.assertEqual(settings, ['/assets/js/settings.js?v=search-audit-20261104'])
                self.assertFalse(any('googletagmanager.com/' in a.get('src', '') for a, _ in doc.scripts))
                csp = next(a['content'] for t, a in doc.tags if t == 'meta' and a.get('http-equiv') == 'Content-Security-Policy')
                directives = {part.split()[0]: part.split()[1:] for part in csp.split(';') if part.strip()}
                self.assertIn('https://www.googletagmanager.com', directives['script-src'])
                for origin in ['https://www.googletagmanager.com', 'https://*.google-analytics.com', 'https://*.google.com']:
                    self.assertIn(origin, directives['connect-src'])
                self.assertNotIn("'unsafe-eval'", directives['script-src'])

    def test_discovery_files_agree_without_exposing_error_or_demo_pages(self):
        self.assertEqual(len(self.urls), len(set(self.urls)))
        links = re.findall(r'\]\((https://[^)]+)\)', (ROOT / 'llms.txt').read_text())
        self.assertEqual(set(links), set(self.urls))
        self.assertEqual(len(links), len(self.urls))
        robots = RobotFileParser()
        robots.parse((ROOT / 'robots.txt').read_text().splitlines())
        self.assertEqual(robots.site_maps(), [BASE + 'sitemap.xml'])
        for agent in ['Googlebot', 'bingbot', 'OAI-SearchBot']:
            for url in self.urls:
                self.assertTrue(robots.can_fetch(agent, url))
        for name in ['404.html', 'assets/media/9f9acea32bf4f6b3.html']:
            doc = HTML((ROOT / name).read_text())
            self.assertTrue(any(t == 'meta' and a.get('name') == 'robots' and 'noindex' in a.get('content', '') for t, a in doc.tags))
            self.assertNotIn(BASE + name, self.urls)
        self.assertEqual((ROOT / 'CNAME').read_text().strip(), 'lakshmikantha.in')
        key = ROOT / '8aebd4d31700ce02d2b24cacd5242fae.txt'
        self.assertEqual(key.read_text().strip(), key.stem)


if __name__ == '__main__':
    unittest.main(verbosity=2)
