package share

import "time"

type Role string

const (
	RoleViewer Role = "viewer"
	RoleEditor Role = "editor"
	RoleOwner  Role = "owner"
)

func (r Role) IsValid() bool {
	switch r {
	case RoleViewer, RoleEditor, RoleOwner:
		return true
	}
	return false
}

func (r Role) CanEdit() bool {
	return r == RoleEditor || r == RoleOwner
}

type TreeShare struct {
	ID              string
	TreeID          string
	UserID          string
	Role            Role
	InvitedBy       *string
	UserEmail       string
	UserDisplayName string
	UserAvatarURL   string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
