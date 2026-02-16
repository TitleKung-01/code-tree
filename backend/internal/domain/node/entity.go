package node

import "time"

type Status string

const (
    StatusStudying  Status = "studying"
    StatusGraduated Status = "graduated"
    StatusRetired   Status = "retired"
)

type Node struct {
    ID           string
    TreeID       string
    ParentID     *string // nil = root node
    SiblingOrder int
    Nickname     string
    FirstName    string
    LastName     string
    StudentID    string
    Generation   int
    PhotoURL     string
    Status       Status
    PositionX    float64
    PositionY    float64
    CreatedAt    time.Time
    UpdatedAt    time.Time
}

// IsRoot ตรวจว่าเป็น root node (ไม่มีพี่)
func (n *Node) IsRoot() bool {
    return n.ParentID == nil
}

// CalculateGeneration คำนวณรุ่นจาก parent
// ถ้าไม่มี parent → generation = 1 (root)
// ถ้ามี parent → parent.generation + 1
func CalculateGeneration(parent *Node) int {
    if parent == nil {
        return 1
    }
    return parent.Generation + 1
}