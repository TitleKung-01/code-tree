package tree

import (
	"encoding/json"
	"time"
)

// TreeStructureEdge แต่ละ node ใน structure
type TreeStructureEdge struct {
	Children []string `json:"children"`
	Order    int      `json:"order"`
}

// TreeStructure โครงสร้าง parent-child ทั้ง tree เก็บเป็น JSONB
type TreeStructure struct {
	RootIDs []string                     `json:"rootIds"`
	Edges   map[string]TreeStructureEdge `json:"edges"`
}

// NewEmptyStructure สร้าง structure ว่าง
func NewEmptyStructure() TreeStructure {
	return TreeStructure{
		RootIDs: []string{},
		Edges:   make(map[string]TreeStructureEdge),
	}
}

// IsDescendant ตรวจว่า targetID เป็น descendant ของ ancestorID หรือไม่
func (s *TreeStructure) IsDescendant(ancestorID, targetID string) bool {
	edge, ok := s.Edges[ancestorID]
	if !ok {
		return false
	}
	for _, childID := range edge.Children {
		if childID == targetID {
			return true
		}
		if s.IsDescendant(childID, targetID) {
			return true
		}
	}
	return false
}

// FindParentID หา parent ตัวแรก ของ nodeID จาก structure (backward compat)
func (s *TreeStructure) FindParentID(nodeID string) *string {
	for id, edge := range s.Edges {
		for _, childID := range edge.Children {
			if childID == nodeID {
				parentID := id
				return &parentID
			}
		}
	}
	return nil
}

// FindParentIDs หา parent ทั้งหมดของ nodeID จาก structure (multi-parent / DAG)
func (s *TreeStructure) FindParentIDs(nodeID string) []string {
	var parents []string
	for id, edge := range s.Edges {
		for _, childID := range edge.Children {
			if childID == nodeID {
				parents = append(parents, id)
				break
			}
		}
	}
	return parents
}

// ToJSON แปลง structure เป็น JSON bytes
func (s *TreeStructure) ToJSON() ([]byte, error) {
	return json.Marshal(s)
}

// ParseStructure แปลง JSON bytes เป็น TreeStructure
func ParseStructure(data []byte) (*TreeStructure, error) {
	var s TreeStructure
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, err
	}
	if s.Edges == nil {
		s.Edges = make(map[string]TreeStructureEdge)
	}
	if s.RootIDs == nil {
		s.RootIDs = []string{}
	}
	return &s, nil
}

type Tree struct {
	ID          string
	Name        string
	Description string
	Faculty     string
	Department  string
	CreatedBy   string
	ShareToken  *string
	IsPublic    bool
	Structure   TreeStructure
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
