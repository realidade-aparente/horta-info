// receitas.js — COM FILTROS + CONTADOR DINÂMICO + TIPO E LINK RESTAURADOS

let RECEITAS = [];

const INGREDIENTES_COM_GLUTEN = [
  "trigo", "farinha de trigo", "centeio", "cevada", "aveia",
  "pão", "pão ralado", "massa", "esparguete", "cuscuz",
  "seitan", "malte", "cerveja", "bolacha", "biscoito",
  "tortilha de trigo", "wrap de trigo", "sêmola"
];

const INGREDIENTES_COM_LACTOSE = [
  "leite", "natas", "manteiga", "queijo", "queijo parmesão",
  "queijo feta", "queijo mozarela", "iogurte", "requeijão", "nata"
];

const INGREDIENTES_COM_SOJA = [
  "soja", "tofu", "molho de soja", "tamari", "edamame", "proteína de soja"
];

function carregarReceitas() {
  const resultadosContainer = document.getElementById("resultados");
  const contador = document.getElementById("contador-resultados");

  if (resultadosContainer) resultadosContainer.innerHTML = "<p>A carregar receitas...</p>";
  if (contador) contador.textContent = "(0 receitas encontradas)";

  const url = typeof RECIPE_JSON_URL !== "undefined"
    ? RECIPE_JSON_URL
    : "data/refeicoes/receitas_refeicoes.json";

  fetch(url)
    .then(r => r.json())
    .then(data => {
      RECEITAS = data;
      gerarCheckboxesIngredientes();
    });
}

function obterFiltrosDietaSelecionados() {
  const filtros = [];
  if (document.getElementById("chk-vegetariana")?.checked) filtros.push("vegetariana");
  if (document.getElementById("chk-vegan")?.checked) filtros.push("vegan");
  if (document.getElementById("chk-raw-vegan")?.checked) filtros.push("raw-vegan");
  return filtros;
}

function semGluten() { return document.getElementById("filtro-sem-gluten")?.checked; }
function semLactose() { return document.getElementById("filtro-sem-lactose")?.checked; }
function semSoja() { return document.getElementById("filtro-sem-soja")?.checked; }

function contemAlgum(receita, lista) {
  return (receita.ingredientes || []).some(ing =>
    lista.some(x => ing.toLowerCase().includes(x))
  );
}

function obterListaGlobalIngredientesComContagem() {
  const filtrosDieta = obterFiltrosDietaSelecionados();

  let receitasFiltradas = !filtrosDieta.length
    ? RECEITAS
    : RECEITAS.filter(r => filtrosDieta.includes((r.dieta || "").toLowerCase().trim()));

  if (semGluten()) receitasFiltradas = receitasFiltradas.filter(r => !contemAlgum(r, INGREDIENTES_COM_GLUTEN));
  if (semLactose()) receitasFiltradas = receitasFiltradas.filter(r => !contemAlgum(r, INGREDIENTES_COM_LACTOSE));
  if (semSoja()) receitasFiltradas = receitasFiltradas.filter(r => !contemAlgum(r, INGREDIENTES_COM_SOJA));

  const conjunto = new Set();
  receitasFiltradas.forEach(r => {
    (r.ingredientes || []).forEach(i => conjunto.add(i));
  });

  return {
    receitasAtivas: receitasFiltradas.length,
    ingredientes: Array.from(conjunto).sort((a, b) => a.localeCompare(b))
  };
}

function atualizarContadorIngredientes(n) {
  const el = document.getElementById("contador-ingredientes");
  if (el) el.textContent = `(${n} ingredientes disponíveis)`;
}

