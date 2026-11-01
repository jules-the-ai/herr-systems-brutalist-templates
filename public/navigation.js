// Native details remains usable without JavaScript.
(() => {
  const menus = [...document.querySelectorAll('.nav-dropdown')];
  const close = except => menus.forEach(menu => { if (menu !== except) menu.open = false; });
  menus.forEach(menu => {
    menu.addEventListener('toggle', () => { if (menu.open) close(menu); });
    menu.addEventListener('focusout', () => setTimeout(() => { if (!menu.contains(document.activeElement)) menu.open = false; }, 0));
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); event.preventDefault(); }
    });
  });
  document.addEventListener('click', event => { if (!event.target.closest('.nav-dropdown')) close(); });
})();
