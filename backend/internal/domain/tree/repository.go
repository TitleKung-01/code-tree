package tree

import "context"

type Repository interface {
	// CRUD
	Create(ctx context.Context, t *Tree) error
	FindByID(ctx context.Context, id string) (*Tree, error)
	FindByIDs(ctx context.Context, ids []string) ([]*Tree, error)
	FindByShareToken(ctx context.Context, token string) (*Tree, error)
	ListByUser(ctx context.Context, userID string) ([]*Tree, error)
	Delete(ctx context.Context, id string) error

	// Share token
	GenerateShareToken(ctx context.Context, treeID string) (string, error)

	// Structure operations (เรียก DB functions ที่สร้างไว้ใน migrations)
	AddNodeToStructure(ctx context.Context, treeID, nodeID string, parentID *string) error
	RemoveNodeFromStructure(ctx context.Context, treeID, nodeID string) error
	MoveNodeInStructure(ctx context.Context, treeID, nodeID string, newParentID *string) error
	AddChildToParent(ctx context.Context, treeID, nodeID, parentID string) error
}
