const toggle = document.querySelector(".theme");
toggle?.addEventListener("click", () => {
  const light = document.documentElement.dataset.theme !== "light";
  document.documentElement.dataset.theme = light ? "light" : "dark";
  toggle.setAttribute(
    "aria-label",
    `Switch to ${light ? "dark" : "light"} theme`,
  );
});
for (const nav of document.querySelectorAll(".masthead nav,.footer-links"))
  for (const link of nav.querySelectorAll("a"))
    if (new URL(link.href).pathname === location.pathname)
      link.setAttribute("aria-current", "page");
const menu = document.querySelector(".mobile-menu");
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu?.open) {
    menu.open = false;
    menu.querySelector("summary").focus();
  }
});
document.addEventListener("click", (event) => {
  if (menu?.open && !menu.contains(event.target)) menu.open = false;
});
for (const form of document.querySelectorAll("form")) {
  form.dataset.endpointEnabled = "false";
  form.addEventListener("submit", (event) => event.preventDefault());
}
