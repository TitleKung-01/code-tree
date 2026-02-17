package share

import "context"

type Repository interface {
	// Create สร้างการแชร์ใหม่
	Create(ctx context.Context, s *TreeShare) error

	// FindByTreeAndUser หาการแชร์ด้วย tree_id + user_id
	FindByTreeAndUser(ctx context.Context, treeID, userID string) (*TreeShare, error)

	// UpdateRole อัปเดต role ของการแชร์
	UpdateRole(ctx context.Context, treeID, userID string, role Role) (*TreeShare, error)

	// Delete ลบการแชร์
	Delete(ctx context.Context, treeID, userID string) error

	// ListByTree ดูรายการแชร์ทั้งหมดของ tree (รวมข้อมูล user)
	ListByTree(ctx context.Context, treeID string) ([]*TreeShare, error)

	// ListByUser ดูรายการ tree ที่ถูกแชร์มาให้ user
	ListTreeIDsByUser(ctx context.Context, userID string) ([]string, error)

	// FindUserByEmail หา user จาก email
	FindUserByEmail(ctx context.Context, email string) (userID string, err error)

	// GetUserRole ดู role ของ user กับ tree (ถ้าไม่มีจะ return ErrShareNotFound)
	GetUserRole(ctx context.Context, treeID, userID string) (Role, error)
}
