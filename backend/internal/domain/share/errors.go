package share

import "errors"

var (
	ErrShareNotFound    = errors.New("share not found")
	ErrAlreadyShared    = errors.New("tree is already shared with this user")
	ErrCannotShareSelf  = errors.New("cannot share tree with yourself")
	ErrUserNotFound     = errors.New("user not found")
	ErrInvalidRole      = errors.New("invalid share role")
	ErrNotShareOwner    = errors.New("only tree owner can manage shares")
	ErrCannotRemoveOwner = errors.New("cannot remove the original tree owner")
)
