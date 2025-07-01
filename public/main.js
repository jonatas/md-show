function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}
const on = (e) => document.querySelector(e);
const all = (e) =>  document.querySelectorAll(e);
const parent = (element, tagName) => {
  let ancestor = element;
  while (ancestor.tagName !== tagName.toUpperCase()) {
      ancestor = ancestor.parentNode;
  }
  return ancestor;
};

function runSelectStatements(){
  const sql_blocks = all("code[class*='language-sql']");

  for (let i = 0; i < sql_blocks.length; i++) {
    sql_blocks[i].addEventListener("click", fetchQuery);
  }
}

function fetchQuery(event) {
  element = parent(event.target, "code");
  element.removeEventListener("click", fetchQuery);
  query = element.innerText;

  // Add a timer span element to the SQL code snippet
  let timer = document.createElement("span");
  timer.className = "query-timer";
  timer.innerHTML = "0.00s";
  element.appendChild(timer);

  // Start the timer
  let startTime = performance.now();
  let timerInterval = setInterval(() => {
    let currentTime = performance.now();
    let elapsedTime = (currentTime - startTime) / 1000;
    timer.innerHTML = `${elapsedTime.toFixed(2)}s`;
  }, 100);

  fetch("/query", {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  })
    .then(response => response.json())
    .then(data => {
      // Stop the timer
      clearInterval(timerInterval);
      element.classList.remove("loading");
      renderResult(data, element);
    });
}

function plot(data, element){
  title = data.title || data[0].title;
  let layout = {title}
  if (!Array.isArray(data[0].x)) {
    let x, y;
    y_axis = Object.keys(data[0]).filter(e => e.match("^y"));
    x = data.map(row => row.x);
    axis_y = (y) => data.map(row => row[y]);
    type = data.type || data[0].type || "scatter";
    // FIXME: why this syntax is not valid?
    // data = y_axis.map(key => {x, "y": axis_y(key), type });
    data = y_axis.map(function(key){return {x: x, y: axis_y(key), type: type };})
  }
  div = document.createElement("div");
  element.appendChild(div);
  console.log({data});
  Plotly.newPlot(div, data, layout);
}

function table(data, element){
  // Render the result as a table
  let table = document.createElement("table");
  let thead = document.createElement("thead");
  let tbody = document.createElement("tbody");
  let headerRow = document.createElement("tr");

  table.style.border =
    thead.style.border =
      tbody.style.border = "0.4px dotted";

  Object.keys(data[0]).forEach(key => {
    let headerCell = document.createElement("th");
    headerCell.textContent = key;
    headerRow.appendChild(headerCell);
  });

  thead.appendChild(headerRow);

  data.forEach(serie=> {
    if (!Array.isArray(serie)){
      serie = [serie];
    }
    serie.forEach(row => {
      let dataRow = document.createElement("tr");
      Object.values(row).forEach(value => {
        let dataCell = document.createElement("td");
        dataCell.textContent = value;
        dataRow.appendChild(dataCell);
      });
      tbody.appendChild(dataRow);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
  });

  element.appendChild(table);
}

function renderResult(res, element) {
  let data = Array.isArray(res) ? res : [res];
  if (data[0].hasOwnProperty("data")){
    plot([data[0].data], element);
  } else if (data[0].hasOwnProperty("x")){
    plot(data, element);
  } else {
    table(data, element);
  }
}

function bindPresentationMode(){
  let sections = all("h1, h2");
  for (let i = 0; i < sections.length; i++) {
    let currentSection = sections[i];
    let slide = document.createElement("div");
    slide.className = "slide";
    let nextSection = sections[i + 1] || null;
    let nextSectionParent = nextSection ? nextSection.parentNode : null;
    let currentSectionParent = currentSection.parentNode;
    let nextSibling = currentSection.nextSibling;
    while (nextSibling !== nextSection && nextSibling !== null) {
      slide.appendChild(nextSibling);
      nextSibling = currentSection.nextSibling;
    }
    currentSectionParent.replaceChild(slide, currentSection);
    slide.insertBefore(currentSection, slide.firstChild);
  }

  let currentSlide = 0;
  const slides = all(".slide");

  const showSlide = function(slideNumber) {
    slides[currentSlide].style.display = "none";
    currentSlide = slideNumber;
    slides[slideNumber].style.display = "block";
  };

  const nextSlide = function () {
    showSlide((currentSlide + 1) % slides.length);
  };

  const previousSlide = function () {
    showSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  const keyboardShortcuts = function(event) {
    if (event.keyCode === 27) {
      htmlMode();
    } else if (event.keyCode === 37) {
      previousSlide();
    } else if (event.keyCode === 39) {
      nextSlide();
    }
  };

  const presentationMode = function() {
    slides.forEach(function(slide) {
      slide.style.display = "none";
    });

    showSlide(currentSlide);

    document.body.classList.add("presentation-mode");
    on("#start-presentation").style.display = "none";
    on("#stop-presentation").style.display = "inline";

    document.addEventListener("keydown", keyboardShortcuts);
  };

  const htmlMode = function() {
    slides.forEach(function(slide) {
      slide.style.display = "block";
    });

    document.body.classList.remove("presentation-mode");
    on("#start-presentation").style.display = "inline";
    on("#stop-presentation").style.display = "none";

    document.removeEventListener("keydown", keyboardShortcuts);
  };

  showSlide(0);

  on("#start-presentation").addEventListener("click", presentationMode)
  on("#stop-presentation").addEventListener("click", htmlMode)
  on("#next-slide").addEventListener("click", nextSlide);
  on("#previous-slide").addEventListener("click",previousSlide);

  document.querySelector("#first-slide").addEventListener("click", event => showSlide(0));
  document.querySelector("#last-slide").addEventListener("click", event => showSlide(slides.length - 1));
}

document.addEventListener("DOMContentLoaded", function() {
  runSelectStatements();
  bindPresentationMode();
});
