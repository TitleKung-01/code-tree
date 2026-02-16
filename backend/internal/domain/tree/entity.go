package tree

import "time"

type Tree struct {
    ID          string
    Name        string
    Description string
    Faculty     string
    Department  string
    CreatedBy   string
    ShareToken  *string
    IsPublic    bool
    CreatedAt   time.Time
    UpdatedAt   time.Time
}