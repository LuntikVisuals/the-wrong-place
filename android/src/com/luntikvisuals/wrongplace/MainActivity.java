package com.luntikvisuals.wrongplace;
import android.app.Activity;import android.os.Bundle;import android.view.View;import android.view.Window;import android.view.WindowManager;
import android.webkit.WebSettings;import android.webkit.WebView;import android.webkit.WebViewClient;import android.webkit.WebResourceRequest;
/** Offline WebView wrapper: loads the bundled single-file game from assets, fullscreen landscape, no network. */
public class MainActivity extends Activity {
  private WebView web;
  @Override protected void onCreate(Bundle b){super.onCreate(b);
    requestWindowFeature(Window.FEATURE_NO_TITLE);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN|WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    web=new WebView(this);WebSettings s=web.getSettings();
    s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(true);s.setAllowContentAccess(false);s.setBlockNetworkLoads(true);s.setSupportZoom(false);s.setBuiltInZoomControls(false);
    web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !r.getUrl().toString().startsWith("file:///android_asset/");}});
    web.setOverScrollMode(View.OVER_SCROLL_NEVER);setContentView(web);hideUi();
    if(b!=null)web.restoreState(b);else web.loadUrl("file:///android_asset/index.html");}
  private void hideUi(){web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);}
  @Override public void onWindowFocusChanged(boolean f){super.onWindowFocusChanged(f);if(f)hideUi();}
  @Override protected void onSaveInstanceState(Bundle o){super.onSaveInstanceState(o);web.saveState(o);}
  @Override protected void onPause(){super.onPause();web.onPause();web.evaluateJavascript("try{window.WP&&WP.onPause&&WP.onPause()}catch(e){}",null);}
  @Override protected void onResume(){super.onResume();web.onResume();hideUi();}
  @Override public void onBackPressed(){web.evaluateJavascript("(function(){try{return !!(window.WP&&WP.onBack&&WP.onBack())}catch(e){return false}})()",new android.webkit.ValueCallback<String>(){public void onReceiveValue(String v){if(!"true".equals(v))finish();}});}
  @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
