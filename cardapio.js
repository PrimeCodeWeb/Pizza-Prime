document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".botoes");
  const botao = document.querySelector(".menu-hamburguer");

  botao.addEventListener("click", () => {
    menu.classList.toggle("ativo");
  });
});