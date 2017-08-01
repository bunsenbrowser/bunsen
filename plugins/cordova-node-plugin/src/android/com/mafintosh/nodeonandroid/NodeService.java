/**
 */
package com.mafintosh.nodeonandroid;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.apache.cordova.PluginResult.Status;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;
import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.content.BroadcastReceiver;
//import org.rti.rcd.NodeService;
import static android.content.Context.BIND_AUTO_CREATE;


public class NodeService extends CordovaPlugin {
//    private NodeReceiver receiver;
    // Event types for callbacks
    private enum Event {
        ACTIVATE, DEACTIVATE, FAILURE
    }

    // Plugin namespace
    private static final String JS_NAMESPACE =
            "org.rti.rcd";

    // Flag indicates if the app is in background or foreground
    private boolean inBackground = false;

    // Flag indicates if the plugin is enabled or disabled
    private boolean isDisabled = true;

    // Flag indicates if the service is bind
    private boolean isBind = false;

    // Default settings for the notification
    private static JSONObject defaultSettings = new JSONObject();

    private static final String TAG = "CordovaNodePlugin";

    /** Common tag used for logging statements. */
    private static final String LOGTAG = "CordovaNodePlugin";

    /** Cordova Actions. */
    private static final String ACTION_START_SERVER = "startServer";
    private static final String ACTION_STOP_SERVER = "stopServer";

    private String	url = "";

    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);

        Log.d(TAG, "Initializing CordovaNodePlugin");
    }

//    private NodeService service;

    // Used to (un)bind the service to with the activity
    private final ServiceConnection connection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            fireEvent(Event.ACTIVATE, "'service activated'");
//            NodeService.ForegroundBinder binder = (NodeService.ForegroundBinder) service;
//            BackgroundMode.this.service = binder.getService();
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            fireEvent(Event.FAILURE, "'service disconnected'");
        }
    };

  public boolean execute(String action, JSONArray inputs, final CallbackContext callbackContext) throws JSONException {
    PluginResult result = null;
    Log.d(LOGTAG, String.format("ACTION_START_SERVER: %s", ACTION_START_SERVER));
    if (ACTION_START_SERVER.equals(action)) {
//      result = startServer(inputs, callbackContext);
//        startService();
//        onStartCommand();
        cordova.getActivity().runOnUiThread(new Runnable() {
            public void run() {
                Log.d(TAG, "Starting node. Wheeee!");
                startNode("node");
                callbackContext.success(); // Thread-safe.
            }
        });
        return true;
      // Echo back the first argument
//      Log.d(TAG, phrase);
//    } else if (ACTION_STOP_SERVER.equals(action)) {
////      result = stopServer(inputs, callbackContext);
//        disableMode();
    } else {
      Log.d(LOGTAG, String.format("Invalid action passed: %s", action));
      result = new PluginResult(Status.INVALID_ACTION);
    }

    if(result != null) callbackContext.sendPluginResult( result );

    return true;
  }

//  kudos: https://github.com/katzer/cordova-plugin-background-mode/blob/master/src/android/BackgroundMode.java
//    /**
//     * Called when the system is about to start resuming a previous activity.
//     *
//     * @param multitasking Flag indicating if multitasking is turned on for app.
//     */
//    @Override
//    public void onPause(boolean multitasking) {
//        super.onPause(multitasking);
//        inBackground = true;
//        startService();
//    }

//    /**
//     * Called when the activity will start interacting with the user.
//     *
//     * @param multitasking Flag indicating if multitasking is turned on for app.
//     */
//    @Override
//    public void onResume(boolean multitasking) {
//        super.onResume(multitasking);
//        inBackground = false;
//        stopService();
//    }

    /**
     * Called when the activity will be destroyed.
     */
    @Override
    public void onDestroy() {
//        stopService();
        super.onDestroy();
    }

//    /**
//     * Enable the background mode.
//     */
//    private void enableMode() {
//        isDisabled = false;
//
//        if (inBackground) {
//            startService();
//        }
//    }

//    /**
//     * Disable the background mode.
//     */
//    private void disableMode() {
//        stopService();
//        isDisabled = true;
//    }

//    /**
//     * Update the default settings and configure the notification.
//     *
//     * @param settings The settings
//     * @param update A truthy value means to update the running service.
//     */
//    private void configure(JSONObject settings, boolean update) {
//        if (update) {
//            updateNotification(settings);
//        } else {
//            setDefaultSettings(settings);
//        }
//    }
//
//    /**
//     * Update the default settings for the notification.
//     *
//     * @param settings The new default settings
//     */
//    private void setDefaultSettings(JSONObject settings) {
//        defaultSettings = settings;
//    }
//
//    /**
//     * The settings for the new/updated notification.
//     *
//     * @return
//     *      updateSettings if set or default settings
//     */
//    protected static JSONObject getSettings() {
//        return defaultSettings;
//    }
//
//    /**
//     * Update the notification.
//     *
//     * @param settings The config settings
//     */
//    private void updateNotification(JSONObject settings) {
//        if (isBind) {
//            service.updateNotification(settings);
//        }
//    }

