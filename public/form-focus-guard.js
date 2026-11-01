/* Pre-hydration guard (loaded via plain <script src> in the root layout head):
   while any external editable element has focus, set data-form-focus on <html>;
   globals.css hides the fixed AI concierge launcher in that state so it cannot
   cover form controls on short/mobile viewports. */
document.addEventListener('focusin', function (e) {
  var t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
    if (t.closest && t.closest('[data-ai-concierge]')) return;
    document.documentElement.setAttribute('data-form-focus', '1');
  }
});
document.addEventListener('focusout', function (e) {
  var t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
    document.documentElement.removeAttribute('data-form-focus');
  }
});
