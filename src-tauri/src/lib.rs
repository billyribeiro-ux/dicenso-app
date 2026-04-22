//! DiCenso desktop shell (Tauri 2).
//!
//! The Next.js static export emits a single shell for each dynamic segment
//! (e.g. `/notes/_/index.html`). When the webview requests a concrete id like
//! `/notes/abc-123/`, the corresponding file doesn't exist, so without a
//! fallback we'd 404 and the app would feel broken compared to the web
//! version (where Next's dev server handles routing dynamically).
//!
//! This module installs a SPA fallback on the default `tauri` asset protocol:
//! if a request misses, and the path lives under a known dynamic entity
//! segment, we transparently serve that entity's shell. Next.js' client
//! router then hydrates the real id from `window.location.pathname`.
//!
//! This mirrors the standard GitHub Pages / Netlify `_redirects` pattern
//! adapted to an embedded Tauri asset protocol.

use tauri::http::{Request, Response};
use tauri::{UriSchemeContext, Wry};

/// Entity prefixes whose `[id]` routes should fall back to `_/index.html`.
const DYNAMIC_ENTITY_PREFIXES: &[&str] = &["notes", "prompts", "tasks", "lessons"];

fn asset_bytes(app: &tauri::AppHandle, path: &str) -> Option<Vec<u8>> {
    app.asset_resolver()
        .get(path.to_string())
        .map(|asset| asset.bytes)
}

fn content_type_for(path: &str) -> &'static str {
    match path.rsplit('.').next().unwrap_or("") {
        "html" | "htm" => "text/html; charset=utf-8",
        "js" | "mjs" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "otf" => "font/otf",
        "wasm" => "application/wasm",
        "txt" => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    }
}

/// Resolve a request to bytes + content type, using the dynamic-route shell
/// fallback when a direct hit misses. Returns `None` only when nothing at all
/// matches (true 404).
fn resolve(app: &tauri::AppHandle, raw_path: &str) -> Option<(Vec<u8>, &'static str)> {
    let path = raw_path.trim_start_matches('/');

    // 1. Try the exact file.
    if let Some(bytes) = asset_bytes(app, &format!("/{}", path)) {
        return Some((bytes, content_type_for(path)));
    }

    // 2. Try directory index (`/notes` → `/notes/index.html`).
    let dir_candidate = if path.ends_with('/') {
        format!("/{}index.html", path)
    } else {
        format!("/{}/index.html", path)
    };
    if let Some(bytes) = asset_bytes(app, &dir_candidate) {
        return Some((bytes, "text/html; charset=utf-8"));
    }

    // 3. SPA fallback for dynamic entity routes: `/notes/<id>[/…]` →
    //    `/notes/_/index.html`. Next.js' client router will read the real id
    //    from `window.location.pathname` after hydration.
    let segments: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
    if let Some(first) = segments.first() {
        if DYNAMIC_ENTITY_PREFIXES.contains(first) && segments.len() >= 2 {
            // Skip the known static children (`/notes/new`, `/notes/_`). If the
            // second segment is itself a known file path, the exact-file branch
            // above would already have hit. Anything else is a dynamic id.
            let shell = format!("/{}/_/index.html", first);
            if let Some(bytes) = asset_bytes(app, &shell) {
                return Some((bytes, "text/html; charset=utf-8"));
            }
        }
    }

    // 4. Last-resort: app root.
    asset_bytes(app, "/index.html").map(|b| (b, "text/html; charset=utf-8"))
}

fn handle_asset_request(
    ctx: UriSchemeContext<'_, Wry>,
    request: Request<Vec<u8>>,
) -> Response<Vec<u8>> {
    let app = ctx.app_handle();
    let path = request.uri().path().to_string();

    match resolve(app, &path) {
        Some((bytes, content_type)) => Response::builder()
            .status(200)
            .header("Content-Type", content_type)
            .header("Cache-Control", "no-cache")
            .body(bytes)
            .unwrap_or_else(|_| Response::new(Vec::new())),
        None => Response::builder()
            .status(404)
            .header("Content-Type", "text/plain; charset=utf-8")
            .body(b"Not Found".to_vec())
            .unwrap_or_else(|_| Response::new(Vec::new())),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .register_uri_scheme_protocol("tauri", handle_asset_request)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
