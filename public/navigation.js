// Native details remains usable without JavaScript.
(() => {
  const menus = [...document.querySelectorAll('.nav-dropdown')];
  const close = except => menus.forEach(menu => { if (menu !== except) menu.open = false; });
  menus.forEach(menu => {
    menu.addEventListener('toggle', () => { if (menu.open) close(menu); });
    menu.addEventListener('focusout', event => {
      // Pointer activation may blur summary without focusing the anchor. A null
      // destination is not proof of leaving the menu: closing here removes the
      // link before mouseup/click. Outside clicks are handled below instead.
      if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false;
    });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); event.preventDefault(); }
    });
  });
  document.addEventListener('click', event => { if (!event.target.closest('.nav-dropdown')) close(); });
})();
