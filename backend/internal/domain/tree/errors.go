package tree

import "errors"

var (
    ErrTreeNotFound = errors.New("tree not found")
    ErrTreeNoName   = errors.New("tree name is required")
    ErrUnauthorized = errors.New("unauthorized to access this tree")
)