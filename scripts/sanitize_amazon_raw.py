import os
import re
import json
import urllib.parse
from bs4 import BeautifulSoup, Comment

RAW_PAGES_DIR = r"C:\Users\ANANTMADHAV\PROJECTS\hackathon-intel\clones\amazon_scraped_raw\pages"
MANIFEST_PATH = r"C:\Users\ANANTMADHAV\PROJECTS\hackathon-intel\clones\amazon_scraped_raw\harvest_manifest.json"
OUTPUT_DIR = r"C:\OMNISTU GLOBALS\omnistu-superstore\public\sanitized_pages"
LOCAL_IMAGES_DIR = r"C:\OMNISTU GLOBALS\omnistu-superstore\public\assets\images"
LOCAL_FONTS_DIR = r"C:\OMNISTU GLOBALS\omnistu-superstore\public\assets\fonts"
LOCAL_CSS_DIR = r"C:\OMNISTU GLOBALS\omnistu-superstore\public\assets\css"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load manifest
with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    manifest = json.load(f)

# Build lookup maps
css_map = {}
for item in manifest.get("css", []):
    url_base = item["url"].split("?")[0]
    css_map[url_base] = item["file"]
    css_map[item["url"]] = item["file"]

img_map = {}
for item in manifest.get("images", []):
    url_base = item["url"].split("?")[0]
    img_map[url_base] = item["file"]
    img_map[item["url"]] = item["file"]

font_map = {}
for item in manifest.get("fonts", []):
    url_base = item["url"].split("?")[0]
    font_map[url_base] = item["file"]
    font_map[item["url"]] = item["file"]

local_images = set(os.listdir(LOCAL_IMAGES_DIR))
local_css = set(os.listdir(LOCAL_CSS_DIR))
local_fonts = set(os.listdir(LOCAL_FONTS_DIR))

FALLBACK_IMG = "/assets/images/nav-sprite-global-1x-reorg-privacy._CB779528203_.png"

def resolve_image(src):
    if not src or "fls-na.amazon.com" in src or src.startswith("data:"):
        return None
    clean = src.split("?")[0]
    if clean in img_map and img_map[clean] in local_images:
        return f"/assets/images/{img_map[clean]}"
    fname = clean.split("/")[-1]
    if fname in local_images:
        return f"/assets/images/{fname}"
    # check url-encoded or unencoded
    unquoted = urllib.parse.unquote(fname)
    if unquoted in local_images:
        return f"/assets/images/{unquoted}"
    # Asin / key prefix match
    prefix = fname.split(".")[0]
    if len(prefix) >= 5:
        for f in local_images:
            if f.startswith(prefix):
                return f"/assets/images/{f}"
    return f"/assets/images/{fname}" if fname in local_images else FALLBACK_IMG

def resolve_css(href):
    if not href:
        return None
    clean = href.split("?")[0]
    if clean in css_map and css_map[clean] in local_css:
        return f"/assets/css/{css_map[clean]}"
    fname = clean.split("/")[-1]
    if fname in local_css:
        return f"/assets/css/{fname}"
    for k, v in css_map.items():
        if k in href or href in k:
            if v in local_css:
                return f"/assets/css/{v}"
    # Check if encoded version matches
    quoted = urllib.parse.quote(fname)
    if quoted in local_css:
        return f"/assets/css/{quoted}"
    return None

