# Session status and Entracte attendance

This forward migration removes `PUBLISHED`. Existing published sessions are
converted to `DRAFT` so their schedules remain visible and no session is lost.
It adds a required cancellation reason when a session is cancelled at the service
boundary, an Entracte count per session, and attendance checkpoints before and
after each Entracte. Legacy cancelled rows without a reason receive a neutral
migration note. Existing attendance remains the `SESSION` checkpoint.
