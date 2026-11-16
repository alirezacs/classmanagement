# Attendance segments

For a session with `N` Entracte breaks, the UI records exactly `N + 1` attendance
segments. The existing database column remains named `entracteNumber` for migration
compatibility but is exposed by Prisma as `segmentNumber`. Legacy `SESSION`,
`BEFORE_ENTRACTE`, and `AFTER_ENTRACTE` rows are retained; new records use `SEGMENT`.
