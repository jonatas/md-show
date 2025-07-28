require 'sinatra/base'
require 'redcarpet'
require 'pg'
require 'set'
require 'set'

class Md::Show::App < Sinatra::Base
  def pg_uri
    ARGV.size == 1 ? ENV['PG_URI'] : ARGV.last
  end
  # Connect to the PostgreSQL database using the URI provided
  def connect_to_db
    conn = PG.connect(pg_uri)
    yield conn
  ensure
    conn.close if conn
  end

  # Render the markdown file to HTML using Redcarpet with syntax highlighting
  def render_markdown(file_path)
    markdown = File.read(file_path)
    renderer = Redcarpet::Markdown.new(
      Redcarpet::Render::HTML.new(fenced_code_blocks: true),
      fenced_code_blocks: true,
      highlight: true,
      autolink: true,
      tables: true,
      strikethrough: true,
      superscript: true
    )
    renderer.render(markdown)
  end


  # Run the SQL code snippet and return the result
  def run_query(conn, sql)
    #return if sql !~ /^\s*SELECT\t/i
    result = conn.exec(sql)
    response = result.map(&:to_h)
    puts({sql: sql, response: response})
    response
  end

  set :public_folder, File.join(File.dirname(__FILE__),"../../../public")

  get '/' do
    # Render the markdown file
    html = render_markdown(ARGV[0])

    # Detect languages used in the content before processing
    detected_languages = detect_all_languages(html)

    # Process all code blocks for syntax highlighting
    html = process_code_blocks(html)

    # Generate dynamic script includes based on detected languages
    language_scripts = generate_language_scripts(detected_languages)

    # Inject the presentation navigation script with dynamic language support
    html = <<-HTML + html
    <head>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-okaidia.min.css" />
      <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
      #{language_scripts}
      <!-- Enhanced Plugins -->
      <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/normalize-whitespace/prism-normalize-whitespace.min.js"></script>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.css" />
      #{detected_languages.include?('mermaid') ? '<script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>' : ''}
      <!-- Plotting and Main Scripts -->
      <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      <script src="/main.js"></script>
      <link rel="stylesheet" href="/main.css">
    </head>
    <button id="first-slide">⏮</button>
    <button id="previous-slide">⬅️</button>
    <button id="start-presentation">▶️</button>
    <button id="stop-presentation" style="display: none;">⏹</button>
    <button id="next-slide">➡️</button>
    <button id="last-slide">⏭</button>
    HTML

    html
  end

  # Process all code blocks with language detection and syntax highlighting
  def process_code_blocks(html)
    # Handle fenced code blocks with language specification
    html.gsub!(%r{<pre><code class="([^"]+)">(.*?)</code></pre>}m) do |match|
      lang_class = $1
      code_content = $2
      
      # Extract language from class (handles both 'language-xyz' and 'xyz' formats)
      language = lang_class.match(/(?:language-)?(.+)/)[1] if lang_class
      language = normalize_language(language) if language
      
      # Handle Mermaid diagrams specially
      if language == 'mermaid'
        # Create a unique ID for each mermaid diagram
        diagram_id = "mermaid-#{rand(10000)}"
        "<div class=\"mermaid-container\"><div id=\"#{diagram_id}\" class=\"mermaid\">#{code_content.strip}</div></div>"
      else
        # Create properly formatted code block
        css_classes = ["language-#{language}"]
        css_classes << "line-numbers" # Add line numbers support
        
        "<pre class=\"#{css_classes.join(' ')}\"><code class=\"#{css_classes.join(' ')}\">#{code_content.chomp}</code></pre>"
      end
    end

    # Handle legacy SQL blocks (for backward compatibility)
    html.gsub!(%r{<code>sql\n(.*?)\n</code>}m) do |match|
      code_content = $1
      "<pre class=\"language-sql line-numbers\"><code class=\"language-sql line-numbers\">#{code_content.chomp}</code></pre>"
    end

    # Handle inline code blocks without language specification
    html.gsub!(%r{<pre><code>(.*?)</code></pre>}m) do |match|
      code_content = $1
      detected_lang = detect_language_from_content(code_content)
      
      # Check if it looks like a mermaid diagram
      if is_mermaid_content?(code_content)
        diagram_id = "mermaid-#{rand(10000)}"
        "<div class=\"mermaid-container\"><div id=\"#{diagram_id}\" class=\"mermaid\">#{code_content.strip}</div></div>"
      else
        css_classes = ["language-#{detected_lang}", "line-numbers"]
        "<pre class=\"#{css_classes.join(' ')}\"><code class=\"#{css_classes.join(' ')}\">#{code_content.chomp}</code></pre>"
      end
    end

    html
  end

  # Detect all languages used in the HTML content
  def detect_all_languages(html)
    languages = Set.new
    
    # Find all explicitly declared languages in fenced code blocks
    html.scan(%r{<pre><code class="([^"]+)">(.*?)</code></pre>}m) do |match|
      lang_class = match[0]
      code_content = match[1]
      
      # Extract language from class (handles both 'language-xyz' and 'xyz' formats)
      if lang_class
        language = lang_class.match(/(?:language-)?(.+)/)[1]
        language = normalize_language(language) if language
        languages.add(language)
      end
    end

    # Find legacy SQL blocks
    html.scan(%r{<code>sql\n(.*?)\n</code>}m) do |match|
      languages.add('sql')
    end

    # Find code blocks without language specification and detect them
    html.scan(%r{<pre><code>(.*?)</code></pre>}m) do |match|
      code_content = match[0]
      detected_lang = detect_language_from_content(code_content)
      languages.add(detected_lang) unless detected_lang == 'text'
    end
    
    # Check for potential Mermaid diagrams in the content
    if html.include?('mermaid') || html.match?(/\b(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|requirementDiagram|mindmap|timeline|zenuml|sankey)\b/i)
      languages.add('mermaid')
    end
    
    languages.to_a
  end

  # Generate script tags for detected languages
  def generate_language_scripts(languages)
    return '' if languages.empty?
    
    scripts = []
    language_categories = categorize_languages(languages)
    
    # Add comment headers for organization
    unless language_categories[:core].empty?
      scripts << "      <!-- Core Programming Languages -->"
      language_categories[:core].each do |lang|
        scripts << generate_script_tag(lang)
      end
    end
    
    unless language_categories[:database].empty?
      scripts << "      <!-- Database Languages -->"
      language_categories[:database].each do |lang|
        scripts << generate_script_tag(lang)
      end
    end
    
    unless language_categories[:web].empty?
      scripts << "      <!-- Web Technologies -->"
      language_categories[:web].each do |lang|
        scripts << generate_script_tag(lang)
      end
    end
    
    unless language_categories[:shell].empty?
      scripts << "      <!-- Shell and Config -->"
      language_categories[:shell].each do |lang|
        scripts << generate_script_tag(lang)
      end
    end
    
    unless language_categories[:functional].empty?
      scripts << "      <!-- Functional Languages -->"
      language_categories[:functional].each do |lang|
        scripts << generate_script_tag(lang)
      end
    end
    
    unless language_categories[:data_science].empty?
      scripts << "      <!-- Data Science and ML -->"
      language_categories[:data_science].each do |lang|
        scripts << generate_script_tag(lang)
      end
    end
    
    unless language_categories[:other].empty?
      scripts << "      <!-- Other Languages -->"
      language_categories[:other].each do |lang|
        scripts << generate_script_tag(lang)
      end
    end
    
    scripts.join("\n")
  end

  # Categorize languages for organized loading
  def categorize_languages(languages)
    categories = {
      core: [],
      database: [],
      web: [],
      shell: [],
      functional: [],
      data_science: [],
      other: []
    }
    
    languages.each do |lang|
      case lang.to_s
      when 'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'scala'
        categories[:core] << lang
      when 'sql', 'plsql'
        categories[:database] << lang
      when 'css', 'scss', 'sass', 'less', 'markup', 'xml', 'json', 'yaml'
        categories[:web] << lang
      when 'bash', 'powershell', 'docker', 'dockerfile'
        categories[:shell] << lang
      when 'haskell', 'erlang', 'elixir', 'clojure'
        categories[:functional] << lang
      when 'r', 'matlab', 'latex'
        categories[:data_science] << lang
      when 'mermaid'
        # Mermaid is handled separately, skip it here
        next
      else
        categories[:other] << lang
      end
    end
    
    categories
  end

  # Generate individual script tag for a language
  def generate_script_tag(lang)
    return '' if lang.nil? || lang == 'text' || lang == 'mermaid'
    "      <script src=\"https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-#{lang}.min.js\"></script>"
  end

  # Normalize language names to match PrismJS conventions
  def normalize_language(lang)
    lang_map = {
      'js' => 'javascript',
      'ts' => 'typescript',
      'py' => 'python',
      'rb' => 'ruby',
      'sh' => 'bash',
      'shell' => 'bash',
      'zsh' => 'bash',
      'ps1' => 'powershell',
      'cs' => 'csharp',
      'c++' => 'cpp',
      'yml' => 'yaml',
      'html' => 'markup',
      'xml' => 'markup',
      'dockerfile' => 'docker',
      'mmd' => 'mermaid'
    }
    
    lang_map[lang.downcase] || lang.downcase
  end

  # Check if content looks like a Mermaid diagram
  def is_mermaid_content?(content)
    content_lines = content.strip.split("\n")
    return false if content_lines.empty?
    
    # Check for common Mermaid diagram types
    first_line = content_lines.first.strip.downcase
    mermaid_keywords = [
      'graph', 'flowchart', 'sequencediagram', 'classDiagram', 'stateDiagram',
      'erDiagram', 'journey', 'gantt', 'pie', 'gitgraph', 'requirementDiagram',
      'mindmap', 'timeline', 'zenuml', 'sankey'
    ]
    
    mermaid_keywords.any? { |keyword| first_line.start_with?(keyword) }
  end

  # Basic language detection from code content
  def detect_language_from_content(content)
    content_lower = content.downcase.strip
    
    # SQL patterns
    return 'sql' if content_lower.match?(/^\s*(select|insert|update|delete|create|alter|drop)\s/i)
    
    # JavaScript/TypeScript patterns
    return 'javascript' if content_lower.match?(/\b(function|const|let|var|=>|console\.log)\b/)
    return 'typescript' if content_lower.match?(/\b(interface|type|enum).*[=:]/i)
    
    # Python patterns
    return 'python' if content_lower.match?(/\b(def|import|from|print|if __name__)\b/)
    
    # Ruby patterns  
    return 'ruby' if content_lower.match?(/\b(def|end|class|module|puts|require)\b/)
    
    # Go patterns
    return 'go' if content_lower.match?(/\b(func|package|import|fmt\.)/i)
    
    # Rust patterns
    return 'rust' if content_lower.match?(/\b(fn|let|mut|use|struct|impl)\b/)
    
    # Java/C# patterns
    return 'java' if content_lower.match?(/\b(public class|private|static void|system\.out)\b/i)
    return 'csharp' if content_lower.match?(/\b(using system|console\.writeline|namespace)\b/i)
    
    # Shell patterns
    return 'bash' if content_lower.match?(/^[\$#]\s|\b(echo|grep|sed|awk|cd|ls)\b/)
    
    # CSS patterns
    return 'css' if content_lower.match?(/[.#][a-z-]+\s*\{|@media|@import/)
    
    # JSON patterns
    return 'json' if content_lower.match?(/^\s*[\[{]/) && content_lower.match?(/[}\]]\s*$/)
    
    # Check for Mermaid diagrams
    return 'mermaid' if is_mermaid_content?(content)
    
    # Default to plain text
    'text'
  end

  def parse_aggregated_results(data)
    data.map do |hash|
      hash.transform_values{|e|JSON.parse(e) rescue cast_results(e)}
    end
  end

  def cast_results(e)
    return [] unless e
    return e unless e.start_with?("{") && e.end_with?("}")
    e[1..-2].split(",").map{|f|cast_result(f)}
  end

  def cast_result(element)
    case element
    when /^\d+\.\d+$/
      element.to_f
    when /^"\d{4}-\d{2}-\d{2}\s.+"$/
      element[1..-2]
    else
      element
    end
  end

  post '/query' do
    request.body.rewind
    query = JSON.parse(request.body.read)['query']

    result = nil
    connect_to_db do |conn|
      begin
        puts query
        result = conn.exec(query)
      rescue PG::Error => e
        puts "Ops!", e.message
        return [500, { message: e.message }.to_json]
      end
    end
    data = parse_aggregated_results(result)

    [200, data.to_json]
  end
end

