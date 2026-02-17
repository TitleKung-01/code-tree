package node

import "context"

type Repository interface {
	// CRUD
	Create(ctx context.Context, n *Node) error
	FindByID(ctx context.Context, id string) (*Node, error)
	Update(ctx context.Context, n *Node) error
	Delete(ctx context.Context, id string) error

	// Generation
	UpdateGeneration(ctx context.Context, id string, generation int32) error

	// Query
	FindByTreeID(ctx context.Context, treeID string) ([]*Node, error)
	CountByTreeID(ctx context.Context, treeID string) (int, error)
}
