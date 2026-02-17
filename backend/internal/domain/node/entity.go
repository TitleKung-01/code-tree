package node

import "time"

type Status string

const (
	StatusStudying  Status = "studying"
	StatusGraduated Status = "graduated"
	StatusRetired   Status = "retired"
)

type Node struct {
	ID         string
	TreeID     string
	Nickname   string
	FirstName  string
	LastName   string
	StudentID  string
	PhotoURL   string
	Status     Status
	Generation int32
	PositionX  float64
	PositionY  float64
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
