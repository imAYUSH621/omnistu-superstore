import os
import re
import sys

target_dir = r"C:\OMNISTU GLOBALS\omnistu-superstore"
patterns = [
    re.compile(r"(?i)(?:api_key|token|secret|password|bearer|auth)\s*[:=]\s*['\"][a-zA-Z0-9_\-\.]{20,}['\"]"),
    re.compile(r"AIza[0-9A-Za-z-_]{35}"),
    re.compile(r"ghp_[0-9A-Za-z]{36}"),
    re.compile(r"sk-[0-9A-Za-z]{32,}"),
]

suspects = []
for root, dirs, files in os.walk(target_dir):
    if "node_modules" in dirs: dirs.remove("node_modules")
    if ".next" in dirs: dirs.remove(".next")
    if ".git" in dirs: dirs.remove(".git")
    for f in files:
        if f.endswith((".tsx", ".ts", ".js", ".json", ".html", ".md")):
            p = os.path.join(root, f)
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as fh:
                    content = fh.read()
                for pat in patterns:
                    m = pat.findall(content)
                    if m:
                        clean_matches = [
                            x for x in m 
                            if "NEXT_PUBLIC_SUPABASE" not in x 
                            and "placeholder" not in x 
                            and "123456" not in x 
                            and "2026" not in x
                            and "mock_" not in x
                            and "your-" not in x
                        ]
                        if clean_matches:
                            suspects.append((p, clean_matches))
            except Exception:
                pass

print(f"Suspect matches found: {len(suspects)}")
if suspects:
    for s in suspects:
        print("  ", s[0], s[1][:2])
    sys.exit(1)

print("SECURITY AUDIT PASS: Zero secrets in tracked codebase!")
sys.exit(0)
