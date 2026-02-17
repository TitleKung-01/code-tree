package node

import "errors"

var (
	ErrNodeNotFound      = errors.New("node not found")
	ErrNoNickname        = errors.New("nickname is required")
	ErrTreeIDRequired    = errors.New("tree_id is required")
	ErrCircularReference = errors.New("cannot move node: circular reference detected")
	ErrSelfParent        = errors.New("cannot set node as its own parent")
	ErrCrossTreeMove     = errors.New("cannot move node to a different tree")
	ErrParentNotFound    = errors.New("parent node not found")
)
