use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::sync::{LazyLock, Mutex};

static PROMPTS_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SharedPromptRecord {
    id: String,
    workspace_id: String,
    user_id: String,
    title: String,
    body: String,
    category: String,
    is_favorite: bool,
    version: i64,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SharedPromptsFile {
    version: i64,
    prompts: Vec<SharedPromptRecord>,
}

fn prompts_file_path() -> Result<PathBuf, String> {
    let home = env::var("HOME").map_err(|_| "HOME env var is not set".to_string())?;
    Ok(PathBuf::from(home)
        .join(".dicenso")
        .join("shared-prompts.json"))
}

fn read_store() -> Result<SharedPromptsFile, String> {
    let path = prompts_file_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("failed to create store dir: {e}"))?;
    }
    if !path.exists() {
        return Ok(SharedPromptsFile {
            version: 1,
            prompts: Vec::new(),
        });
    }

    let raw = fs::read_to_string(&path).map_err(|e| format!("failed to read store file: {e}"))?;
    let parsed = serde_json::from_str::<SharedPromptsFile>(&raw)
        .map_err(|e| format!("failed to parse store json: {e}"))?;
    Ok(parsed)
}

fn write_store(store: &SharedPromptsFile) -> Result<(), String> {
    let path = prompts_file_path()?;
    let tmp = path.with_extension("tmp.json");
    let json = serde_json::to_string_pretty(store)
        .map_err(|e| format!("failed to serialize store json: {e}"))?;
    fs::write(&tmp, json).map_err(|e| format!("failed to write temp store file: {e}"))?;
    fs::rename(&tmp, &path).map_err(|e| format!("failed to move temp store file: {e}"))?;
    Ok(())
}

#[tauri::command]
fn shared_prompts_list(user_id: String) -> Result<Vec<SharedPromptRecord>, String> {
    let _guard = PROMPTS_LOCK
        .lock()
        .map_err(|_| "failed to lock prompt store".to_string())?;
    let mut items: Vec<SharedPromptRecord> = read_store()?
        .prompts
        .into_iter()
        .filter(|p| p.user_id == user_id)
        .collect();
    items.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(items)
}

#[tauri::command]
fn shared_prompts_get(id: String) -> Result<Option<SharedPromptRecord>, String> {
    let _guard = PROMPTS_LOCK
        .lock()
        .map_err(|_| "failed to lock prompt store".to_string())?;
    Ok(read_store()?.prompts.into_iter().find(|p| p.id == id))
}

#[tauri::command]
fn shared_prompts_create(item: SharedPromptRecord) -> Result<SharedPromptRecord, String> {
    let _guard = PROMPTS_LOCK
        .lock()
        .map_err(|_| "failed to lock prompt store".to_string())?;
    let mut store = read_store()?;
    store.prompts.retain(|p| p.id != item.id);
    store.prompts.push(item.clone());
    write_store(&store)?;
    Ok(item)
}

#[tauri::command]
fn shared_prompts_update(
    id: String,
    changes: serde_json::Value,
) -> Result<Option<SharedPromptRecord>, String> {
    let _guard = PROMPTS_LOCK
        .lock()
        .map_err(|_| "failed to lock prompt store".to_string())?;
    let mut store = read_store()?;
    let Some(idx) = store.prompts.iter().position(|p| p.id == id) else {
        return Ok(None);
    };

    if let Some(title) = changes.get("title").and_then(|v| v.as_str()) {
        store.prompts[idx].title = title.to_string();
    }
    if let Some(body) = changes.get("body").and_then(|v| v.as_str()) {
        store.prompts[idx].body = body.to_string();
    }
    if let Some(category) = changes.get("category").and_then(|v| v.as_str()) {
        store.prompts[idx].category = category.to_string();
    }
    if let Some(is_favorite) = changes.get("isFavorite").and_then(|v| v.as_bool()) {
        store.prompts[idx].is_favorite = is_favorite;
    }
    if let Some(version) = changes.get("version").and_then(|v| v.as_i64()) {
        store.prompts[idx].version = version;
    }
    if let Some(updated_at) = changes.get("updatedAt").and_then(|v| v.as_str()) {
        store.prompts[idx].updated_at = updated_at.to_string();
    }

    let updated = store.prompts[idx].clone();
    write_store(&store)?;
    Ok(Some(updated))
}

#[tauri::command]
fn shared_prompts_delete(id: String) -> Result<(), String> {
    let _guard = PROMPTS_LOCK
        .lock()
        .map_err(|_| "failed to lock prompt store".to_string())?;
    let mut store = read_store()?;
    store.prompts.retain(|p| p.id != id);
    write_store(&store)?;
    Ok(())
}

#[tauri::command]
fn shared_prompts_upsert_many(items: Vec<SharedPromptRecord>) -> Result<usize, String> {
    let _guard = PROMPTS_LOCK
        .lock()
        .map_err(|_| "failed to lock prompt store".to_string())?;
    let mut store = read_store()?;
    for item in &items {
        store.prompts.retain(|p| p.id != item.id);
        store.prompts.push(item.clone());
    }
    write_store(&store)?;
    Ok(items.len())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            shared_prompts_list,
            shared_prompts_get,
            shared_prompts_create,
            shared_prompts_update,
            shared_prompts_delete,
            shared_prompts_upsert_many
        ])
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
