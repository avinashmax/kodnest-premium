# How the Job Notification Tracker Works

## Simple Version (User Journey)

```mermaid
graph TD
    A["1. Tell us what you like"] --> B["2. App scans 60+ new jobs"]
    B --> C["3. Personal 'Match Score' created"]
    C --> D["4. See your top jobs in the Dashboard"]
    D --> E["5. Move jobs to 'Applied' or 'Saved'"]
    E --> F["6. Get a personalized Morning Briefing"]

    %% Node Styles
    style A fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#000
    style B fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px,color:#000
    style C fill:#FFF3E0,stroke:#E65100,stroke-width:2px,color:#000
    style D fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#000
    style E fill:#FFEBEE,stroke:#C62828,stroke-width:2px,color:#000
    style F fill:#E1F5FE,stroke:#01579B,stroke-width:2px,color:#000
```

**What it does for you:**
- **Saves Time**: No more searching for hours.
- **Smart Picks**: Only shows jobs that actually fit your skills.
- **Organization**: Keeps all your applications in one clean place.

---

## Technical Version (System Architecture)

```mermaid
graph TD
    A["Landing Page"] --> B["Settings Center"]
    B -->|"Save Preferences"| C["Match Engine"]
    
    subgraph "Core Processing"
    C -->|"Score Jobs (0-100%)"| D["Job Dashboard"]
    D -->|"Status Update"| E["Activity Log"]
    D -->|"Saved Jobs"| F["Saved Tab"]
    end
    
    subgraph "Automation"
    C -->|"Top 10 Algo"| G["Daily Digest"]
    G -->|"Persistence"| H["localStorage (Today's Briefing)"]
    end
    
    subgraph "Verification & Shipping"
    D --> I["Test Checklist"]
    G --> I
    I -->|"10/10 Passed"| J["Proof Dashboard"]
    J -->|"Links + Tests Verified"| K["Ship Lock (Unlocked)"]
    K --> L["Final Production State"]
    end

    %% Component Styles
    style A fill:#f5f5f5,stroke:#333,color:#000
    style B fill:#E1F5FE,stroke:#01579B,color:#000
    style C fill:#FFF3E0,stroke:#E65100,stroke-width:3px,color:#000
    style D fill:#E8F5E9,stroke:#2E7D32,color:#000
    style G fill:#F3E5F5,stroke:#7B1FA2,color:#000
    style I fill:#FFEBEE,stroke:#C62828,color:#000
    style J fill:#f9f9f9,stroke:#666,color:#000
    style K fill:#FFF9C4,stroke:#FBC02D,stroke-width:4px,color:#000
    style L fill:#C8E6C9,stroke:#2E7D32,stroke-width:4px,color:#000
```
