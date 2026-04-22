use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::PathBuf;
use std::sync::{LazyLock, Mutex};

static STORE_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SharedEntitiesFile {
    version: i64,
    collections: HashMap<String, Vec<Value>>,
}

fn default_collections() -> HashMap<String, Vec<Value>> {
    let mut map = HashMap::new();
    map.insert("prompts".to_string(), Vec::new());
    map.insert("notes".to_string(), Vec::new());
    map.insert("tasks".to_string(), Vec::new());
    map.insert("lessons".to_string(), Vec::new());
    map
}

fn default_store() -> SharedEntitiesFile {
    SharedEntitiesFile {
        version: 1,
        collections: default_collections(),
    }
}

fn is_allowed_collection(collection: &str) -> bool {
    matches!(collection, "prompts" | "notes" | "tasks" | "lessons")
}

fn entities_file_path() -> Result<PathBuf, String> {
    let home = env::var("HOME").map_err(|_| "HOME env var is not set".to_string())?;
    Ok(PathBuf::from(home)
        .join(".dicenso")
        .join("shared-entities.json"))
}

fn legacy_prompts_file_path() -> Result<PathBuf, String> {
    let home = env::var("HOME").map_err(|_| "HOME env var is not set".to_string())?;
    Ok(PathBuf::from(home)
        .join(".dicenso")
        .join("shared-prompts.json"))
}

fn normalize_store(mut parsed: SharedEntitiesFile) -> SharedEntitiesFile {
    for (key, value) in default_collections() {
        parsed.collections.entry(key).or_insert(value);
    }
    parsed
}

fn read_store() -> Result<SharedEntitiesFile, String> {
    let path = entities_file_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("failed to create store dir: {e}"))?;
    }

    if path.exists() {
        let raw =
            fs::read_to_string(&path).map_err(|e| format!("failed to read store file: {e}"))?;
        let parsed = serde_json::from_str::<SharedEntitiesFile>(&raw)
            .map_err(|e| format!("failed to parse store json: {e}"))?;
        return Ok(normalize_store(parsed));
    }

    // One-time migration from the older prompts-only store.
    let legacy_path = legacy_prompts_file_path()?;
    if legacy_path.exists() {
        let raw = fs::read_to_string(&legacy_path)
            .map_err(|e| format!("failed to read legacy store file: {e}"))?;
        let legacy_value =
            serde_json::from_str::<Value>(&raw).map_err(|e| format!("failed to parse legacy store: {e}"))?;
        let mut store = default_store();
        if let Some(prompts) = legacy_value.get("prompts").and_then(|v| v.as_array()) {
            store
                .collections
                .insert("prompts".to_string(), prompts.clone());
        }
        write_store(&store)?;
        return Ok(store);
    }

    Ok(default_store())
}

fn write_store(store: &SharedEntitiesFile) -> Result<(), String> {
    let path = entities_file_path()?;
    let tmp = path.with_extension("tmp.json");
    let json = serde_json::to_string_pretty(store)
        .map_err(|e| format!("failed to serialize store json: {e}"))?;
    fs::write(&tmp, json).map_err(|e| format!("failed to write temp store file: {e}"))?;
    fs::rename(&tmp, &path).map_err(|e| format!("failed to move temp store file: {e}"))?;
    Ok(())
}

fn merge_objects(existing: &Map<String, Value>, patch: &Map<String, Value>) -> Map<String, Value> {
    let mut merged = existing.clone();
    for (k, v) in patch {
        merged.insert(k.clone(), v.clone());
    }
    merged
}

#[tauri::command]
fn shared_entities_list(collection: String, user_id: String) -> Result<Vec<Value>, String> {
    if !is_allowed_collection(&collection) {
        return Err("collection is not allowed".to_string());
    }
    let _guard = STORE_LOCK
        .lock()
        .map_err(|_| "failed to lock shared entity store".to_string())?;
    let store = read_store()?;
    let mut items = store
        .collections
        .get(&collection)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .filter(|item| item.get("userId").and_then(|v| v.as_str()) == Some(user_id.as_str()))
        .collect::<Vec<_>>();

    items.sort_by(|a, b| {
        let a_updated = a.get("updatedAt").and_then(|v| v.as_str()).unwrap_or("");
        let b_updated = b.get("updatedAt").and_then(|v| v.as_str()).unwrap_or("");
        b_updated.cmp(a_updated)
    });
    Ok(items)
}

