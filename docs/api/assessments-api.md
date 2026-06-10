# Assessments API

All assessment APIs are under `/api` and require an authenticated cookie session. For `POST`, `PUT`, and `DELETE`, send `x-csrf-token` with the value from the `eudora_csrf_token` cookie.

Pagination is available on every list endpoint:

| Query | Type | Notes |
| --- | --- | --- |
| `page` | number | 1-based page number. Default `1`. |
| `pageSize` | number | Default `25`, max `100`. |

## Setup Lookups

### `GET /api/assessment-types`
### `GET /api/subjects`
### `GET /api/assessment-levels`

| Query | Values |
| --- | --- |
| `search` | Searches `code` and `name`. |
| `status` | `active`, `inactive`, `archived` |
| `page` | number |
| `pageSize` | number |

Create body for assessment types and subjects:

```json
{
  "code": "weekly",
  "name": "Weekly Assessment"
}
```

Create body for levels:

```json
{
  "code": "level-5",
  "name": "Level 5",
  "sortOrder": 5
}
```

Update body:

```json
{
  "name": "Weekly Assessment",
  "status": "active",
  "sortOrder": 5
}
```

## Assessments

### `GET /api/assessments`

| Query | Values |
| --- | --- |
| `search` | Searches title. |
| `assessmentTypeId` | Assessment type ID. |
| `subjectId` | Subject ID. |
| `levelId` | Assessment level ID. |
| `termId` | Term ID. |
| `weekNumber` | number |
| `status` | `draft`, `published`, `archived` |
| `page` | number |
| `pageSize` | number |

### `POST /api/assessments`

```json
{
  "assessmentTypeId": "assessment_type_id",
  "subjectId": "subject_id",
  "levelId": "level_id",
  "termId": "term_id",
  "weekNumber": 4,
  "title": "Week 4 Level 5 Maths Fractions Assessment",
  "totalMarks": 20,
  "estimatedDurationMinutes": 45,
  "sections": [
    { "title": "Number", "sortOrder": 1 },
    { "title": "Reasoning", "sortOrder": 2 }
  ]
}
```

Other routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/assessments/:id` | Get details. |
| `PUT` | `/api/assessments/:id` | Update details. |
| `DELETE` | `/api/assessments/:id` | Archive. |
| `POST` | `/api/assessments/:id/publish` | Publish. |

## Questions

### `GET /api/questions`

| Query | Values |
| --- | --- |
| `search` | Searches prompt and correct answer. |
| `subjectId` | Subject ID. |
| `levelId` | Assessment level ID. |
| `questionType` | `mcq`, `short_answer`, `numeric`, `written` |
| `difficulty` | `easy`, `medium`, `hard`, `extension` |
| `status` | `draft`, `active`, `archived` |
| `page` | number |
| `pageSize` | number |

### `POST /api/questions`

```json
{
  "subjectId": "subject_id",
  "levelId": "level_id",
  "questionType": "mcq",
  "prompt": "Which fraction is equivalent to 1/2?",
  "correctAnswer": null,
  "difficulty": "medium",
  "status": "active",
  "options": [
    { "optionLabel": "A", "optionText": "2/4", "isCorrect": true },
    { "optionLabel": "B", "optionText": "1/3", "isCorrect": false }
  ]
}
```

Assessment question routes:

| Method | Route | Body |
| --- | --- | --- |
| `POST` | `/api/assessments/:id/questions` | `{ "questionId": "...", "questionNumber": 1, "marksAvailable": 2, "sectionId": "..." }` |
| `PUT` | `/api/assessments/:assessmentId/questions/:questionId` | `{ "questionNumber": 1, "marksAvailable": 2, "sectionId": "..." }` |
| `DELETE` | `/api/assessments/:assessmentId/questions/:questionId` | none |

## Assignments

### `GET /api/assignments`

| Query | Values |
| --- | --- |
| `assessmentId` | Assessment ID. |
| `studentId` | Student ID. |
| `classId` | Class section ID. |
| `status` | `assigned`, `started`, `submitted`, `overdue`, `exempted`, `cancelled` |
| `page` | number |
| `pageSize` | number |

Nested list routes:

| Route | Extra filters |
| --- | --- |
| `GET /api/students/:id/assignments` | `assessmentId`, `classId`, `status`, `page`, `pageSize` |
| `GET /api/classes/:id/assignments` | `assessmentId`, `studentId`, `status`, `page`, `pageSize` |

### `POST /api/assignments`

Exactly one of `studentId` or `classId` is required.

```json
{
  "assessmentId": "assessment_id",
  "studentId": "student_id",
  "classId": null,
  "lessonId": null,
  "opensAt": "2026-06-10T09:00:00.000Z",
  "dueAt": "2026-06-17T23:59:00.000Z",
  "status": "assigned"
}
```

## Attempts

### `GET /api/attempts`

| Query | Values |
| --- | --- |
| `assessmentAssignmentId` | Assignment ID. |
| `studentId` | Student ID. |
| `resultStatus` | `in_progress`, `submitted`, `marked`, `needs_review` |
| `page` | number |
| `pageSize` | number |

Nested list routes:

| Route | Extra filters |
| --- | --- |
| `GET /api/students/:id/attempts` | `assessmentAssignmentId`, `resultStatus`, `page`, `pageSize` |
| `GET /api/assignments/:id/attempts` | `studentId`, `resultStatus`, `page`, `pageSize` |

### `POST /api/attempts`

```json
{
  "assessmentAssignmentId": "assignment_id",
  "studentId": "student_id",
  "rawImportPayload": null
}
```

Other attempt bodies:

```json
{
  "timeSpentSeconds": 1800,
  "resultStatus": "in_progress",
  "teacherComment": null,
  "parentComment": null
}
```

```json
{
  "mode": "auto",
  "teacherComment": "Auto-marked MCQ responses.",
  "parentComment": "Completed and marked."
}
```

## Responses

### `GET /api/responses`

| Query | Values |
| --- | --- |
| `assessmentAttemptId` | Attempt ID. |
| `questionId` | Question ID. |
| `page` | number |
| `pageSize` | number |

Nested list routes:

| Route | Extra filters |
| --- | --- |
| `GET /api/attempts/:id/responses` | `questionId`, `page`, `pageSize` |
| `GET /api/questions/:id/responses` | `assessmentAttemptId`, `page`, `pageSize` |

### `POST /api/responses`

```json
{
  "assessmentAttemptId": "attempt_id",
  "questionId": "question_id",
  "selectedOptionId": "option_id",
  "responseText": null,
  "timeSpentSeconds": 90
}
```

### `POST /api/responses/:id/mark`

```json
{
  "isCorrect": true,
  "marksAwarded": 2,
  "feedback": "Correct."
}
```
