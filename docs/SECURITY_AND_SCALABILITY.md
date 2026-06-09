# Security & Scalability Architecture

This guide explains how to secure and scale this football streaming and live score ecosystem to support millions of concurrent users during high-stakes tournaments.

---

## 1. Security & Access Control

### Row Level Security (RLS)
The database enforces strict RLS policies to prevent API abuse and keep administrative tables safe:
- **Public access (`anon` role)**: Allowed to read (`SELECT`) metadata from matches, teams, streams, score updates, match events, notifications, and active ad scripts. Write privileges (`INSERT`, `UPDATE`, `DELETE`) are completely blocked.
- **Admin access (`authenticated` role)**: Allowed all CRUD operations. Access requires authentication via Supabase Auth (admin email/password).

### Stream URL Obscurity & Token Binding
To prevent link leaching and hotlinking of streaming URLs:
1. **Dynamic Expiration Tokens**: In production, streaming links should be protected by temporary, time-bound authentication tokens generated on stream servers (e.g., Akamai Token Authorization or Cloudflare Secure Tokens).
2. **Reverse Proxying**: Stream URLs can be routed through an API Gateway or reverse proxy to hide raw stream origin source servers.

---

## 2. Scalability to World Cup 2026 Traffic Levels

A high-stakes event like the World Cup creates massive concurrent traffic spikes (especially during goals).

### Realtime Database Optimization
1. **Connection Pooling**: Supabase PostgreSQL uses **PgBouncer** to pool database connections. Configure PgBouncer in `Transaction` mode to allow tens of thousands of active socket connections with minimal CPU overhead.
2. **Read Replicas**: Distribute database read queries (schedules, notifications history, ad network configs) to read replicas, leaving the primary database node focused on live scoreboard updates and event insertions.

### Realtime Layer Scale (Supabase Realtime)
Supabase Realtime handles WebSocket connections on clusters of Elixir nodes.
- **Client-Side Polling Fallback**: While Realtime WebSockets provide sub-second latency, we build a polling fallback (every 5 seconds) inside the Android app's Flow layer. If WebSocket servers experience load limits, clients poll REST endpoints cached by CDN proxies, ensuring service continuity.
- **CDN Caching**: Route PostgREST API calls through a CDN (such as Cloudflare or CloudFront) with short cache TTLs (e.g., 2–5 seconds). This absorbs 99% of read traffic, protecting database instances from load spikes.

### Indexing Strategy
To optimize query search times during heavy load, table indices are created on frequently queried columns:
- `matches(status)`: Fetches active live games.
- `matches(start_time)`: Orders the fixtures chronologically.
- `streams(match_id)`: Fetches active streaming links instantly.
- `match_events(match_id)`: Fetches timeline event details for active detail screens.
