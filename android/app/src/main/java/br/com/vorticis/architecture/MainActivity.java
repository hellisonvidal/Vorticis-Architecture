package br.com.vorticis.architecture;

// Vorticis Architecture para Android.
// A interface é o mesmo app web (assets/www), servido em https://appassets.androidplatform.net
// para que módulos JS, WebAssembly e IndexedDB funcionem como no navegador.
// O Java cuida do que o WebView não faz sozinho: escolher arquivos, salvar arquivos,
// abrir desenhos vindos de outros apps e o botão Voltar.

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private static final String TAG = "Vorticis";
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private static final int REQ_OPEN = 1, REQ_SAVE = 2;
    private static final int BAR_COLOR = 0xFF064E3B;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingSave;
    private String pendingSaveName;
    private Uri pendingOpen;
    private boolean pageReady;
    private long lastBack;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        edgeToEdge();

        final FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(BAR_COLOR);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);
        // barras do sistema e teclado: afasta a interface para não ficar por baixo
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            @SuppressWarnings("deprecation")
            public WindowInsets onApplyWindowInsets(View v, WindowInsets in) {
                v.setPadding(in.getSystemWindowInsetLeft(), in.getSystemWindowInsetTop(),
                        in.getSystemWindowInsetRight(), in.getSystemWindowInsetBottom());
                return in;
            }
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);

        web.addJavascriptInterface(new Bridge(), "VorticisAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return serve(req.getUrl());
            }

            // (API 24+; sem @Override para compilar também com SDKs antigos)
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (ActivityNotFoundException e) {
                    toast("Nenhum app para abrir este link.");
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                deliverPendingOpen();
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                boolean images = params.getAcceptTypes().length > 0;
                for (String t : params.getAcceptTypes()) if (t == null || !t.startsWith("image/")) images = false;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(images ? "image/*" : "*/*");
                try {
                    startActivityForResult(Intent.createChooser(i, images ? "Escolher imagem" : "Abrir desenho"), REQ_OPEN);
                    return true;
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    toast("Nenhum app de arquivos disponível.");
                    return false;
                }
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.d(TAG, m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")");
                return true;
            }
        });

        pendingOpen = uriFrom(getIntent());
        if (state != null) web.restoreState(state);
        if (web.getUrl() == null) web.loadUrl(START);
    }

    @SuppressWarnings("deprecation")
    private void edgeToEdge() {
        Window w = getWindow();
        w.setStatusBarColor(Color.TRANSPARENT);
        w.setNavigationBarColor(Color.TRANSPARENT);
        w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    /* ---------- arquivos do app (assets/www) ---------- */
    private WebResourceResponse serve(Uri u) {
        if (!HOST.equals(u.getHost())) return null;
        String path = u.getPath();
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        Map<String, String> headers = new HashMap<String, String>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Cache-Control", "no-cache");
        try {
            InputStream in = getAssets().open("www" + path);
            String mime = mimeOf(path);
            String enc = mime.startsWith("text/") || mime.endsWith("json") || mime.endsWith("xml") ? "utf-8" : null;
            return new WebResourceResponse(mime, enc, 200, "OK", headers, in);
        } catch (IOException e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", headers, new ByteArrayInputStream(new byte[0]));
        }
    }

    private static String mimeOf(String path) {
        String ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
        switch (ext) {
            case "html": return "text/html";
            case "js": case "mjs": return "text/javascript";
            case "css": return "text/css";
            case "json": case "map": return "application/json";
            case "webmanifest": return "application/manifest+json";
            case "svg": return "image/svg+xml";
            case "png": return "image/png";
            case "jpg": case "jpeg": return "image/jpeg";
            case "wasm": return "application/wasm";
            case "txt": case "md": return "text/plain";
            default: return "application/octet-stream";
        }
    }

    /* ---------- ponte com o JavaScript ---------- */
    public class Bridge {
        @JavascriptInterface
        public void saveFile(final String name, final String mime, final String b64) {
            final byte[] data;
            try {
                data = Base64.decode(b64, Base64.DEFAULT);
            } catch (IllegalArgumentException e) {
                js("androidSaved(false," + JSONObject.quote(name) + ")");
                return;
            }
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    startSave(name, mime, data);
                }
            });
        }

        @JavascriptInterface
        public String version() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "";
            }
        }
    }

    private void startSave(String name, String mime, byte[] data) {
        pendingSave = data;
        pendingSaveName = name;
        if (mime == null || mime.isEmpty()) {
            String ext = name.substring(name.lastIndexOf('.') + 1).toLowerCase();
            mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
            if (mime == null) mime = "application/octet-stream";
        }
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(mime);
        i.putExtra(Intent.EXTRA_TITLE, name);
        try {
            startActivityForResult(i, REQ_SAVE);
        } catch (ActivityNotFoundException e) {
            pendingSave = null;
            toast("Não foi possível abrir a janela de salvar.");
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_OPEN) {
            Uri[] result = null;
            if (res == RESULT_OK && data != null) {
                if (data.getClipData() != null && data.getClipData().getItemCount() > 0) {
                    result = new Uri[data.getClipData().getItemCount()];
                    for (int k = 0; k < result.length; k++) result[k] = data.getClipData().getItemAt(k).getUri();
                } else if (data.getData() != null) {
                    result = new Uri[]{data.getData()};
                }
            }
            if (fileCallback != null) fileCallback.onReceiveValue(result);
            fileCallback = null;
        } else if (req == REQ_SAVE) {
            boolean ok = false;
            String name = pendingSaveName == null ? "" : pendingSaveName;
            if (res == RESULT_OK && data != null && data.getData() != null && pendingSave != null) {
                try {
                    OutputStream out = getContentResolver().openOutputStream(data.getData(), "wt");
                    if (out == null) throw new IOException("sem destino");
                    out.write(pendingSave);
                    out.close();
                    ok = true;
                    String shown = displayName(data.getData());
                    if (shown != null) name = shown;
                } catch (Exception e) {
                    Log.e(TAG, "salvar", e);
                    toast("Falha ao salvar: " + e.getMessage());
                }
            }
            pendingSave = null;
            pendingSaveName = null;
            js("androidSaved(" + ok + "," + JSONObject.quote(name) + ")");
        } else {
            super.onActivityResult(req, res, data);
        }
    }

    /* ---------- desenhos vindos de outros apps ("Abrir com" / "Compartilhar") ---------- */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri u = uriFrom(intent);
        if (u != null) {
            pendingOpen = u;
            deliverPendingOpen();
        }
    }

    @SuppressWarnings("deprecation")
    private static Uri uriFrom(Intent i) {
        if (i == null) return null;
        if (Intent.ACTION_VIEW.equals(i.getAction())) return i.getData();
        if (Intent.ACTION_SEND.equals(i.getAction())) {
            Object o = i.getParcelableExtra(Intent.EXTRA_STREAM);
            return o instanceof Uri ? (Uri) o : null;
        }
        return null;
    }

    private void deliverPendingOpen() {
        if (!pageReady || pendingOpen == null) return;
        final Uri u = pendingOpen;
        pendingOpen = null;
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    InputStream in = getContentResolver().openInputStream(u);
                    if (in == null) throw new IOException("arquivo indisponível");
                    ByteArrayOutputStream buf = new ByteArrayOutputStream();
                    byte[] chunk = new byte[65536];
                    int n;
                    while ((n = in.read(chunk)) > 0) buf.write(chunk, 0, n);
                    in.close();
                    String name = displayName(u);
                    if (name == null) name = u.getLastPathSegment();
                    final String call = "androidOpenFile(" + JSONObject.quote(name == null ? "arquivo" : name) + ",'"
                            + Base64.encodeToString(buf.toByteArray(), Base64.NO_WRAP) + "')";
                    js(call);
                } catch (Exception e) {
                    Log.e(TAG, "abrir", e);
                    toast("Não foi possível abrir o arquivo: " + e.getMessage());
                }
            }
        }).start();
    }

    private String displayName(Uri u) {
        if (!"content".equals(u.getScheme())) return u.getLastPathSegment();
        Cursor c = null;
        try {
            c = getContentResolver().query(u, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null);
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (Exception ignored) {
        } finally {
            if (c != null) c.close();
        }
        return null;
    }

    /* ---------- ciclo de vida e botão Voltar ---------- */
    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("window.androidBack?androidBack():false", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                if ("true".equals(v)) return;
                long now = System.currentTimeMillis();
                if (now - lastBack < 2000) finish();
                else {
                    lastBack = now;
                    toast("Toque em Voltar de novo para sair");
                }
            }
        });
    }

    @Override
    protected void onPause() {
        js("window.androidPause&&androidPause()");
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    private void js(final String code) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (web != null) web.evaluateJavascript(code, null);
            }
        });
    }

    private void toast(final String msg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show();
            }
        });
    }
}
