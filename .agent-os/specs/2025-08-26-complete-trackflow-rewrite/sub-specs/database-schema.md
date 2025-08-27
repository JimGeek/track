# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-26-complete-trackflow-rewrite/spec.md

> Created: 2025-08-26
> Version: 1.0.0

## Schema Changes

### Core Models

#### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Authentication
  accounts Account[]
  sessions Session[]

  // Relationships
  todoLists TodoList[]
  tasks     Task[]
  
  @@map("users")
}
```

#### TodoList Model
```prisma
model TodoList {
  id          String   @id @default(cuid())
  title       String
  description String?
  color       String   @default("#3B82F6")
  isArchived  Boolean  @default(false)
  position    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks  Task[]

  @@map("todo_lists")
  @@index([userId])
  @@index([position])
}
```

#### Task Model
```prisma
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  
  // Dates
  dueDate     DateTime?
  startDate   DateTime?
  completedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Organization
  position    Int        @default(0)
  tags        String[]   @default([])
  
  // Progress tracking
  progress    Int        @default(0) // 0-100
  estimatedHours Int?
  actualHours    Int?
  
  // Relationships
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  todoListId String
  todoList   TodoList  @relation(fields: [todoListId], references: [id], onDelete: Cascade)
  
  // Dependencies
  dependsOn    Task[] @relation("TaskDependencies")
  dependencies Task[] @relation("TaskDependencies")
  
  // Subtasks
  parentId String?
  parent   Task?  @relation("SubTasks", fields: [parentId], references: [id])
  children Task[] @relation("SubTasks")

  @@map("tasks")
  @@index([userId])
  @@index([todoListId])
  @@index([status])
  @@index([priority])
  @@index([dueDate])
  @@index([position])
  @@index([parentId])
}
```

#### NextAuth Models
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

### Enums

```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELLED
  ON_HOLD
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### Indexes and Performance

```prisma
// Composite indexes for common queries
@@index([userId, status], name: "user_status_idx")
@@index([todoListId, position], name: "list_position_idx")
@@index([userId, dueDate], name: "user_due_date_idx")
@@index([status, priority], name: "status_priority_idx")

// Full-text search index for title and description
@@index([title], type: Hash)
@@index([description], type: Hash)
```

## Migrations

### Initial Migration
```sql
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_lists" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "todo_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "progress" INTEGER NOT NULL DEFAULT 0,
    "estimatedHours" INTEGER,
    "actualHours" INTEGER,
    "userId" TEXT NOT NULL,
    "todoListId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TaskDependencies" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "todo_lists_userId_idx" ON "todo_lists"("userId");
CREATE INDEX "todo_lists_position_idx" ON "todo_lists"("position");

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");
CREATE INDEX "tasks_todoListId_idx" ON "tasks"("todoListId");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");
CREATE INDEX "tasks_position_idx" ON "tasks"("position");
CREATE INDEX "tasks_parentId_idx" ON "tasks"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "_TaskDependencies_AB_unique" ON "_TaskDependencies"("A", "B");
CREATE INDEX "_TaskDependencies_B_index" ON "_TaskDependencies"("B");

-- AddForeignKey
ALTER TABLE "todo_lists" ADD CONSTRAINT "todo_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_todoListId_fkey" FOREIGN KEY ("todoListId") REFERENCES "todo_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskDependencies" ADD CONSTRAINT "_TaskDependencies_A_fkey" FOREIGN KEY ("A") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskDependencies" ADD CONSTRAINT "_TaskDependencies_B_fkey" FOREIGN KEY ("B") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Data Migration Considerations
- **Existing data preservation**: Ensure current task data is migrated with proper type conversions
- **User account linking**: Map existing user sessions to new authentication system
- **Performance optimization**: Create indexes after data migration to improve insert performance
- **Rollback strategy**: Maintain backup tables during migration process

### Schema Optimization
- **Connection pooling**: Configure Prisma with appropriate connection limits
- **Query optimization**: Use `include` and `select` strategically to minimize over-fetching
- **Caching layer**: Implement Redis for frequently accessed data
- **Database monitoring**: Set up query performance tracking