def sanitize_page(filename, page_type="general"):
    src_path = os.path.join(RAW_PAGES_DIR, filename)
    if not os.path.exists(src_path):
        print(f"File not found: {src_path}")
        return

    with open(src_path, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # 1. Strip comments
    for comment in soup.find_all(text=lambda text: isinstance(text, Comment)):
        comment.extract()

    # 2. Strip tracking & telemetry scripts
    telemetry_patterns = [
        "ue_csm", "ue_id", "uedata", "csa", "fls-na.amazon.com",
        "google-analytics", "gtag", "AmazonAdvertising", "forensics",
        "csm", "ue.stub", "ue.count", "ue.tag", "ue_t0", "uet("
    ]
    for script in soup.find_all("script"):
        src = script.get("src", "")
        content = script.string or ""
        is_telemetry = any(p in src or p in content for p in telemetry_patterns)
        if is_telemetry or not src:
            # We strip telemetry scripts and inline Amazon ad/beacon scripts
            script.extract()

    # 3. Strip tracking pixels (1x1 images, beacons)
    for img in soup.find_all("img"):
        src = img.get("src", "")
        if "fls-na.amazon.com" in src or "uedata" in src or "batch/1/OP" in src:
            img.extract()
            continue
        new_src = resolve_image(src)
        if new_src:
            img["src"] = new_src
        if img.get("data-a-hires"):
            img["data-a-hires"] = resolve_image(img.get("data-a-hires")) or new_src
        if img.get("data-src"):
            img["data-src"] = resolve_image(img.get("data-src")) or new_src

    # 4. Rewrite Stylesheet Links
    for link in soup.find_all("link", rel="stylesheet"):
        href = link.get("href", "")
        new_href = resolve_css(href)
        if new_href:
            link["href"] = new_href
        elif "media-amazon.com" in href:
            # Drop unresolvable external stylesheets
            link.extract()

    # 5. Fix CSS URLs in inline <style> tags
    for style in soup.find_all("style"):
        if style.string:
            css_text = style.string
            # Replace font URLs
            css_text = re.sub(
                r'https?://m\.media-amazon\.com/images/S/sash/([a-zA-Z0-9_-]+\.woff2)',
                r'/assets/fonts/\1',
                css_text
            )
            # Replace image URLs
            css_text = re.sub(
                r'https?://m\.media-amazon\.com/images/([^\'")\s]+)',
                lambda m: resolve_image(m.group(0)) or FALLBACK_IMG,
                css_text
            )
            style.string = css_text

    # 6. Rebranding Header Logo
    nav_logo = soup.find(id="nav-logo") or soup.find("a", class_="nav-logo-link")
    if nav_logo:
        nav_logo["href"] = "/"
        nav_logo.clear()
        # Create authentic Amazon Ember logo with Omnistu branding
        logo_html = """
        <span class="nav-logo-base" style="font-family:'Amazon Ember',Arial,sans-serif;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;display:flex;align-items:center;padding:6px 0;">
            omnistu<span style="color:#ff9900;font-size:16px;font-weight:900;margin-left:2px;margin-top:2px;">.us</span>
        </span>
        """
        logo_soup = BeautifulSoup(logo_html, "html.parser")
        nav_logo.append(logo_soup)

    # 7. Add Seller Central / Admin Link in Subnav
    nav_xshop = soup.find(id="nav-xshop")
    if nav_xshop:
        admin_link = soup.find("a", href="/admin")
        if not admin_link:
            admin_btn = soup.new_tag("a", href="/admin", **{
                "class": "nav-a",
                "style": "color:#ff9900 !important;font-weight:700;display:inline-flex;align-items:center;background:rgba(255,153,0,0.15);padding:2px 10px;border-radius:3px;border:1px solid #ff9900;margin-left:8px;"
            })
            admin_btn.string = "⚙ Seller Central / Admin"
            nav_xshop.append(admin_btn)

    # 8. Rebrand Search Form & Inputs
    search_form = soup.find(id="nav-search-bar-form")
    if search_form:
        search_form["action"] = "/s"
        search_form["method"] = "GET"
    search_input = soup.find(id="twotabsearchtextbox")
    if search_input:
        search_input["name"] = "k"

    # 9. Rebrand Footer
    footer = soup.find(id="navFooter")
    if footer:
        # Replace copyright notices
        for el in footer.find_all(text=re.compile(r"©\s*\d{4}[-–]?\d{4},?\s*Amazon\.com", re.IGNORECASE)):
            el.replace_with("© 1996-2026, Omnistu Superstore, Inc. or its affiliates")
        for el in footer.find_all(text=re.compile(r"Amazon\.com,?\s*Inc\.", re.IGNORECASE)):
            el.replace_with("Omnistu Superstore, Inc.")

    # 10. Update Title
    titles = {
        "01_homepage.html": "Omnistu Superstore. Spend less. Smile more.",
        "02_search_magnetic_balls.html": "Omnistu Superstore: Magnetic Balls Fidget Toys",
        "03_category_toys_bestsellers.html": "Omnistu Superstore Best Sellers: Toys & Games",
        "04_product_detail_page.html": "Silicone Magnetic Balls Fidget Toys | Omnistu Superstore",
        "05_cart_page.html": "Omnistu Superstore Shopping Cart",
        "06_checkout_page.html": "Omnistu Superstore Checkout",
        "07_orders_page.html": "Your Orders | Omnistu Superstore"
    }
    if soup.title:
        soup.title.string = titles.get(filename, "Omnistu Superstore")
    else:
        new_title = soup.new_tag("title")
        new_title.string = titles.get(filename, "Omnistu Superstore")
        if soup.head:
            soup.head.append(new_title)

    # 11. Inject Core Client Engine Script
    core_script = soup.new_tag("script", src="/assets/js/amazon-client-core.js")
    if soup.body:
        soup.body.append(core_script)

    # 12. Save Sanitized File
    dest_path = os.path.join(OUTPUT_DIR, filename)
    with open(dest_path, "w", encoding="utf-8") as out:
        out.write(str(soup))
    print(f"Sanitized: {filename} -> {dest_path} (Size: {os.path.getsize(dest_path)} bytes)")

if __name__ == "__main__":
    pages = [
        "01_homepage.html",
        "02_search_magnetic_balls.html",
        "03_category_toys_bestsellers.html",
        "04_product_detail_page.html",
        "05_cart_page.html",
        "06_checkout_page.html",
        "07_orders_page.html"
    ]
    for p in pages:
        sanitize_page(p)