//    /**
//     * Bind the activity to a background service and put them into foreground
//     * state.
//     */
//    private void startService() {
//        Activity context = cordova.getActivity();
//
//        if (isDisabled || isBind)
//            return;
//
//        Intent intent = new Intent(context, NodeService.class);
//
//        try {
//            context.bindService(intent, connection, BIND_AUTO_CREATE);
//            fireEvent(Event.ACTIVATE, null);
//            context.startService(intent);
//        } catch (Exception e) {
//            fireEvent(Event.FAILURE, String.format("'%s'", e.getMessage()));
//        }
//
//        isBind = true;
//    }

//    public int onStartCommand() {
//
////        Intent intent = new Intent(context, NodeService.class);
////        final String ipcPort = intent.getStringExtra("ipc-port");
//
//        new Thread(new Runnable() {
//            @Override
//            public void run() {
////                String jsPath = getCacheDir().getAbsolutePath() + "/index.js";
////                copyAssetFile(getAssets(), "index.js", jsPath);
////                startNode("node", jsPath, "" + ipcPort);
//                startNode("node");
//            }
//        }).start();
//
////        return START_REDELIVER_INTENT;
//        return 1;
//    }

    private native void startNode(String... app);

    static {
        System.loadLibrary("node");
        System.loadLibrary("native-lib");
    }

//    /**
//     * Bind the activity to a background service and put them into foreground
//     * state.
//     */
//    private void stopService() {
//        Activity context = cordova.getActivity();
//        Intent intent    = new Intent(context, NodeService.class);
//
//        if (!isBind)
//            return;
//
//        fireEvent(Event.DEACTIVATE, null);
//        context.unbindService(connection);
//        context.stopService(intent);
//
//        isBind = false;
//    }

    /**
     * Fire vent with some parameters inside the web view.
     *
     * @param event The name of the event
     * @param params Optional arguments for the event
     */
    private void fireEvent (Event event, String params) {
        String eventName = event.name().toLowerCase();
        Boolean active   = event == Event.ACTIVATE;

        String str = String.format("%s._setActive(%b)",
                JS_NAMESPACE, active);

        str = String.format("%s;%s.on%s(%s)",
                str, JS_NAMESPACE, eventName, params);

        str = String.format("%s;%s.fireEvent('%s',%s);",
                str, JS_NAMESPACE, eventName, params);

        final String js = str;

        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                webView.loadUrl("javascript:" + js);
            }
        });
    }


//  // kudos: https://github.com/floatinghotpot/cordova-httpd/blob/master/src/android/CorHttpd.java#L52
//  private PluginResult startServer(JSONArray inputs, CallbackContext callbackContext) {
//    Log.w(LOGTAG, "startServer");
//
////    JSONObject options = inputs.optJSONObject(0);
////    if(options == null) return null;
////
////    www_root = options.optString(OPT_WWW_ROOT);
////    port = options.optInt(OPT_PORT, 8888);
////    localhost_only = options.optBoolean(OPT_LOCALHOST_ONLY, false);
////
////    if(www_root.startsWith("/")) {
////      //localPath = Environment.getExternalStorageDirectory().getAbsolutePath();
////      localPath = www_root;
////    } else {
////      //localPath = "file:///android_asset/www";
////      localPath = "www";
////      if(www_root.length()>0) {
////        localPath += "/";
////        localPath += www_root;
////      }
////    }
//
//    final CallbackContext delayCallback = callbackContext;
//    cordova.getActivity().runOnUiThread(new Runnable(){
//      @Override
//      public void run() {
//        String errmsg = __startServer();
//        if (errmsg.length() > 0) {
//          delayCallback.error( errmsg );
//        } else {
////          if (localhost_only) {
////            url = "http://127.0.0.1:" + port;
////          } else {
////            url = "http://" + __getLocalIpAddress() + ":" + port;
////          }
//            url = "http://127.0.0.1:8080";
//          delayCallback.success( url );
//        }
//      }
//    });
//
//    return null;
//  }
//
//  private String __startServer() {
//    String errmsg = "";
//    try {
//      AndroidFile f = new AndroidFile(localPath);
//
//      Context ctx = cordova.getActivity().getApplicationContext();
//      AssetManager am = ctx.getResources().getAssets();
//      f.setAssetManager( am );
//
//      if(localhost_only) {
//        InetSocketAddress localAddr = new InetSocketAddress(InetAddress.getByAddress(new byte[]{127,0,0,1}), port);
//        server = new WebServer(localAddr, f);
//      } else {
//        server = new WebServer(port, f);
//      }
//    } catch (IOException e) {
//      errmsg = String.format("IO Exception: %s", e.getMessage());
//      Log.w(LOGTAG, errmsg);
//    }
//    return errmsg;
//  }
//
//  private void __stopServer() {
//    if (server != null) {
//      server.stop();
//      server = null;
//    }
//  }

}

//private class NodeReceiver extends BroadcastReceiver {
//    @Override
//    public void onReceive(Context context, Intent intent) {
//        String loadUrl = intent.getStringExtra("loadUrl");
//        if (loadUrl != null) browser.loadUrl(loadUrl);
//    }
//}