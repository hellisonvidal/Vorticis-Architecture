// Vorticis Architecture — programa para Windows (Tauri).
// A interface é o mesmo app web; o Rust cuida do que o navegador não faz:
// janela nativa de "Salvar como" e conversão DXF -> DWG com o ODA File Converter.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::Engine;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Abre a janela "Salvar como" e grava o arquivo. Retorna o caminho, ou None se cancelado.
#[tauri::command]
fn save_file(name: String, data_b64: String) -> Result<Option<String>, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data_b64.as_bytes())
        .map_err(|e| format!("dados inválidos: {e}"))?;
    match ask_save_path(&name) {
        Some(path) => {
            std::fs::write(&path, &bytes).map_err(|e| format!("não foi possível gravar: {e}"))?;
            Ok(Some(path.display().to_string()))
        }
        None => Ok(None),
    }
}

fn ask_save_path(name: &str) -> Option<PathBuf> {
    let ext = Path::new(name).extension().and_then(|e| e.to_str()).unwrap_or("").to_string();
    let mut dlg = rfd::FileDialog::new().set_file_name(name);
    if !ext.is_empty() {
        dlg = dlg.add_filter(ext.to_uppercase(), &[ext.as_str()]);
    }
    dlg.save_file()
}

/// Procura o ODA File Converter: variável VORTICIS_ODA ou pastas padrão de instalação.
fn find_oda() -> Option<PathBuf> {
    if let Ok(p) = std::env::var("VORTICIS_ODA") {
        let p = PathBuf::from(p);
        if p.is_file() {
            return Some(p);
        }
    }
    let mut roots: Vec<PathBuf> = Vec::new();
    for var in ["ProgramFiles", "ProgramFiles(x86)", "ProgramW6432"] {
        if let Ok(v) = std::env::var(var) {
            roots.push(PathBuf::from(v).join("ODA"));
        }
    }
    roots.push(PathBuf::from("/usr/bin"));
    roots.push(PathBuf::from("/Applications"));
    let mut found: Vec<PathBuf> = Vec::new();
    for root in roots {
        let direct = [root.join("ODAFileConverter.exe"), root.join("ODAFileConverter")];
        for d in direct {
            if d.is_file() {
                found.push(d);
            }
        }
        if let Ok(entries) = std::fs::read_dir(&root) {
            for e in entries.flatten() {
                let dir = e.path();
                for c in [
                    dir.join("ODAFileConverter.exe"),
                    dir.join("Contents/MacOS/ODAFileConverter"),
                ] {
                    if c.is_file() {
                        found.push(c);
                    }
                }
            }
        }
    }
    found.sort();
    found.pop() // a versão mais recente costuma vir por último na ordem alfabética
}

#[tauri::command]
fn oda_status() -> Option<String> {
    find_oda().map(|p| p.display().to_string())
}

const DWG_VERSIONS: [&str; 8] = ["ACAD9", "ACAD10", "ACAD12", "ACAD14", "ACAD2000", "ACAD2004", "ACAD2010", "ACAD2018"];

/// Converte o DXF gerado pelo app em DWG (ODA File Converter) e pergunta onde salvar.
#[tauri::command]
fn export_dwg(name: String, dxf: String, version: String) -> Result<Option<String>, String> {
    let oda = find_oda().ok_or_else(|| "ODA_NOT_FOUND".to_string())?;
    let version = if DWG_VERSIONS.contains(&version.as_str()) { version } else { "ACAD2018".to_string() };
    let stem = Path::new(&name)
        .file_stem()
        .and_then(|s| s.to_str())
        .map(|s| s.chars().map(|c| if c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' { c } else { '_' }).collect::<String>())
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "projeto".to_string());
    let work = std::env::temp_dir().join(format!("vorticis-dwg-{}-{}", std::process::id(), stamp()));
    let (inp, out) = (work.join("in"), work.join("out"));
    std::fs::create_dir_all(&inp).map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&out).map_err(|e| e.to_string())?;
    std::fs::write(inp.join(format!("{stem}.dxf")), dxf.as_bytes()).map_err(|e| e.to_string())?;

    let mut cmd = Command::new(&oda);
    cmd.arg(&inp).arg(&out).arg(&version).arg("DWG").arg("0").arg("1").arg("*.DXF");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    let status = cmd.output().map_err(|e| format!("não foi possível executar o ODA File Converter: {e}"))?;
    let result = find_dwg(&out);
    let outcome = match result {
        Some(dwg) => {
            let bytes = std::fs::read(&dwg).map_err(|e| e.to_string())?;
            match ask_save_path(&format!("{stem}.dwg")) {
                Some(path) => {
                    std::fs::write(&path, &bytes).map_err(|e| format!("não foi possível gravar: {e}"))?;
                    Ok(Some(path.display().to_string()))
                }
                None => Ok(None),
            }
        }
        None => Err(format!(
            "o conversor não gerou o DWG (código {:?}). {}",
            status.status.code(),
            String::from_utf8_lossy(&status.stderr).trim()
        )),
    };
    let _ = std::fs::remove_dir_all(&work);
    outcome
}

fn find_dwg(dir: &Path) -> Option<PathBuf> {
    std::fs::read_dir(dir).ok()?.flatten().map(|e| e.path()).find(|p| {
        p.extension().and_then(|e| e.to_str()).map(|e| e.eq_ignore_ascii_case("dwg")).unwrap_or(false)
    })
}

fn stamp() -> u128 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_file, oda_status, export_dwg])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Vorticis Architecture");
}
