.PHONY: db-start db-migrate db-setup db-push db-reset db-link db-types

# Convenience wrapper so you can run `make db-*` inside `supabase/`.
# It forwards targets to the root Makefile.

db-start db-migrate db-setup db-push db-reset db-link db-types:
	@make -f ..\Makefile $@

