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

// Initialize syntax highlighting for all code blocks
function initializeSyntaxHighlighting() {
  // Configure Prism settings
  if (typeof Prism !== 'undefined') {
    Prism.plugins.NormalizeWhitespace.setDefaults({
      'remove-trailing': true,
      'remove-indent': true,
      'left-trim': true,
      'right-trim': true
    });
    
    // Re-highlight all code blocks
    Prism.highlightAll();
    
    // Add copy functionality to all code blocks
    addCopyButtons();
  }
  
  // Initialize Mermaid diagrams
  initializeMermaid();
}

// Initialize Mermaid diagrams
function initializeMermaid() {
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      themeVariables: {
        primaryColor: '#3498db',
        primaryTextColor: '#2c3e50',
        primaryBorderColor: '#2980b9',
        lineColor: '#34495e',
        secondaryColor: '#ecf0f1',
        tertiaryColor: '#f8f9fa'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false
      },
      gantt: {
        useMaxWidth: true,
        barHeight: 20,
        fontSize: 11,
        fontFamily: '"Open Sans", sans-serif'
      }
    });

    // Render all Mermaid diagrams
    renderMermaidDiagrams();
  }
}

// Render all Mermaid diagrams on the page
function renderMermaidDiagrams() {
  const mermaidElements = all('.mermaid');
  
  mermaidElements.forEach((element, index) => {
    try {
      // Generate a unique ID if not already set
      if (!element.id) {
        element.id = `mermaid-${index}-${Date.now()}`;
      }
      
      const content = element.textContent || element.innerText;
      if (content.trim()) {
        // Clear the element content first
        element.innerHTML = '';
        
        // Render the diagram
        mermaid.render(element.id + '-svg', content).then(({svg}) => {
          element.innerHTML = svg;
          
          // Add click-to-zoom functionality
          addMermaidZoom(element);
          
          // Add export functionality
          addMermaidExport(element, content);
        }).catch((error) => {
          console.error('Mermaid rendering error:', error);
          element.innerHTML = `<div class="mermaid-error">
            <p>Error rendering diagram:</p>
            <pre>${error.message}</pre>
            <details>
              <summary>View source</summary>
              <pre><code>${content}</code></pre>
            </details>
          </div>`;
        });
      }
    } catch (error) {
      console.error('Mermaid initialization error:', error);
      element.innerHTML = `<div class="mermaid-error">
        <p>Error initializing diagram: ${error.message}</p>
      </div>`;
    }
  });
}

// Add zoom functionality to Mermaid diagrams
function addMermaidZoom(element) {
  const svg = element.querySelector('svg');
  if (svg) {
    svg.style.cursor = 'zoom-in';
    svg.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.className = 'mermaid-modal';
      modal.innerHTML = `
        <div class="mermaid-modal-content">
          <span class="mermaid-modal-close">&times;</span>
          <div class="mermaid-modal-diagram">
            ${svg.outerHTML}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close modal functionality
      const closeBtn = modal.querySelector('.mermaid-modal-close');
      const modalContent = modal.querySelector('.mermaid-modal-content');
      
      closeBtn.addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
      
      // ESC key to close
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          modal.remove();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    });
  }
}

// Add export functionality to Mermaid diagrams
function addMermaidExport(element, source) {
  const container = element.closest('.mermaid-container');
  if (container && !container.querySelector('.mermaid-controls')) {
    const controls = document.createElement('div');
    controls.className = 'mermaid-controls';
    controls.innerHTML = `
      <button class="mermaid-btn mermaid-copy" title="Copy source">📋</button>
      <button class="mermaid-btn mermaid-download" title="Download SVG">💾</button>
      <button class="mermaid-btn mermaid-zoom" title="View fullscreen">🔍</button>
    `;
    
    container.appendChild(controls);
    
    // Copy source functionality
    controls.querySelector('.mermaid-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(source).then(() => {
        showToast('Mermaid source copied to clipboard!');
      });
    });
    
    // Download SVG functionality
    controls.querySelector('.mermaid-download').addEventListener('click', () => {
      const svg = element.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mermaid-diagram-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Diagram downloaded as SVG!');
      }
    });
    
    // Fullscreen zoom functionality
    controls.querySelector('.mermaid-zoom').addEventListener('click', () => {
      addMermaidZoom(element);
      element.querySelector('svg').click();
    });
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Add copy buttons to code blocks
function addCopyButtons() {
  const codeBlocks = all('pre[class*="language-"]');
  
  codeBlocks.forEach(block => {
    if (block.querySelector('.copy-button')) return; // Already has copy button
    
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = '📋';
    button.title = 'Copy to clipboard';
    
    button.addEventListener('click', () => {
      const code = block.querySelector('code');
      if (code) {
        navigator.clipboard.writeText(code.textContent).then(() => {
          button.textContent = '✅';
          setTimeout(() => {
            button.textContent = '📋';
          }, 2000);
        }).catch(() => {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = code.textContent;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          
          button.textContent = '✅';
          setTimeout(() => {
            button.textContent = '📋';
          }, 2000);
        });
      }
    });
    
    block.style.position = 'relative';
    block.appendChild(button);
  });
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
    
    // Re-render Mermaid diagrams in the current slide if needed
    const slideMermaidElements = slides[slideNumber].querySelectorAll('.mermaid');
    if (slideMermaidElements.length > 0) {
      setTimeout(() => {
        slideMermaidElements.forEach(element => {
          if (!element.querySelector('svg')) {
            const content = element.textContent || element.innerText;
            if (content.trim() && typeof mermaid !== 'undefined') {
              element.innerHTML = '';
              mermaid.render(element.id + '-svg', content).then(({svg}) => {
                element.innerHTML = svg;
                addMermaidZoom(element);
                addMermaidExport(element, content);
              }).catch(console.error);
            }
          }
        });
      }, 100);
    }
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
  initializeSyntaxHighlighting();
  bindPresentationMode();
});
