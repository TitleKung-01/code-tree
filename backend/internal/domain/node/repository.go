package node

import "context"

type Repository interface {
    // CRUD
    Create(ctx context.Context, n *Node) error
    FindByID(ctx context.Context, id string) (*Node, error)
    Update(ctx context.Context, n *Node) error
    Delete(ctx context.Context, id string) error

    // Query
    FindByTreeID(ctx context.Context, treeID string) ([]*Node, error)
    CountByTreeID(ctx context.Context, treeID string) (int, error)

    // Move
    UpdateParent(ctx context.Context, nodeID string, newParentID *string, generation int) error

    // Descendants (สำหรับ cascade delete + circular check)
    FindDescendantIDs(ctx context.Context, nodeID string) ([]string, error)

    // Sibling order
    GetMaxSiblingOrder(ctx context.Context, treeID string, parentID *string) (int, error)

    // Multi-parent (node_parents junction table)
    AddParentID(ctx context.Context, nodeID string, parentID string) error
    RemoveParentID(ctx context.Context, nodeID string, parentID string) error
    FindParentIDsByNodeIDs(ctx context.Context, nodeIDs []string) (map[string][]string, error)
    EnsureNodeParentsTable(ctx context.Context) error
}