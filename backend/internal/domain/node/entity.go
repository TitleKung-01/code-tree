package node

import "time"

type Status string

const (
	StatusStudying  Status = "studying"
	StatusGraduated Status = "graduated"
	StatusRetired   Status = "retired"
)

type Node struct {
	ID         string
	TreeID     string
	Nickname   string
	FirstName  string
	LastName   string
	StudentID  string
	PhotoURL   string
	Status     Status
	Generation int32
	PositionX  float64
	PositionY  float64
	Metadata   map[string]string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Contact field keys stored in Metadata JSONB
const (
	MetaKeyPhone    = "phone"
	MetaKeyEmail    = "email"
	MetaKeyLineID   = "line_id"
	MetaKeyDiscord  = "discord"
	MetaKeyFacebook = "facebook"
)

func (n *Node) Phone() string    { return n.Metadata[MetaKeyPhone] }
func (n *Node) Email() string    { return n.Metadata[MetaKeyEmail] }
func (n *Node) LineID() string   { return n.Metadata[MetaKeyLineID] }
func (n *Node) Discord() string  { return n.Metadata[MetaKeyDiscord] }
func (n *Node) Facebook() string { return n.Metadata[MetaKeyFacebook] }

func (n *Node) SetContact(phone, email, lineID, discord, facebook string) {
	if n.Metadata == nil {
		n.Metadata = make(map[string]string)
	}
	if phone != "" {
		n.Metadata[MetaKeyPhone] = phone
	} else {
		delete(n.Metadata, MetaKeyPhone)
	}
	if email != "" {
		n.Metadata[MetaKeyEmail] = email
	} else {
		delete(n.Metadata, MetaKeyEmail)
	}
	if lineID != "" {
		n.Metadata[MetaKeyLineID] = lineID
	} else {
		delete(n.Metadata, MetaKeyLineID)
	}
	if discord != "" {
		n.Metadata[MetaKeyDiscord] = discord
	} else {
		delete(n.Metadata, MetaKeyDiscord)
	}
	if facebook != "" {
		n.Metadata[MetaKeyFacebook] = facebook
	} else {
		delete(n.Metadata, MetaKeyFacebook)
	}
}
