# Entity Relationship Model

```mermaid
erDiagram
    USER ||--o| RESIDENT : "has student profile"
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ NOTICE : authors
    ROOM ||--o{ RESIDENT : accommodates
    RESIDENT ||--o{ COMPLAINT : submits
    RESIDENT ||--o{ VISITOR_REQUEST : requests
    RESIDENT ||--o{ PAYMENT : owes
    ROOM ||--o{ COMPLAINT : concerns

    USER {
        string id PK
        string name
        string email UK
        string phone
        string role
        string passwordHash
        boolean active
    }
    RESIDENT {
        string id PK
        string userId FK
        string studentId UK
        string faculty
        string year
        string roomId FK
        string block
        date checkInDate
        string status
    }
    ROOM {
        string id PK
        string number UK
        string block
        int floor
        string type
        int capacity
        string status
        array occupants
        array amenities
    }
    COMPLAINT {
        string id PK
        string residentId FK
        string roomId FK
        string title
        string description
        string category
        string priority
        string status
        string image
        datetime createdAt
        array history
    }
    VISITOR_REQUEST {
        string id PK
        string residentId FK
        string visitorName
        string visitorPhone
        string relationship
        string idNumber
        datetime visitDate
        string purpose
        string status
        datetime checkedInAt
        datetime checkedOutAt
    }
    PAYMENT {
        string id PK
        string residentId FK
        decimal amount
        string period
        date dueDate
        datetime paidAt
        string status
        string reference
    }
    NOTICE {
        string id PK
        string authorId FK
        string title
        string message
        string category
        string audience
        datetime publishedAt
        datetime expiresAt
        boolean pinned
    }
    NOTIFICATION {
        string id PK
        string userId FK
        string title
        string message
        string type
        boolean read
        datetime createdAt
    }
```

Room occupancy is additionally stored as resident IDs in `ROOM.occupants` to make capacity checks and dashboard summaries inexpensive. In a relational production schema, this would normally be derived from active room-allocation records.