function gerarCheckboxesIngredientes() {
  const container = document.getElementById("lista-ingredientes");
  if (!container) return;
  container.innerHTML = "";

  const { ingredientes } = obterListaGlobalIngredientesComContagem();
  atualizarContadorIngredientes(ingredientes.length);

  if (!ingredientes.length) {
    container.innerHTML = "<p>Não há ingredientes para os filtros selecionados.</p>";
    return;
  }

  ingredientes.forEach(ingrediente => {
    const label = document.createElement("label");
    label.className = "ingrediente-opcao";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = ingrediente;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + ingrediente));
    container.appendChild(label);
  });
}

function slugify(text) {
  return text
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function procurarReceitas() {
  const selecionados = Array.from(
    document.querySelectorAll("#lista-ingredientes input[type='checkbox']:checked")
  ).map(cb => cb.value);

  const filtrosDieta = obterFiltrosDietaSelecionados();
  const resultadosContainer = document.getElementById("resultados");
  const contador = document.getElementById("contador-resultados");
  resultadosContainer.innerHTML = "";

  let receitasPreparadas = RECEITAS.map(r => {
    const totalIngredientes = (r.ingredientes || []).length;
    const coincidencias = (r.ingredientes || []).filter(ing => selecionados.includes(ing)).length;
    const faltam = (r.ingredientes || []).filter(ing => !selecionados.includes(ing));
    const ratio = totalIngredientes ? coincidencias / totalIngredientes : 0;
    return { ...r, totalIngredientes, coincidencias, faltam, ratio };
  })
  .filter(r => r.coincidencias > 0)
  .filter(r => !filtrosDieta.length || filtrosDieta.includes((r.dieta || "").toLowerCase().trim()));

  if (semGluten()) receitasPreparadas = receitasPreparadas.filter(r => !contemAlgum(r, INGREDIENTES_COM_GLUTEN));
  if (semLactose()) receitasPreparadas = receitasPreparadas.filter(r => !contemAlgum(r, INGREDIENTES_COM_LACTOSE));
  if (semSoja()) receitasPreparadas = receitasPreparadas.filter(r => !contemAlgum(r, INGREDIENTES_COM_SOJA));

  receitasPreparadas.sort((a, b) => b.ratio - a.ratio || b.coincidencias - a.coincidencias);

  if (contador) contador.textContent = `(${receitasPreparadas.length} receitas encontradas)`;

  receitasPreparadas.forEach(r => {
    const div = document.createElement("div");
    div.className = "card-receita";

    const percentagem = Math.round(r.ratio * 100);
    const dietaLabel = r.dieta ? r.dieta.replace("-", " ") : "não especificado";

    div.innerHTML = `
      <h3>${r.nome}</h3>
      <p><strong>Tipo:</strong> ${dietaLabel}</p>
      <p><strong>Completude:</strong> ${percentagem}% (${r.coincidencias}/${r.totalIngredientes})</p>
      <p><strong>Ingredientes:</strong> ${(r.ingredientes || []).join(", ")}</p>
      <p><strong>Em falta:</strong> ${r.faltam.length ? r.faltam.join(", ") : "<em>Nenhum</em>"}</p>
      <p>
  <a href="${r.link}#${slugify(r.nome)}" target="_blank">
    Ver receita
  </a>
</p>
    `;

    resultadosContainer.appendChild(div);
  });
}

function limparSelecoes() {
  document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
  gerarCheckboxesIngredientes();
  document.getElementById("resultados").innerHTML = "<p>Seleções limpas.</p>";
  document.getElementById("contador-resultados").textContent = "(0 receitas encontradas)";
}

document.addEventListener("DOMContentLoaded", () => {
  carregarReceitas();

  document.getElementById("btn-procurar")?.addEventListener("click", procurarReceitas);
  document.getElementById("btn-limpar")?.addEventListener("click", limparSelecoes);

  document.querySelectorAll(
    "#chk-vegetariana, #chk-vegan, #chk-raw-vegan, #filtro-sem-gluten, #filtro-sem-lactose, #filtro-sem-soja"
  ).forEach(cb => cb.addEventListener("change", gerarCheckboxesIngredientes));
});
