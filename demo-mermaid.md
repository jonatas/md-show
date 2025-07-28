# Mermaid Diagrams Demo

This demo showcases the new Mermaid diagram support in md-show with comprehensive syntax highlighting.

## Flowchart Example

Here's a simple flowchart showing a decision process:

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug it]
    D --> E[Fix the issue]
    E --> B
    C --> F[Deploy to production]
    F --> G[End]
```

## Sequence Diagram

User authentication flow:

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant D as Database
    
    U->>F: Login Request
    F->>A: Validate Credentials
    A->>D: Check User
    D-->>A: User Data
    A-->>F: JWT Token
    F-->>U: Login Success
```

## Class Diagram

Basic OOP structure:

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +move()
    }
    
    class Dog {
        +String breed
        +bark()
        +wagTail()
    }
    
    class Cat {
        +String color
        +meow()
        +purr()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat
```

## State Diagram

Application states:

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Ready : Data Loaded
    Loading --> Error : Load Failed
    Ready --> Processing : User Action
    Processing --> Ready : Success
    Processing --> Error : Failure
    Error --> Loading : Retry
    Ready --> [*] : Shutdown
```

## Gantt Chart

Project timeline:

```mermaid
gantt
    title Development Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements    :done,    req, 2024-01-01, 2024-01-15
    Design          :done,    des, 2024-01-10, 2024-01-25
    section Development
    Backend         :active,  dev1, 2024-01-20, 2024-02-20
    Frontend        :         dev2, 2024-02-01, 2024-02-28
    Testing         :         test, 2024-02-15, 2024-03-05
    section Deployment
    Production      :         prod, 2024-03-01, 2024-03-10
```

## Mixed Content with Code

You can also mix Mermaid diagrams with regular code blocks:

```python
def create_flowchart():
    """
    Generate a mermaid flowchart programmatically
    """
    diagram = """
    flowchart LR
        A[Python Script] --> B[Generate Diagram]
        B --> C[Render with Mermaid]
        C --> D[Display Result]
    """
    return diagram

# Usage
chart = create_flowchart()
print(chart)
```

## SQL Integration

SQL queries still work as before:

```sql
SELECT 
    name,
    COUNT(*) as total_diagrams,
    AVG(complexity) as avg_complexity
FROM 
    presentation_slides 
WHERE 
    diagram_type = 'mermaid'
GROUP BY 
    name
ORDER BY 
    total_diagrams DESC;
```

## JavaScript Code Example

And of course, other programming languages are highlighted perfectly:

```javascript
// Mermaid initialization
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true
  }
});

// Render all diagrams
document.addEventListener('DOMContentLoaded', () => {
  mermaid.init(undefined, '.mermaid');
});
```

## Features Summary

- ✅ **Comprehensive Language Support**: JavaScript, Python, Ruby, Go, Rust, SQL, and many more
- ✅ **Mermaid Diagrams**: Flowcharts, sequence diagrams, class diagrams, state diagrams, Gantt charts
- ✅ **Interactive Features**: Click to zoom, copy source, download SVG
- ✅ **Presentation Mode**: Perfect rendering in slide presentation format
- ✅ **Auto-detection**: Smart language detection for unlabeled code blocks
- ✅ **Beautiful Styling**: Modern, professional appearance with syntax highlighting