#[tauri::command]
fn shared_entities_get(collection: String, id: String) -> Result<Option<Value>, String> {
    if !is_allowed_collection(&collection) {
        return Err("collection is not allowed".to_string());
    }
    let _guard = STORE_LOCK
        .lock()
        .map_err(|_| "failed to lock shared entity store".to_string())?;
    let store = read_store()?;
    Ok(store
        .collections
        .get(&collection)
        .cloned()
        .unwrap_or_default()
        .into_iter()
        .find(|item| item.get("id").and_then(|v| v.as_str()) == Some(id.as_str())))
}

#[tauri::command]
fn shared_entities_create(collection: String, item: Value) -> Result<Value, String> {
    if !is_allowed_collection(&collection) {
        return Err("collection is not allowed".to_string());
    }
    let id = item
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or("item.id is required".to_string())?
        .to_string();

    let _guard = STORE_LOCK
        .lock()
        .map_err(|_| "failed to lock shared entity store".to_string())?;
    let mut store = read_store()?;
    let list = store.collections.entry(collection).or_default();
    list.retain(|existing| existing.get("id").and_then(|v| v.as_str()) != Some(id.as_str()));
    list.push(item.clone());
    write_store(&store)?;
    Ok(item)
}

#[tauri::command]
fn shared_entities_update(collection: String, id: String, changes: Value) -> Result<Option<Value>, String> {
    if !is_allowed_collection(&collection) {
        return Err("collection is not allowed".to_string());
    }
    let patch = changes
        .as_object()
        .ok_or("changes must be a JSON object".to_string())?;

    let _guard = STORE_LOCK
        .lock()
        .map_err(|_| "failed to lock shared entity store".to_string())?;
    let mut store = read_store()?;
    let list = store.collections.entry(collection).or_default();
    let Some(idx) = list
        .iter()
        .position(|existing| existing.get("id").and_then(|v| v.as_str()) == Some(id.as_str()))
    else {
        return Ok(None);
    };

    let existing_obj = list[idx]
        .as_object()
        .ok_or("stored entity is not a JSON object".to_string())?;
    let mut merged = merge_objects(existing_obj, patch);
    merged.insert("id".to_string(), Value::String(id.clone()));
    if let Some(created_at) = existing_obj.get("createdAt") {
      merged.insert("createdAt".to_string(), created_at.clone());
    }

    let updated_value = Value::Object(merged);
    list[idx] = updated_value.clone();
    write_store(&store)?;
    Ok(Some(updated_value))
}

#[tauri::command]
fn shared_entities_delete(collection: String, id: String) -> Result<(), String> {
    if !is_allowed_collection(&collection) {
        return Err("collection is not allowed".to_string());
    }
    let _guard = STORE_LOCK
        .lock()
        .map_err(|_| "failed to lock shared entity store".to_string())?;
    let mut store = read_store()?;
    let list = store.collections.entry(collection).or_default();
    list.retain(|existing| existing.get("id").and_then(|v| v.as_str()) != Some(id.as_str()));
    write_store(&store)?;
    Ok(())
}

#[tauri::command]
fn shared_entities_upsert_many(collection: String, items: Vec<Value>) -> Result<usize, String> {
    if !is_allowed_collection(&collection) {
        return Err("collection is not allowed".to_string());
    }
    let _guard = STORE_LOCK
        .lock()
        .map_err(|_| "failed to lock shared entity store".to_string())?;
    let mut store = read_store()?;
    let list = store.collections.entry(collection).or_default();

    for item in &items {
        if let Some(id) = item.get("id").and_then(|v| v.as_str()) {
            list.retain(|existing| existing.get("id").and_then(|v| v.as_str()) != Some(id));
            list.push(item.clone());
        }
    }

    write_store(&store)?;
    Ok(items.len())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            shared_entities_list,
            shared_entities_get,
            shared_entities_create,
            shared_entities_update,
            shared_entities_delete,
            shared_entities_upsert_many
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

