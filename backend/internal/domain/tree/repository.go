package tree

import "context"

type Repository interface {
    Create(ctx context.Context, t *Tree) error
    FindByID(ctx context.Context, id string) (*Tree, error)
    ListByUser(ctx context.Context, userID string) ([]*Tree, error)
    Delete(ctx context.Context, id string) error
}